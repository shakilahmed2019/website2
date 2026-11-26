import { Course, Enrollment, Lesson } from '../types/lms';

export function getAllLessons(course: Course): Lesson[] {
  return course.modules.flatMap((mod) => mod.lessons);
}

export function getTotalLessonCount(course: Course): number {
  return getAllLessons(course).length;
}

export function getCourseProgress(course: Course, enrollment?: Enrollment): {
  completedCount: number;
  totalCount: number;
  percent: number;
  nextLesson: Lesson | undefined;
  isCompleted: boolean;
} {
  const lessons = getAllLessons(course);
  const totalCount = lessons.length;
  if (!enrollment || totalCount === 0) {
    return {
      completedCount: 0,
      totalCount,
      percent: 0,
      nextLesson: lessons[0],
      isCompleted: false,
    };
  }

  const completedSet = new Set(enrollment.completedLessonIds);
  const completedCount = lessons.filter((l) => completedSet.has(l.id)).length;
  const percent = Math.round((completedCount / totalCount) * 100);
  const nextLesson =
    lessons.find((l) => !completedSet.has(l.id)) ??
    lessons.find((l) => l.id === enrollment.lastLessonId) ??
    lessons[0];

  return {
    completedCount,
    totalCount,
    percent,
    nextLesson,
    isCompleted: completedCount > 0 && completedCount === totalCount,
  };
}

export function formatDurationHours(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}m`;
}

export function formatPriceBdt(priceBdt: number): string {
  if (!priceBdt || priceBdt <= 0) return 'Free';
  return `৳${priceBdt.toLocaleString('en-US')}`;
}

