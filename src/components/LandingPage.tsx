import React, { useMemo, useState } from 'react';
import { ExternalLink, Youtube } from 'lucide-react';
import { CATEGORIES, CHANNEL_INFO } from '../data/lmsData';
import { Course, CourseLevel, Enrollment } from '../types/lms';
import { FeaturedCourseBannerSlider } from './FeaturedCourseBannerSlider';
import { CategoryCircleScroll } from './CategoryCircleScroll';
import { CourseCardGrid } from './CourseCardGrid';
import { CourseDetailsModal } from './CourseDetailsModal';
import { YouTubeClassesSection } from './YouTubeClassesSection';
import { BrandLogo } from './BrandLogo';

interface LandingPageProps {
  courses: Course[];
  enrollments: Enrollment[];
  loadingCourses?: boolean;
  onOpenCourse: (courseId: string) => void;
  logoUrl?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  courses,
  enrollments,
  loadingCourses = false,
  onOpenCourse,
  logoUrl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailsCourseId, setDetailsCourseId] = useState<string | null>(null);

  const publishedCourses = useMemo(
    () => courses.filter((c) => c.published),
    [courses]
  );

  const courseCounts = useMemo(() => {
    const counts: Record<string, number> = { All: publishedCourses.length };
    for (const c of publishedCourses) {
      counts[c.category] = (counts[c.category] ?? 0) + 1;
    }
    return counts;
  }, [publishedCourses]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedCourses.filter((course) => {
      const matchesCat =
        selectedCategory === 'All' || course.category === selectedCategory;
      const matchesLevel =
        selectedLevel === 'All' || course.level === selectedLevel;
      const matchesQuery =
        q.length === 0 ||
        course.title.toLowerCase().includes(q) ||
        course.subtitle.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q);
      return matchesCat && matchesLevel && matchesQuery;
    });
  }, [publishedCourses, selectedCategory, selectedLevel, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSearchQuery('');
  };

  const detailsCourse = useMemo(
    () => courses.find((c) => c.id === detailsCourseId) ?? null,
    [courses, detailsCourseId]
  );
  const detailsEnrollment = useMemo(
    () => enrollments.find((e) => e.courseId === detailsCourseId),
    [enrollments, detailsCourseId]
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 pb-24 sm:px-6 sm:py-7 md:pb-12 lg:px-8">
      <FeaturedCourseBannerSlider
        courses={publishedCourses}
        enrollments={enrollments}
        onSelectCourse={onOpenCourse}
      />

      <div className="space-y-8 px-4 sm:px-0 overflow-visible">
        <CategoryCircleScroll
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          courseCounts={courseCounts}
        />

        {/* Official Channel & Lead Instructor Overview Strip */}
        <section
          aria-label="Channel and instructor profile"
          className="rounded-2xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5 min-w-0">
              <BrandLogo logoUrl={logoUrl} size={44} className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-teal-700 dark:text-teal-300">
                  Official Learning Portal · {CHANNEL_INFO.instructorTitle}
                </p>
                <h2 className="mt-0.5 font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {CHANNEL_INFO.brandName}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                  Structured HSC Chemistry, Physics, Higher Math, Biology One-Shot masterclasses and University Admission batches led by <span className="font-semibold text-slate-900 dark:text-slate-100">{CHANNEL_INFO.instructorName}</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={CHANNEL_INFO.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
              >
                <Youtube className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>YouTube Channel</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>

              <a
                href={CHANNEL_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
              >
                <span>Facebook Page</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 dark:border-emerald-900/60 pt-4 sm:grid-cols-3">
            {CHANNEL_INFO.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stat.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.detail}
                </span>
              </div>
            ))}
          </div>
        </section>

        <CourseCardGrid
          courses={filteredCourses}
          enrollments={enrollments}
          loading={loadingCourses}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          onOpenCourse={onOpenCourse}
          onViewDetails={(id) => setDetailsCourseId(id)}
          onResetFilters={handleResetFilters}
        />

        <YouTubeClassesSection />
      </div>

      <CourseDetailsModal
        course={detailsCourse}
        enrollment={detailsEnrollment}
        onClose={() => setDetailsCourseId(null)}
        onEnrollOrResume={onOpenCourse}
      />
    </main>
  );
};
