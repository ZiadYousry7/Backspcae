/**
 * POST /api/notifications/send-reminders
 *
 * Called by a cron job (e.g. Vercel Cron / GitHub Actions) daily.
 * Finds tasks due in the next 1, 3, and 7 days, and sends email
 * reminders via Microsoft Graph API.
 *
 * Requires: CRON_SECRET header for security, GRAPH_SERVICE_ACCOUNT_TOKEN env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendGraphEmail, buildDeadlineReminderEmail } from '@/lib/graph-api';

const REMINDER_DAYS = [1, 3, 7]; // send reminders at these intervals

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const accessToken = process.env.GRAPH_SERVICE_ACCOUNT_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Graph token not configured' }, { status: 500 });
  }

  const results: { sent: number; failed: number; skipped: number } = {
    sent: 0, failed: 0, skipped: 0
  };

  for (const daysAhead of REMINDER_DAYS) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Find tasks due on targetDate, not completed/cancelled
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id, title, title_ar, due_date, status,
        project:projects!tasks_project_id_fkey(id, title, title_ar),
        assignee:profiles!tasks_assigned_to_fkey(id, email, full_name, full_name_ar)
      `)
      .eq('due_date', dateStr)
      .not('status', 'in', '("completed","cancelled")');

    if (error || !tasks) continue;

    for (const task of tasks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assignee = task.assignee as unknown as { id: string; email: string; full_name: string; full_name_ar?: string } | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const project = task.project as unknown as { id: string; title: string; title_ar?: string } | null;
      if (!assignee?.email || !project) { results.skipped++; continue; }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mafaza-pms.com';
      const taskUrl = `${appUrl}/projects/${project.id}`;

      // Send bilingual (EN) email – could be customised per user preference
      const { subject, htmlBody } = buildDeadlineReminderEmail({
        recipientName: assignee.full_name,
        taskTitle: task.title,
        projectTitle: project.title,
        dueDate: new Date(task.due_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        }),
        daysLeft: daysAhead,
        taskUrl,
        lang: 'en',
      });

      const { success } = await sendGraphEmail({
        to: [{ name: assignee.full_name, email: assignee.email }],
        subject,
        htmlBody,
        accessToken,
      });

      if (success) {
        results.sent++;
        // Mark email sent in notifications table
        await supabase.from('notifications').insert({
          recipient_id: (task.assignee as unknown as { id: string }).id,
          type: 'deadline_approaching',
          title: 'Deadline Approaching',
          title_ar: 'موعد الاستحقاق يقترب',
          message: `Task "${task.title}" is due in ${daysAhead} day(s)`,
          entity_type: 'task',
          entity_id: task.id as string,
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        });
      } else {
        results.failed++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    results,
    processedAt: new Date().toISOString(),
  });
}
