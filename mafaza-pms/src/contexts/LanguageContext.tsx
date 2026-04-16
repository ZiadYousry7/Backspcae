'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Lang = 'en' | 'ar';

interface LanguageContextValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  toggleLang: () => void;
  t: (key: string) => string;
}

// ---- Full translation dictionary ----
const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.tasks': 'My Tasks',
    'nav.executive': 'Executive View',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign Out',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.add': 'Add',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.view': 'View',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.all': 'All',
    'common.none': 'None',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.noData': 'No data available',
    'common.error': 'An error occurred',
    'common.success': 'Success',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.signInWith365': 'Sign in with Microsoft 365',
    'auth.signOut': 'Sign Out',
    'auth.welcome': 'Welcome to Mafaza PMS',
    'auth.subtitle': 'Project Management for Mafaza F&B',
    'auth.signingIn': 'Signing in...',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Good morning',
    'dashboard.myTasks': 'My Tasks',
    'dashboard.totalTasks': 'Total Tasks',
    'dashboard.completed': 'Completed',
    'dashboard.inProgress': 'In Progress',
    'dashboard.overdue': 'Overdue',
    'dashboard.upcoming': 'Upcoming Deadlines',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.kpiScore': 'KPI Score',
    'dashboard.completionRate': 'Completion Rate',
    'dashboard.onTimeRate': 'On-Time Rate',
    'dashboard.noUpcomingDeadlines': 'No upcoming deadlines',
    'dashboard.allCaughtUp': 'You\'re all caught up!',

    // Projects
    'projects.title': 'Projects',
    'projects.newProject': 'New Project',
    'projects.allProjects': 'All Projects',
    'projects.myProjects': 'My Projects',
    'projects.archived': 'Archived',
    'projects.noProjects': 'No projects found',
    'projects.createFirst': 'Create your first project to get started',
    'projects.progress': 'Progress',
    'projects.tasks': 'Tasks',
    'projects.members': 'Members',
    'projects.dueDate': 'Due Date',
    'projects.status': 'Status',
    'projects.priority': 'Priority',
    'projects.department': 'Department',
    'projects.visibility': 'Visibility',
    'projects.owner': 'Owner',
    'projects.description': 'Description',

    // Tasks
    'tasks.title': 'Tasks',
    'tasks.newTask': 'New Task',
    'tasks.allTasks': 'All Tasks',
    'tasks.assignedToMe': 'Assigned to Me',
    'tasks.createdByMe': 'Created by Me',
    'tasks.subtasks': 'Subtasks',
    'tasks.addSubtask': 'Add Subtask',
    'tasks.comments': 'Comments',
    'tasks.addComment': 'Add a comment...',
    'tasks.privateComment': 'Private comment',
    'tasks.attachments': 'Attachments',
    'tasks.uploadFile': 'Upload File',
    'tasks.assignee': 'Assignee',
    'tasks.unassigned': 'Unassigned',
    'tasks.dueDate': 'Due Date',
    'tasks.startDate': 'Start Date',
    'tasks.estimatedHours': 'Estimated Hours',
    'tasks.actualHours': 'Actual Hours',
    'tasks.blockerReason': 'Blocker Reason',
    'tasks.noTasks': 'No tasks yet',
    'tasks.markComplete': 'Mark Complete',
    'tasks.markIncomplete': 'Mark Incomplete',
    'tasks.milestone': 'Milestone',
    'tasks.tags': 'Tags',
    'tasks.watchers': 'Watchers',

    // Status labels
    'status.not_started': 'Not Started',
    'status.in_progress': 'In Progress',
    'status.under_review': 'Under Review',
    'status.completed': 'Completed',
    'status.blocked': 'Blocked',
    'status.cancelled': 'Cancelled',
    'status.planning': 'Planning',
    'status.active': 'Active',
    'status.on_hold': 'On Hold',

    // Priority labels
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.critical': 'Critical',

    // Visibility labels
    'visibility.public': 'Public',
    'visibility.internal': 'Internal',
    'visibility.private': 'Private',

    // Departments
    'dept.marketing': 'Marketing',
    'dept.sales': 'Sales',
    'dept.r_and_d': 'R&D',
    'dept.production': 'Production',
    'dept.accounts': 'Accounts',
    'dept.procurement': 'Procurement',

    // Roles
    'role.super_admin': 'Super Admin',
    'role.department_manager': 'Department Manager',
    'role.employee': 'Employee',

    // Executive dashboard
    'executive.title': 'Executive Dashboard',
    'executive.bottlenecks': 'Bottlenecks',
    'executive.bottleneckDesc': 'Blocked or overdue tasks requiring attention',
    'executive.deptOverview': 'Department Overview',
    'executive.totalProjects': 'Total Projects',
    'executive.companyKPI': 'Company KPI',
    'executive.noBottlenecks': 'No bottlenecks detected',
    'executive.daysOverdue': 'days overdue',

    // Forms
    'form.title': 'Title',
    'form.titleAr': 'Title (Arabic)',
    'form.description': 'Description',
    'form.descriptionAr': 'Description (Arabic)',
    'form.required': 'This field is required',
    'form.selectDept': 'Select Department',
    'form.selectPriority': 'Select Priority',
    'form.selectStatus': 'Select Status',
    'form.selectVisibility': 'Select Visibility',
    'form.selectAssignee': 'Select Assignee',

    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Mark all as read',
    'notif.noNotifications': 'No notifications',
    'notif.task_assigned': 'Task Assigned',
    'notif.deadline_approaching': 'Deadline Approaching',
    'notif.task_overdue': 'Task Overdue',
    'notif.comment_mention': 'Mentioned in Comment',
    'notif.task_updated': 'Task Updated',
    'notif.project_update': 'Project Updated',

    // KPI
    'kpi.title': 'KPI Metrics',
    'kpi.score': 'Performance Score',
    'kpi.completion': 'Task Completion Rate',
    'kpi.onTime': 'On-Time Delivery Rate',
    'kpi.avgDuration': 'Avg. Task Duration',
    'kpi.days': 'days',
    'kpi.excellent': 'Excellent',
    'kpi.good': 'Good',
    'kpi.needsImprovement': 'Needs Improvement',
    'kpi.poor': 'Poor',
  },

  ar: {
    // Nav
    'nav.dashboard': 'لوحة التحكم',
    'nav.projects': 'المشاريع',
    'nav.tasks': 'مهامي',
    'nav.executive': 'العرض التنفيذي',
    'nav.notifications': 'الإشعارات',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.add': 'إضافة',
    'common.search': 'بحث...',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.view': 'عرض',
    'common.close': 'إغلاق',
    'common.submit': 'إرسال',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.all': 'الكل',
    'common.none': 'لا شيء',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.noData': 'لا توجد بيانات',
    'common.error': 'حدث خطأ',
    'common.success': 'نجاح',

    // Auth
    'auth.signIn': 'تسجيل الدخول',
    'auth.signInWith365': 'تسجيل الدخول بـ Microsoft 365',
    'auth.signOut': 'تسجيل الخروج',
    'auth.welcome': 'أهلاً بك في نظام مافازا',
    'auth.subtitle': 'نظام إدارة المشاريع لشركة مافازا',
    'auth.signingIn': 'جاري تسجيل الدخول...',

    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'صباح الخير',
    'dashboard.myTasks': 'مهامي',
    'dashboard.totalTasks': 'إجمالي المهام',
    'dashboard.completed': 'مكتمل',
    'dashboard.inProgress': 'جاري',
    'dashboard.overdue': 'متأخر',
    'dashboard.upcoming': 'المواعيد القادمة',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.kpiScore': 'نقاط الأداء',
    'dashboard.completionRate': 'معدل الإنجاز',
    'dashboard.onTimeRate': 'معدل الالتزام بالمواعيد',
    'dashboard.noUpcomingDeadlines': 'لا توجد مواعيد قادمة',
    'dashboard.allCaughtUp': 'أنت على المسار الصحيح!',

    // Projects
    'projects.title': 'المشاريع',
    'projects.newProject': 'مشروع جديد',
    'projects.allProjects': 'جميع المشاريع',
    'projects.myProjects': 'مشاريعي',
    'projects.archived': 'مؤرشف',
    'projects.noProjects': 'لا توجد مشاريع',
    'projects.createFirst': 'أنشئ مشروعك الأول للبدء',
    'projects.progress': 'التقدم',
    'projects.tasks': 'المهام',
    'projects.members': 'الأعضاء',
    'projects.dueDate': 'تاريخ الاستحقاق',
    'projects.status': 'الحالة',
    'projects.priority': 'الأولوية',
    'projects.department': 'القسم',
    'projects.visibility': 'الرؤية',
    'projects.owner': 'المالك',
    'projects.description': 'الوصف',

    // Tasks
    'tasks.title': 'المهام',
    'tasks.newTask': 'مهمة جديدة',
    'tasks.allTasks': 'جميع المهام',
    'tasks.assignedToMe': 'المسندة إليّ',
    'tasks.createdByMe': 'التي أنشأتها',
    'tasks.subtasks': 'المهام الفرعية',
    'tasks.addSubtask': 'إضافة مهمة فرعية',
    'tasks.comments': 'التعليقات',
    'tasks.addComment': 'أضف تعليقاً...',
    'tasks.privateComment': 'تعليق خاص',
    'tasks.attachments': 'المرفقات',
    'tasks.uploadFile': 'رفع ملف',
    'tasks.assignee': 'المسؤول',
    'tasks.unassigned': 'غير مسند',
    'tasks.dueDate': 'تاريخ الاستحقاق',
    'tasks.startDate': 'تاريخ البدء',
    'tasks.estimatedHours': 'الساعات المقدرة',
    'tasks.actualHours': 'الساعات الفعلية',
    'tasks.blockerReason': 'سبب الحظر',
    'tasks.noTasks': 'لا توجد مهام بعد',
    'tasks.markComplete': 'تعليم كمكتمل',
    'tasks.markIncomplete': 'تعليم كغير مكتمل',
    'tasks.milestone': 'معلم رئيسي',
    'tasks.tags': 'الوسوم',
    'tasks.watchers': 'المراقبون',

    // Status labels
    'status.not_started': 'لم يبدأ',
    'status.in_progress': 'جاري',
    'status.under_review': 'قيد المراجعة',
    'status.completed': 'مكتمل',
    'status.blocked': 'محظور',
    'status.cancelled': 'ملغي',
    'status.planning': 'تخطيط',
    'status.active': 'نشط',
    'status.on_hold': 'متوقف',

    // Priority labels
    'priority.low': 'منخفض',
    'priority.medium': 'متوسط',
    'priority.high': 'عالي',
    'priority.critical': 'حرج',

    // Visibility labels
    'visibility.public': 'عام',
    'visibility.internal': 'داخلي',
    'visibility.private': 'خاص',

    // Departments
    'dept.marketing': 'التسويق',
    'dept.sales': 'المبيعات',
    'dept.r_and_d': 'البحث والتطوير',
    'dept.production': 'الإنتاج',
    'dept.accounts': 'الحسابات',
    'dept.procurement': 'المشتريات',

    // Roles
    'role.super_admin': 'المدير التنفيذي',
    'role.department_manager': 'مدير القسم',
    'role.employee': 'موظف',

    // Executive dashboard
    'executive.title': 'لوحة الإدارة العليا',
    'executive.bottlenecks': 'نقاط الاختناق',
    'executive.bottleneckDesc': 'المهام المحظورة أو المتأخرة التي تحتاج اهتماماً',
    'executive.deptOverview': 'نظرة عامة على الأقسام',
    'executive.totalProjects': 'إجمالي المشاريع',
    'executive.companyKPI': 'مؤشرات أداء الشركة',
    'executive.noBottlenecks': 'لا توجد اختناقات',
    'executive.daysOverdue': 'أيام متأخرة',

    // Forms
    'form.title': 'العنوان',
    'form.titleAr': 'العنوان (عربي)',
    'form.description': 'الوصف',
    'form.descriptionAr': 'الوصف (عربي)',
    'form.required': 'هذا الحقل مطلوب',
    'form.selectDept': 'اختر القسم',
    'form.selectPriority': 'اختر الأولوية',
    'form.selectStatus': 'اختر الحالة',
    'form.selectVisibility': 'اختر الرؤية',
    'form.selectAssignee': 'اختر المسؤول',

    // Notifications
    'notif.title': 'الإشعارات',
    'notif.markAllRead': 'تعليم الكل كمقروء',
    'notif.noNotifications': 'لا توجد إشعارات',
    'notif.task_assigned': 'تم تعيين مهمة',
    'notif.deadline_approaching': 'موعد الاستحقاق يقترب',
    'notif.task_overdue': 'مهمة متأخرة',
    'notif.comment_mention': 'تم الإشارة إليك في تعليق',
    'notif.task_updated': 'تم تحديث مهمة',
    'notif.project_update': 'تم تحديث مشروع',

    // KPI
    'kpi.title': 'مؤشرات الأداء',
    'kpi.score': 'نقاط الأداء',
    'kpi.completion': 'معدل إنجاز المهام',
    'kpi.onTime': 'معدل التسليم في الوقت',
    'kpi.avgDuration': 'متوسط مدة المهمة',
    'kpi.days': 'أيام',
    'kpi.excellent': 'ممتاز',
    'kpi.good': 'جيد',
    'kpi.needsImprovement': 'يحتاج تحسين',
    'kpi.poor': 'ضعيف',
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  // Persist language preference
  useEffect(() => {
    const stored = localStorage.getItem('mafaza_lang') as Lang | null;
    if (stored === 'ar' || stored === 'en') setLang(stored);
  }, []);

  // Apply dir/lang attributes to <html>
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem('mafaza_lang', next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string): string => translations[lang][key] ?? translations['en'][key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', isRTL: lang === 'ar', toggleLang, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
