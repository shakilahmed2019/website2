import React, { useMemo, useState } from 'react';
import {
  Play,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  X,
  XCircle,
  CreditCard,
  LogIn,
  Download,
  Compass,
} from 'lucide-react';
import { Course, Enrollment, PaymentSubmission, UserProfile } from '../types/lms';
import {
  formatDurationHours,
  formatPriceBdt,
  getCourseProgress,
} from '../utils/courseHelpers';

interface StudentDashboardProps {
  currentUser: UserProfile | null;
  courses: Course[];
  enrollments: Enrollment[];
  payments?: PaymentSubmission[];
  onOpenCourse: (courseId: string) => void;
  onBrowseCatalog: () => void;
  onOpenAuth?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  courses,
  enrollments,
  payments = [],
  onOpenCourse,
  onBrowseCatalog,
  onOpenAuth,
}) => {
  const [previewCertificateCourseId, setPreviewCertificateCourseId] = useState<
    string | null
  >(null);
  const [downloadNotice, setDownloadNotice] = useState('');

  const enrolledItems = useMemo(() => {
    return enrollments
      .map((enrollment) => {
        const course = courses.find((c) => c.id === enrollment.courseId);
        if (!course) return null;
        return {
          course,
          enrollment,
          progress: getCourseProgress(course, enrollment),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [courses, enrollments]);

  const completedItems = enrolledItems.filter((item) => item.progress.isCompleted);
  const inProgressItems = enrolledItems.filter((item) => !item.progress.isCompleted);

  const totalHoursCompleted = useMemo(() => {
    return enrolledItems.reduce((acc, item) => {
      const ratio = item.progress.percent / 100;
      return acc + item.course.durationHours * ratio;
    }, 0);
  }, [enrolledItems]);

  const activeCertificateItem = enrolledItems.find(
    (item) => item.course.id === previewCertificateCourseId
  );

  const handleDownloadCertificate = (courseTitle: string, certId: string) => {
    const learner = currentUser?.name ?? 'Arafat Rahman';
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#030805"/>
  <rect x="36" y="36" width="1128" height="728" rx="16" fill="#04140a" stroke="#10b981" stroke-width="2"/>
  <rect x="56" y="56" width="1088" height="688" rx="10" fill="none" stroke="#065f46" stroke-width="1"/>
  <text x="100" y="135" fill="#5eead4" font-family="sans-serif" font-size="20" font-weight="700" letter-spacing="3">TANVIR'S SCIENCE SQUARE</text>
  <text x="100" y="210" fill="#94a3b8" font-family="sans-serif" font-size="22">Certificate of Science Mastery</text>
  <text x="100" y="310" fill="#f1f5f9" font-family="sans-serif" font-size="54" font-weight="700">${learner}</text>
  <text x="100" y="375" fill="#cbd5e1" font-family="sans-serif" font-size="24">has successfully completed all required science classes and assessments for</text>
  <text x="100" y="445" fill="#34d399" font-family="sans-serif" font-size="34" font-weight="700">${courseTitle}</text>
  <line x1="100" y1="590" x2="1100" y2="590" stroke="#065f46" stroke-width="1"/>
  <text x="100" y="645" fill="#94a3b8" font-family="monospace" font-size="18">CREDENTIAL ID: ${certId}</text>
  <text x="100" y="680" fill="#94a3b8" font-family="sans-serif" font-size="18">Issued by Tanvir · Tanvir's Science Square Academic Board</text>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certId.toLowerCase()}-certificate.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadNotice(`Downloaded certificate ${certId}`);
    window.setTimeout(() => setDownloadNotice(''), 3000);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 pb-24 sm:px-6 md:pb-12 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {currentUser ? `${currentUser.name}’s Learning Hub` : 'My Learning Hub'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Track module progress, resume active lectures, and verify earned completion credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={onBrowseCatalog}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white text-slate-800 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#04140a] px-4 py-2 text-xs sm:text-sm font-semibold dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
        >
          <Compass className="h-4 w-4 text-teal-700 dark:text-teal-300" />
          <span>Explore Catalog</span>
        </button>
      </div>

      {/* 4-Column Learner Progress Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Tracks</span>
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {inProgressItems.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-teal-700 dark:text-teal-300" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {completedItems.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Hours Logged</span>
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {totalHoursCompleted.toFixed(1)}h
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Certificates</span>
            <Award className="h-4 w-4 text-teal-700 dark:text-teal-300" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {completedItems.length}
          </p>
        </div>
      </div>

      {/* Guest Sign-In Banner */}
      {!currentUser && (
        <section className="rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-[#04140a] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Sign in with Google to Sync Your Learning Hub
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Access your enrolled batches, watch live payment TrxID approval updates, and earn verified HSC &amp; Admission certificates.
            </p>
          </div>
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors shrink-0"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In with Google</span>
            </button>
          )}
        </section>
      )}

      {/* Enrolled Courses with Detailed Progress Bars */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
          Enrolled Courses
        </h2>

        {enrolledItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <h3 className="mt-3 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              No enrolled courses yet
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Enroll in any HSC or Admission Science course from the catalog to begin tracking lesson progress.
            </p>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="mt-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 px-4 py-2 text-xs font-semibold dark:text-[#030805] dark:hover:bg-emerald-400"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {enrolledItems.map(({ course, enrollment, progress }) => {
              const receipt = payments.find(
                (p) => p.courseId === course.id && p.status === 'approved'
              );
              return (
              <article
                key={course.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4 sm:p-5"
              >
                <div className="flex gap-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-20 w-32 shrink-0 rounded-lg object-cover border border-slate-200 bg-slate-100 dark:border-emerald-900/60 dark:bg-[#030805] hidden sm:block"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300">
                      <span>{course.category}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatDurationHours(course.durationHours)}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Instructor: {course.instructor}
                      {receipt ? (
                        <span className="ml-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                          · Paid {formatPriceBdt(receipt.amountPaidBdt)} ({receipt.method.toUpperCase()} · {receipt.transactionId})
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Next Lesson */}
                <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-emerald-900/50 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[65%]">
                      {progress.isCompleted
                        ? `Completed ${enrollment.completedAt ?? ''}`
                        : `Next: ${progress.nextLesson?.title ?? 'Start Course'}`}
                    </span>
                    <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {progress.completedCount}/{progress.totalCount} · {progress.percent}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#030805]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progress.isCompleted
                          ? 'bg-teal-600 dark:bg-teal-300'
                          : 'bg-emerald-600 dark:bg-emerald-500'
                      }`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenCourse(course.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 px-3.5 py-2 text-xs font-semibold dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>
                        {progress.isCompleted ? 'Review Lessons' : 'Resume Classroom'}
                      </span>
                    </button>

                    {progress.isCompleted && (
                      <button
                        type="button"
                        onClick={() => setPreviewCertificateCourseId(course.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/40 bg-teal-50 text-teal-800 hover:border-teal-600 dark:border-teal-300/40 dark:bg-[#031109] px-3 py-2 text-xs font-semibold dark:text-teal-300 dark:hover:border-teal-300 transition-colors"
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>View Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Real-Time Payment Verifications (bKash / Nagad / Rocket) */}
      {currentUser && payments.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Payment Verifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live verification feed — courses unlock automatically as soon as Admin approves your TrxID.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300 font-semibold">
                    <CreditCard className="h-3.5 w-3.5 shrink-0" />
                    <span className="uppercase">{pay.method}</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      · {pay.transactionId}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {pay.courseTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {formatPriceBdt(pay.amountPaidBdt)} · {pay.submittedAt}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize shrink-0 ${
                    pay.status === 'approved'
                      ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : pay.status === 'rejected'
                      ? 'border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                      : 'border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                  }`}
                >
                  {pay.status === 'approved' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : pay.status === 'rejected' ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span>{pay.status}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Earned Certificates Preview Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Earned Certificates
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete 100% of lessons in any track to unlock a verifiable certificate.
            </p>
          </div>
        </div>

        {completedItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#031109] p-6 text-sm text-slate-600 dark:text-slate-300">
            Finish all lessons in an active course to generate your first completion certificate.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {completedItems.map(({ course, enrollment }) => {
              const certId =
                enrollment.certificateId ??
                `TSS-2026-${course.id.slice(-4).toUpperCase()}`;

              return (
                <div
                  key={course.id}
                  className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 dark:from-[#041a0d] dark:via-[#04140a] dark:to-[#030805] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] font-semibold tracking-wider text-teal-700 dark:text-teal-300">
                        VERIFIED CREDENTIAL · {certId}
                      </p>
                      <h3 className="mt-1.5 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Awarded to{' '}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {currentUser?.name ?? 'Arafat Rahman'}
                        </span>{' '}
                        · Issued {enrollment.completedAt ?? '2026'}
                      </p>
                    </div>
                    <Award className="h-7 w-7 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div className="mt-4 flex items-center gap-3 border-t border-emerald-200/70 dark:border-emerald-900/60 pt-3">
                    <button
                      type="button"
                      onClick={() => setPreviewCertificateCourseId(course.id)}
                      className="rounded-lg bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20 dark:bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold dark:text-emerald-400 dark:hover:bg-emerald-500/25 transition-colors"
                    >
                      Preview Certificate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadCertificate(course.title, certId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#031109] px-3 py-1.5 text-xs font-medium dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download SVG</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Full Certificate Preview Modal */}
      {activeCertificateItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-preview-title"
          onClick={() => setPreviewCertificateCourseId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-emerald-500/50 bg-white dark:bg-[#04140a] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs font-semibold tracking-wider text-teal-700 dark:text-teal-300">
                TANVIR&apos;S SCIENCE SQUARE CREDENTIAL VERIFICATION
              </span>
              <button
                type="button"
                onClick={() => setPreviewCertificateCourseId(null)}
                aria-label="Close certificate preview"
                className="rounded-lg p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-slate-50 dark:border-emerald-800/80 dark:bg-[#030805] p-6 sm:p-8">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Certificate of Science Mastery
              </p>
              <h3
                id="cert-preview-title"
                className="mt-3 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100"
              >
                {currentUser?.name ?? 'Arafat Rahman'}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                has successfully completed all required science classes and assessments for
              </p>
              <p className="mt-3 font-display text-xl font-bold text-teal-700 dark:text-teal-300">
                {activeCertificateItem.course.title}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-emerald-900/70 pt-5 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Lead Instructor</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                    {activeCertificateItem.course.instructor}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 dark:text-slate-400">Credential ID</p>
                  <p className="mt-1 font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {activeCertificateItem.enrollment.certificateId ??
                      `TSS-2026-${activeCertificateItem.course.id
                        .slice(-4)
                        .toUpperCase()}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs text-emerald-700 dark:text-emerald-400">{downloadNotice}</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewCertificateCourseId(null)}
                  className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 dark:border-emerald-900/80 dark:bg-[#031109] px-4 py-2 text-xs font-semibold dark:text-slate-200 dark:hover:text-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadCertificate(
                      activeCertificateItem.course.title,
                      activeCertificateItem.enrollment.certificateId ??
                        `TSS-2026-${activeCertificateItem.course.id
                          .slice(-4)
                          .toUpperCase()}`
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 px-4 py-2 text-xs font-semibold dark:text-[#030805] dark:hover:bg-emerald-400"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default StudentDashboard;
