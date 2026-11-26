import React, { useEffect } from 'react';
import { X, Clock, BookOpen, Star, Play, CheckCircle2, ExternalLink } from 'lucide-react';
import { Course, Enrollment } from '../types/lms';
import {
  formatDurationHours,
  formatPriceBdt,
  getCourseProgress,
  getTotalLessonCount,
} from '../utils/courseHelpers';
import { FACEBOOK_PAGE_URL, YOUTUBE_CHANNEL_URL } from '../services/youtubeSync';
import { EnrollButton } from './EnrollButton';

interface CourseDetailsModalProps {
  course: Course | null;
  enrollment?: Enrollment;
  onClose: () => void;
  onEnrollOrResume: (courseId: string) => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  enrollment,
  onClose,
  onEnrollOrResume,
}) => {
  useEffect(() => {
    if (!course) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [course, onClose]);

  if (!course) return null;

  const totalLessons = getTotalLessonCount(course);
  const progress = getCourseProgress(course, enrollment);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-details-title"
      onClick={onClose}
    >
      <div
        className="emerald-scroll max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 16:9 Header Cover */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-[#030805]">
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close course details"
            className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md hover:bg-black/75 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-teal-300">
              <div className="flex items-center gap-2">
                <span>{course.category}</span>
                <span aria-hidden="true" className="text-emerald-700">·</span>
                <span className="text-slate-200">{course.level}</span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-300 tabular-nums">
                {formatPriceBdt(course.priceBdt)}
              </span>
            </div>
            <h2
              id="course-details-title"
              className="mt-1 font-display text-xl sm:text-2xl font-bold text-white text-balance"
            >
              {course.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {course.subtitle}
          </p>

          {/* Compact Metadata Strip */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] p-3.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="tabular-nums font-medium">
                {formatDurationHours(course.durationHours)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <BookOpen className="h-4 w-4 text-teal-700 dark:text-teal-300 shrink-0" />
              <span className="tabular-nums font-medium">
                {totalLessons} lessons
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 justify-end">
              <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400 shrink-0" />
              <span className="tabular-nums font-medium">
                {course.rating.toFixed(1)} ({course.enrolledCount.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Syllabus Preview */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Curriculum Syllabus
            </h3>
            <div className="space-y-2.5">
              {course.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] p-3.5"
                >
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                    {mod.title}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {mod.lessons.map((lesson) => {
                      const done = Boolean(
                        enrollment?.completedLessonIds.includes(lesson.id)
                      );
                      return (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-200"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {done && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                            {lesson.durationMinutes}m
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer with overflow-visible for neon glow */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-200 dark:border-emerald-900/60 pt-4 overflow-visible">
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Instructor:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {course.instructor}
                </span>
                <span className="hidden sm:inline"> · {course.instructorRole}</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={YOUTUBE_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-700 hover:text-emerald-700 dark:text-teal-300 dark:hover:text-emerald-400 font-medium"
                >
                  <span>YouTube</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={FACEBOOK_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-700 hover:text-emerald-700 dark:text-teal-300 dark:hover:text-emerald-400 font-medium"
                >
                  <span>Facebook Page</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="overflow-visible">
              {enrollment ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEnrollOrResume(course.id);
                  }}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {progress.isCompleted
                      ? 'Review Course'
                      : `Continue (${progress.percent}%)`}
                  </span>
                </button>
              ) : (
                <EnrollButton
                  label={course.priceBdt > 0 ? `Enroll · ${formatPriceBdt(course.priceBdt)}` : 'Enroll Free'}
                  onClick={() => {
                    onClose();
                    onEnrollOrResume(course.id);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

