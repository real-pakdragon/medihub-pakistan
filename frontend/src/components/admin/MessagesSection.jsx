import { useState } from 'react';
import { CheckCheck, Inbox, MailOpen, Reply } from 'lucide-react';

import { useAdminMessages, useUpdateMessageStatus } from '../../hooks/queries.js';
import { useToast } from '../Toaster.jsx';
import { EmptyState } from '../ui/Skeleton.jsx';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
];

export function MessagesSection() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useAdminMessages(filter || undefined, true);
  const updateStatus = useUpdateMessageStatus();

  const messages = data?.data ?? [];

  const mark = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error(err?.message ?? 'Update failed');
    }
  };

  return (
    <section aria-labelledby="admin-messages-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="admin-messages-title" className="text-xl sm:text-2xl">
          Contact Messages
        </h1>
        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                filter === value ? 'bg-brand text-white shadow-card' : 'bg-white text-slate-600 hover:bg-brand-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-slate-400">Loading messages…</p>
        ) : messages.length === 0 ? (
          <EmptyState icon={Inbox} title="No messages here">
            When students contact you through the site form, their messages appear in this inbox.
          </EmptyState>
        ) : (
          messages.map((m) => (
            <article
              key={m.id}
              className={`card-base p-5 sm:p-6 ${m.status === 'new' ? 'border-l-4 border-l-brand-mid' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base">{m.subject}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    <strong>{m.name}</strong> ·{' '}
                    <a href={`mailto:${m.email}`} className="font-medium text-brand-mid hover:underline">
                      {m.email}
                    </a>{' '}
                    · {new Date(m.createdAt).toLocaleString('en-PK')}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    m.status === 'new'
                      ? 'bg-emerald-100 text-emerald-700'
                      : m.status === 'read'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {m.status.toUpperCase()}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{m.message}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                  onClick={() => mark(m.id, 'replied').catch(() => {})}
                  className="btn-secondary !px-4 !py-2 text-xs"
                >
                  <Reply size={14} aria-hidden="true" /> Reply by email
                </a>
                {m.status !== 'read' && m.status !== 'replied' && (
                  <button type="button" onClick={() => mark(m.id, 'read')} className="btn-ghost !px-4 !py-2 text-xs">
                    <MailOpen size={14} aria-hidden="true" /> Mark read
                  </button>
                )}
                {m.status !== 'replied' && (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => mark(m.id, 'replied')}
                    className="btn-pill !px-4 !py-2 text-xs bg-brand-light text-brand-mid hover:bg-brand-border"
                  >
                    <CheckCheck size={14} aria-hidden="true" /> Mark replied
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
