import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X, Youtube } from 'lucide-react';
import { CATEGORIES, CHANNEL_INFO, COURSE_IMAGE_LIBRARY } from '../../data/lmsData';
import { Course, CourseLevel, CourseModule, Lesson } from '../../types/lms';
import { fetchYouTubeMetadataByUrl } from '../../services/youtubeSync';

export interface CourseDraft {
  id?: string;
  title: string;
  subtitle: string;
  category: string;
  level: CourseLevel;
  instructor: string;
  instructorRole: string;
  priceBdt: number;
  durationHours: number;
  thumbnail: string;
  featured: boolean;
  published: boolean;
  modules: CourseModule[];
}

const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.id !== 'All').map((c) => c.id);

export function createEmptyDraft(): CourseDraft {
  const uid = Date.now().toString(36);
  return {
    title: '',
    subtitle: '',
    category: CATEGORY_OPTIONS[0] ?? 'Chemistry',
    level: 'Intermediate',
    instructor: CHANNEL_INFO.instructorName,
    instructorRole: CHANNEL_INFO.instructorTitle,
    priceBdt: 0,
    durationHours: 4.5,
    thumbnail: COURSE_IMAGE_LIBRARY[0].url,
    featured: false,
    published: true,
    modules: [
      {
        id: `mod_${uid}_1`,
        title: '01. Core Foundations & One-Shot Lecture',
        lessons: [
          {
            id: `les_${uid}_1`,
            title: 'One-Shot Concept Breakdown',
            durationMinutes: 28,
            summary:
              'Complete chapter concept walkthrough, derivations, and board CQ solving.',
            keyTakeaways: [
              'Core formulas & derivations',
              'Board & admission MCQ shortcuts',
            ],
            videoUrl: '',
          },
        ],
      },
    ],
  };
}

interface CourseEditorModalProps {
  initialDraft: CourseDraft;
  existingCourses: Course[];
  onClose: () => void;
  onCreateCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onShowNotice: (msg: string) => void;
}

