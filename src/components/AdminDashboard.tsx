import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CreditCard,
  Database,
  Loader2,
  Megaphone,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  BrandConfig,
  Course,
  Enrollment,
  NoticeItem,
  PaymentStatus,
  PaymentSubmission,
  UserProfile,
} from '../types/lms';
import { isVerifiedAdminUser } from '../utils/authGuards';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminCoursesTab } from './admin/AdminCoursesTab';
import { AdminPaymentsTab } from './admin/AdminPaymentsTab';
import { AdminNoticesTab } from './admin/AdminNoticesTab';

interface AdminDashboardProps {
  currentUser: UserProfile | null;
  courses: Course[];
  enrollments: Enrollment[];
  payments: PaymentSubmission[];
  notices: NoticeItem[];
  brandConfig: BrandConfig;
  onUpdateBrandConfig: (config: BrandConfig) => void;
  onCreateCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onPreviewCourse: (courseId: string) => void;
  onUpdatePaymentStatus: (paymentId: string, status: PaymentStatus) => void;
  onCreateNotice: (notice: NoticeItem) => void;
  onToggleNotice: (noticeId: string) => void;
  onDeleteNotice: (noticeId: string) => void;
  onImportDemoData?: () => Promise<{
    coursesAdded: number;
    noticesAdded: number;
    examsAdded: number;
  }>;
  onExitAdmin?: () => void;
}

type AdminSubTab = 'overview' | 'courses' | 'payments' | 'notices';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  courses,
  enrollments,
  payments,
  notices,
  brandConfig,
  onUpdateBrandConfig,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onPreviewCourse,
  onUpdatePaymentStatus,
  onCreateNotice,
  onToggleNotice,
  onDeleteNotice,
  onImportDemoData,
  onExitAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('overview');
  const [statusNotice, setStatusNotice] = useState('');
  const [importingDemo, setImportingDemo] = useState(false);

  const isStrictlyAuthorized = isVerifiedAdminUser(currentUser);

  const pendingPaymentsCount = useMemo(
    () => payments.filter((p) => p.status === 'pending').length,
    [payments]
  );

  const activeNoticesCount = useMemo(
    () => notices.filter((n) => n.active).length,
    [notices]
  );

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => setStatusNotice(''), 4000);
  };

  const handleImportDemoClick = async () => {
    if (!onImportDemoData) return;
    setImportingDemo(true);
    try {
      const summary = await onImportDemoData();
      if (
        summary.coursesAdded === 0 &&
        summary.noticesAdded === 0 &&
        summary.examsAdded === 0
      ) {
        showNotice('All demo courses, notices, and exam MCQs are already in Firestore.');
      } else {
        showNotice(
          `Imported ${summary.coursesAdded} courses, ${summary.noticesAdded} notices, and ${summary.examsAdded} exam MCQs into Firestore.`
        );
      }
    } finally {
      setImportingDemo(false);
    }
  };

  const tabs: Array<{
    id: AdminSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'overview', label: 'Overview Analytics', icon: BarChart3 },
    {
      id: 'courses',
      label: 'Courses & YT Importer',
      icon: BookOpen,
      count: courses.length,
    },
    {
      id: 'payments',
      label: 'Payment Approvals',
      icon: CreditCard,
      count: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
    },
    {
      id: 'notices',
      label: 'Notice Manager',
      icon: Megaphone,
      count: activeNoticesCount > 0 ? activeNoticesCount : undefined,
    },
  ];

  if (!isStrictlyAuthorized) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-500/40 bg-white dark:bg-[#04140a] p-6 sm:p-8 shadow-sm space-y-4">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-600 dark:text-rose-400" />
          <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Admin Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            This studio is locked to verified Instructor / Admin accounts authenticated with Firebase.
          </p>
          {onExitAdmin && (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
            >
              Return to Science Catalog
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 sm:px-6 md:pb-12 lg:px-8">
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tanvir&apos;s Science Square — Admin Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Analytics, YouTube course imports, Bangladeshi payment approvals, and live announcements.
          </p>
        </div>

        {onImportDemoData && (
          <button
            type="button"
            onClick={() => void handleImportDemoClick()}
            disabled={importingDemo}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg border border-emerald-600/40 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {importingDemo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <span>{importingDemo ? 'Importing...' : 'Import Demo Data'}</span>
          </button>
        )}
      </div>

      {statusNotice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-[#04140a] px-4 py-2.5 text-xs sm:text-sm dark:text-emerald-400"
        >
          <span>{statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice('')}
            aria-label="Dismiss notification"
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modular 4-Tab Bar */}
      <div
        role="tablist"
        aria-label="Admin workspace sections"
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 dark:border-emerald-900/80 dark:bg-[#031109] p-1.5 overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    isActive
                      ? 'text-white/90 dark:text-[#030805]/80'
                      : 'text-teal-700 dark:text-teal-300'
                  }`}
                >
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-tab Panels */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          courses={courses}
          enrollments={enrollments}
          payments={payments}
          brandConfig={brandConfig}
          onUpdateBrandConfig={onUpdateBrandConfig}
          onShowNotice={showNotice}
        />
      )}

      {activeTab === 'courses' && (
        <AdminCoursesTab
          courses={courses}
          onCreateCourse={onCreateCourse}
          onUpdateCourse={onUpdateCourse}
          onDeleteCourse={onDeleteCourse}
          onPreviewCourse={onPreviewCourse}
          onShowNotice={showNotice}
        />
      )}

      {activeTab === 'payments' && (
        <AdminPaymentsTab
          payments={payments}
          onUpdatePaymentStatus={onUpdatePaymentStatus}
          onShowNotice={showNotice}
        />
      )}

      {activeTab === 'notices' && (
        <AdminNoticesTab
          notices={notices}
          courses={courses}
          onCreateNotice={onCreateNotice}
          onToggleNotice={onToggleNotice}
          onDeleteNotice={onDeleteNotice}
          onShowNotice={showNotice}
        />
      )}
    </main>
  );
};

export default AdminDashboard;
