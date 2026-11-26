import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';
import { Course, PaymentMethod, PaymentSubmission } from '../types/lms';
import { PROMO_CODES } from '../data/lmsData';
import { formatPriceBdt } from '../utils/courseHelpers';
import { submitPaymentDoc } from '../services/lmsFirestore';

interface PaymentModalProps {
  course: Course | null;
  userId: string;
  studentName: string;
  catalogSeeded?: boolean;
  onClose: () => void;
  onPaymentComplete: (submission: PaymentSubmission) => void;
}

const GATEWAY_CONFIG: Record<
  PaymentMethod,
  {
    name: string;
    merchantNumber: string;
    accentClass: string;
    selectedClass: string;
    instructions: string[];
  }
> = {
  bkash: {
    name: 'bKash',
    merchantNumber: '01711-004580',
    accentClass: 'text-[#E2136E]',
    selectedClass:
      'border-[#E2136E] bg-[#E2136E]/10 text-[#E2136E] dark:bg-[#E2136E]/15',
    instructions: [
      'Open bKash App or dial *247# and choose "Send Money".',
      'Enter the Merchant / Personal number above and exact payable BDT amount.',
      'Copy the 10-character TrxID from your confirmation SMS and paste below.',
    ],
  },
  nagad: {
    name: 'Nagad',
    merchantNumber: '01819-004580',
    accentClass: 'text-[#F6921E]',
    selectedClass:
      'border-[#F6921E] bg-[#F6921E]/10 text-[#d97706] dark:text-[#F6921E] dark:bg-[#F6921E]/15',
    instructions: [
      'Open Nagad App or dial *167# and select "Send Money".',
      'Send the exact discounted BDT amount to the Nagad number above.',
      'Enter your Nagad Sender Number & TrxID below for admin verification.',
    ],
  },
  rocket: {
    name: 'Rocket',
    merchantNumber: '01911-004580-7',
    accentClass: 'text-[#8C3494]',
    selectedClass:
      'border-[#8C3494] bg-[#8C3494]/10 text-[#8C3494] dark:text-[#c084fc] dark:bg-[#8C3494]/20',
    instructions: [
      'Open Rocket App or dial *322# and tap "Send Money".',
      'Transfer the payable BDT fee to the Rocket account above.',
      'Provide the Transaction ID and sender mobile to queue your enrollment.',
    ],
  },
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  course,
  userId,
  studentName,
  catalogSeeded = true,
  onClose,
  onPaymentComplete,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('bkash');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [phone, setPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<PaymentSubmission | null>(
    null
  );

  useEffect(() => {
    if (!course) return;
    setFormError('');
    setSubmitting(false);
    setSubmittedRecord(null);
    setTrxId('');
    setPromoFeedback(null);
    setAppliedPromoCode(null);
    setPromoInput('');
  }, [course?.id]);

  useEffect(() => {
    if (!course) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [course, onClose]);

  const { discountBdt, finalPayableBdt, activePromo } = useMemo(() => {
    if (!course) return { discountBdt: 0, finalPayableBdt: 0, activePromo: null };
    const promo = PROMO_CODES.find((p) => p.code === appliedPromoCode) ?? null;
    if (!promo) {
      return {
        discountBdt: 0,
        finalPayableBdt: course.priceBdt,
        activePromo: null,
      };
    }
    const rawDiscount =
      promo.type === 'percent'
        ? Math.round((course.priceBdt * promo.value) / 100)
        : promo.value;
    const clamped = Math.min(course.priceBdt, Math.max(0, rawDiscount));
    return {
      discountBdt: clamped,
      finalPayableBdt: course.priceBdt - clamped,
      activePromo: promo,
    };
  }, [course, appliedPromoCode]);

  if (!course) return null;

  const gateway = GATEWAY_CONFIG[method];

  const handleApplyPromo = () => {
    const normalized = promoInput.trim().toUpperCase();
    if (!normalized) {
      setPromoFeedback({ type: 'error', text: 'Enter a promo code first.' });
      return;
    }
    const matched = PROMO_CODES.find((p) => p.code === normalized);
    if (!matched) {
      setAppliedPromoCode(null);
      setPromoFeedback({
        type: 'error',
        text: 'Invalid code. Try TANVIR20 or HSC26.',
      });
      return;
    }
    setAppliedPromoCode(matched.code);
    setPromoFeedback({
      type: 'success',
      text: `${matched.code} applied — ${matched.label}`,
    });
  };

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText(gateway.merchantNumber).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setFormError('Please sign in with Google before submitting a payment.');
      return;
    }
    if (!catalogSeeded) {
      setFormError(
        'Course catalog is awaiting initial Admin sync in Firestore. Ask the Admin to sign in once first.'
      );
      return;
    }

    const cleanedPhone = phone.replace(/[\s-]+/g, '');
    const cleanedTrx = trxId.trim().toUpperCase();

    if (!/^01[3-9]\d{8}$/.test(cleanedPhone)) {
      setFormError(
        'Enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).'
      );
      return;
    }
    if (!/^[A-Z0-9]{6,18}$/.test(cleanedTrx)) {
      setFormError(
        'Enter a valid Transaction ID (6–18 alphanumeric characters, e.g., BKA9X42M10).'
      );
      return;
    }

    setFormError('');
    setSubmitting(true);

    const submission: PaymentSubmission = {
      id: `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      courseId: course.id,
      courseTitle: course.title,
      studentName: studentName || 'Science Student',
      studentPhone: cleanedPhone,
      method,
      transactionId: cleanedTrx,
      promoCode: activePromo?.code,
      discountBdt,
      amountPaidBdt: finalPayableBdt,
      status: 'pending',
      submittedAt: new Date().toISOString().slice(0, 10),
    };

    try {
      await submitPaymentDoc(submission);
      setSubmittedRecord(submission);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not submit payment to Firestore. Please retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={onClose}
    >
      <div
        className="emerald-scroll max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-emerald-900/60 pb-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Tanvir&apos;s Science Square · Course Enrollment
            </p>
            <h2
              id="payment-modal-title"
              className="mt-1 font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2"
            >
              {course.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#031109] dark:hover:text-slate-100 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submittedRecord ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Payment Submitted — Awaiting Approval
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                TrxID{' '}
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {submittedRecord.transactionId}
                </span>{' '}
                is queued for Admin verification. Your course unlocks immediately in real time once approved.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center pt-2">
              <button
                type="button"
                onClick={() => onPaymentComplete(submittedRecord)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Track Status in My Learning</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
            {!catalogSeeded && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Firestore catalog has not been initialized by the Admin account yet. Paid checkout requires the Admin to sign in once first.
                </span>
              </div>
            )}

            {/* Gateway Selector: bKash / Nagad / Rocket */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Bangladeshi Mobile Banking Method
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['bkash', 'nagad', 'rocket'] as PaymentMethod[]).map((m) => {
                  const active = method === m;
                  const cfg = GATEWAY_CONFIG[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      aria-pressed={active}
                      className={`rounded-xl border-2 px-3 py-2.5 text-center font-display text-xs sm:text-sm font-bold transition-colors ${
                        active
                          ? cfg.selectedClass
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-emerald-900/70 dark:bg-[#031109] dark:text-slate-200'
                      }`}
                    >
                      {cfg.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merchant Number & Quick Instructions */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {gateway.name} Send Money Number
                  </p>
                  <p
                    className={`font-mono text-sm sm:text-base font-bold tabular-nums ${gateway.accentClass}`}
                  >
                    {gateway.merchantNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#04140a] dark:text-slate-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <ol className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                {gateway.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Promo Code Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="promo-code-input"
                  className="font-medium text-slate-700 dark:text-slate-300"
                >
                  Promo Code
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Available:{' '}
                  <span className="font-mono text-teal-700 dark:text-teal-300">
                    TANVIR20
                  </span>{' '}
                  ·{' '}
                  <span className="font-mono text-teal-700 dark:text-teal-300">
                    HSC26
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code (e.g. TANVIR20)"
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] py-2 pl-8 pr-3 font-mono text-xs uppercase dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-100 dark:hover:border-emerald-400 transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoFeedback && (
                <p
                  className={`text-xs font-medium ${
                    promoFeedback.type === 'success'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {promoFeedback.text}
                </p>
              )}
            </div>

            {/* Fee Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Course Fee</span>
                <span className="font-mono tabular-nums">
                  {formatPriceBdt(course.priceBdt)}
                </span>
              </div>
              {discountBdt > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Discount ({activePromo?.code})</span>
                  <span className="font-mono tabular-nums">
                    -{formatPriceBdt(discountBdt)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 dark:border-emerald-900/60 pt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <span>Total Payable</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatPriceBdt(finalPayableBdt)}
                </span>
              </div>
            </div>

            {/* Sender Phone & TrxID Inputs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="sender-phone"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Your {gateway.name} Number
                </label>
                <input
                  id="sender-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 font-mono text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="trx-id"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Transaction ID (TrxID)
                </label>
                <input
                  id="trx-id"
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g., BKA9X42M10"
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 uppercase focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 font-mono text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {formError && (
              <p
                className="text-xs font-medium text-rose-600 dark:text-rose-400"
                role="alert"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting TrxID to Firestore...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit TrxID for Verification</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
