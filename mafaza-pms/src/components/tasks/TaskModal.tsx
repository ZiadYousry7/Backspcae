'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Clock, User, Tag, Paperclip, Lock,
  Send, CheckSquare, ChevronDown, AlertOctagon, Edit3,
  Trash2, Download, File, Image, Eye, EyeOff, MessageCircle,
  Plus, Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn, TASK_STATUS_CONFIG, formatFileSize, getFileType } from '@/lib/utils';
import type { Task, Comment, Attachment, Profile, TaskStatus } from '@/types';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdated: () => void;
}

const ALL_STATUSES: TaskStatus[] = [
  'not_started', 'in_progress', 'under_review', 'completed', 'blocked', 'cancelled'
];

// ---- Attachment icon ----
function FileIcon({ type }: { type: string }) {
  if (type === 'image') return <Image size={16} className="text-blue-500" />;
  return <File size={16} className="text-gray-500" />;
}

// ---- Single comment ----
function CommentBubble({
  comment,
  currentUserId,
  lang,
}: {
  comment: Comment & { author?: Profile };
  currentUserId: string;
  lang: 'en' | 'ar';
}) {
  const isOwn = comment.author_id === currentUserId;

  return (
    <div className={cn('flex gap-2.5', isOwn && 'flex-row-reverse')}>
      <Avatar profile={comment.author} size="xs" className="shrink-0 mt-1" />
      <div className={cn('flex-1 max-w-[80%]', isOwn && 'items-end')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-600">{comment.author?.full_name}</span>
          {comment.is_private && (
            <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">
              <Lock size={9} />
              {lang === 'ar' ? 'خاص' : 'Private'}
            </span>
          )}
          <span className="text-[10px] text-gray-300">
            {new Date(comment.created_at).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
        <div className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm text-gray-800 shadow-sm',
          isOwn ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 rounded-tl-sm',
          comment.is_private && 'ring-1 ring-purple-300'
        )}>
          {comment.content}
        </div>
      </div>
    </div>
  );
}

