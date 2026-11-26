import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { INITIAL_COURSES, INITIAL_NOTICES } from '../data/lmsData';
import { MCQ_BANK } from '../data/mcqBank';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Course,
  Enrollment,
  ExamResult,
  NoticeItem,
  PaymentStatus,
  PaymentSubmission,
  UserProfile,
  UserRole,
} from '../types/lms';

const BOOTSTRAP_ADMIN_EMAIL = 'tamprorigmail@gmail.com';

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase().slice(0, 6);
  }
  return (name.trim().slice(0, 2) || 'ST').toUpperCase();
}

function sanitizeCoursePayload(course: Course): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: course.id.slice(0, 128),
    title: course.title.trim().slice(0, 200),
    subtitle: course.subtitle.trim().slice(0, 600),
    category: course.category.trim().slice(0, 60),
    level: course.level,
    instructor: course.instructor.trim().slice(0, 100),
    instructorRole: course.instructorRole.trim().slice(0, 160),
    priceBdt: Math.max(0, Math.min(500000, Number(course.priceBdt) || 0)),
    durationHours: Math.max(0.1, Math.min(500, Number(course.durationHours) || 1)),
    rating: Math.max(0, Math.min(5, Number(course.rating) || 5)),
    enrolledCount: Math.max(0, Number(course.enrolledCount) || 0),
    thumbnail: course.thumbnail.trim().slice(0, 1000),
    featured: Boolean(course.featured),
    published: Boolean(course.published),
    updatedAt: (course.updatedAt || new Date().toISOString().slice(0, 10)).slice(0, 40),
    modules: course.modules.slice(0, 40).map((mod) => ({
      id: mod.id,
      title: mod.title,
      lessons: mod.lessons.map((les) => {
        const cleanLesson: Record<string, unknown> = {
          id: les.id,
          title: les.title,
          durationMinutes: Number(les.durationMinutes) || 10,
          summary: les.summary,
          keyTakeaways: Array.isArray(les.keyTakeaways) ? les.keyTakeaways : [],
        };
        if (les.videoUrl) cleanLesson.videoUrl = les.videoUrl;
        if (les.resources && les.resources.length > 0) {
          cleanLesson.resources = les.resources;
        }
        return cleanLesson;
      }),
    })),
  };

  if (
    typeof course.originalPriceBdt === 'number' &&
    course.originalPriceBdt > 0
  ) {
    payload.originalPriceBdt = Math.min(500000, course.originalPriceBdt);
  }

  return payload;
}

export async function syncUserProfile(
  fbUser: FirebaseUser
): Promise<UserProfile> {
  const userPath = `users/${fbUser.uid}`;
  let currentPath = userPath;
  let currentOp = OperationType.WRITE;

  try {
    const email = (fbUser.email || '').trim().slice(0, 160);
    const isBootstrapAdmin =
      email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL && fbUser.emailVerified;

    let isAdminDoc = false;
    try {
      const adminSnap = await getDoc(doc(db, 'admins', fbUser.uid));
      isAdminDoc = adminSnap.exists();
    } catch {
      isAdminDoc = false;
    }

    const resolvedRole: UserRole =
      isBootstrapAdmin || isAdminDoc ? 'admin' : 'student';

    if (isBootstrapAdmin && !isAdminDoc) {
      try {
        await setDoc(doc(db, 'admins', fbUser.uid), {
          email,
          createdAt: serverTimestamp(),
        });
      } catch {
        // Bootstrap admin email is still honored via token email check; user write below surfaces any rule block
      }
    }

    const userRef = doc(db, 'users', fbUser.uid);
    currentOp = OperationType.GET;
    currentPath = userPath;
    const existingSnap = await getDoc(userRef);

    const displayName = (
      fbUser.displayName ||
      email.split('@')[0] ||
      'Science Student'
    )
      .trim()
      .slice(0, 100);
    const initials = deriveInitials(displayName);
    const defaultTitle =
      resolvedRole === 'admin'
        ? "Lead Science Instructor · Tanvir's Science Square"
        : 'HSC Science Candidate';

    if (!existingSnap.exists()) {
      const profile: UserProfile = {
        id: fbUser.uid,
        name: displayName,
        email,
        role: resolvedRole,
        title: defaultTitle,
        initials,
        enrolledCourses: [],
      };
      currentOp = OperationType.CREATE;
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return profile;
    }

    const rawData = existingSnap.data() as Record<string, unknown>;
    const data = rawData as Partial<UserProfile>;
    const finalRole: UserRole =
      isBootstrapAdmin || isAdminDoc || data.role === 'admin'
        ? 'admin'
        : 'student';
    const enrolledCourses = Array.isArray(data.enrolledCourses)
      ? data.enrolledCourses.filter((c): c is string => typeof c === 'string')
      : [];

    const updatePayload: Record<string, unknown> = {
      name: (data.name || displayName).slice(0, 100),
      title: (data.title || defaultTitle).slice(0, 120),
      initials: (data.initials || initials).slice(0, 6),
      updatedAt: serverTimestamp(),
    };
    if (!data.id) updatePayload.id = fbUser.uid;
    if (!data.email) updatePayload.email = email;
    if (!data.role || (finalRole !== data.role && resolvedRole === 'admin')) {
      updatePayload.role = finalRole;
    }
    if (!Array.isArray(data.enrolledCourses)) {
      updatePayload.enrolledCourses = [];
    }
    if (!rawData.createdAt) {
      updatePayload.createdAt = serverTimestamp();
    }

    currentOp = OperationType.UPDATE;
    await updateDoc(userRef, updatePayload);

    return {
      id: fbUser.uid,
      name: (data.name || displayName).slice(0, 100),
      email: (data.email || email).slice(0, 160),
      role: finalRole,
      title: (data.title || defaultTitle).slice(0, 120),
      initials: (data.initials || initials).slice(0, 6),
      enrolledCourses,
    };
  } catch (error) {
    handleFirestoreError(error, currentOp, currentPath);
  }
}

