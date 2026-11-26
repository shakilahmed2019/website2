import React, { useState } from 'react';
import { Play, Search, BookOpen, Star, Loader2 } from 'lucide-react';
import { Course, CourseLevel, Enrollment } from '../types/lms';
import {
  formatDurationHours,
  formatPriceBdt,
  getCourseProgress,
  getTotalLessonCount,
} from '../utils/courseHelpers';
import { EnrollButton } from './EnrollButton';
import './CourseCard.css';

interface CourseCardGridProps {
  courses: Course[];
  enrollments: Enrollment[];
  loading?: boolean;
  selectedCategory: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLevel: CourseLevel | 'All';
  onLevelChange: (level: CourseLevel | 'All') => void;
  onOpenCourse: (courseId: string) => void;
  onViewDetails: (courseId: string) => void;
  onResetFilters: () => void;
}

const LEVELS: Array<CourseLevel | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export const CourseCardGrid: React.FC<CourseCardGridProps> = ({
  courses,
  enrollments,
  loading = false,
  selectedCategory,
  searchQuery,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  onOpenCourse,
  onViewDetails,
  onResetFilters,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section aria-label="Course catalog" className="space-y-5">
      {/* Compact Search + Level Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {selectedCategory === 'All' ? 'HSC & Admission Science Courses' : `${selectedCategory} Courses`}
            </h2>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Syncing...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
            Showing {courses.length} {courses.length === 1 ? 'course' : 'courses'} · Tanvir&apos;s Science Square
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Chemistry, Physics, Math..."
              aria-label="Search courses"
              className="w-full sm:w-64 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] py-2 pl-9 pr-3 text-sm dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div
            role="group"
            aria-label="Filter by difficulty level"
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 dark:border-emerald-900/80 dark:bg-[#031109] p-1 overflow-x-auto no-scrollbar"
          >
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onLevelChange(lvl)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedLevel === lvl
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton or Empty State */}
      {loading ? (
        <div
          role="status"
          aria-label="Loading science courses"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-emerald-900/70 dark:bg-[#04140a] p-4 space-y-4 animate-pulse"
            >
              <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-[#031109]" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-emerald-500/20" />
                <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-[#062010]" />
                <div className="h-3 w-3/5 rounded bg-slate-200 dark:bg-[#062010]" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-16 rounded bg-emerald-500/20" />
                <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-[#062010]" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] px-6 py-14 text-center">
          <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400/80" />
          <h3 className="mt-3 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            No matching science courses found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
            Adjust your subject filter, difficulty level, or search keywords to browse available HSC &amp; Admission classes.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 rounded-lg border border-emerald-600/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-500/10 px-4 py-2 text-xs font-semibold dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 overflow-visible">
          {courses.map((course) => {
            const enrollment = enrollments.find((e) => e.courseId === course.id);
            const progress = getCourseProgress(course, enrollment);
            const totalLessons = getTotalLessonCount(course);
            const imageBroken = failedImages[course.id];
            const isFree = !course.priceBdt || course.priceBdt <= 0;

            return (
              <article
                key={course.id}
                className="lms-course-card group"
              >
                {/* Detailed 16:9 Thumbnail */}
                <button
                  type="button"
                  onClick={() => onViewDetails(course.id)}
                  className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-[#031109] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                >
                  {!imageBroken ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [course.id]: true }))
                      }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-100 to-teal-50 dark:from-[#04140a] dark:via-[#072716] dark:to-[#030805] p-6">
                      <span className="font-display text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {course.category}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent dark:from-[#04140a]/90" />
                </button>

                {/* Card Body — Zero-Pill Unboxed Metadata & overflow-visible for neon button glow */}
                <div className="flex flex-1 flex-col p-4 sm:p-5 overflow-visible">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 min-w-0">
                      <span className="font-medium truncate">{course.category}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800">·</span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                        {formatDurationHours(course.durationHours)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 shrink-0 font-mono tabular-nums">
                      {course.originalPriceBdt && course.originalPriceBdt > course.priceBdt && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {formatPriceBdt(course.originalPriceBdt)}
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold ${
                          isFree
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatPriceBdt(course.priceBdt)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewDetails(course.id)}
                    className="mt-2 text-left focus-visible:outline-none"
                  >
                    <h3 className="font-display text-base font-bold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                  </button>

                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                    {course.subtitle}
                  </p>

                  {/* Spacer + Enrollment Progress or Instructor Metadata */}
                  <div className="mt-auto pt-4 overflow-visible">
                    {enrollment ? (
                      <div className="mb-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">
                            {progress.isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {progress.completedCount}/{progress.totalCount} lessons · {progress.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#030805]">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-emerald-900/50 pt-3">
                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                          {course.instructor}
                        </span>
                        <span className="flex items-center gap-1 tabular-nums shrink-0">
                          <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400" />
                          <span className="text-slate-800 dark:text-slate-200">{course.rating.toFixed(1)}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800">·</span>
                          <span>{totalLessons} lessons</span>
                        </span>
                      </div>
                    )}

                    {enrollment ? (
                      <button
                        type="button"
                        onClick={() => onOpenCourse(course.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 py-2.5 px-5 text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>
                          {progress.isCompleted ? 'Review Course' : 'Continue Learning'}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 overflow-visible">
                        <EnrollButton
                          fullWidth
                          label="Enroll Now"
                          onClick={() => onOpenCourse(course.id)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
