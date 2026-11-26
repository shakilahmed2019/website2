import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Course } from '../../types/lms';
import {
  formatDurationHours,
  formatPriceBdt,
  getTotalLessonCount,
} from '../../utils/courseHelpers';
import { CourseDraft, createEmptyDraft } from './CourseEditorModal';

const CourseEditorModal = lazy(() => import('./CourseEditorModal'));

interface AdminCoursesTabProps {
  courses: Course[];
  onCreateCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onPreviewCourse: (courseId: string) => void;
  onShowNotice: (msg: string) => void;
}

export const AdminCoursesTab: React.FC<AdminCoursesTabProps> = ({
  courses,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onPreviewCourse,
  onShowNotice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editorDraft, setEditorDraft] = useState<CourseDraft | null>(null);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const openCreateModal = () => {
    setEditorDraft(createEmptyDraft());
  };

  const openEditModal = (course: Course) => {
    setEditorDraft({
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      category: course.category,
      level: course.level,
      instructor: course.instructor,
      instructorRole: course.instructorRole,
      priceBdt: course.priceBdt ?? 0,
      durationHours: course.durationHours,
      thumbnail: course.thumbnail,
      featured: course.featured,
      published: course.published,
      modules: course.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({ ...l })),
      })),
    });
  };

  const handleTogglePublish = (course: Course) => {
    onUpdateCourse({
      ...course,
      published: !course.published,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    onShowNotice(
      !course.published
        ? `Published "${course.title}"`
        : `Moved "${course.title}" to drafts`
    );
  };

  const handleToggleFeatured = (course: Course) => {
    onUpdateCourse({
      ...course,
      featured: !course.featured,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter science courses..."
            aria-label="Filter courses in table"
            className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] py-2 pl-9 pr-3 text-sm dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-semibold dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Course / YT Import</span>
        </button>
      </div>

      {/* Course CRUD Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-emerald-900/80 dark:bg-[#031109] text-xs font-medium dark:text-slate-400">
                <th className="py-3 pl-4 pr-3">Course</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3 text-right">Fee (BDT)</th>
                <th className="py-3 px-3 text-right">Lessons</th>
                <th className="py-3 px-3 text-right">Duration</th>
                <th className="py-3 px-3">Visibility</th>
                <th className="py-3 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/50 text-sm">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No courses match your search filter.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const lessonCount = getTotalLessonCount(course);
                  const isDeleting = confirmDeleteId === course.id;

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#031109]/70 transition-colors"
                    >
                      <td className="py-3 pl-4 pr-3 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={course.thumbnail}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="h-10 w-16 shrink-0 rounded-md object-cover border border-slate-200 bg-slate-100 dark:border-emerald-900/60 dark:bg-[#030805]"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onPreviewCourse(course.id)}
                              className="font-medium text-slate-900 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400 transition-colors text-left line-clamp-1"
                            >
                              {course.title}
                            </button>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {course.level} · {course.instructor}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-teal-700 dark:text-teal-300 whitespace-nowrap">
                        {course.category}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                        {formatPriceBdt(course.priceBdt)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                        {lessonCount}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                        {formatDurationHours(course.durationHours)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(course)}
                            title={course.published ? 'Click to unpublish' : 'Click to publish'}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                              course.published
                                ? 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {course.published ? (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3.5 w-3.5" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(course)}
                            aria-label={
                              course.featured
                                ? `Unfeature ${course.title}`
                                : `Feature ${course.title} in banner`
                            }
                            title="Toggle Featured Banner"
                            className={`rounded-md p-1 transition-colors ${
                              course.featured
                                ? 'text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-300/10'
                                : 'text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300'
                            }`}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                course.featured ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="text-xs text-rose-600 dark:text-rose-300 mr-1">
                              Delete?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCourse(course.id);
                                setConfirmDeleteId(null);
                                onShowNotice(`Deleted "${course.title}"`);
                              }}
                              aria-label="Confirm delete"
                              className="rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 p-1.5 dark:text-rose-300 dark:hover:bg-rose-500/30 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              aria-label="Cancel delete"
                              className="rounded-md bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-[#031109] p-1.5 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(course)}
                              aria-label={`Edit ${course.title}`}
                              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-[#031109] dark:hover:text-emerald-400 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(course.id)}
                              aria-label={`Delete ${course.title}`}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-[#031109] dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lazy-Loaded Course Editor Modal */}
      {editorDraft && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm">
              <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] px-5 py-3 text-xs font-medium text-slate-700 dark:text-slate-200">
                Loading Course Studio Editor...
              </div>
            </div>
          }
        >
          <CourseEditorModal
            initialDraft={editorDraft}
            existingCourses={courses}
            onClose={() => setEditorDraft(null)}
            onCreateCourse={onCreateCourse}
            onUpdateCourse={onUpdateCourse}
            onShowNotice={onShowNotice}
          />
        </Suspense>
      )}
    </div>
  );
};