export async function importDemoDataToFirestore(): Promise<{
  coursesAdded: number;
  noticesAdded: number;
  examsAdded: number;
}> {
  try {
    const [coursesSnap, noticesSnap, examsSnap, brandSnap] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'notices')),
      getDocs(collection(db, 'exams')),
      getDoc(doc(db, 'settings', 'brand')),
    ]);

    const existingCourseIds = new Set(coursesSnap.docs.map((d) => d.id));
    const existingNoticeIds = new Set(noticesSnap.docs.map((d) => d.id));
    const existingExamIds = new Set(examsSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    let coursesAdded = 0;
    let noticesAdded = 0;
    let examsAdded = 0;

    for (const course of INITIAL_COURSES) {
      if (existingCourseIds.has(course.id)) continue;
      coursesAdded += 1;
      batch.set(doc(db, 'courses', course.id), {
        ...sanitizeCoursePayload(course),
        createdAt: serverTimestamp(),
      });
    }

    for (const notice of INITIAL_NOTICES) {
      if (existingNoticeIds.has(notice.id)) continue;
      noticesAdded += 1;
      const noticePayload: Record<string, unknown> = {
        id: notice.id,
        title: notice.title.slice(0, 140),
        message: notice.message.slice(0, 500),
        priority: notice.priority,
        active: notice.active,
        createdAt: notice.createdAt.slice(0, 40),
        updatedAt: serverTimestamp(),
      };
      if (notice.linkLabel) noticePayload.linkLabel = notice.linkLabel.slice(0, 60);
      if (notice.targetCourseId) {
        noticePayload.targetCourseId = notice.targetCourseId.slice(0, 128);
      }
      batch.set(doc(db, 'notices', notice.id), noticePayload);
    }

    for (const exam of MCQ_BANK) {
      if (existingExamIds.has(exam.id)) continue;
      examsAdded += 1;
      batch.set(doc(db, 'exams', exam.id), {
        id: exam.id,
        subject: exam.subject.slice(0, 60),
        chapter: exam.chapter.slice(0, 140),
        question: exam.question.slice(0, 500),
        options: exam.options,
        correctIndex: exam.correctIndex,
        explanation: exam.explanation.slice(0, 600),
        createdAt: serverTimestamp(),
      });
    }

    if (!brandSnap.exists()) {
      batch.set(doc(db, 'settings', 'brand'), {
        logoUrl: '',
        updatedAt: serverTimestamp(),
      });
    }

    if (coursesAdded > 0 || noticesAdded > 0 || examsAdded > 0 || !brandSnap.exists()) {
      await batch.commit();
    }

    return { coursesAdded, noticesAdded, examsAdded };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'courses');
  }
}

