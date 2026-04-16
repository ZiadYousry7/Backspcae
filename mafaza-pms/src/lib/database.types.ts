// Simplified Supabase database types - avoids `never` issues from complex Omit chains

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type Profile = {
  id: string;
  email: string;
  full_name: string;
  full_name_ar: string | null;
  avatar_url: string | null;
  role: 'super_admin' | 'department_manager' | 'employee';
  department: 'marketing' | 'sales' | 'r_and_d' | 'production' | 'accounts' | 'procurement' | null;
  job_title: string | null;
  job_title_ar: string | null;
  microsoft_id: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: 'marketing' | 'sales' | 'r_and_d' | 'production' | 'accounts' | 'procurement';
  visibility: 'public' | 'internal' | 'private';
  owner_id: string;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  cover_image_url: string | null;
  tags: string[];
  progress_percentage: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  status: 'not_started' | 'in_progress' | 'under_review' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  visibility: 'public' | 'internal' | 'private';
  department: 'marketing' | 'sales' | 'r_and_d' | 'production' | 'accounts' | 'procurement';
  assigned_to: string | null;
  created_by: string;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  sort_order: number;
  tags: string[];
  is_milestone: boolean;
  blocker_reason: string | null;
  created_at: string;
  updated_at: string;
};

type Comment = {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  content_ar: string | null;
  is_private: boolean;
  is_system_comment: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

type CommentMention = {
  id: string;
  comment_id: string;
  user_id: string;
  is_read: boolean;
};

type Attachment = {
  id: string;
  task_id: string | null;
  comment_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_size: number | null;
  file_type: 'image' | 'document' | 'spreadsheet' | 'other';
  mime_type: string | null;
  storage_path: string;
  public_url: string | null;
  created_at: string;
};

type Notification = {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: 'deadline_approaching' | 'task_assigned' | 'task_updated' | 'comment_mention' | 'task_overdue' | 'project_update';
  title: string;
  title_ar: string | null;
  message: string | null;
  message_ar: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
};

type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  can_edit: boolean;
  joined_at: string;
};

type KpiSnapshot = {
  id: string;
  user_id: string;
  department: string | null;
  snapshot_date: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  on_time_completions: number;
  completion_rate: number;
  on_time_rate: number;
  avg_task_duration_days: number | null;
  score: number;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string; full_name: string };
        Update: Partial<Profile>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'progress_percentage'> & { id?: string; progress_percentage?: number };
        Update: Partial<Project>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Task>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Comment>;
      };
      comment_mentions: {
        Row: CommentMention;
        Insert: Omit<CommentMention, 'id'> & { id?: string };
        Update: Partial<CommentMention>;
      };
      attachments: {
        Row: Attachment;
        Insert: Omit<Attachment, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Attachment>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Notification>;
      };
      project_members: {
        Row: ProjectMember;
        Insert: Omit<ProjectMember, 'id' | 'joined_at'> & { id?: string };
        Update: Partial<ProjectMember>;
      };
      kpi_snapshots: {
        Row: KpiSnapshot;
        Insert: Omit<KpiSnapshot, 'id' | 'created_at'> & { id?: string };
        Update: Partial<KpiSnapshot>;
      };
    };
    Views: {
      bottleneck_tasks: {
        Row: {
          id: string;
          title: string;
          title_ar: string | null;
          status: string;
          priority: string;
          department: string;
          due_date: string | null;
          blocker_reason: string | null;
          created_at: string;
          updated_at: string;
          project_id: string;
          project_title: string;
          project_title_ar: string | null;
          assignee_name: string | null;
          assignee_email: string | null;
          days_overdue: number | null;
        };
      };
      department_kpi_summary: {
        Row: {
          department: string;
          total_tasks: number;
          completed_tasks: number;
          overdue_tasks: number;
          blocked_tasks: number;
          in_progress_tasks: number;
          completion_rate: number;
        };
      };
    };
    Functions: {
      current_user_role: { Args: Record<never, never>; Returns: string };
      current_user_department: { Args: Record<never, never>; Returns: string };
      is_super_admin: { Args: Record<never, never>; Returns: boolean };
      is_department_manager: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: {
      user_role: 'super_admin' | 'department_manager' | 'employee';
      department_name: 'marketing' | 'sales' | 'r_and_d' | 'production' | 'accounts' | 'procurement';
    };
  };
}
