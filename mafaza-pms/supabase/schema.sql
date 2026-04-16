-- =============================================================
-- MAFAZA F&B PROJECT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Supabase PostgreSQL with Row Level Security (RLS)
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'department_manager', 'employee');
CREATE TYPE department_name AS ENUM ('marketing', 'sales', 'r_and_d', 'production', 'accounts', 'procurement');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'under_review', 'completed', 'blocked', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_visibility AS ENUM ('public', 'internal', 'private');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('deadline_approaching', 'task_assigned', 'task_updated', 'comment_mention', 'task_overdue', 'project_update');
CREATE TYPE attachment_type AS ENUM ('image', 'document', 'spreadsheet', 'other');

-- =============================================================
-- TABLE: profiles (extends Supabase auth.users)
-- =============================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    full_name_ar TEXT,                          -- Arabic name
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'employee',
    department department_name,                 -- NULL for super_admin
    job_title TEXT,
    job_title_ar TEXT,
    microsoft_id TEXT UNIQUE,                   -- Azure AD object ID
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- TABLE: departments (metadata for each department)
-- =============================================================

CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name department_name NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    display_name_ar TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',      -- Tailwind hex for badges
    icon TEXT,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed departments
INSERT INTO public.departments (name, display_name, display_name_ar, color, icon) VALUES
    ('marketing',    'Marketing',   'التسويق',    '#8B5CF6', 'megaphone'),
    ('sales',        'Sales',       'المبيعات',   '#10B981', 'trending-up'),
    ('r_and_d',      'R&D',         'البحث والتطوير', '#F59E0B', 'flask'),
    ('production',   'Production',  'الإنتاج',    '#EF4444', 'factory'),
    ('accounts',     'Accounts',    'الحسابات',   '#3B82F6', 'calculator'),
    ('procurement',  'Procurement', 'المشتريات',  '#EC4899', 'shopping-cart');

-- =============================================================
-- TABLE: projects
-- =============================================================

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,
    status project_status NOT NULL DEFAULT 'planning',
    priority task_priority NOT NULL DEFAULT 'medium',
    department department_name NOT NULL,
    visibility task_visibility NOT NULL DEFAULT 'internal',
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    cover_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- TABLE: project_members (who can see/work on a project)
-- =============================================================

CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_edit BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

-- =============================================================
-- TABLE: tasks
-- =============================================================

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE, -- for subtasks
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,
    status task_status NOT NULL DEFAULT 'not_started',
    priority task_priority NOT NULL DEFAULT 'medium',
    visibility task_visibility NOT NULL DEFAULT 'internal',
    department department_name NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    estimated_hours NUMERIC(6,2),
    actual_hours NUMERIC(6,2),
    sort_order INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_milestone BOOLEAN DEFAULT FALSE,
    blocker_reason TEXT,                        -- if status = 'blocked'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- TABLE: task_watchers (users who follow a task)
-- =============================================================

CREATE TABLE public.task_watchers (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- =============================================================
-- TABLE: comments
-- =============================================================

CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    content_ar TEXT,
    is_private BOOLEAN DEFAULT FALSE,           -- if TRUE, only visible to mentioned users + managers
    is_system_comment BOOLEAN DEFAULT FALSE,    -- auto-generated audit trail
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- TABLE: comment_mentions (private comment recipients)
-- =============================================================

CREATE TABLE public.comment_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    UNIQUE (comment_id, user_id)
);

-- =============================================================
-- TABLE: attachments
-- =============================================================

CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    file_name TEXT NOT NULL,
    file_size INTEGER,                          -- bytes
    file_type attachment_type NOT NULL DEFAULT 'other',
    mime_type TEXT,
    storage_path TEXT NOT NULL,                 -- Supabase Storage path
    public_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (task_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- =============================================================
-- TABLE: notifications
-- =============================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    title_ar TEXT,
    message TEXT,
    message_ar TEXT,
    entity_type TEXT,                           -- 'task' | 'project' | 'comment'
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- TABLE: kpi_snapshots (daily KPI calculations)
-- =============================================================

CREATE TABLE public.kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department department_name,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    overdue_tasks INTEGER DEFAULT 0,
    on_time_completions INTEGER DEFAULT 0,
    completion_rate NUMERIC(5,2) DEFAULT 0,     -- percentage
    on_time_rate NUMERIC(5,2) DEFAULT 0,        -- percentage
    avg_task_duration_days NUMERIC(6,2),
    score NUMERIC(5,2) DEFAULT 0,               -- 0-100 composite KPI score
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, snapshot_date)
);

-- =============================================================
-- TABLE: audit_log (immutable change history)
-- =============================================================

CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,                       -- 'created', 'updated', 'deleted', 'status_changed'
    entity_type TEXT NOT NULL,                  -- 'project', 'task', 'comment'
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- INDEXES for performance
-- =============================================================

CREATE INDEX idx_projects_department ON public.projects(department);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_due_date ON public.projects(due_date);

CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_department ON public.tasks(department);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id);

