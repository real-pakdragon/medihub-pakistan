import { BadgeCheck, Users } from 'lucide-react';

import { useAdminSubscribers } from '../../hooks/queries.js';
import { EmptyState } from '../ui/Skeleton.jsx';

export function SubscribersSection() {
  const { data, isLoading } = useAdminSubscribers(true);
  const subscribers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <section aria-labelledby="admin-subscribers-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="admin-subscribers-title" className="text-xl sm:text-2xl">
          MDCAT Early-Access Subscribers
        </h1>
        {!isLoading && (
          <p className="text-sm text-slate-500">
            <strong>{subscribers.length}</strong> total ·{' '}
            <strong className="inline-flex items-center gap-1">
              <BadgeCheck size={15} className="text-emerald-600" aria-hidden="true" />
              {meta?.confirmedCount ?? 0}
            </strong>{' '}
            confirmed
          </p>
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-slate-400">Loading subscribers…</p>
        ) : subscribers.length === 0 ? (
          <EmptyState icon={Users} title="No subscribers yet">
            Emails captured from the MDCAT notify-me box on the public site will appear here.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-light bg-white shadow-card">
            <table className="w-full min-w-[480px] text-left text-sm">
              <caption className="sr-only">List of MDCAT early-access subscribers</caption>
              <thead>
                <tr className="border-b border-brand-light bg-brand-light/60 text-xs uppercase tracking-wide text-brand">
                  <th scope="col" className="px-5 py-3">Email</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Subscribed at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="max-w-xs truncate px-5 py-3 font-medium text-slate-700">{s.email}</td>
                    <td className="px-5 py-3">
                      {s.confirmed ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          confirmed
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          pending
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {new Date(s.subscribedAt).toLocaleString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
