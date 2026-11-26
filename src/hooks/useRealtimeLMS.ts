import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { INITIAL_COURSES, INITIAL_NOTICES } from '../data/lmsData';
import { MCQ_BANK } from '../data/mcqBank';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  seedInitialCatalogIfEmpty,
  syncUserProfile,
} from '../services/lmsFirestore';
import {
  BrandConfig,
  Course,
  Enrollment,
  McqQuestion,
  NoticeItem,
  PaymentSubmission,
  UserProfile,
} from '../types/lms';

const BOOTSTRAP_ADMIN_EMAIL = 'tamprorigmail@gmail.com';

export interface RealtimeLMSState {
  authReady: boolean;
  currentUser: UserProfile | null;
  unverifiedEmail: string | null;
  courses: Course[];
  catalogSeeded: boolean;
  enrollments: Enrollment[];
  payments: PaymentSubmission[];
  notices: NoticeItem[];
  mcqs: McqQuestion[];
  brandConfig: BrandConfig;
  syncingData: {
    courses: boolean;
    notices: boolean;
    exams: boolean;
  };
  listenerError: Error | null;
  retrySync: () => void;
  clearListenerError: () => void;
  refreshAuthUser: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export function useRealtimeLMS(): RealtimeLMSState {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [catalogSeeded, setCatalogSeeded] = useState(false);
  const [enrollmentDocs, setEnrollmentDocs] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const [mcqs, setMcqs] = useState<McqQuestion[]>(MCQ_BANK);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>({ logoUrl: '' });
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [listenerError, setListenerError] = useState<Error | null>(null);
  const [syncNonce, setSyncNonce] = useState(0);

  const captureError = useCallback(
    (err: unknown, op: OperationType, path: string) => {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message) as {
            operationType?: string;
            path?: string;
          };
          if (parsed && parsed.operationType) {
            setListenerError(err);
            return;
          }
        } catch {
          // Not already JSON-formatted by handleFirestoreError
        }
      }
      try {
        handleFirestoreError(err, op, path);
      } catch (wrapped) {
        setListenerError(
          wrapped instanceof Error ? wrapped : new Error(String(wrapped))
        );
      }
    },
    []
  );

  const retrySync = useCallback(() => {
    setListenerError(null);
    setSyncNonce((n) => n + 1);
  }, []);

  const clearListenerError = useCallback(() => {
    setListenerError(null);
  }, []);

  // 1. Firebase Authentication state listener + User Profile & Admin sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setListenerError(null);
      if (!fbUser) {
        setCurrentUser(null);
        setUnverifiedEmail(null);
        setCourses(INITIAL_COURSES);
        setCatalogSeeded(false);
        setNotices(INITIAL_NOTICES);
        setMcqs(MCQ_BANK);
        setBrandConfig({ logoUrl: '' });
        setEnrollmentDocs([]);
        setPayments([]);
        setAuthReady(true);
        return;
      }

      if (!fbUser.emailVerified) {
        setCurrentUser(null);
        setUnverifiedEmail(fbUser.email || 'your email');
        setEnrollmentDocs([]);
        setPayments([]);
        setAuthReady(true);
        return;
      }

      setUnverifiedEmail(null);
      try {
        const profile = await syncUserProfile(fbUser);
        setCurrentUser(profile);
        if (profile.role === 'admin') {
          await seedInitialCatalogIfEmpty();
        }
      } catch (err) {
        captureError(err, OperationType.WRITE, `users/${fbUser.uid}`);
        const email = (fbUser.email || '').trim();
        const isBootstrap = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
        const name = (fbUser.displayName || email.split('@')[0] || 'Student').trim();
        const parts = name.split(/\s+/).filter(Boolean);
        const initials =
          parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : (name.slice(0, 2) || 'ST').toUpperCase();
        setCurrentUser({
          id: fbUser.uid,
          name,
          email,
          role: isBootstrap ? 'admin' : 'student',
          title: isBootstrap
            ? "Lead Science Instructor · Tanvir's Science Square"
            : 'HSC Science Candidate',
          initials,
          enrolledCourses: [],
        });
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, [captureError, syncNonce]);

  const refreshAuthUser = useCallback(async (): Promise<boolean> => {
    const fbUser = auth.currentUser;
    if (!fbUser) return false;
    await fbUser.reload();
    await fbUser.getIdToken(true);
    if (!fbUser.emailVerified) {
      setUnverifiedEmail(fbUser.email || 'your email');
      return false;
    }
    setUnverifiedEmail(null);
    const profile = await syncUserProfile(fbUser);
    setCurrentUser(profile);
    if (profile.role === 'admin') {
      await seedInitialCatalogIfEmpty();
    }
    return true;
  }, []);

  // 2. Real-time listener on signed-in user profile (keeps role & enrolledCourses synced live)
  useEffect(() => {
    if (!authReady || !currentUser?.id) return;
    const userPath = `users/${currentUser.id}`;
    const unsub = onSnapshot(
      doc(db, 'users', currentUser.id),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Partial<UserProfile>;
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                name: data.name ?? prev.name,
                role: data.role ?? prev.role,
                title: data.title ?? prev.title,
                initials: data.initials ?? prev.initials,
                enrolledCourses: Array.isArray(data.enrolledCourses)
                  ? data.enrolledCourses
                  : prev.enrolledCourses ?? [],
              }
            : prev
        );
      },
      (err) => captureError(err, OperationType.GET, userPath)
    );
    return () => unsub();
  }, [authReady, currentUser?.id, captureError, syncNonce]);

  const userId = currentUser?.id ?? null;

  const isBootstrapAdmin =
    currentUser?.role === 'admin' &&
    currentUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;

  // 3. Real-time Courses listener (authenticated users only; guests use local catalog seed)
  useEffect(() => {
    if (!authReady || !userId) {
      setLoadingCourses(false);
      return;
    }
    setLoadingCourses(true);
    const coursesQuery = isBootstrapAdmin
      ? collection(db, 'courses')
      : query(collection(db, 'courses'), where('published', '==', true));

    const unsub = onSnapshot(
      coursesQuery,
      (snapshot) => {
        setLoadingCourses(false);
        if (snapshot.empty) {
          setCatalogSeeded(false);
          setCourses(INITIAL_COURSES);
          return;
        }
        setCatalogSeeded(true);
        const list = snapshot.docs.map((d) => {
          const data = d.data() as Course;
          return { ...data, id: d.id };
        });
        list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        setCourses(list);
      },
      (err) => {
        setLoadingCourses(false);
        captureError(err, OperationType.LIST, 'courses');
      }
    );

    return () => unsub();
  }, [authReady, userId, isBootstrapAdmin, captureError, syncNonce]);

  // 4. Real-time Notices listener (AdminNoticesTab -> NoticeBoard instantly)
  useEffect(() => {
    if (!authReady || !userId) {
      setLoadingNotices(false);
      return;
    }
    setLoadingNotices(true);
    const noticesQuery = isBootstrapAdmin
      ? collection(db, 'notices')
      : query(collection(db, 'notices'), where('active', '==', true));

    const unsub = onSnapshot(
      noticesQuery,
      (snapshot) => {
        setLoadingNotices(false);
        if (snapshot.empty && !catalogSeeded) {
          setNotices(INITIAL_NOTICES);
          return;
        }
        const list = snapshot.docs.map((d) => {
          const data = d.data() as NoticeItem;
          return { ...data, id: d.id };
        });
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setNotices(list);
      },
      (err) => {
        setLoadingNotices(false);
        captureError(err, OperationType.LIST, 'notices');
      }
    );

    return () => unsub();
  }, [authReady, userId, isBootstrapAdmin, catalogSeeded, captureError, syncNonce]);

  // 5. Real-time MCQ Exams listener (`exams` collection)
  useEffect(() => {
    if (!authReady || !userId) {
      setLoadingExams(false);
      return;
    }
    setLoadingExams(true);
    const unsub = onSnapshot(
      collection(db, 'exams'),
      (snapshot) => {
        setLoadingExams(false);
        if (snapshot.empty) {
          setMcqs(MCQ_BANK);
          return;
        }
        const list = snapshot.docs.map((d) => {
          const data = d.data() as McqQuestion;
          return { ...data, id: d.id };
        });
        setMcqs(list);
      },
      (err) => {
        setLoadingExams(false);
        captureError(err, OperationType.LIST, 'exams');
      }
    );
    return () => unsub();
  }, [authReady, userId, captureError, syncNonce]);

  // 6. Real-time Brand Logo listener
  useEffect(() => {
    if (!authReady || !userId) return;
    const unsub = onSnapshot(
      doc(db, 'settings', 'brand'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<BrandConfig>;
          setBrandConfig({ logoUrl: data.logoUrl || '' });
        }
      },
      (err) => captureError(err, OperationType.GET, 'settings/brand')
    );
    return () => unsub();
  }, [authReady, userId, captureError, syncNonce]);

  // 7. Real-time Enrollments listener (unlocks instantly when Admin approves payment)
  useEffect(() => {
    if (!authReady || !currentUser) {
      setEnrollmentDocs([]);
      return;
    }
    const enrollmentsQuery = isBootstrapAdmin
      ? collection(db, 'enrollments')
      : query(
          collection(db, 'enrollments'),
          where('userId', '==', currentUser.id)
        );

    const unsub = onSnapshot(
      enrollmentsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Enrollment);
        setEnrollmentDocs(list);
      },
      (err) => captureError(err, OperationType.LIST, 'enrollments')
    );
    return () => unsub();
  }, [authReady, currentUser?.id, isBootstrapAdmin, captureError, syncNonce]);

  // 8. Real-time Payments listener (Admin sees all; students see their own TrxID status)
  useEffect(() => {
    if (!authReady || !currentUser) {
      setPayments([]);
      return;
    }
    const paymentsQuery = isBootstrapAdmin
      ? collection(db, 'payments')
      : query(
          collection(db, 'payments'),
          where('userId', '==', currentUser.id)
        );

    const unsub = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data() as PaymentSubmission;
          return { ...data, id: d.id };
        });
        list.sort((a, b) =>
          (b.submittedAt || '').localeCompare(a.submittedAt || '')
        );
        setPayments(list);
      },
      (err) => captureError(err, OperationType.LIST, 'payments')
    );
    return () => unsub();
  }, [authReady, currentUser?.id, isBootstrapAdmin, captureError, syncNonce]);

  // Merge user profile `enrolledCourses` IDs with `enrollments` docs so UI reflects both sources seamlessly
  const enrollments = useMemo(() => {
    if (!currentUser) return [];
    const byCourse = new Map<string, Enrollment>();
    for (const e of enrollmentDocs) {
      if (!e.userId || e.userId === currentUser.id) {
        byCourse.set(e.courseId, e);
      }
    }
    for (const cId of currentUser.enrolledCourses ?? []) {
      if (!byCourse.has(cId)) {
        byCourse.set(cId, {
          userId: currentUser.id,
          courseId: cId,
          completedLessonIds: [],
          enrolledAt: new Date().toISOString().slice(0, 10),
        });
      }
    }
    return Array.from(byCourse.values());
  }, [currentUser, enrollmentDocs]);

  const logout = async () => {
    await signOut(auth);
  };

  const syncingData = useMemo(
    () => ({
      courses: loadingCourses,
      notices: loadingNotices,
      exams: loadingExams,
    }),
    [loadingCourses, loadingNotices, loadingExams]
  );

  return {
    authReady,
    currentUser,
    unverifiedEmail,
    courses,
    catalogSeeded,
    enrollments,
    payments,
    notices,
    mcqs,
    brandConfig,
    syncingData,
    listenerError,
    retrySync,
    clearListenerError,
    refreshAuthUser,
    logout,
  };
}
