// =============================================================
// Microsoft Graph API – Email Notification Service
// Sends deadline reminder emails via Microsoft 365
// =============================================================

interface EmailRecipient {
  name: string;
  email: string;
}

interface EmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlBody: string;
  accessToken: string;
}

/**
 * Send an email using the Microsoft Graph API (Mail.Send scope).
 * The accessToken must belong to a user with Mail.Send permission,
 * or an app with Mail.Send application permission.
 */
export async function sendGraphEmail({
  to,
  subject,
  htmlBody,
  accessToken,
}: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const endpoint = 'https://graph.microsoft.com/v1.0/me/sendMail';

  const payload = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content: htmlBody,
      },
      toRecipients: to.map((r) => ({
        emailAddress: { address: r.email, name: r.name },
      })),
    },
    saveToSentItems: false,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 202 || res.ok) {
      return { success: true };
    }

    const err = await res.json().catch(() => ({}));
    return { success: false, error: JSON.stringify(err) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ---- Email template helpers ----

export function buildDeadlineReminderEmail(opts: {
  recipientName: string;
  taskTitle: string;
  projectTitle: string;
  dueDate: string;
  daysLeft: number;
  taskUrl: string;
  lang?: 'en' | 'ar';
}): { subject: string; htmlBody: string } {
  const isAr = opts.lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const fontFamily = isAr ? "'Segoe UI', Tahoma, Arial, sans-serif" : "'Segoe UI', sans-serif";

  const urgencyColor =
    opts.daysLeft <= 1 ? '#EF4444' : opts.daysLeft <= 3 ? '#F59E0B' : '#3B82F6';

  const subject = isAr
    ? `تذكير: ${opts.taskTitle} – موعد التسليم خلال ${opts.daysLeft} أيام`
    : `Reminder: "${opts.taskTitle}" – Due in ${opts.daysLeft} day(s)`;

  const htmlBody = `
<!DOCTYPE html>
<html dir="${dir}" lang="${isAr ? 'ar' : 'en'}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:${fontFamily}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1E3A5F 0%,#2563EB 100%);padding:32px 40px">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700">
              ${isAr ? 'مافازا – نظام إدارة المشاريع' : 'Mafaza – Project Management System'}
            </h1>
            <p style="margin:8px 0 0;color:#BFDBFE;font-size:14px">
              ${isAr ? 'تذكير بموعد الاستحقاق' : 'Deadline Reminder'}
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 20px;color:#374151;font-size:16px">
              ${isAr ? `مرحباً ${opts.recipientName},` : `Hello ${opts.recipientName},`}
            </p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7">
              ${isAr
                ? `هذا تذكير بأن المهمة التالية موعد تسليمها قريب:`
                : `This is a reminder that the following task is approaching its deadline:`}
            </p>
            <!-- Task card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin:0 0 24px">
              <tr>
                <td style="padding:20px 24px;border-right:4px solid ${urgencyColor}">
                  <p style="margin:0 0 8px;color:#1E293B;font-size:17px;font-weight:700">${opts.taskTitle}</p>
                  <p style="margin:0 0 4px;color:#64748B;font-size:13px">
                    📁 ${isAr ? 'المشروع' : 'Project'}: <strong>${opts.projectTitle}</strong>
                  </p>
                  <p style="margin:0;color:${urgencyColor};font-size:13px;font-weight:600">
                    📅 ${isAr ? 'موعد التسليم' : 'Due Date'}: ${opts.dueDate}
                    (${opts.daysLeft <= 0
                      ? (isAr ? 'متأخر!' : 'Overdue!')
                      : (isAr ? `خلال ${opts.daysLeft} أيام` : `in ${opts.daysLeft} day(s)`)})
                  </p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="${isAr ? 'right' : 'left'}">
                  <a href="${opts.taskUrl}"
                     style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px">
                    ${isAr ? 'عرض المهمة ←' : 'View Task →'}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F1F5F9;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#94A3B8;font-size:12px">
              ${isAr
                ? 'هذا البريد الإلكتروني تلقائي من نظام مافازا لإدارة المشاريع. لا ترد على هذا البريد.'
                : 'This is an automated email from Mafaza PMS. Please do not reply directly.'}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, htmlBody };
}

export function buildTaskAssignedEmail(opts: {
  recipientName: string;
  assignerName: string;
  taskTitle: string;
  projectTitle: string;
  dueDate?: string;
  taskUrl: string;
  lang?: 'en' | 'ar';
}): { subject: string; htmlBody: string } {
  const isAr = opts.lang === 'ar';
  const subject = isAr
    ? `تم تعيينك في مهمة: ${opts.taskTitle}`
    : `You've been assigned to: "${opts.taskTitle}"`;

  const htmlBody = `
<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#1E3A5F 0%,#2563EB 100%);padding:32px 40px">
            <h1 style="margin:0;color:#fff;font-size:24px">
              ${isAr ? 'مافازا – مهمة جديدة' : 'Mafaza – New Task Assigned'}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="color:#374151;font-size:15px">
              ${isAr
                ? `مرحباً ${opts.recipientName}، قام ${opts.assignerName} بتعيينك في المهمة التالية:`
                : `Hello ${opts.recipientName}, ${opts.assignerName} has assigned you to the following task:`}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin:0 0 24px">
              <tr>
                <td style="padding:20px 24px;border-right:4px solid #2563EB">
                  <p style="margin:0 0 8px;color:#1E293B;font-size:17px;font-weight:700">${opts.taskTitle}</p>
                  <p style="margin:0 0 4px;color:#64748B;font-size:13px">📁 ${opts.projectTitle}</p>
                  ${opts.dueDate ? `<p style="margin:0;color:#F59E0B;font-size:13px;font-weight:600">📅 ${isAr ? 'الموعد النهائي' : 'Due'}: ${opts.dueDate}</p>` : ''}
                </td>
              </tr>
            </table>
            <a href="${opts.taskUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600">
              ${isAr ? 'عرض المهمة ←' : 'View Task →'}
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#F1F5F9;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#94A3B8;font-size:12px">
              ${isAr ? 'بريد تلقائي من نظام مافازا' : 'Automated email from Mafaza PMS'}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, htmlBody };
}
