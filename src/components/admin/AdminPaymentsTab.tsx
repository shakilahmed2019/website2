import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Clock, X, XCircle } from 'lucide-react';
import { PaymentStatus, PaymentSubmission } from '../../types/lms';
import { formatPriceBdt } from '../../utils/courseHelpers';

interface AdminPaymentsTabProps {
  payments: PaymentSubmission[];
  onUpdatePaymentStatus: (paymentId: string, status: PaymentStatus) => void;
  onShowNotice: (msg: string) => void;
}

const METHOD_LABEL: Record<PaymentSubmission['method'], string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
};

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({
  payments,
  onUpdatePaymentStatus,
  onShowNotice,
}) => {
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return payments;
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  const counts = useMemo(
    () => ({
      all: payments.length,
      pending: payments.filter((p) => p.status === 'pending').length,
      approved: payments.filter((p) => p.status === 'approved').length,
      rejected: payments.filter((p) => p.status === 'rejected').length,
    }),
    [payments]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            Student Payment Approvals (bKash · Nagad · Rocket)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify student TrxID submissions and approve or revoke batch access.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 dark:border-emerald-900/80 dark:bg-[#031109] p-1 self-start overflow-x-auto no-scrollbar">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#030805]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              {status} ({counts[status]})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-emerald-900/80 dark:bg-[#031109] text-xs font-medium dark:text-slate-400">
                <th className="py-3 pl-4 pr-3">Student</th>
                <th className="py-3 px-3">Course Batch</th>
                <th className="py-3 px-3">Method &amp; TrxID</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pl-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/50 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No payment records match the selected status filter.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr
                    key={pay.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#031109]/70 transition-colors"
                  >
                    <td className="py-3 pl-4 pr-3 whitespace-nowrap">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {pay.studentName}
                      </p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {pay.studentPhone}
                      </p>
                    </td>

                    <td className="py-3 px-3 min-w-[200px]">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {pay.courseTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {pay.submittedAt}
                        {pay.promoCode ? ` · Promo ${pay.promoCode}` : ''}
                      </p>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {METHOD_LABEL[pay.method]}
                      </span>
                      <p className="font-mono text-xs text-slate-700 dark:text-slate-200 tabular-nums">
                        {pay.transactionId}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      {formatPriceBdt(pay.amountPaidBdt)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${
                          pay.status === 'approved'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : pay.status === 'rejected'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {pay.status === 'approved' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : pay.status === 'rejected' ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        <span>{pay.status}</span>
                      </span>
                    </td>

                    <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {pay.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdatePaymentStatus(pay.id, 'approved');
                              onShowNotice(
                                `Approved ${pay.studentName} (${pay.transactionId})`
                              );
                            }}
                            aria-label={`Approve ${pay.transactionId}`}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                        )}
                        {pay.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdatePaymentStatus(pay.id, 'rejected');
                              onShowNotice(`Rejected ${pay.transactionId}`);
                            }}
                            aria-label={`Reject ${pay.transactionId}`}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