// ---- Main task modal ----
export function TaskModal({ task, onClose, onUpdated }: TaskModalProps) {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'subtasks' | 'attachments'>('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const canEdit =
    profile?.role === 'super_admin' ||
    profile?.role === 'department_manager' ||
    task.created_by === profile?.id ||
    task.assigned_to === profile?.id;

  const title = lang === 'ar' && task.title_ar ? task.title_ar : task.title;
  const description = lang === 'ar' && task.description_ar ? task.description_ar : task.description;

  // Load related data
  useEffect(() => {
    const loadRelated = async () => {
      const [{ data: commentData }, { data: attachData }, { data: subtaskData }] = await Promise.all([
        supabase
          .from('comments')
          .select(`*, author:profiles!comments_author_id_fkey(id, full_name, avatar_url)`)
          .eq('task_id', task.id)
          .order('created_at', { ascending: true }),

        supabase
          .from('attachments')
          .select(`*, uploader:profiles!attachments_uploaded_by_fkey(id, full_name)`)
          .eq('task_id', task.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('tasks')
          .select(`*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url)`)
          .eq('parent_task_id', task.id)
          .order('sort_order', { ascending: true }),
      ]);

      setComments((commentData as Comment[]) ?? []);
      setAttachments((attachData as Attachment[]) ?? []);
      setSubtasks((subtaskData as Task[]) ?? []);
    };

    loadRelated();
  }, [task.id]);

  // Scroll comments to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Update task status
  const updateStatus = async (newStatus: TaskStatus) => {
    setSaving(true);
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    if (!error) {
      setStatus(newStatus);
      // Add system comment for audit trail
      await supabase.from('comments').insert({
        task_id: task.id,
        author_id: profile!.id,
        content: `Status changed to "${TASK_STATUS_CONFIG[newStatus].label}"`,
        is_system_comment: true,
        is_private: false,
      });
    }
    setSaving(false);
    setShowStatusMenu(false);
  };

  // Send comment
  const sendComment = async () => {
    if (!newComment.trim() || !profile) return;
    setSendingComment(true);

    const { data: commentRow, error } = await supabase
      .from('comments')
      .insert({
        task_id: task.id,
        author_id: profile.id,
        content: newComment.trim(),
        is_private: isPrivateComment,
        is_system_comment: false,
      })
      .select('*')
      .single();

    if (!error && commentRow) {
      // Insert private mentions
      if (isPrivateComment && mentionedUsers.length > 0) {
        await supabase.from('comment_mentions').insert(
          mentionedUsers.map((uid) => ({ comment_id: commentRow.id, user_id: uid }))
        );
      }

      setComments((prev) => [...prev, { ...commentRow, author: profile } as Comment]);
      setNewComment('');
      setMentionedUsers([]);
    }
    setSendingComment(false);
  };

  // Upload attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !profile) return;
    setUploading(true);

    for (const file of Array.from(e.target.files)) {
      const path = `tasks/${task.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(path, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(path);

        await supabase.from('attachments').insert({
          task_id: task.id,
          uploaded_by: profile.id,
          file_name: file.name,
          file_size: file.size,
          file_type: getFileType(file.type),
          mime_type: file.type,
          storage_path: path,
          public_url: urlData.publicUrl,
        });
      }
    }

    // Reload attachments
    const { data } = await supabase
      .from('attachments')
      .select('*, uploader:profiles!attachments_uploaded_by_fkey(id, full_name)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });

    setAttachments((data as Attachment[]) ?? []);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle subtask completion
  const toggleSubtask = async (subtask: Task) => {
    const newStatus: TaskStatus = subtask.status === 'completed' ? 'not_started' : 'completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', subtask.id);
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtask.id ? { ...s, status: newStatus } : s))
    );
  };

  const TABS = [
    { id: 'details', label: lang === 'ar' ? 'التفاصيل' : 'Details' },
    { id: 'comments', label: `${t('tasks.comments')} (${comments.filter((c) => !c.is_system_comment).length})` },
    { id: 'subtasks', label: `${t('tasks.subtasks')} (${subtasks.length})` },
    { id: 'attachments', label: `${t('tasks.attachments')} (${attachments.length})` },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pe-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {task.is_milestone && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                  ◆ {lang === 'ar' ? 'معلم' : 'Milestone'}
                </span>
              )}
              {/* Status selector */}
              <div className="relative">
                <button
                  onClick={() => canEdit && setShowStatusMenu(!showStatusMenu)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                    TASK_STATUS_CONFIG[status].bg,
                    TASK_STATUS_CONFIG[status].color,
                    canEdit && 'cursor-pointer hover:opacity-80'
                  )}
                  disabled={!canEdit || saving}
                >
                  {lang === 'ar' ? TASK_STATUS_CONFIG[status].labelAr : TASK_STATUS_CONFIG[status].label}
                  {canEdit && <ChevronDown size={11} />}
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full mt-1 start-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(s)}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                          s === status && 'bg-blue-50 text-blue-600 font-medium'
                        )}
                      >
                        <span className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          TASK_STATUS_CONFIG[s].bg.replace('bg-', 'bg-').replace('50', '500')
                        )} />
                        {lang === 'ar' ? TASK_STATUS_CONFIG[s].labelAr : TASK_STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <PriorityBadge priority={task.priority} lang={lang} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="p-5 space-y-5">
              {description && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                    {t('projects.description')}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Assignee */}
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                    <User size={11} /> {t('tasks.assignee')}
                  </p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar profile={task.assignee} size="xs" />
                      <span className="text-sm text-gray-700">{task.assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">{t('tasks.unassigned')}</span>
                  )}
                </div>

                {/* Due date */}
                {task.due_date && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                      <Calendar size={11} /> {t('tasks.dueDate')}
                    </p>
                    <p className="text-sm text-gray-700">
                      {new Date(task.due_date).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {/* Hours */}
                {task.estimated_hours && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                      <Clock size={11} /> {t('tasks.estimatedHours')}
                    </p>
                    <p className="text-sm text-gray-700">{task.estimated_hours}h</p>
                  </div>
                )}
                {task.actual_hours && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                      <Clock size={11} /> {t('tasks.actualHours')}
                    </p>
                    <p className="text-sm text-gray-700">{task.actual_hours}h</p>
                  </div>
                )}
              </div>

              {/* Blocker reason */}
              {task.status === 'blocked' && task.blocker_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-500 font-medium mb-1 flex items-center gap-1">
                    <AlertOctagon size={11} /> {t('tasks.blockerReason')}
                  </p>
                  <p className="text-sm text-red-700">{task.blocker_reason}</p>
                </div>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                    <Tag size={11} /> {t('tasks.tags')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* System comments (audit log) */}
              {comments.filter((c) => c.is_system_comment).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    {lang === 'ar' ? 'سجل التغييرات' : 'Activity Log'}
                  </p>
                  <div className="space-y-1.5">
                    {comments.filter((c) => c.is_system_comment).map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        <span>{c.content}</span>
                        <span className="ms-auto shrink-0">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {comments.filter((c) => !c.is_system_comment).length === 0 ? (
                  <div className="text-center py-10">
                    <MessageCircle size={36} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">
                      {lang === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                    </p>
                  </div>
                ) : (
                  comments
                    .filter((c) => !c.is_system_comment)
                    .map((c) => (
                      <CommentBubble
                        key={c.id}
                        comment={c as Comment & { author?: Profile }}
                        currentUserId={profile?.id ?? ''}
                        lang={lang}
                      />
                    ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment composer */}
              <div className="border-t border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setIsPrivateComment(!isPrivateComment)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
                      isPrivateComment
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {isPrivateComment ? <Lock size={11} /> : <Eye size={11} />}
                    {isPrivateComment ? t('tasks.privateComment') : (lang === 'ar' ? 'عام' : 'Public')}
                  </button>
                  {isPrivateComment && (
                    <p className="text-xs text-purple-500">
                      {lang === 'ar'
                        ? 'سيظهر للأشخاص المذكورين والمديرين فقط'
                        : 'Only visible to mentioned users and managers'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Avatar profile={profile} size="xs" className="mt-1.5 shrink-0" />
                  <div className="flex-1 flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendComment();
                        }
                      }}
                      placeholder={t('tasks.addComment')}
                      rows={2}
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 hover:bg-white transition-colors"
                    />
                    <button
                      onClick={sendComment}
                      disabled={!newComment.trim() || sendingComment}
                      className="self-end p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTASKS TAB */}
          {activeTab === 'subtasks' && (
            <div className="p-5 space-y-3">
              {/* Progress of subtasks */}
              {subtasks.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{lang === 'ar' ? 'تقدم المهام الفرعية' : 'Subtask progress'}</span>
                    <span>
                      {subtasks.filter((s) => s.status === 'completed').length}/{subtasks.length}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${(subtasks.filter((s) => s.status === 'completed').length / subtasks.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {subtasks.length === 0 ? (
                <div className="text-center py-10">
                  <CheckSquare size={36} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">{t('tasks.noTasks')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => toggleSubtask(subtask)}
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                          subtask.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                        )}
                      >
                        {subtask.status === 'completed' && <Check size={12} />}
                      </button>
                      <span className={cn(
                        'flex-1 text-sm text-gray-700',
                        subtask.status === 'completed' && 'line-through text-gray-400'
                      )}>
                        {lang === 'ar' && subtask.title_ar ? subtask.title_ar : subtask.title}
                      </span>
                      {subtask.assignee && (
                        <Avatar profile={subtask.assignee} size="xs" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canEdit && (
                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                  <Plus size={15} />
                  {t('tasks.addSubtask')}
                </button>
              )}
            </div>
          )}

          {/* ATTACHMENTS TAB */}
          {activeTab === 'attachments' && (
            <div className="p-5 space-y-3">
              {canEdit && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <Paperclip size={16} />
                    {uploading
                      ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                      : t('tasks.uploadFile')}
                  </button>
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="text-center py-10">
                  <Paperclip size={36} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">
                    {lang === 'ar' ? 'لا توجد مرفقات' : 'No attachments'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <FileIcon type={att.file_type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{att.file_name}</p>
                        <p className="text-xs text-gray-400">
                          {att.file_size ? formatFileSize(att.file_size) : ''} ·{' '}
                          {att.uploader?.full_name} ·{' '}
                          {new Date(att.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {att.public_url && (
                        <a
                          href={att.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.file_name}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-xs text-gray-400 bg-gray-50/50">
          <span>
            {lang === 'ar' ? 'تم الإنشاء' : 'Created'}{' '}
            {new Date(task.created_at).toLocaleDateString()}
            {task.creator ? ` · ${task.creator.full_name}` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors text-xs font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
