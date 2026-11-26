import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Medal,
  Play,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { getQuestionsForCourse } from '../data/mcqBank';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { submitExamResultDoc } from '../services/lmsFirestore';
import { ExamResult, McqQuestion, UserProfile } from '../types/lms';

interface ExamHallProps {
  courseId: string;
  courseCategory: string;
  courseTitle: string;
  mcqs?: McqQuestion[];
  loading?: boolean;
  currentUser?: UserProfile | null;
  catalogSeeded?: boolean;
  onRequireAuth?: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ExamHall: React.FC<ExamHallProps> = ({
  courseId,
  courseCategory,
  courseTitle,
  mcqs,
  loading = false,
  currentUser = null,
  catalogSeeded = false,
  onRequireAuth,
}) => {
  const questions = useMemo(() => {
    if (mcqs && mcqs.length > 0) {
      const normalized = courseCategory.trim().toLowerCase();
      const matched = mcqs.filter(
        (q) => q.subject.trim().toLowerCase() === normalized
      );
      if (matched.length > 0) return matched;
      return mcqs.slice(0, 6);
    }
    return getQuestionsForCourse(courseCategory);
  }, [mcqs, courseCategory]);

  const totalAllowedSec = questions.length * 60;
  const [phase, setPhase] = useState<'ready' | 'running' | 'submitted'>('ready');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(totalAllowedSec);

  const [leaderboard, setLeaderboard] = useState<ExamResult[]>([]);
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const hasSavedRef = useRef(false);

  useEffect(() => {
    setPhase('ready');
    setAnswers({});
    setSecondsLeft(questions.length * 60);
    setScoreSaved(false);
    setSaveError('');
    hasSavedRef.current = false;
  }, [courseId, questions.length]);

  // Real-time subject leaderboard listener (authenticated users only)
  useEffect(() => {
    if (!currentUser) {
      setLeaderboard([]);
      return;
    }
    const q = query(
      collection(db, 'examResults'),
      where('subject', '==', courseCategory)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as ExamResult);
        list.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          return (b.submittedAt || '').localeCompare(a.submittedAt || '');
        });
        setLeaderboard(list.slice(0, 15));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'examResults');
        } catch {
          // Listener permissions fail-safe handled silently inside ExamHall
        }
      }
    );
    return () => unsub();
  }, [courseCategory, currentUser]);

  const computeResult = useCallback(
    (answerMap: Record<string, number>) => {
      let correct = 0;
      let wrong = 0;
      let skipped = 0;

      for (const q of questions) {
        const picked = answerMap[q.id];
        if (picked === undefined) {
          skipped += 1;
        } else if (picked === q.correctIndex) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }

      const penalty = negativeMarking ? wrong * 0.25 : 0;
      const rawScore = Math.max(0, Number((correct - penalty).toFixed(2)));
      const accuracy =
        questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

      return { correct, wrong, skipped, rawScore, accuracy };
    },
    [negativeMarking, questions]
  );

  const result = useMemo(
    () => computeResult(answers),
    [answers, computeResult]
  );

  const persistExamScore = useCallback(
    async (finalSnapshot: {
      correct: number;
      wrong: number;
      skipped: number;
      rawScore: number;
      accuracy: number;
    }) => {
      if (hasSavedRef.current || !currentUser || !catalogSeeded) return;
      hasSavedRef.current = true;
      setSavingScore(true);
      setSaveError('');

      const payload: ExamResult = {
        id: `res_${currentUser.id.slice(0, 8)}_${Date.now().toString(36)}`,
        userId: currentUser.id,
        studentName: currentUser.name,
        studentInitials: currentUser.initials,
        courseId,
        courseTitle,
        subject: courseCategory,
        score: finalSnapshot.rawScore,
        totalQuestions: questions.length,
        correctCount: finalSnapshot.correct,
        wrongCount: finalSnapshot.wrong,
        skippedCount: finalSnapshot.skipped,
        accuracy: finalSnapshot.accuracy,
        negativeMarking,
        submittedAt: new Date().toISOString().slice(0, 10),
      };

      try {
        await submitExamResultDoc(payload);
        setScoreSaved(true);
      } catch (err) {
        hasSavedRef.current = false;
        setSaveError(
          err instanceof Error
            ? err.message
            : 'Unable to publish score to leaderboard.'
        );
      } finally {
        setSavingScore(false);
      }
    },
    [
      catalogSeeded,
      courseCategory,
      courseId,
      courseTitle,
      currentUser,
      negativeMarking,
      questions.length,
    ]
  );

  const handleSubmitExam = useCallback(() => {
    setPhase('submitted');
    const finalSnapshot = computeResult(answers);
    void persistExamScore(finalSnapshot);
  }, [answers, computeResult, persistExamScore]);

  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, handleSubmitExam]);

  const startExam = () => {
    setAnswers({});
    setSecondsLeft(totalAllowedSec);
    setScoreSaved(false);
    setSaveError('');
    hasSavedRef.current = false;
    setPhase('running');
  };

  const renderLeaderboard = () => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 dark:border-emerald-900/70 dark:bg-[#031109] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Medal className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          <h4 className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
            Live {courseCategory} Leaderboard
          </h4>
        </div>
        <span className="font-mono text-[11px] text-teal-700 dark:text-teal-300">
          Real-Time · Top {Math.max(1, leaderboard.length)}
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
          {currentUser
            ? `No recorded attempts for ${courseCategory} yet. Complete this MCQ test to claim #1 on the live leaderboard!`
            : `Sign in to load and compete on the live ${courseCategory} leaderboard.`}
        </p>
      ) : (
        <div className="divide-y divide-slate-200/70 dark:divide-emerald-900/50">
          {leaderboard.map((entry, index) => {
            const isSelf = currentUser && entry.userId === currentUser.id;
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between gap-3 py-2 text-xs ${
                  isSelf
                    ? 'font-semibold text-emerald-800 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] font-bold ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        : index === 2
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-[#04140a] dark:text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-600/10 dark:bg-emerald-500/15 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {entry.studentInitials}
                  </span>
                  <span className="truncate">
                    {entry.studentName}
                    {isSelf ? ' (You)' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {entry.accuracy}%
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {entry.score}/{entry.totalQuestions}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div role="status" aria-label="Loading MCQ Exam Hall" className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Syncing {courseCategory} MCQ exam bank from Firestore...</span>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-20 rounded-xl bg-slate-100 dark:bg-[#031109]" />
          <div className="h-11 w-48 rounded-lg bg-emerald-500/20" />
          <div className="h-32 rounded-xl bg-slate-100 dark:bg-[#031109]" />
        </div>
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="space-y-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {courseCategory} MCQ Exam Hall
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Chapter-wise HSC &amp; Admission practice test for {courseTitle}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300 tabular-nums">
              {questions.length} MCQs · {questions.length} min
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] p-3.5 text-xs">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Scoring Mode
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                {negativeMarking
                  ? 'Admission Mode (-0.25 per wrong answer)'
                  : 'HSC Board Mode (No negative marking)'}
              </p>
            </div>
            <div className="flex items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setNegativeMarking(false)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  !negativeMarking
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                    : 'border border-slate-200 bg-white text-slate-600 dark:border-emerald-900/80 dark:bg-[#04140a] dark:text-slate-300'
                }`}
              >
                Board (0)
              </button>
              <button
                type="button"
                onClick={() => setNegativeMarking(true)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  negativeMarking
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                    : 'border border-slate-200 bg-white text-slate-600 dark:border-emerald-900/80 dark:bg-[#04140a] dark:text-slate-300'
                }`}
              >
                Admission (-0.25)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={startExam}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Start MCQ Practice Test</span>
          </button>
        </div>

        {renderLeaderboard()}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Live Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
          {phase === 'running' ? (
            <>
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Time Remaining:</span>
              <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
                {formatTimer(secondsLeft)}
              </span>
            </>
          ) : (
            <>
              <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Score: {result.rawScore} / {questions.length} ({result.accuracy}%)
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {phase === 'running' ? (
            <button
              type="button"
              onClick={handleSubmitExam}
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
            >
              Submit &amp; Check Score
            </button>
          ) : (
            <button
              type="button"
              onClick={startExam}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#04140a] dark:text-slate-200 dark:hover:border-emerald-400 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Submitted Score Summary & Save Feedback */}
      {phase === 'submitted' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:border-emerald-800/80 dark:bg-[#031109] p-3.5 text-center text-xs">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Correct</p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {result.correct}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Wrong</p>
              <p className="mt-1 font-mono text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {result.wrong}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Skipped</p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {result.skipped}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white dark:border-emerald-900/70 dark:bg-[#04140a] px-3.5 py-2.5 text-xs">
            {savingScore ? (
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>Publishing your score to live leaderboard...</span>
              </span>
            ) : scoreSaved ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Score saved to Live {courseCategory} Leaderboard!</span>
              </span>
            ) : !currentUser ? (
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">
                  Sign in with Google to save your score on the live leaderboard.
                </span>
                {onRequireAuth && (
                  <button
                    type="button"
                    onClick={onRequireAuth}
                    className="rounded-md bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805]"
                  >
                    Sign In
                  </button>
                )}
              </div>
            ) : !catalogSeeded ? (
              <span className="text-amber-700 dark:text-amber-300">
                Catalog awaiting initial Admin sync before leaderboard scores can be written.
              </span>
            ) : saveError ? (
              <span className="text-rose-600 dark:text-rose-400">{saveError}</span>
            ) : null}
          </div>

          {renderLeaderboard()}
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => {
          const picked = answers[q.id];
          const isSubmitted = phase === 'submitted';
          const isCorrect = picked === q.correctIndex;

          return (
            <div
              key={q.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 dark:border-emerald-900/70 dark:bg-[#031109] p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-teal-700 dark:text-teal-300">
                    Q{qIdx + 1} · {q.chapter}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {q.question}
                  </p>
                </div>

                {isSubmitted && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                      picked === undefined
                        ? 'text-slate-500 dark:text-slate-400'
                        : isCorrect
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {picked === undefined ? (
                      <>
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Skipped</span>
                      </>
                    ) : isCorrect ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Wrong</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = picked === oIdx;
                  const isRightAnswer = q.correctIndex === oIdx;

                  let btnClass =
                    'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 dark:border-emerald-900/70 dark:bg-[#04140a] dark:text-slate-200 dark:hover:border-emerald-400';

                  if (!isSubmitted && isSelected) {
                    btnClass =
                      'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold';
                  } else if (isSubmitted) {
                    if (isRightAnswer) {
                      btnClass =
                        'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300 font-semibold';
                    } else if (isSelected && !isRightAnswer) {
                      btnClass =
                        'border-rose-500 bg-rose-50 text-rose-800 dark:border-rose-400 dark:bg-rose-500/15 dark:text-rose-300';
                    } else {
                      btnClass =
                        'border-slate-200 bg-white/60 text-slate-500 dark:border-emerald-900/50 dark:bg-[#04140a]/60 dark:text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                      }
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${btnClass}`}
                    >
                      <span className="font-mono font-bold shrink-0">
                        {OPTION_LETTERS[oIdx]}.
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="rounded-lg border border-slate-200 bg-white dark:border-emerald-900/60 dark:bg-[#030805] p-3 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-teal-700 dark:text-teal-300">
                    Explanation:{' '}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExamHall;
