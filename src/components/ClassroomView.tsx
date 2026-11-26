import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Subtitles,
  FileText,
  ChevronRight,
  FolderGit2,
  Presentation,
  Award,
  Loader2,
} from 'lucide-react';
import {
  Course,
  Enrollment,
  Lesson,
  McqQuestion,
  UserProfile,
} from '../types/lms';
import { getAllLessons, getCourseProgress } from '../utils/courseHelpers';
import { SecureVideoPlayer } from './SecureVideoPlayer';

const ExamHall = lazy(() => import('./ExamHall'));

interface ClassroomViewProps {
  course: Course;
  enrollment?: Enrollment;
  mcqs?: McqQuestion[];
  loadingMcqs?: boolean;
  currentUser?: UserProfile | null;
  catalogSeeded?: boolean;
  onRequireAuth?: () => void;
  notesMap: Record<string, string>;
  onSaveNote: (lessonId: string, note: string) => void;
  onToggleLessonComplete: (courseId: string, lessonId: string) => void;
  onMarkCompleteAndNext: (courseId: string, lessonId: string, nextLessonId?: string) => void;
  onBack: () => void;
  onOpenLearningHub: () => void;
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2];

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  course,
  enrollment,
  mcqs,
  loadingMcqs = false,
  currentUser = null,
  catalogSeeded = false,
  onRequireAuth,
  notesMap,
  onSaveNote,
  onToggleLessonComplete,
  onMarkCompleteAndNext,
  onBack,
  onOpenLearningHub,
}) => {
  const allLessons = useMemo(() => getAllLessons(course), [course]);
  const progress = useMemo(
    () => getCourseProgress(course, enrollment),
    [course, enrollment]
  );

  const [activeLessonId, setActiveLessonId] = useState<string>(
    progress.nextLesson?.id ?? allLessons[0]?.id ?? ''
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'notes' | 'mcq'>('overview');
  const [theaterMode, setTheaterMode] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);

  const activeLesson: Lesson | undefined = useMemo(
    () => allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0],
    [allLessons, activeLessonId]
  );

  const activeLessonIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const nextLesson =
    activeLessonIndex >= 0 && activeLessonIndex < allLessons.length - 1
      ? allLessons[activeLessonIndex + 1]
      : undefined;

  const totalSec = (activeLesson?.durationMinutes ?? 15) * 60;
  const speed = PLAYBACK_SPEEDS[speedIndex];
  const isCurrentCompleted = Boolean(
    activeLesson && enrollment?.completedLessonIds.includes(activeLesson.id)
  );

  useEffect(() => {
    setCurrentSec(0);
    setIsPlaying(false);
  }, [activeLesson?.id]);

  useEffect(() => {
    if (!allLessons.some((l) => l.id === activeLessonId) && allLessons[0]) {
      setActiveLessonId(allLessons[0].id);
    }
  }, [allLessons, activeLessonId]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentSec((prev) => {
        const next = prev + speed;
        if (next >= totalSec) {
          setIsPlaying(false);
          return totalSec;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, speed, totalSec]);

  if (!activeLesson) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-slate-600 dark:text-slate-300">
          This course does not contain any lessons yet.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 px-4 py-2 text-sm font-semibold dark:text-[#030805]"
        >
          Back to Catalog
        </button>
      </main>
    );
  }

  const playbackPercent = totalSec > 0 ? Math.min(100, (currentSec / totalSec) * 100) : 0;
  const currentCaptionIndex = Math.min(
    Math.max(0, activeLesson.keyTakeaways.length - 1),
    Math.floor(
      (playbackPercent / 100) * Math.max(1, activeLesson.keyTakeaways.length)
    )
  );
  const activeCaption =
    activeLesson.keyTakeaways[currentCaptionIndex] ?? activeLesson.summary;

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 md:pb-12 lg:px-8">
      {/* Top Classroom Bar */}
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 dark:border-emerald-900/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#04140a] px-3 py-1.5 text-xs font-medium dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <div className="min-w-0">
            <p className="text-xs text-teal-700 dark:text-teal-300 truncate">{course.category}</p>
            <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-[#04140a]">
              <div
                className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
              {progress.percent}% complete
            </span>
          </div>

          {progress.isCompleted && (
            <button
              type="button"
              onClick={onOpenLearningHub}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/40 bg-teal-50 text-teal-800 hover:border-teal-600 dark:border-teal-300/40 dark:bg-[#04140a] px-3 py-1.5 text-xs font-semibold dark:text-teal-300 dark:hover:border-teal-300"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Certificate Ready</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Zone Classroom Workspace */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          theaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'
        }`}
      >
        {/* Left / Primary Video Stage + Notes */}
        <div className={theaterMode ? 'space-y-5' : 'lg:col-span-8 space-y-5'}>
          {/* 16:9 Video Player Stage */}
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-emerald-900/80 bg-white dark:bg-[#031109]">
            {activeLesson.videoUrl ? (
              <SecureVideoPlayer
                videoUrl={activeLesson.videoUrl}
                title={activeLesson.title}
                posterUrl={course.thumbnail}
                theaterMode={theaterMode}
                onToggleTheater={() => setTheaterMode((t) => !t)}
              />
            ) : (
              <div className="relative aspect-video w-full bg-[#030805]">
                <img
                  src={course.thumbnail}
                  alt={activeLesson.title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className={`h-full w-full object-cover transition-opacity duration-300 ${
                    isPlaying ? 'opacity-40' : 'opacity-30'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030805] via-[#030805]/65 to-[#030805]/40" />

                <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-7">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-teal-300 tabular-nums">
                      Lesson {activeLessonIndex + 1} of {allLessons.length} ·{' '}
                      {course.instructor}
                    </span>
                    <span className="font-mono text-slate-300 tabular-nums">
                      {formatSeconds(currentSec)} / {formatSeconds(totalSec)}
                    </span>
                  </div>

                  <div className="my-auto flex flex-col items-center text-center max-w-xl mx-auto">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      aria-label={isPlaying ? 'Pause lecture' : 'Play lecture'}
                      className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-500 text-[#030805] shadow-lg hover:bg-emerald-400 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6 fill-current" />
                      ) : (
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      )}
                    </button>

                    <h2 className="font-display text-base sm:text-xl font-bold text-slate-100 text-balance">
                      {activeLesson.title}
                    </h2>

                    {showCaptions && (
                      <div className="mt-3 rounded-lg border border-emerald-900/70 bg-[#030805]/85 px-4 py-2 text-xs sm:text-sm text-slate-200 max-w-lg">
                        {activeCaption}
                      </div>
                    )}
                  </div>

                  <div className="h-4" />
                </div>
              </div>
            )}

            {/* Interactive Video Control Deck */}
            {!activeLesson.videoUrl && (
              <div className="border-t border-slate-200 bg-slate-50 dark:border-emerald-900/80 dark:bg-[#04140a] px-4 py-3 space-y-2.5">
                <input
                  type="range"
                  min={0}
                  max={totalSec}
                  value={Math.floor(currentSec)}
                  onChange={(e) => setCurrentSec(Number(e.target.value))}
                  aria-label="Seek lecture timeline"
                  className="h-1.5 w-full cursor-pointer accent-emerald-600 dark:accent-emerald-400 bg-slate-200 dark:bg-[#030805] rounded-lg"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 dark:bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold dark:text-emerald-400 dark:hover:bg-emerald-500/25 transition-colors"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentSec((s) => Math.max(0, s - 10))}
                      aria-label="Rewind 10 seconds"
                      className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#031109] dark:hover:text-slate-100"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentSec((s) => Math.min(totalSec, s + 10))}
                      aria-label="Forward 10 seconds"
                      className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#031109] dark:hover:text-slate-100"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>

                    <span className="ml-2 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums hidden sm:inline">
                      {formatSeconds(currentSec)} / {formatSeconds(totalSec)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSpeedIndex((i) => (i + 1) % PLAYBACK_SPEEDS.length)
                      }
                      className="rounded-md border border-slate-200 bg-white text-slate-700 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] px-2.5 py-1 font-mono text-xs dark:text-slate-200 dark:hover:border-emerald-400"
                    >
                      {speed}x
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCaptions((c) => !c)}
                      aria-pressed={showCaptions}
                      aria-label="Toggle lecture captions"
                      className={`rounded-md border p-1.5 transition-colors ${
                        showCaptions
                          ? 'border-emerald-600/50 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'border-slate-200 bg-white text-slate-400 dark:border-emerald-900/80 dark:bg-[#031109]'
                      }`}
                    >
                      <Subtitles className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheaterMode((t) => !t)}
                      aria-pressed={theaterMode}
                      aria-label="Toggle theater mode"
                      className="hidden lg:inline-flex rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] p-1.5 dark:text-slate-300 dark:hover:border-emerald-400"
                    >
                      {theaterMode ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4">
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeLesson.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {activeLesson.durationMinutes} min · {course.instructor}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  onToggleLessonComplete(course.id, activeLesson.id)
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  isCurrentCompleted
                    ? 'border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-200 dark:hover:border-emerald-400'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isCurrentCompleted ? 'Completed' : 'Mark Complete'}</span>
              </button>

              {nextLesson && (
                <button
                  type="button"
                  onClick={() => {
                    onMarkCompleteAndNext(course.id, activeLesson.id, nextLesson.id);
                    setActiveLessonId(nextLesson.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 px-3.5 py-2 text-xs font-semibold dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors whitespace-nowrap"
                >
                  <span>Complete &amp; Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Lesson Tabs: Overview / Resources / Notes / MCQ Exam Hall */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4 sm:p-5">
            <div className="flex items-center gap-5 border-b border-slate-200 dark:border-emerald-900/60 pb-3 text-xs sm:text-sm font-medium overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'overview'
                    ? 'text-emerald-700 border-b-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400 -mb-[13px] pb-3'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Overview &amp; Takeaways
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resources')}
                className={`pb-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'resources'
                    ? 'text-emerald-700 border-b-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400 -mb-[13px] pb-3'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Resources ({activeLesson.resources?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`pb-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'notes'
                    ? 'text-emerald-700 border-b-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400 -mb-[13px] pb-3'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Personal Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mcq')}
                className={`pb-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'mcq'
                    ? 'text-emerald-700 border-b-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400 -mb-[13px] pb-3'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                MCQ Exam Hall
              </button>
            </div>

            <div className="mt-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {activeLesson.summary}
                  </p>
                  {activeLesson.keyTakeaways.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-teal-700 dark:text-teal-300 mb-2">
                        Key Science Takeaways
                      </h3>
                      <ul className="space-y-2">
                        {activeLesson.keyTakeaways.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200"
                          >
                            <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                              0{idx + 1}.
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-2.5">
                  {activeLesson.resources && activeLesson.resources.length > 0 ? (
                    activeLesson.resources.map((res, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          {res.type === 'repo' ? (
                            <FolderGit2 className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                          ) : res.type === 'slides' ? (
                            <Presentation className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {res.label}
                            </p>
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {res.sizeOrHint}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Included
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No downloadable attachments for this lesson. Use Personal Notes to capture key commands and insights.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-2">
                  <label
                    htmlFor="lesson-notes-textarea"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Saved automatically to your workspace for “{activeLesson.title}”
                  </label>
                  <textarea
                    id="lesson-notes-textarea"
                    rows={5}
                    value={notesMap[activeLesson.id] ?? ''}
                    onChange={(e) => onSaveNote(activeLesson.id, e.target.value)}
                    placeholder="Capture architectural invariants, edge cases, or implementation notes..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] p-3 text-sm dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}

              {activeTab === 'mcq' && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Loading MCQ Exam Hall &amp; Live Leaderboard...</span>
                    </div>
                  }
                >
                  <ExamHall
                    courseId={course.id}
                    courseCategory={course.category}
                    courseTitle={course.title}
                    mcqs={mcqs}
                    loading={loadingMcqs}
                    currentUser={currentUser}
                    catalogSeeded={catalogSeeded}
                    onRequireAuth={onRequireAuth}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </div>

        {/* Right Curriculum Playlist Sidebar */}
        <aside
          aria-label="Course curriculum"
          className={
            theaterMode
              ? 'rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4'
              : 'lg:col-span-4 rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4 self-start'
          }
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-900/60 pb-3">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Course Curriculum
            </h2>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {progress.completedCount}/{progress.totalCount} done
            </span>
          </div>

          <div className="emerald-scroll mt-3 max-h-[540px] space-y-4 overflow-y-auto pr-1">
            {course.modules.map((mod) => (
              <div key={mod.id} className="space-y-1.5">
                <h3 className="px-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
                  {mod.title}
                </h3>

                <div className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLesson.id;
                    const isDone = Boolean(
                      enrollment?.completedLessonIds.includes(lesson.id)
                    );

                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                          isActive
                            ? 'bg-emerald-50 border border-emerald-500/40 dark:bg-[#031109] dark:border-emerald-500/50'
                            : 'hover:bg-slate-50 dark:hover:bg-[#031109]/70 border border-transparent'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onToggleLessonComplete(course.id, lesson.id)
                          }
                          aria-label={
                            isDone
                              ? `Mark ${lesson.title} incomplete`
                              : `Mark ${lesson.title} complete`
                          }
                          className="shrink-0 text-emerald-600 hover:text-teal-700 dark:text-emerald-400 dark:hover:text-teal-300"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 fill-emerald-500/20" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveLessonId(lesson.id)}
                          className="flex flex-1 items-center justify-between gap-2 text-left min-w-0"
                        >
                          <span
                            className={`text-xs font-medium truncate ${
                              isActive
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {lesson.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                            {lesson.durationMinutes}m
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
};

export default ClassroomView;