CREATE INDEX idx_comments_task ON public.comments(task_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX idx_kpi_user_date ON public.kpi_snapshots(user_id, snapshot_date);
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on auth.users insert (for OAuth / Azure AD)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, microsoft_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'microsoft_id'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-calculate project progress from tasks
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_total INTEGER;
    v_completed INTEGER;
    v_progress INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_total, v_completed
    FROM public.tasks
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
      AND parent_task_id IS NULL;  -- only top-level tasks

    IF v_total > 0 THEN
        v_progress := ROUND((v_completed::NUMERIC / v_total) * 100);
    ELSE
        v_progress := 0;
    END IF;

    UPDATE public.projects
    SET progress_percentage = v_progress,
        status = CASE
            WHEN v_total > 0 AND v_completed = v_total THEN 'completed'::project_status
            ELSE status
        END
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_task_progress_update
    AFTER INSERT OR UPDATE OF status OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();

-- Notify on task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to <> NEW.assigned_to) THEN
        INSERT INTO public.notifications (recipient_id, sender_id, type, title, title_ar, message, entity_type, entity_id)
        VALUES (
            NEW.assigned_to,
            NEW.created_by,
            'task_assigned',
            'New Task Assigned',
            'تم تعيين مهمة جديدة',
            'You have been assigned a new task: ' || NEW.title,
            'task',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_task_assignment_notify
    AFTER INSERT OR UPDATE OF assigned_to ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignment();

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user department
CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS department_name AS $$
    SELECT department FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: is_department_manager
CREATE OR REPLACE FUNCTION public.is_department_manager()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'department_manager');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- PROFILES ----
CREATE POLICY "profiles_select_own_or_admin"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_super_admin()
           OR department = public.current_user_department());

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "profiles_insert_system"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- ---- DEPARTMENTS ----
CREATE POLICY "departments_select_all"
    ON public.departments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "departments_modify_admin"
    ON public.departments FOR ALL
    USING (public.is_super_admin());

-- ---- PROJECTS ----
CREATE POLICY "projects_select"
    ON public.projects FOR SELECT
    USING (
        public.is_super_admin()
        OR (
            department = public.current_user_department()
            AND (
                visibility IN ('public', 'internal')
                OR owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.project_members pm
                    WHERE pm.project_id = id AND pm.user_id = auth.uid()
                )
            )
        )
        OR visibility = 'public'
    );

CREATE POLICY "projects_insert"
    ON public.projects FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR (public.is_department_manager() AND department = public.current_user_department())
    );

CREATE POLICY "projects_update"
    ON public.projects FOR UPDATE
    USING (
        public.is_super_admin()
        OR owner_id = auth.uid()
        OR (public.is_department_manager() AND department = public.current_user_department())
    );

-- ---- TASKS ----
CREATE POLICY "tasks_select"
    ON public.tasks FOR SELECT
    USING (
        public.is_super_admin()
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
        OR (
            department = public.current_user_department()
            AND visibility IN ('public', 'internal')
        )
        OR (
            visibility = 'public'
            AND EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = project_id
                AND (p.department = public.current_user_department() OR public.is_super_admin())
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.task_watchers tw
            WHERE tw.task_id = id AND tw.user_id = auth.uid()
        )
    );

CREATE POLICY "tasks_insert"
    ON public.tasks FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR (public.is_department_manager() AND department = public.current_user_department())
    );

CREATE POLICY "tasks_update"
    ON public.tasks FOR UPDATE
    USING (
        public.is_super_admin()
        OR created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR (public.is_department_manager() AND department = public.current_user_department())
    );

-- ---- COMMENTS ----
CREATE POLICY "comments_select"
    ON public.comments FOR SELECT
    USING (
        NOT is_private
        OR author_id = auth.uid()
        OR public.is_super_admin()
        OR public.is_department_manager()
        OR EXISTS (
            SELECT 1 FROM public.comment_mentions cm
            WHERE cm.comment_id = id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "comments_insert"
    ON public.comments FOR INSERT
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_update_own"
    ON public.comments FOR UPDATE
    USING (author_id = auth.uid());

-- ---- NOTIFICATIONS ----
CREATE POLICY "notifications_own"
    ON public.notifications FOR SELECT
    USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    USING (recipient_id = auth.uid());

-- ---- KPI SNAPSHOTS ----
CREATE POLICY "kpi_select"
    ON public.kpi_snapshots FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_super_admin()
        OR (public.is_department_manager() AND department = public.current_user_department())
    );

-- ---- ATTACHMENTS ----
CREATE POLICY "attachments_select"
    ON public.attachments FOR SELECT
    USING (
        public.is_super_admin()
        OR uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id
            AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid()
                 OR t.department = public.current_user_department())
        )
    );

CREATE POLICY "attachments_insert"
    ON public.attachments FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());

-- ---- AUDIT LOG ----
CREATE POLICY "audit_log_admin_only"
    ON public.audit_log FOR SELECT
    USING (public.is_super_admin());

-- =============================================================
-- VIEWS
-- =============================================================

-- Bottleneck View: blocked or overdue tasks for executive dashboard
CREATE OR REPLACE VIEW public.bottleneck_tasks AS
SELECT
    t.id,
    t.title,
    t.title_ar,
    t.status,
    t.priority,
    t.department,
    t.due_date,
    t.blocker_reason,
    t.created_at,
    t.updated_at,
    p.id AS project_id,
    p.title AS project_title,
    p.title_ar AS project_title_ar,
    u.full_name AS assignee_name,
    u.email AS assignee_email,
    CURRENT_DATE - t.due_date AS days_overdue
FROM public.tasks t
JOIN public.projects p ON p.id = t.project_id
LEFT JOIN public.profiles u ON u.id = t.assigned_to
WHERE
    t.status = 'blocked'
    OR (t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled'))
ORDER BY days_overdue DESC NULLS LAST, t.priority DESC;

-- Department KPI summary view
CREATE OR REPLACE VIEW public.department_kpi_summary AS
SELECT
    p.department,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled')) AS overdue_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'blocked') AS blocked_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_tasks,
    ROUND(
        CASE WHEN COUNT(t.id) > 0
        THEN (COUNT(t.id) FILTER (WHERE t.status = 'completed')::NUMERIC / COUNT(t.id)) * 100
        ELSE 0 END, 2
    ) AS completion_rate
FROM public.tasks t
JOIN public.projects p ON p.id = t.project_id
WHERE t.parent_task_id IS NULL
GROUP BY p.department;

-- =============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard)
-- =============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-covers', 'project-covers', true);