export async function seedInitialCatalogIfEmpty(): Promise<boolean> {
  try {
    const existingCourses = await getDocs(query(collection(db, 'courses'), limit(1)));
    if (!existingCourses.empty) return false;
    const summary = await importDemoDataToFirestore();
    return summary.coursesAdded > 0 || summary.examsAdded > 0 || summary.noticesAdded > 0;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'courses');
  }
}

// --- Courses ---
export async function createCourseDoc(course: Course): Promise<void> {
  const path = `courses/${course.id}`;
  try {
    await setDoc(doc(db, 'courses', course.id), {
      ...sanitizeCoursePayload(course),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCourseDoc(course: Course): Promise<void> {
  const path = `courses/${course.id}`;
  try {
    await updateDoc(doc(db, 'courses', course.id), sanitizeCoursePayload(course));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCourseDoc(courseId: string): Promise<void> {
  const path = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Enrollments ---
export async function enrollFreeCourseDoc(
  userId: string,
  courseId: string
): Promise<void> {
  const docId = `${userId}_${courseId}`;
  const path = `enrollments/${docId}`;
  try {
    const enrollRef = doc(db, 'enrollments', docId);
    const snap = await getDoc(enrollRef);
    if (snap.exists()) return;

    const batch = writeBatch(db);
    batch.set(enrollRef, {
      userId,
      courseId,
      completedLessonIds: [],
      enrolledAt: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'courses', courseId), {
      enrolledCount: increment(1),
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEnrollmentProgressDoc(
  userId: string,
  enrollment: Enrollment
): Promise<void> {
  const docId = `${userId}_${enrollment.courseId}`;
  const path = `enrollments/${docId}`;
  try {
    const enrollRef = doc(db, 'enrollments', docId);
    const snap = await getDoc(enrollRef);

    if (!snap.exists()) {
      // Admin-approved via users.enrolledCourses directly: create progress doc if free or admin
      await setDoc(enrollRef, {
        userId,
        courseId: enrollment.courseId,
        completedLessonIds: enrollment.completedLessonIds.slice(0, 300),
        ...(enrollment.lastLessonId
          ? { lastLessonId: enrollment.lastLessonId.slice(0, 128) }
          : {}),
        ...(enrollment.completedAt
          ? { completedAt: enrollment.completedAt.slice(0, 40) }
          : {}),
        ...(enrollment.certificateId
          ? { certificateId: enrollment.certificateId.slice(0, 80) }
          : {}),
        enrolledAt: enrollment.enrolledAt || new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const patch: Record<string, unknown> = {
      completedLessonIds: enrollment.completedLessonIds.slice(0, 300),
      updatedAt: serverTimestamp(),
    };
    if (enrollment.lastLessonId) {
      patch.lastLessonId = enrollment.lastLessonId.slice(0, 128);
    }
    if (enrollment.completedAt) {
      patch.completedAt = enrollment.completedAt.slice(0, 40);
    }
    if (enrollment.certificateId) {
      patch.certificateId = enrollment.certificateId.slice(0, 80);
    }
    await updateDoc(enrollRef, patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Payments ---
export async function submitPaymentDoc(
  submission: PaymentSubmission
): Promise<void> {
  const path = `payments/${submission.id}`;
  try {
    const payload: Record<string, unknown> = {
      id: submission.id,
      userId: submission.userId || '',
      courseId: submission.courseId,
      courseTitle: submission.courseTitle.trim().slice(0, 200),
      studentName: submission.studentName.trim().slice(0, 100),
      studentPhone: submission.studentPhone.trim().slice(0, 15),
      method: submission.method,
      transactionId: submission.transactionId.trim().toUpperCase().slice(0, 18),
      discountBdt: Math.max(0, Number(submission.discountBdt) || 0),
      amountPaidBdt: Math.max(0, Number(submission.amountPaidBdt) || 0),
      status: 'pending',
      submittedAt: submission.submittedAt.slice(0, 40),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (submission.promoCode) {
      payload.promoCode = submission.promoCode.trim().slice(0, 24);
    }
    await setDoc(doc(db, 'payments', submission.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePaymentStatusBatch(
  payment: PaymentSubmission,
  nextStatus: PaymentStatus
): Promise<void> {
  const path = `payments/${payment.id}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'payments', payment.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    const targetUserId = payment.userId;
    if (targetUserId) {
      const userRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userRef);
      const enrollId = `${targetUserId}_${payment.courseId}`;
      const enrollRef = doc(db, 'enrollments', enrollId);
      const existingEnroll = await getDoc(enrollRef);

      if (nextStatus === 'approved') {
        if (userSnap.exists()) {
          const existingList = Array.isArray(userSnap.data()?.enrolledCourses)
            ? (userSnap.data()?.enrolledCourses as string[]).filter(
                (c): c is string => typeof c === 'string'
              )
            : [];
          const nextEnrolled = existingList.includes(payment.courseId)
            ? existingList
            : [...existingList, payment.courseId].slice(0, 100);
          batch.update(userRef, {
            enrolledCourses: nextEnrolled,
            updatedAt: serverTimestamp(),
          });
        }

        if (!existingEnroll.exists()) {
          batch.set(enrollRef, {
            userId: targetUserId,
            courseId: payment.courseId,
            completedLessonIds: [],
            enrolledAt: new Date().toISOString().slice(0, 10),
            paymentId: payment.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(db, 'courses', payment.courseId), {
            enrolledCount: increment(1),
            updatedAt: new Date().toISOString().slice(0, 10),
          });
        }
      } else if (nextStatus === 'rejected') {
        if (userSnap.exists()) {
          const existingList = Array.isArray(userSnap.data()?.enrolledCourses)
            ? (userSnap.data()?.enrolledCourses as string[]).filter(
                (c): c is string => typeof c === 'string'
              )
            : [];
          batch.update(userRef, {
            enrolledCourses: existingList.filter((id) => id !== payment.courseId),
            updatedAt: serverTimestamp(),
          });
        }

        if (existingEnroll.exists()) {
          batch.delete(enrollRef);
        }
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Notices ---
export async function createNoticeDoc(notice: NoticeItem): Promise<void> {
  const path = `notices/${notice.id}`;
  try {
    const payload: Record<string, unknown> = {
      id: notice.id,
      title: notice.title.trim().slice(0, 140),
      message: notice.message.trim().slice(0, 500),
      priority: notice.priority,
      active: notice.active,
      createdAt: notice.createdAt.slice(0, 40),
      updatedAt: serverTimestamp(),
    };
    if (notice.linkLabel) payload.linkLabel = notice.linkLabel.trim().slice(0, 60);
    if (notice.targetCourseId) {
      payload.targetCourseId = notice.targetCourseId.trim().slice(0, 128);
    }
    await setDoc(doc(db, 'notices', notice.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleNoticeDoc(
  noticeId: string,
  nextActive: boolean
): Promise<void> {
  const path = `notices/${noticeId}`;
  try {
    await updateDoc(doc(db, 'notices', noticeId), {
      active: nextActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteNoticeDoc(noticeId: string): Promise<void> {
  const path = `notices/${noticeId}`;
  try {
    await deleteDoc(doc(db, 'notices', noticeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Exam Results ---
export async function submitExamResultDoc(result: ExamResult): Promise<void> {
  const path = `examResults/${result.id}`;
  try {
    await setDoc(doc(db, 'examResults', result.id), {
      id: result.id,
      userId: result.userId,
      studentName: result.studentName.trim().slice(0, 100),
      studentInitials: result.studentInitials.trim().slice(0, 6),
      courseId: result.courseId,
      courseTitle: result.courseTitle.trim().slice(0, 200),
      subject: result.subject.trim().slice(0, 60),
      score: Math.max(0, Math.min(500, Number(result.score) || 0)),
      totalQuestions: Math.max(1, Number(result.totalQuestions) || 1),
      correctCount: Math.max(0, Number(result.correctCount) || 0),
      wrongCount: Math.max(0, Number(result.wrongCount) || 0),
      skippedCount: Math.max(0, Number(result.skippedCount) || 0),
      accuracy: Math.max(0, Math.min(100, Number(result.accuracy) || 0)),
      negativeMarking: Boolean(result.negativeMarking),
      submittedAt: result.submittedAt.slice(0, 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// --- Brand Settings ---
export async function updateBrandConfigDoc(logoUrl: string): Promise<void> {
  const path = 'settings/brand';
  try {
    await setDoc(doc(db, 'settings', 'brand'), {
      logoUrl: logoUrl.trim().slice(0, 500000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