export const CourseEditorModal: React.FC<CourseEditorModalProps> = ({
  initialDraft,
  existingCourses,
  onClose,
  onCreateCourse,
  onUpdateCourse,
  onShowNotice,
}) => {
  const [draft, setDraft] = useState<CourseDraft>(initialDraft);
  const [formError, setFormError] = useState('');
  const [ytImportUrl, setYtImportUrl] = useState('');
  const [ytImporting, setYtImporting] = useState(false);
  const [ytImportStatus, setYtImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const handleQuickYouTubeImport = async () => {
    if (!ytImportUrl.trim()) {
      setYtImportStatus({
        type: 'error',
        message: 'Paste a YouTube video or playlist link from @tanvirssciencesquare.',
      });
      return;
    }

    setYtImporting(true);
    setYtImportStatus(null);
    try {
      const meta = await fetchYouTubeMetadataByUrl(ytImportUrl);
      setDraft((prev) => {
        const updatedModules = prev.modules.map((mod, mIdx) =>
          mIdx === 0
            ? {
                ...mod,
                lessons: mod.lessons.map((les, lIdx) =>
                  lIdx === 0
                    ? { ...les, title: meta.title, videoUrl: meta.watchUrl }
                    : les
                ),
              }
            : mod
        );
        return {
          ...prev,
          title: meta.title,
          subtitle:
            prev.subtitle.trim() ||
            `Official class from ${meta.authorName} covering key HSC & Admission Science concepts.`,
          thumbnail: meta.thumbnailUrl,
          modules: updatedModules,
        };
      });
      setYtImportStatus({
        type: 'success',
        message: `Imported "${meta.title}" — Thumbnail & Video URL auto-filled.`,
      });
    } catch (err) {
      setYtImportStatus({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not parse YouTube URL. Verify the link format.',
      });
    } finally {
      setYtImporting(false);
    }
  };

  const handleAddModule = () => {
    const idx = draft.modules.length + 1;
    const uid = Date.now().toString(36);
    setDraft((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          id: `mod_${uid}`,
          title: `${String(idx).padStart(2, '0')}. New Science Module`,
          lessons: [
            {
              id: `les_${uid}_1`,
              title: 'Concept Lecture & CQ Solving',
              durationMinutes: 20,
              summary: 'Core concepts, equations, and practice questions for this chapter.',
              keyTakeaways: ['Board & Admission problem breakdown'],
              videoUrl: '',
            },
          ],
        },
      ],
    }));
  };

  const handleUpdateModuleTitle = (modIdx: number, title: string) => {
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => (i === modIdx ? { ...m, title } : m)),
    }));
  };

  const handleRemoveModule = (modIdx: number) => {
    if (draft.modules.length <= 1) return;
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== modIdx),
    }));
  };

  const handleAddLesson = (modIdx: number) => {
    const uid = Date.now().toString(36);
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === modIdx
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                {
                  id: `les_${uid}`,
                  title: 'New Video Lesson',
                  durationMinutes: 20,
                  summary: 'Detailed derivation and problem-solving walkthrough.',
                  keyTakeaways: ['Formula & shortcut review'],
                  videoUrl: '',
                },
              ],
            }
          : m
      ),
    }));
  };

  const handleUpdateLesson = (
    modIdx: number,
    lesIdx: number,
    patch: Partial<Lesson>
  ) => {
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === modIdx
          ? {
              ...m,
              lessons: m.lessons.map((l, j) => (j === lesIdx ? { ...l, ...patch } : l)),
            }
          : m
      ),
    }));
  };

  const handleRemoveLesson = (modIdx: number, lesIdx: number) => {
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === modIdx && m.lessons.length > 1
          ? { ...m, lessons: m.lessons.filter((_, j) => j !== lesIdx) }
          : m
      ),
    }));
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setFormError('Course title is required.');
      return;
    }
    if (!draft.subtitle.trim()) {
      setFormError('Course summary is required.');
      return;
    }
    if (!draft.instructor.trim()) {
      setFormError('Instructor name is required.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (draft.id) {
      const existing = existingCourses.find((c) => c.id === draft.id);
      if (existing) {
        onUpdateCourse({
          ...existing,
          title: draft.title.trim(),
          subtitle: draft.subtitle.trim(),
          category: draft.category,
          level: draft.level,
          instructor: draft.instructor.trim(),
          instructorRole: draft.instructorRole.trim() || CHANNEL_INFO.instructorTitle,
          priceBdt: Math.max(0, Number(draft.priceBdt) || 0),
          durationHours: Number(draft.durationHours) || 1,
          thumbnail: draft.thumbnail.trim() || COURSE_IMAGE_LIBRARY[0].url,
          featured: draft.featured,
          published: draft.published,
          modules: draft.modules,
          updatedAt: today,
        });
        onShowNotice(`Updated "${draft.title.trim()}"`);
      }
    } else {
      const newCourse: Course = {
        id: `crs_${Date.now().toString(36)}`,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        category: draft.category,
        level: draft.level,
        instructor: draft.instructor.trim(),
        instructorRole: draft.instructorRole.trim() || CHANNEL_INFO.instructorTitle,
        priceBdt: Math.max(0, Number(draft.priceBdt) || 0),
        durationHours: Number(draft.durationHours) || 1,
        rating: 5.0,
        enrolledCount: 1,
        thumbnail: draft.thumbnail.trim() || COURSE_IMAGE_LIBRARY[0].url,
        featured: draft.featured,
        published: draft.published,
        updatedAt: today,
        modules: draft.modules,
      };
      onCreateCourse(newCourse);
      onShowNotice(`Created "${newCourse.title}"`);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-editor-title"
      onClick={onClose}
    >
      <div
        className="emerald-scroll max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/60 pb-4">
          <h2
            id="course-editor-title"
            className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {draft.id ? 'Edit Course & Curriculum' : 'Create New Course'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close course editor"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#031109] dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Import from YouTube Bar */}
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-[#031109] p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            <Youtube className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>Quick Import from YouTube (@tanvirssciencesquare)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Paste any YouTube video or playlist link to auto-fill Title, HD Thumbnail, and Classroom Video URL in one click.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={ytImportUrl}
              onChange={(e) => setYtImportUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or playlist?list=..."
              className="flex-1 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-xs sm:text-sm dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleQuickYouTubeImport()}
              disabled={ytImporting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {ytImporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Auto-Fill Course</span>
              )}
            </button>
          </div>
          {ytImportStatus && (
            <p
              className={`text-xs font-medium ${
                ytImportStatus.type === 'success'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {ytImportStatus.message}
            </p>
          )}
        </div>

        <form onSubmit={handleSaveCourse} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Course Title
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g., HSC Chemistry 2nd Paper: পরিবেশ রসায়ন One-Shot"
                className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Subtitle / Syllabus Overview
              </label>
              <textarea
                rows={2}
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                placeholder="Concise summary of HSC chapters, CQ/MCQ coverage, and admission prep..."
                className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Science Subject
              </label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={draft.level}
                onChange={(e) =>
                  setDraft({ ...draft, level: e.target.value as CourseLevel })
                }
                className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Instructor Name
              </label>
              <input
                type="text"
                value={draft.instructor}
                onChange={(e) => setDraft({ ...draft, instructor: e.target.value })}
                placeholder="Tanvir"
                className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Course Fee (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={draft.priceBdt}
                  onChange={(e) =>
                    setDraft({ ...draft, priceBdt: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 font-mono text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={draft.durationHours}
                  onChange={(e) =>
                    setDraft({ ...draft, durationHours: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 font-mono text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Cover Artwork (16:9 or Imported YouTube Thumbnail)
              </label>
              <input
                type="url"
                value={draft.thumbnail}
                onChange={(e) => setDraft({ ...draft, thumbnail: e.target.value })}
                placeholder="Thumbnail URL"
                className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-1.5 font-mono text-xs dark:text-slate-200 dark:focus:border-emerald-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {COURSE_IMAGE_LIBRARY.map((img) => {
                  const active = draft.thumbnail === img.url;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, thumbnail: img.url })}
                      className={`overflow-hidden rounded-lg border-2 text-left transition-all ${
                        active
                          ? 'border-emerald-600 ring-1 ring-emerald-600 dark:border-emerald-400 dark:ring-emerald-400'
                          : 'border-slate-200 opacity-80 hover:opacity-100 dark:border-emerald-900/60 dark:opacity-75'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="aspect-video w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-6 sm:col-span-2 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) =>
                    setDraft({ ...draft, published: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 dark:border-emerald-800 dark:bg-[#030805] accent-emerald-600 dark:accent-emerald-500"
                />
                <span>Published in catalog</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) =>
                    setDraft({ ...draft, featured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 dark:border-emerald-800 dark:bg-[#030805] accent-teal-600 dark:accent-teal-300"
                />
                <span>Highlight in featured banner</span>
              </label>
            </div>
          </div>

          {/* Curriculum Modules & Lessons Editor */}
          <div className="border-t border-slate-200 dark:border-emerald-900/60 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Curriculum Modules ({draft.modules.length})
              </h3>
              <button
                type="button"
                onClick={handleAddModule}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 text-emerald-700 hover:border-emerald-600 dark:border-emerald-800 dark:bg-[#031109] px-2.5 py-1 text-xs font-medium dark:text-emerald-400 dark:hover:border-emerald-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="space-y-3">
              {draft.modules.map((mod, mIdx) => (
                <div
                  key={mod.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] p-3 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) =>
                        handleUpdateModuleTitle(mIdx, e.target.value)
                      }
                      aria-label={`Module ${mIdx + 1} title`}
                      className="flex-1 rounded-md border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-2.5 py-1.5 text-xs font-semibold dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                    />
                    {draft.modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(mIdx)}
                        aria-label="Remove module"
                        className="rounded-md p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pl-3">
                    {mod.lessons.map((les, lIdx) => (
                      <div
                        key={les.id}
                        className="space-y-1.5 rounded-md border border-slate-200/70 dark:border-emerald-900/50 bg-white/60 dark:bg-[#030805]/60 p-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={les.title}
                            onChange={(e) =>
                              handleUpdateLesson(mIdx, lIdx, {
                                title: e.target.value,
                              })
                            }
                            placeholder="Lesson title"
                            className="min-w-[180px] flex-1 rounded-md border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/70 dark:bg-[#030805] px-2.5 py-1 text-xs dark:text-slate-200 dark:focus:border-emerald-400 focus:outline-none"
                          />
                          <input
                            type="number"
                            min="1"
                            value={les.durationMinutes}
                            onChange={(e) =>
                              handleUpdateLesson(mIdx, lIdx, {
                                durationMinutes: Number(e.target.value) || 10,
                              })
                            }
                            aria-label="Lesson duration minutes"
                            className="w-16 rounded-md border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/70 dark:bg-[#030805] px-2 py-1 font-mono text-xs dark:text-slate-200 text-right dark:focus:border-emerald-400 focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            min
                          </span>
                          {mod.lessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(mIdx, lIdx)}
                              aria-label="Remove lesson"
                              className="rounded p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          value={les.videoUrl ?? ''}
                          onChange={(e) =>
                            handleUpdateLesson(mIdx, lIdx, {
                              videoUrl: e.target.value,
                            })
                          }
                          placeholder="YouTube Video / Playlist URL (optional)"
                          className="w-full rounded-md border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-emerald-600 dark:border-emerald-900/60 dark:bg-[#030805] px-2.5 py-1 font-mono text-[11px] dark:text-slate-300 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddLesson(mIdx)}
                      className="text-xs font-medium text-teal-700 hover:text-emerald-700 dark:text-teal-300 dark:hover:text-emerald-400"
                    >
                      + Add Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-emerald-900/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 dark:border-emerald-900/80 dark:bg-[#031109] px-4 py-2 text-xs font-semibold dark:text-slate-200 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 px-5 py-2 text-xs font-semibold dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
            >
              {draft.id ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditorModal;
