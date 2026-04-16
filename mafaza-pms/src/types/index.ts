// =============================================================
// MAFAZA PMS – Core Type Definitions
// =============================================================

export type UserRole = 'super_admin' | 'department_manager' | 'employee';

export type DepartmentName =
  | 'marketing'
  | 'sales'
  | 'r_and_d'
  | 'production'
  | 'accounts'
  | 'procurement';

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'under_review'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskVisibility = 'public' | 'internal' | 'private';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type NotificationType =
  | 'deadline_approaching'
  | 'task_assigned'
  | 'task_updated'
  | 'comment_mention'
  | 'task_overdue'
  | 'project_update';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  avatar_url?: string;
  role: UserRole;
  department?: DepartmentName;
  job_title?: string;
  job_title_ar?: string;
  microsoft_id?: string;
  is_active: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: DepartmentName;
  display_name: string;
  display_name_ar: string;
  color: string;
  icon?: string;
  manager_id?: string;
  manager?: Profile;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  status: ProjectStatus;
  priority: TaskPriority;
  department: DepartmentName;
  visibility: TaskVisibility;
  owner_id: string;
  owner?: Profile;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  cover_image_url?: string;
  tags: string[];
  progress_percentage: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // computed joins
  tasks?: Task[];
  members?: ProjectMember[];
  _count?: { tasks: number; completed: number };
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  can_edit: boolean;
  joined_at: string;
  user?: Profile;
}

export interface Task {
  id: string;
  project_id: string;
  parent_task_id?: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  status: TaskStatus;
  priority: TaskPriority;
  visibility: TaskVisibility;
  department: DepartmentName;
  assigned_to?: string;
  assignee?: Profile;
  created_by: string;
  creator?: Profile;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  sort_order: number;
  tags: string[];
  is_milestone: boolean;
  blocker_reason?: string;
  created_at: string;
  updated_at: string;
  // joins
  subtasks?: Task[];
  comments?: Comment[];
  attachments?: Attachment[];
  watchers?: Profile[];
  project?: Project;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  author?: Profile;
  content: string;
  content_ar?: string;
  is_private: boolean;
  is_system_comment: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  mentions?: CommentMention[];
  attachments?: Attachment[];
}

export interface CommentMention {
  id: string;
  comment_id: string;
  user_id: string;
  is_read: boolean;
  user?: Profile;
}

export interface Attachment {
  id: string;
  task_id?: string;
  comment_id?: string;
  uploaded_by: string;
  uploader?: Profile;
  file_name: string;
  file_size?: number;
  file_type: 'image' | 'document' | 'spreadsheet' | 'other';
  mime_type?: string;
  storage_path: string;
  public_url?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  sender?: Profile;
  type: NotificationType;
  title: string;
  title_ar?: string;
  message?: string;
  message_ar?: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

export interface KpiSnapshot {
  id: string;
  user_id: string;
  department?: DepartmentName;
  snapshot_date: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  on_time_completions: number;
  completion_rate: number;
  on_time_rate: number;
  avg_task_duration_days?: number;
  score: number;
  created_at: string;
}

export interface BottleneckTask {
  id: string;
  title: string;
  title_ar?: string;
  status: TaskStatus;
  priority: TaskPriority;
  department: DepartmentName;
  due_date?: string;
  blocker_reason?: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  project_title: string;
  project_title_ar?: string;
  assignee_name?: string;
  assignee_email?: string;
  days_overdue?: number;
}

export interface DepartmentKpiSummary {
  department: DepartmentName;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
}

// Auth types
export interface AuthSession {
  user: Profile;
  accessToken: string;
  microsoftToken?: string;
}

// Form types
export interface CreateProjectForm {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  department: DepartmentName;
  priority: TaskPriority;
  visibility: TaskVisibility;
  start_date?: string;
  due_date?: string;
  tags?: string[];
}

export interface CreateTaskForm {
  project_id: string;
  parent_task_id?: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  department: DepartmentName;
  priority: TaskPriority;
  visibility: TaskVisibility;
  assigned_to?: string;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  is_milestone?: boolean;
  tags?: string[];
}

// UI state
export interface FilterState {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  department?: DepartmentName[];
  assignee?: string[];
  dateRange?: { from: string; to: string };
  search?: string;
}
