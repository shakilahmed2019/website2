export type UserRole = 'student' | 'admin';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type ViewRoute = 'catalog' | 'student' | 'admin' | 'classroom';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  initials: string;
  enrolledCourses?: string[];
}

export interface LessonResource {
  label: string;
  type: 'pdf' | 'repo' | 'slides';
  sizeOrHint: string;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  summary: string;
  keyTakeaways: string[];
  videoUrl?: string;
  resources?: LessonResource[];
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: CourseLevel;
  instructor: string;
  instructorRole: string;
  priceBdt: number;
  originalPriceBdt?: number;
  durationHours: number;
  rating: number;
  enrolledCount: number;
  thumbnail: string;
  featured: boolean;
  published: boolean;
  updatedAt: string;
  modules: CourseModule[];
}

export interface Enrollment {
  userId?: string;
  courseId: string;
  completedLessonIds: string[];
  lastLessonId?: string;
  enrolledAt: string;
  completedAt?: string;
  certificateId?: string;
  paymentId?: string;
}

export interface CategoryItem {
  id: string;
  label: string;
  shortLabel: string;
  bengaliHint?: string;
  courseCountHint?: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  watchUrl: string;
  embedUrl: string;
  description?: string;
}

export interface BrandConfig {
  logoUrl: string;
}

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentSubmission {
  id: string;
  userId?: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentPhone: string;
  method: PaymentMethod;
  transactionId: string;
  promoCode?: string;
  discountBdt: number;
  amountPaidBdt: number;
  status: PaymentStatus;
  submittedAt: string;
}

export type NoticePriority = 'info' | 'live' | 'urgent';

export interface NoticeItem {
  id: string;
  title: string;
  message: string;
  priority: NoticePriority;
  active: boolean;
  linkLabel?: string;
  targetCourseId?: string;
  createdAt: string;
}

export interface McqQuestion {
  id: string;
  subject: string;
  chapter: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  studentName: string;
  studentInitials: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  negativeMarking: boolean;
  submittedAt: string;
}
