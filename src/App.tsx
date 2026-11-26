import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  X,
  Youtube,
} from 'lucide-react';
import { CHANNEL_INFO, INITIAL_COURSES } from './data/lmsData';
import { useRealtimeLMS } from './hooks/useRealtimeLMS';
import {
  createCourseDoc,
  createNoticeDoc,
  deleteCourseDoc,
  deleteNoticeDoc,
  enrollFreeCourseDoc,
  importDemoDataToFirestore,
  toggleNoticeDoc,
  updateBrandConfigDoc,
  updateCourseDoc,
  updateEnrollmentProgressDoc,
  updatePaymentStatusBatch,
} from './services/lmsFirestore';
import {
  BrandConfig,
  Course,
  Enrollment,
  NoticeItem,
  PaymentStatus,
  PaymentSubmission,
  ViewRoute,
} from './types/lms';
import { Navbar } from './components/Navbar';
import { NoticeBoard } from './components/NoticeBoard';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BrandLogo } from './components/BrandLogo';
import type { ComplianceDocType } from './components/ComplianceModal';
import { getAllLessons } from './utils/courseHelpers';
import { isVerifiedAdminUser } from './utils/authGuards';

const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ClassroomView = lazy(() => import('./components/ClassroomView'));
const PaymentModal = lazy(() => import('./components/PaymentModal'));
const ComplianceModal = lazy(() => import('./components/ComplianceModal'));

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEYS = {
  notes: 'tss_notes_v1',
  theme: 'edupulse_theme_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.theme);
    if (raw === 'light' || raw === 'dark') return raw;
    return 'dark';
  } catch {
    return 'dark';
  }
}

function extractReadableError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { error?: string; path?: string };
    if (parsed.error) {
      return parsed.path ? `${parsed.error} (${parsed.path})` : parsed.error;
    }
  } catch {
    // plain string
  }
  return raw;
}

function parseRequestedRoute(): ViewRoute {
  try {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const viewParam = new URLSearchParams(window.location.search)
      .get('view')
      ?.toLowerCase();

    const candidate = viewParam || hash || path.replace(/^\/+/, '').split('/')[0];
    if (
      candidate === 'admin' ||
      candidate === 'student' ||
      candidate === 'classroom' ||
      candidate === 'catalog'
    ) {
      return candidate;
    }
  } catch {
    // Ignore URL parsing errors
  }
  return 'catalog';
}

function parseRequestedCompliance(): ComplianceDocType | null {
  try {
    const policyParam = new URLSearchParams(window.location.search)
      .get('policy')
      ?.toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const candidate = policyParam || hash;
    if (
      candidate === 'privacy' ||
      candidate === 'terms' ||
      candidate === 'refund'
    ) {
      return candidate;
    }
  } catch {
    // Ignore URL parsing errors
  }
  return null;
}

function sanitizeUrlToRoot(): void {
  try {
    if (window.location.pathname !== '/' || window.location.search || window.location.hash) {
      window.history.replaceState(null, '', '/');
    }
  } catch {
    // Ignore history API restrictions
  }
}

const LazyViewFallback: React.FC<{ label?: string }> = ({
  label = 'Loading workspace...',
}) => (
  <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4 py-20 text-sm text-slate-600 dark:text-slate-300">
    <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
    <span>{label}</span>
  </div>
);

