import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Megaphone, X } from 'lucide-react';
import { NoticeItem } from '../types/lms';

interface NoticeBoardProps {
  notices: NoticeItem[];
  loading?: boolean;
  onOpenCourse?: (courseId: string) => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  notices,
  loading = false,
  onOpenCourse,
}) => {
  const activeNotices = notices.filter((n) => n.active);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= activeNotices.length && activeNotices.length > 0) {
      setIndex(0);
    }
  }, [activeNotices.length, index]);

  useEffect(() => {
    if (activeNotices.length <= 1 || paused || dismissed) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % activeNotices.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [activeNotices.length, dismissed, paused]);

  if (dismissed) return null;

  if (loading && activeNotices.length === 0) {
    return (
      <div
        role="status"
        aria-label="Loading live notices"
        className="border-b border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-[#04140a] py-2"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="h-3.5 w-3.5 rounded-full bg-emerald-500/30 animate-pulse shrink-0" />
          <div className="h-3 w-20 rounded bg-emerald-500/20 animate-pulse shrink-0" />
          <div className="h-3 flex-1 max-w-md rounded bg-slate-300/60 dark:bg-emerald-900/60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (activeNotices.length === 0) return null;

  const current = activeNotices[index] ?? activeNotices[0];
  const priorityLabel =
    current.priority === 'live'
      ? 'LIVE CLASS'
      : current.priority === 'urgent'
      ? 'EXAM ALERT'
      : 'NOTICE';

  return (
    <div
      role="region"
      aria-label="Live academic notice board"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="border-b border-emerald-200 bg-emerald-50/90 text-slate-900 dark:border-emerald-900/70 dark:bg-[#04140a] dark:text-slate-100 transition-colors"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Megaphone className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span
            className={`font-mono text-[10px] font-bold tracking-wider shrink-0 ${
              current.priority === 'urgent'
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {priorityLabel}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800 shrink-0">
            ·
          </span>
          <p className="truncate text-slate-700 dark:text-slate-200">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {current.title}:
            </span>{' '}
            {current.message}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {current.targetCourseId && onOpenCourse && (
            <button
              type="button"
              onClick={() => onOpenCourse(current.targetCourseId!)}
              className="hidden sm:inline-flex font-semibold text-emerald-700 hover:underline dark:text-emerald-400 px-1.5 whitespace-nowrap"
            >
              {current.linkLabel || 'View'}
            </button>
          )}

          {activeNotices.length > 1 && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  setIndex(
                    (i) => (i - 1 + activeNotices.length) % activeNotices.length
                  )
                }
                aria-label="Previous notice"
                className="rounded p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                {index + 1}/{activeNotices.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setIndex((i) => (i + 1) % activeNotices.length)
                }
                aria-label="Next notice"
                className="rounded p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss notice board"
            className="rounded p-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
