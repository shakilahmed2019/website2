import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  ExternalLink,
  RotateCcw,
  Upload,
  Users,
  Wallet,
  Youtube,
} from 'lucide-react';
import { CHANNEL_INFO } from '../../data/lmsData';
import {
  BrandConfig,
  Course,
  Enrollment,
  PaymentSubmission,
} from '../../types/lms';
import { formatPriceBdt, getCourseProgress } from '../../utils/courseHelpers';
import { BrandLogo } from '../BrandLogo';

interface AdminOverviewTabProps {
  courses: Course[];
  enrollments: Enrollment[];
  payments: PaymentSubmission[];
  brandConfig: BrandConfig;
  onUpdateBrandConfig: (config: BrandConfig) => void;
  onShowNotice: (msg: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  courses,
  enrollments,
  payments,
  brandConfig,
  onUpdateBrandConfig,
  onShowNotice,
}) => {
  const [logoInput, setLogoInput] = useState(brandConfig.logoUrl);

  useEffect(() => {
    setLogoInput(brandConfig.logoUrl);
  }, [brandConfig.logoUrl]);

  const stats = useMemo(() => {
    const publishedCount = courses.filter((c) => c.published).length;
    const totalStudents = courses.reduce((sum, c) => sum + c.enrolledCount, 0);
    const approvedRevenue = payments
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + p.amountPaidBdt, 0);
    const pendingPayments = payments.filter((p) => p.status === 'pending').length;

    const completedCount = enrollments.filter((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      return course ? getCourseProgress(course, e).isCompleted : false;
    }).length;
    const completionRate =
      enrollments.length > 0
        ? Math.round((completedCount / enrollments.length) * 100)
        : 0;

    // Subject enrollment breakdown
    const bySubject: Record<string, number> = {};
    for (const c of courses) {
      bySubject[c.category] = (bySubject[c.category] ?? 0) + c.enrolledCount;
    }
    const maxSubjectCount = Math.max(1, ...Object.values(bySubject));
    const subjectBreakdown = Object.entries(bySubject)
      .map(([subject, count]) => ({
        subject,
        count,
        percent: Math.round((count / maxSubjectCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      publishedCount,
      totalStudents,
      approvedRevenue,
      pendingPayments,
      completionRate,
      subjectBreakdown,
    };
  }, [courses, enrollments, payments]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      onShowNotice('Logo image must be under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoInput(reader.result);
        onUpdateBrandConfig({ logoUrl: reader.result });
        onShowNotice("Updated Tanvir's Science Square channel logo.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* 4-Column Analytics Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Verified Revenue</span>
            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatPriceBdt(stats.approvedRevenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-teal-700 dark:text-teal-300 tabular-nums">
            {stats.pendingPayments} pending approvals
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Enrollments</span>
            <Users className="h-4 w-4 text-teal-700 dark:text-teal-300" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalStudents.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Across {courses.length} batches
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Published Courses</span>
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.publishedCount}
            <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
              / {courses.length}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            HSC &amp; Admission tracks
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Completion Rate</span>
            <Award className="h-4 w-4 text-teal-700 dark:text-teal-300" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.completionRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Active student cohort
          </p>
        </div>
      </div>

      {/* Subject Distribution & Channel Logo Branding */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Subject Distribution */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-5 space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Enrollments by Science Subject
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Student distribution across HSC &amp; Admission categories
            </p>
          </div>

          <div className="space-y-3">
            {stats.subjectBreakdown.map((row) => (
              <div key={row.subject} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {row.subject}
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {row.count.toLocaleString()} students
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#030805]">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Branding & Logo Editor */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo logoUrl={brandConfig.logoUrl} size={44} />
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {CHANNEL_INFO.brandName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Channel ID: {CHANNEL_INFO.channelId}
                </p>
              </div>
            </div>

            <a
              href={CHANNEL_INFO.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-200 shrink-0"
            >
              <Youtube className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Channel</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>

          <div className="space-y-2.5 border-t border-slate-100 dark:border-emerald-900/60 pt-3">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Update Channel Logo (URL or File)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={logoInput}
                onChange={(e) => setLogoInput(e.target.value)}
                placeholder="https://yt3.googleusercontent.com/..."
                className="flex-1 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-1.5 text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateBrandConfig({ logoUrl: logoInput.trim() });
                  onShowNotice('Saved channel logo URL.');
                }}
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                Apply URL
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-200 transition-colors">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setLogoInput('');
                  onUpdateBrandConfig({ logoUrl: '' });
                  onShowNotice('Reset to Science Square default emblem.');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:border-emerald-900/80 dark:bg-[#030805] dark:text-slate-300 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Default</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