const WorkspaceBootSkeleton: React.FC = () => (
  <main
    role="status"
    aria-label="Loading Tanvir's Science Square workspace"
    className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
  >
    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Connecting Tanvir&apos;s Science Square live workspace...</span>
    </div>

    <div className="h-64 sm:h-80 w-full rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-emerald-900/60 dark:bg-[#04140a] animate-pulse" />

    <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 animate-pulse">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-[#04140a]" />
          <div className="h-3 w-14 rounded bg-slate-200 dark:bg-[#04140a]" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white dark:border-emerald-900/60 dark:bg-[#04140a] p-4 space-y-4"
        >
          <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-[#031109]" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-emerald-500/20" />
            <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-[#062010]" />
            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-[#062010]" />
          </div>
        </div>
      ))}
    </div>
  </main>
);

export default function App() {
  const {
    authReady,
    currentUser,
    unverifiedEmail,
    courses,
    catalogSeeded,
    enrollments,
    payments,
    notices,
    mcqs,
    brandConfig,
    syncingData,
    listenerError,
    retrySync,
    clearListenerError,
    refreshAuthUser,
    logout,
  } = useRealtimeLMS();

  const readableListenerError = listenerError
    ? extractReadableError(listenerError)
    : '';

  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() =>
    readStorage<Record<string, string>>(STORAGE_KEYS.notes, {})
  );
  const [mutationError, setMutationError] = useState('');

  const [currentView, setCurrentView] = useState<ViewRoute>(() => {
    const initial = parseRequestedRoute();
    // Never mount AdminDashboard on initial render before auth verification completes
    return initial === 'admin' ? 'catalog' : initial;
  });
  const [pendingAdminUrlRequest, setPendingAdminUrlRequest] = useState(
    () => parseRequestedRoute() === 'admin'
  );
  const [activeCourseId, setActiveCourseId] = useState<string>(
    INITIAL_COURSES[0].id
  );
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentCourseId, setPaymentCourseId] = useState<string | null>(null);
  const [complianceDoc, setComplianceDoc] = useState<ComplianceDocType | null>(
    () => parseRequestedCompliance()
  );

  // Sync Tailwind dark class on <html> and persist theme preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notesMap));
    } catch {
      // Ignore storage quota errors
    }
  }, [notesMap]);

  // Enforce strict RBAC + URL manipulation guard for Admin Console
  useEffect(() => {
    if (!authReady) return;
    const isAdmin = isVerifiedAdminUser(currentUser);

    if (pendingAdminUrlRequest) {
      setPendingAdminUrlRequest(false);
      if (isAdmin) {
        setCurrentView('admin');
      } else {
        sanitizeUrlToRoot();
        setCurrentView('catalog');
        setMutationError(
          'Admin Console access is restricted to verified instructor accounts.'
        );
        if (!currentUser) setAuthOpen(true);
      }
      return;
    }

    if (currentView === 'admin' && !isAdmin) {
      sanitizeUrlToRoot();
      setCurrentView('catalog');
      setMutationError(
        'Admin Console access is restricted to verified instructor accounts.'
      );
    }
  }, [authReady, currentView, currentUser, pendingAdminUrlRequest]);

  // Listen to browser URL/hash navigation attempts (blocks /admin, #admin, ?view=admin tampering)
  useEffect(() => {
    const handleRouteSync = () => {
      const requested = parseRequestedRoute();
      if (requested === 'admin') {
        if (authReady && isVerifiedAdminUser(currentUser)) {
          setCurrentView('admin');
        } else {
          sanitizeUrlToRoot();
          setCurrentView('catalog');
          setMutationError(
            'Admin Console access is restricted to verified instructor accounts.'
          );
          if (!currentUser) setAuthOpen(true);
        }
      } else if (requested !== 'catalog') {
        setCurrentView(requested);
      }

      const policy = parseRequestedCompliance();
      if (policy) {
        setComplianceDoc(policy);
      }
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, [authReady, currentUser]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const runMutation = async (fn: () => Promise<unknown>) => {
    setMutationError('');
    try {
      await fn();
    } catch (err) {
      setMutationError(extractReadableError(err));
    }
  };

  const handleNavigate = (view: ViewRoute) => {
    if (view === 'admin' && !isVerifiedAdminUser(currentUser)) {
      sanitizeUrlToRoot();
      if (!currentUser) {
        setAuthOpen(true);
      } else {
        setMutationError(
          'Admin Console access is restricted to verified instructor accounts.'
        );
      }
      return;
    }
    if (view === 'classroom') {
      const currentTarget =
        courses.find((c) => c.id === activeCourseId) ?? courses[0];
      if (!currentTarget) return;

      const isAdmin = isVerifiedAdminUser(currentUser);
      const isCurrentAccessible =
        isAdmin ||
        currentTarget.priceBdt === 0 ||
        enrollments.some((e) => e.courseId === currentTarget.id);

      if (!isCurrentAccessible) {
        const firstEnrolledCourse = courses.find((c) =>
          enrollments.some((e) => e.courseId === c.id)
        );
        const firstFreeCourse = courses.find((c) => c.priceBdt === 0);
        const fallbackCourse = firstEnrolledCourse ?? firstFreeCourse;

        if (fallbackCourse) {
          setActiveCourseId(fallbackCourse.id);
        } else {
          handleOpenCourse(currentTarget.id);
          return;
        }
      } else {
        setActiveCourseId(currentTarget.id);
      }
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCourse = (courseId: string) => {
    const targetCourse = courses.find((c) => c.id === courseId);
    const isAlreadyEnrolled = enrollments.some((e) => e.courseId === courseId);

    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    // Gate paid unenrolled courses behind Bangladeshi PaymentModal (bKash / Nagad / Rocket)
    if (
      targetCourse &&
      targetCourse.priceBdt > 0 &&
      !isAlreadyEnrolled &&
      !isVerifiedAdminUser(currentUser)
    ) {
      setPaymentCourseId(courseId);
      return;
    }

    if (
      targetCourse &&
      targetCourse.priceBdt === 0 &&
      !isAlreadyEnrolled &&
      catalogSeeded
    ) {
      void runMutation(() => enrollFreeCourseDoc(currentUser.id, courseId));
    }

    setActiveCourseId(courseId);
    setCurrentView('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminPreviewCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setCurrentView('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentComplete = (submission: PaymentSubmission) => {
    setPaymentCourseId(null);
    setActiveCourseId(submission.courseId);
    setCurrentView('student');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePaymentStatus = (paymentId: string, status: PaymentStatus) => {
    const target = payments.find((p) => p.id === paymentId);
    if (!target) return;
    void runMutation(() => updatePaymentStatusBatch(target, status));
  };

  const handleCreateNotice = (notice: NoticeItem) => {
    void runMutation(() => createNoticeDoc(notice));
  };

  const handleToggleNotice = (noticeId: string) => {
    const existing = notices.find((n) => n.id === noticeId);
    if (!existing) return;
    void runMutation(() => toggleNoticeDoc(noticeId, !existing.active));
  };

  const handleDeleteNotice = (noticeId: string) => {
    void runMutation(() => deleteNoticeDoc(noticeId));
  };

  const handleUpdateBrandConfig = (cfg: BrandConfig) => {
    void runMutation(() => updateBrandConfigDoc(cfg.logoUrl));
  };

  const handleCreateCourse = (course: Course) => {
    void runMutation(() => createCourseDoc(course));
  };

  const handleUpdateCourse = (updated: Course) => {
    void runMutation(() => updateCourseDoc(updated));
  };

  const handleDeleteCourse = (courseId: string) => {
    void runMutation(async () => {
      await deleteCourseDoc(courseId);
      if (activeCourseId === courseId) {
        const remaining = courses.find((c) => c.id !== courseId);
        if (remaining) setActiveCourseId(remaining.id);
      }
    });
  };

  const handleImportDemoData = async () => {
    setMutationError('');
    try {
      return await importDemoDataToFirestore();
    } catch (err) {
      setMutationError(extractReadableError(err));
      return { coursesAdded: 0, noticesAdded: 0, examsAdded: 0 };
    }
  };

  const updateLessonCompletion = (
    courseId: string,
    lessonId: string,
    mode: 'toggle' | 'complete',
    nextLessonId?: string
  ) => {
    if (!currentUser || !catalogSeeded) return;
    const targetCourse = courses.find((c) => c.id === courseId);
    if (!targetCourse) return;
    const existing = enrollments.find((e) => e.courseId === courseId);
    if (!existing) return;

    const allLessons = getAllLessons(targetCourse);
    const hasLesson = existing.completedLessonIds.includes(lessonId);

    const nextCompletedIds =
      mode === 'toggle'
        ? hasLesson
          ? existing.completedLessonIds.filter((id) => id !== lessonId)
          : [...existing.completedLessonIds, lessonId]
        : hasLesson
        ? existing.completedLessonIds
        : [...existing.completedLessonIds, lessonId];

    const validCompletedCount = allLessons.filter((l) =>
      nextCompletedIds.includes(l.id)
    ).length;
    const isNowComplete =
      allLessons.length > 0 && validCompletedCount === allLessons.length;

    const updated: Enrollment = {
      ...existing,
      completedLessonIds: nextCompletedIds,
      lastLessonId: nextLessonId ?? lessonId,
      completedAt: isNowComplete
        ? existing.completedAt ?? new Date().toISOString().slice(0, 10)
        : undefined,
      certificateId: isNowComplete
        ? existing.certificateId ??
          `TSS-2026-${courseId.slice(-4).toUpperCase()}-${Math.floor(
            1000 + Math.random() * 9000
          )}`
        : undefined,
    };

    void runMutation(() => updateEnrollmentProgressDoc(currentUser.id, updated));
  };

  const handleLogout = () => {
    void logout();
    if (currentView === 'admin') {
      setCurrentView('catalog');
    }
  };

  const activeCourse =
    courses.find((c) => c.id === activeCourseId) ?? courses[0];
  const activeEnrollment = enrollments.find(
    (e) => e.courseId === activeCourse?.id
  );
  const paymentCourse = paymentCourseId
    ? courses.find((c) => c.id === paymentCourseId) ?? null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#030805] dark:text-slate-100 transition-colors duration-200">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        logoUrl={brandConfig.logoUrl}
      />

      <NoticeBoard
        notices={notices}
        loading={!authReady || syncingData.notices}
        onOpenCourse={handleOpenCourse}
      />

      {(mutationError || readableListenerError) && (
        <div
          role="alert"
          className="mx-auto mt-3 flex w-full max-w-7xl flex-col gap-2 px-4 sm:px-6 lg:px-8"
        >
          {readableListenerError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="break-words">
                  Firestore sync paused: {readableListenerError}. Make sure your{' '}
                  <span className="font-mono font-semibold">firestore.rules</span>{' '}
                  are published in the{' '}
                  <span className="font-mono font-semibold">tanvirs-science-square</span>{' '}
                  Firebase Console.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={retrySync}
                  className="rounded-md border border-amber-600/30 bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-white dark:border-amber-400/30 dark:bg-[#04140a] dark:text-amber-200 dark:hover:bg-[#030805]"
                >
                  Retry Sync
                </button>
                <button
                  type="button"
                  onClick={clearListenerError}
                  aria-label="Dismiss sync warning"
                  className="hover:opacity-75"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {mutationError && (
            <div className="flex flex-1 items-center justify-between gap-3 rounded-lg border border-rose-500/40 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="truncate">{mutationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setMutationError('')}
                aria-label="Dismiss error"
                className="shrink-0 hover:opacity-75"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1">
        {!authReady ? (
          <WorkspaceBootSkeleton />
        ) : (
          <>
            {currentView === 'catalog' && (
              <LandingPage
                courses={courses}
                enrollments={enrollments}
                loadingCourses={syncingData.courses}
                onOpenCourse={handleOpenCourse}
                logoUrl={brandConfig.logoUrl}
              />
            )}

            {currentView === 'student' && (
              <Suspense fallback={<LazyViewFallback label="Loading Learning Hub..." />}>
                <StudentDashboard
                  currentUser={currentUser}
                  courses={courses}
                  enrollments={enrollments}
                  payments={payments}
                  onOpenCourse={handleOpenCourse}
                  onBrowseCatalog={() => handleNavigate('catalog')}
                  onOpenAuth={() => setAuthOpen(true)}
                />
              </Suspense>
            )}

            {currentView === 'admin' && isVerifiedAdminUser(currentUser) && (
              <Suspense fallback={<LazyViewFallback label="Loading Admin Studio..." />}>
                <AdminDashboard
                  currentUser={currentUser}
                  courses={courses}
                  enrollments={enrollments}
                  payments={payments}
                  notices={notices}
                  brandConfig={brandConfig}
                  onUpdateBrandConfig={handleUpdateBrandConfig}
                  onCreateCourse={handleCreateCourse}
                  onUpdateCourse={handleUpdateCourse}
                  onDeleteCourse={handleDeleteCourse}
                  onPreviewCourse={handleAdminPreviewCourse}
                  onUpdatePaymentStatus={handleUpdatePaymentStatus}
                  onCreateNotice={handleCreateNotice}
                  onToggleNotice={handleToggleNotice}
                  onDeleteNotice={handleDeleteNotice}
                  onImportDemoData={handleImportDemoData}
                  onExitAdmin={() => handleNavigate('catalog')}
                />
              </Suspense>
            )}

            {currentView === 'classroom' && activeCourse && (
              <Suspense fallback={<LazyViewFallback label="Loading Classroom..." />}>
                <ClassroomView
                  course={activeCourse}
                  enrollment={activeEnrollment}
                  mcqs={mcqs}
                  loadingMcqs={syncingData.exams}
                  currentUser={currentUser}
                  catalogSeeded={catalogSeeded}
                  onRequireAuth={() => setAuthOpen(true)}
                  notesMap={notesMap}
                  onSaveNote={(lessonId, note) =>
                    setNotesMap((prev) => ({ ...prev, [lessonId]: note }))
                  }
                  onToggleLessonComplete={(cId, lId) =>
                    updateLessonCompletion(cId, lId, 'toggle')
                  }
                  onMarkCompleteAndNext={(cId, lId, nextLId) =>
                    updateLessonCompletion(cId, lId, 'complete', nextLId)
                  }
                  onBack={() =>
                    handleNavigate(
                      isVerifiedAdminUser(currentUser) ? 'admin' : 'catalog'
                    )
                  }
                  onOpenLearningHub={() => handleNavigate('student')}
                />
              </Suspense>
            )}
          </>
        )}
      </div>

      {/* Authentic Channel & Compliance Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-emerald-900/60 dark:bg-[#030805] pt-8 pb-24 md:pb-8 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 text-xs text-slate-600 dark:text-slate-400">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand Summary */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <BrandLogo logoUrl={brandConfig.logoUrl} size={24} />
                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {CHANNEL_INFO.brandName}
                </span>
              </div>
              <p className="leading-relaxed">
                HSC &amp; Admission Science platform with structured batches, One-Shot classes, and chapter-wise MCQ exams.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                4K+ Subscribers · 50+ Free Science Classes
              </p>
            </div>

            {/* Platform Navigation */}
            <div className="space-y-2">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                Platform
              </p>
              <ul className="space-y-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('catalog')}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    Science Catalog
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('student')}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    My Learning Hub
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setAuthOpen(true)}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    Student Account
                  </button>
                </li>
              </ul>
            </div>

            {/* Mandatory EdTech Policies */}
            <div className="space-y-2">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                Legal &amp; Policies
              </p>
              <ul className="space-y-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setComplianceDoc('privacy')}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setComplianceDoc('terms')}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    Terms &amp; Conditions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setComplianceDoc('refund')}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    Refund &amp; Return Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                Contact &amp; Support
              </p>
              <div className="space-y-1.5">
                <a
                  href={`mailto:${CHANNEL_INFO.supportEmail}`}
                  className="flex items-center gap-1.5 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">{CHANNEL_INFO.supportEmail}</span>
                </a>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{CHANNEL_INFO.location}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hours: {CHANNEL_INFO.supportHours}
                </p>
                <div className="flex items-center gap-4 pt-1">
                  <a
                    href={CHANNEL_INFO.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Youtube className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span>YouTube</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                  <a
                    href={CHANNEL_INFO.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Facebook</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200/80 dark:border-emerald-900/50 pt-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <p>© 2026 {CHANNEL_INFO.brandName}. All rights reserved.</p>
            <p>Payments verified via bKash, Nagad &amp; Rocket (BDT ৳)</p>
          </div>
        </div>
      </footer>

      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        currentUser={currentUser}
        unverifiedEmail={unverifiedEmail}
        onRefreshAuth={refreshAuthUser}
        logoUrl={brandConfig.logoUrl}
      />

      {paymentCourse && (
        <Suspense fallback={null}>
          <PaymentModal
            course={paymentCourse}
            userId={currentUser?.id ?? ''}
            studentName={currentUser?.name ?? 'Science Student'}
            catalogSeeded={catalogSeeded}
            onClose={() => setPaymentCourseId(null)}
            onPaymentComplete={handlePaymentComplete}
          />
        </Suspense>
      )}

      {complianceDoc && (
        <Suspense fallback={null}>
          <ComplianceModal
            activeDoc={complianceDoc}
            onSelectDoc={setComplianceDoc}
            onClose={() => setComplianceDoc(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
