import React, { useState } from 'react';
import { Eye, EyeOff, Megaphone, Plus, Trash2 } from 'lucide-react';
import { Course, NoticeItem, NoticePriority } from '../../types/lms';

interface AdminNoticesTabProps {
  notices: NoticeItem[];
  courses: Course[];
  onCreateNotice: (notice: NoticeItem) => void;
  onToggleNotice: (noticeId: string) => void;
  onDeleteNotice: (noticeId: string) => void;
  onShowNotice: (msg: string) => void;
}

export const AdminNoticesTab: React.FC<AdminNoticesTabProps> = ({
  notices,
  courses,
  onCreateNotice,
  onToggleNotice,
  onDeleteNotice,
  onShowNotice,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('live');
  const [targetCourseId, setTargetCourseId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Both notice title and announcement message are required.');
      return;
    }

    const created: NoticeItem = {
      id: `ntc_${Date.now().toString(36)}`,
      title: title.trim(),
      message: message.trim(),
      priority,
      active: true,
      linkLabel: targetCourseId ? 'Open Course' : undefined,
      targetCourseId: targetCourseId || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onCreateNotice(created);
    setTitle('');
    setMessage('');
    setTargetCourseId('');
    setError('');
    onShowNotice(`Published notice "${created.title}" to the live banner.`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Create Notice Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-5 space-y-4 self-start"
      >
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            Publish Live Notice
          </h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notice Headline
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Physics Live Class at 8:00 PM"
            className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Announcement Message
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share exam schedules, YouTube Premieres, or batch discounts..."
            className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Priority Label
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NoticePriority)}
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
            >
              <option value="live">Live Class</option>
              <option value="urgent">Exam Alert</option>
              <option value="info">General Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Linked Course (Optional)
            </label>
            <select
              value={targetCourseId}
              onChange={(e) => setTargetCourseId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#030805] px-3 py-2 text-xs sm:text-sm dark:text-slate-100 dark:focus:border-emerald-400 focus:outline-none"
            >
              <option value="">None</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Publish to Notice Board</span>
        </button>
      </form>

      {/* Active & Archived Notices List */}
      <div className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            Active &amp; Scheduled Notices ({notices.length})
          </h2>
        </div>

        {notices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No notices created yet. Publish an announcement to display it below the Navbar.
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] p-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-mono font-bold uppercase ${
                        n.priority === 'urgent'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800">
                      ·
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {n.createdAt}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800">
                      ·
                    </span>
                    <span
                      className={
                        n.active
                          ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }
                    >
                      {n.active ? 'Visible' : 'Paused'}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {n.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleNotice(n.id)}
                    aria-label={n.active ? `Pause ${n.title}` : `Show ${n.title}`}
                    title={n.active ? 'Pause notice' : 'Activate notice'}
                    className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-[#031109] dark:hover:text-emerald-400 transition-colors"
                  >
                    {n.active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteNotice(n.id);
                      onShowNotice(`Removed notice "${n.title}".`);
                    }}
                    aria-label={`Delete ${n.title}`}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-[#031109] dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
