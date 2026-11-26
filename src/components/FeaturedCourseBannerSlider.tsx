import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Course, Enrollment } from '../types/lms';
import {
  formatDurationHours,
  formatPriceBdt,
  getCourseProgress,
  getTotalLessonCount,
} from '../utils/courseHelpers';
import {
  ShaderTransitionMode,
  WebGLShaderCanvas,
} from './WebGLShaderCanvas';
import { EnrollButton } from './EnrollButton';

interface FeaturedCourseBannerSliderProps {
  courses: Course[];
  enrollments: Enrollment[];
  onSelectCourse: (courseId: string) => void;
}

const SHADER_CYCLE: ShaderTransitionMode[] = ['wave', 'halftone', 'morph'];

export const FeaturedCourseBannerSlider: React.FC<
  FeaturedCourseBannerSliderProps
> = ({ courses, enrollments, onSelectCourse }) => {
  const featuredCourses = courses.filter((c) => c.published && c.featured);
  const slides =
    featuredCourses.length > 0 ? featuredCourses : courses.slice(0, 3);

  const [activeIndex, setActiveIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [shaderMode, setShaderMode] = useState<ShaderTransitionMode>('wave');
  const [isPaused, setIsPaused] = useState(false);
  const [pointerPos, setPointerPos] = useState({ x: 0.5, y: 0.5 });

  // Animation & drag gesture refs
  const animRafRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    lockedHorizontal: boolean;
    targetIdx: number;
    dir: 1 | -1;
    latestProgress: number;
    wasDragged: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lockedHorizontal: false,
    targetIdx: 0,
    dir: 1,
    latestProgress: 0,
    wasDragged: false,
  });

  useEffect(() => {
    if (activeIndex >= slides.length && slides.length > 0) {
      setActiveIndex(0);
      setTargetIndex(0);
      setProgress(0);
    }
  }, [slides.length, activeIndex]);

  const cancelAnimation = useCallback(() => {
    if (animRafRef.current !== null) {
      window.cancelAnimationFrame(animRafRef.current);
      animRafRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  useEffect(() => () => cancelAnimation(), [cancelAnimation]);

  const animateTransition = useCallback(
    (
      nextIdx: number,
      dir: 1 | -1,
      fromProgress = 0,
      toProgress = 1,
      commitOnFinish = true
    ) => {
      if (slides.length <= 1) return;
      cancelAnimation();

      setShaderMode(SHADER_CYCLE[nextIdx % SHADER_CYCLE.length]);
      setTargetIndex(nextIdx);
      setDirection(dir);
      isAnimatingRef.current = true;

      const durationMs = 760 * Math.abs(toProgress - fromProgress);
      if (durationMs < 16) {
        if (commitOnFinish) {
          setActiveIndex(nextIdx);
          setTargetIndex(nextIdx);
        }
        setProgress(0);
        isAnimatingRef.current = false;
        return;
      }

      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        // Cubic ease-out settling curve
        const eased = 1 - Math.pow(1 - t, 3);
        const currentP = fromProgress + (toProgress - fromProgress) * eased;
        setProgress(currentP);

        if (t < 1) {
          animRafRef.current = window.requestAnimationFrame(step);
        } else {
          if (commitOnFinish) {
            setActiveIndex(nextIdx);
            setTargetIndex(nextIdx);
          } else {
            setTargetIndex(activeIndex);
          }
          setProgress(0);
          isAnimatingRef.current = false;
          animRafRef.current = null;
        }
      };

      animRafRef.current = window.requestAnimationFrame(step);
    },
    [activeIndex, cancelAnimation, slides.length]
  );

  const goToSlide = useCallback(
    (nextIdx: number, explicitDir?: 1 | -1) => {
      if (slides.length <= 1 || nextIdx === activeIndex) return;
      const dir: 1 | -1 =
        explicitDir ?? (nextIdx > activeIndex ? 1 : -1);
      animateTransition(nextIdx, dir, 0, 1, true);
    },
    [activeIndex, animateTransition, slides.length]
  );

  const handlePrev = useCallback(() => {
    const prevIdx = (activeIndex - 1 + slides.length) % slides.length;
    goToSlide(prevIdx, -1);
  }, [activeIndex, goToSlide, slides.length]);

  const handleNext = useCallback(() => {
    const nextIdx = (activeIndex + 1) % slides.length;
    goToSlide(nextIdx, 1);
  }, [activeIndex, goToSlide, slides.length]);

  // Auto-play every 4.5 seconds, paused on hover or active drag
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      if (!isAnimatingRef.current && !dragRef.current.active) {
        const nextIdx = (activeIndex + 1) % slides.length;
        animateTransition(nextIdx, 1, 0, 1, true);
      }
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeIndex, animateTransition, isPaused, slides.length]);

  // Touch & Mouse interactive drag/swipe handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (slides.length <= 1) return;
    // Ignore drags starting on interactive controls
    if ((e.target as HTMLElement).closest('button')) return;

    cancelAnimation();
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lockedHorizontal: false,
      targetIdx: activeIndex,
      dir: 1,
      latestProgress: 0,
      wasDragged: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setPointerPos({
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      });
    }

    const drag = dragRef.current;
    if (!drag.active || slides.length <= 1) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.lockedHorizontal) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        drag.lockedHorizontal = true;
        drag.wasDragged = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } else if (Math.abs(dy) > 12) {
        drag.active = false;
        return;
      } else {
        return;
      }
    }

    const dir: 1 | -1 = dx < 0 ? 1 : -1;
    const nextIdx =
      dir === 1
        ? (activeIndex + 1) % slides.length
        : (activeIndex - 1 + slides.length) % slides.length;

    const dragSpan = Math.max(180, rect.width * 0.55);
    const scrubProgress = Math.min(0.98, Math.abs(dx) / dragSpan);

    drag.dir = dir;
    drag.targetIdx = nextIdx;
    drag.latestProgress = scrubProgress;

    setShaderMode(SHADER_CYCLE[nextIdx % SHADER_CYCLE.length]);
    setDirection(dir);
    setTargetIndex(nextIdx);
    setProgress(scrubProgress);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    drag.active = false;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }

    if (!drag.lockedHorizontal) return;

    if (drag.latestProgress >= 0.18) {
      animateTransition(
        drag.targetIdx,
        drag.dir,
        drag.latestProgress,
        1,
        true
      );
    } else {
      animateTransition(
        drag.targetIdx,
        drag.dir,
        drag.latestProgress,
        0,
        false
      );
    }
  };

  if (slides.length === 0) return null;

  const displayIndex = progress > 0.55 ? targetIndex : activeIndex;
  const currentCourse = slides[activeIndex] ?? slides[0];
  const nextCourse = slides[targetIndex] ?? currentCourse;
  const displayCourse = slides[displayIndex] ?? currentCourse;

  const enrollment = enrollments.find((e) => e.courseId === displayCourse.id);
  const courseProgress = getCourseProgress(displayCourse, enrollment);
  const totalLessons = getTotalLessonCount(displayCourse);

  return (
    <section
      aria-label="Featured courses showcase"
      className="relative mx-4 mt-3 sm:mx-0 sm:mt-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-emerald-900/80 bg-[#04140a] select-none shadow-sm dark:shadow-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        setPointerPos({ x: 0.5, y: 0.5 });
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {/* Compact mobile-first height: h-[180px] sm:h-[240px] md:h-[320px] */}
      <div className="relative h-[180px] sm:h-[240px] md:h-[320px] w-full cursor-grab active:cursor-grabbing">
        <WebGLShaderCanvas
          currentSrc={currentCourse.thumbnail}
          nextSrc={nextCourse.thumbnail}
          progress={progress}
          direction={direction}
          mode={shaderMode}
          pointerPos={pointerPos}
          alt={displayCourse.title}
        />

        {/* Crisp dark readability gradient scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030805]/85 via-[#030805]/30 to-transparent" />

        {/* Top Bar: Track Metadata */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3.5 sm:p-5 md:p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-teal-300 min-w-0">
            <span className="truncate">{displayCourse.category}</span>
            <span aria-hidden="true" className="text-emerald-700 shrink-0">
              ·
            </span>
            <span className="font-mono font-semibold text-emerald-300 tabular-nums shrink-0">
              {formatPriceBdt(displayCourse.priceBdt)}
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-emerald-700 shrink-0">
              ·
            </span>
            <span className="hidden sm:inline text-slate-300 tabular-nums shrink-0">
              {totalLessons} lessons ·{' '}
              {formatDurationHours(displayCourse.durationHours)}
            </span>
          </div>
        </div>

        {/* Sleek Glassmorphic Desktop Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous featured course"
              className="hidden sm:flex absolute left-4 top-1/2 z-10 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-slate-100 backdrop-blur-md hover:border-emerald-400/70 hover:bg-black/70 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next featured course"
              className="hidden sm:flex absolute right-4 top-1/2 z-10 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-slate-100 backdrop-blur-md hover:border-emerald-400/70 hover:bg-black/70 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Bottom-Left Sharp Overlay Content & Bottom-Right Pagination */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-3.5 sm:p-5 md:p-6">
          <div className="min-w-0 max-w-xl">
            <h1 className="font-display text-base font-bold tracking-tight text-slate-100 sm:text-xl md:text-2xl line-clamp-1 sm:line-clamp-2 text-balance">
              {displayCourse.title}
            </h1>
            <p className="mt-1 hidden text-xs sm:text-sm text-slate-300 sm:line-clamp-1 md:line-clamp-2">
              {displayCourse.subtitle}
            </p>

            <div className="mt-2.5 sm:mt-3 flex items-center gap-3 overflow-visible">
              {enrollment ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!dragRef.current.wasDragged) {
                      onSelectCourse(displayCourse.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-[#030805] hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume · {courseProgress.percent}%</span>
                </button>
              ) : (
                <EnrollButton
                  compact
                  label={
                    displayCourse.priceBdt > 0
                      ? `Enroll · ${formatPriceBdt(displayCourse.priceBdt)}`
                      : 'Enroll Free'
                  }
                  onClick={() => {
                    if (!dragRef.current.wasDragged) {
                      onSelectCourse(displayCourse.id);
                    }
                  }}
                />
              )}

              <span className="hidden md:inline text-xs text-slate-300">
                by {displayCourse.instructor} · Tanvir&apos;s Science Square
              </span>
            </div>
          </div>

          {/* Modern Bottom Pagination Indicators */}
          {slides.length > 1 && (
            <div
              className="flex items-center gap-1.5 pb-1 shrink-0"
              role="tablist"
              aria-label="Slide pagination"
            >
              {slides.map((slide, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`Slide ${idx + 1}: ${slide.title}`}
                    onClick={() => goToSlide(idx)}
                    className="py-1.5 px-0.5 focus-visible:outline-none"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-200 ${
                        isCurrent
                          ? 'w-6 bg-emerald-400'
                          : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
