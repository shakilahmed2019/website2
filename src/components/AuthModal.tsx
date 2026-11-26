import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types/lms';
import { BrandLogo } from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  unverifiedEmail?: string | null;
  onRefreshAuth?: () => Promise<boolean>;
  logoUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  unverifiedEmail = null,
  onRefreshAuth,
  logoUrl,
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setInfoMessage('');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatAuthError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : 'Authentication failed.';
    if (msg.includes('popup-closed-by-user')) {
      return 'Sign-in popup was closed before completing.';
    }
    if (msg.includes('popup-blocked')) {
      return 'Browser blocked the sign-in popup. Please allow popups and retry.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return 'Incorrect email or password.';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'No account found for this email. Switch to Create Account.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'This email is already registered. Try signing in instead.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('auth/operation-not-allowed')) {
      return 'Enable Email/Password & Google Sign-In in Firebase Console → Authentication → Sign-in method.';
    }
    if (msg.includes('auth/unauthorized-domain')) {
      return 'Add this site domain in Firebase Console → Authentication → Settings → Authorized domains.';
    }
    return msg;
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setError('');
    setInfoMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Enter both your email and password.');
      return;
    }

    if (authTab === 'signup' && fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (authTab === 'signup') {
        const cred = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
        await updateProfile(cred.user, { displayName: fullName.trim() });
        await sendEmailVerification(cred.user);
        setInfoMessage(
          `Verification link sent to ${cleanEmail}. Verify your inbox, then click Refresh Status below.`
        );
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user).catch(() => {});
          setInfoMessage(
            `Please verify ${cleanEmail} using the link sent to your inbox, then click Refresh Status.`
          );
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Enter your email address first to receive a password reset link.');
      return;
    }
    setError('');
    setInfoMessage('');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setInfoMessage(`Password reset email sent to ${cleanEmail}.`);
    } catch (err) {
      setError(formatAuthError(err));
    }
  };

  const handleRefreshVerification = async () => {
    if (!onRefreshAuth) return;
    setRefreshing(true);
    setError('');
    try {
      const verified = await onRefreshAuth();
      if (verified) {
        onClose();
      } else {
        setError('Email is still unverified. Click the link in your inbox, then retry.');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setRefreshing(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setInfoMessage('Verification email resent. Check your inbox and spam folder.');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setError('');
    setInfoMessage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 dark:bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto emerald-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <BrandLogo logoUrl={logoUrl} size={34} className="mt-0.5" />
            <div>
              <h2
                id="auth-modal-title"
                className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100"
              >
                Tanvir&apos;s Science Square
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Sign in via Email &amp; Password or Google to sync your enrolled batches, payments, and MCQ scores.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#031109] dark:hover:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {unverifiedEmail ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/40 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 space-y-2 text-xs">
              <p className="font-display text-sm font-bold text-amber-800 dark:text-amber-300">
                Verify Your Email Address
              </p>
              <p className="text-amber-800/90 dark:text-amber-200 leading-relaxed">
                We sent a verification link to <span className="font-semibold">{unverifiedEmail}</span>. Click that link first to activate Firestore profile syncing, course enrollments, and bKash/Nagad payments.
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300" role="alert">
                {error}
              </p>
            )}
            {infoMessage && (
              <p className="rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {infoMessage}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleRefreshVerification()}
                disabled={refreshing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>I&apos;ve Verified — Refresh Status</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={resending}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-200 transition-colors"
                >
                  {resending ? 'Sending...' : 'Resend Link'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-500/10 dark:text-rose-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : currentUser ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-[#031109] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805] font-mono text-xs font-bold">
                    {currentUser.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/70 dark:border-emerald-900/60 pt-2.5 text-xs">
                <div className="flex items-center gap-1.5">
                  {currentUser.role === 'admin' ? (
                    <>
                      <Shield className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                      <span className="font-semibold text-teal-700 dark:text-teal-300">
                        Admin Access Verified
                      </span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Student Profile Synced
                      </span>
                    </>
                  )}
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {(currentUser.enrolledCourses ?? []).length} paid unlocks
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-100 dark:hover:border-emerald-400 transition-colors"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Switch Google Account</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-500/10 dark:text-rose-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email / Password Tabs */}
            <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 dark:border-emerald-900/80 dark:bg-[#031109] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setError('');
                  setInfoMessage('');
                }}
                className={`rounded-md py-1.5 transition-colors ${
                  authTab === 'signin'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setError('');
                  setInfoMessage('');
                }}
                className={`rounded-md py-1.5 transition-colors ${
                  authTab === 'signup'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-3">
              {authTab === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-full-name"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="auth-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Arafat Rahman"
                      className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] py-2 pl-9 pr-3 text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] py-2 pl-9 pr-3 text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  {authTab === 'signin' && (
                    <button
                      type="button"
                      onClick={() => void handlePasswordReset()}
                      className="text-[11px] font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] py-2 pl-9 pr-3 text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p
                  className="rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {infoMessage && (
                <p className="rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {infoMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>
                  {authTab === 'signin' ? 'Sign In with Email' : 'Create Student Account'}
                </span>
              </button>
            </form>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200 dark:border-emerald-900/60" />
              <span className="mx-3 shrink text-[11px] font-medium text-slate-400">
                OR
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-emerald-900/60" />
            </div>

            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-800 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-100 dark:hover:border-emerald-400 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
