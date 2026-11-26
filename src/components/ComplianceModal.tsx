import React, { useEffect } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { CHANNEL_INFO } from '../data/lmsData';

export type ComplianceDocType = 'privacy' | 'terms' | 'refund';

interface ComplianceModalProps {
  activeDoc: ComplianceDocType | null;
  onSelectDoc: (doc: ComplianceDocType) => void;
  onClose: () => void;
}

const TABS: Array<{
  id: ComplianceDocType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  { id: 'refund', label: 'Refund & Return Policy', icon: RefreshCcw },
];

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  activeDoc,
  onSelectDoc,
  onClose,
}) => {
  useEffect(() => {
    if (!activeDoc) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeDoc, onClose]);

  if (!activeDoc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compliance-modal-title"
      onClick={onClose}
    >
      <div
        className="emerald-scroll flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-emerald-900/70 px-5 pt-5 pb-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {CHANNEL_INFO.brandName} · Official Policies &amp; Student Protection
              </p>
              <h2
                id="compliance-modal-title"
                className="mt-1 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100"
              >
                {activeDoc === 'privacy'
                  ? 'Privacy Policy'
                  : activeDoc === 'terms'
                  ? 'Terms & Conditions'
                  : 'Refund & Return Policy'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close compliance document"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#031109] dark:hover:text-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Policy Tabs */}
          <div
            role="tablist"
            aria-label="Compliance documents"
            className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-xl border border-slate-200 bg-slate-100 dark:border-emerald-900/70 dark:bg-[#031109] p-1"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeDoc === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectDoc(tab.id)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="emerald-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Effective Date: November 2026 · Jurisdiction: Dhaka, Bangladesh
          </p>

          {activeDoc === 'privacy' && (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Information We Collect
                </h3>
                <p>
                  When you register as a student at {CHANNEL_INFO.brandName}, we collect only the details necessary to deliver HSC and Admission Science courses:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Full name, verified email address, and authentication profile via Firebase Authentication (Email/Password or Google Sign-In).</li>
                  <li>Bangladeshi mobile wallet sender number (`01XXXXXXXXX`) and Transaction ID (TrxID) when submitting bKash, Nagad, or Rocket payments for verification.</li>
                  <li>Academic activity including enrolled courses, lesson completion progress, and MCQ Exam Hall leaderboard scores.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  2. How We Use &amp; Protect Your Data
                </h3>
                <p>
                  Your information is used strictly to verify enrollments, unlock paid science batches, publish academic leaderboard rankings (name &amp; score only, never phone numbers or emails), and issue course completion support. We never sell, rent, or trade student contact details with external marketers.
                </p>
                <p>
                  All account records and payment verification entries are stored using Google Firebase Authentication and Cloud Firestore protected by strict role-based security rules.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  3. Data Retention &amp; Removal Requests
                </h3>
                <p>
                  Students or parents/guardians may request profile updates or permanent account deletion at any time by writing to our official support email or Facebook Page listed below.
                </p>
              </section>
            </div>
          )}

          {activeDoc === 'terms' && (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Platform Eligibility &amp; Account Integrity
                </h3>
                <p>
                  By enrolling in courses on {CHANNEL_INFO.brandName}, you confirm that your account details and payment TrxID submissions are genuine. Each student account is licensed strictly to a single individual learner; sharing credentials or simultaneous multi-device commercial use is prohibited.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  2. Intellectual Property &amp; Course Content
                </h3>
                <p>
                  All One-Shot masterclasses, recorded science classes, chapter PDF lecture sheets, formula handbooks, and MCQ sets remain the exclusive intellectual property of {CHANNEL_INFO.brandName} and Instructor Tanvir. Screen recording, downloading, re-uploading to unauthorized channels, or reselling paid batch materials will lead to immediate enrollment revocation without refund.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  3. Payments, Promos &amp; Governing Law
                </h3>
                <p>
                  Course fees are priced in Bangladeshi Taka (`BDT / ৳`). Promotional discount codes (such as `TANVIR20` or `HSC26`) apply only at checkout prior to TrxID submission. Paid batches unlock upon admin verification of bKash, Nagad, or Rocket TrxID. These terms are governed by the laws of the People&apos;s Republic of Bangladesh.
                </p>
              </section>
            </div>
          )}

          {activeDoc === 'refund' && (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Free Classes vs. Paid HSC &amp; Admission Batches
                </h3>
                <p>
                  All public YouTube One-Shot classes and free foundational courses (`৳0`) require no payment and carry no charges. Paid batches include full-cycle lectures, downloadable lecture notes, and Exam Hall access priced in BDT (`৳`).
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  2. Eligibility Window for Refunds (Bangladesh Online Courses)
                </h3>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:border-emerald-800/70 dark:bg-[#031109] p-3.5 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>
                      <strong>48-Hour Satisfaction Window:</strong> You may request a full refund within <strong>48 hours</strong> of payment approval if you have completed less than <strong>15%</strong> of course lessons and have not downloaded restricted PDF packs.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>
                      <strong>Duplicate / Erroneous MFS Payments:</strong> If you accidentally sent funds twice or submitted an incorrect amount via bKash, Nagad, or Rocket, the excess or unapproved payment is refunded 100% after verification.
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  3. Non-Refundable Cases &amp; Processing Timeline
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Requests made after 48 hours of course unlock or after accessing more than 15% of lessons/notes are generally non-refundable (subject to a one-time batch swap to another subject or cycle upon review).</li>
                  <li>Approved refunds are disbursed exclusively to the original bKash, Nagad, or Rocket sender number within <strong>3 to 5 working days</strong>.</li>
                </ul>
              </section>
            </div>
          )}

          {/* Official Contact Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-emerald-900/70 dark:bg-[#031109] p-4 space-y-2">
            <p className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Student Support &amp; Grievance Contact
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs text-slate-600 dark:text-slate-300">
              <a
                href={`mailto:${CHANNEL_INFO.supportEmail}`}
                className="inline-flex items-center gap-2 hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{CHANNEL_INFO.supportEmail}</span>
              </a>
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{CHANNEL_INFO.location}</span>
              </div>
              <a
                href={CHANNEL_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Facebook Official Page</span>
              </a>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Support Hours: {CHANNEL_INFO.supportHours}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceModal;
