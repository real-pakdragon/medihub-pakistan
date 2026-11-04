import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, FolderTree, Inbox, Library, PenLine, Users } from 'lucide-react';

import { Seo } from '../../components/Seo.jsx';
import { useAdminStats } from '../../hooks/queries.js';

export function AdminOverviewPage() {
  const { data: stats } = useAdminStats(true);

  const cards = [
    { label: 'MBBS topics', value: stats?.categories, to: '/admin/library', icon: FolderTree },
    { label: 'Content items', value: stats?.contentItems, to: '/admin/library', icon: Library },
    { label: 'Blog posts', value: stats?.posts, to: '/admin/library', icon: PenLine },
    { label: 'Contact messages', value: stats?.messages, to: '/admin/messages', icon: Inbox },
    { label: 'New messages', value: stats?.newMessages, to: '/admin/messages', icon: Inbox, highlight: true },
  ];

  return (
    <>
      <Seo title="Admin Dashboard" />
      <h1 className="text-xl sm:text-2xl">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, to, icon: Icon, highlight }) => (
          <Link
            key={label}
            to={to}
            className={`card-base group p-6 transition-all hover:-translate-y-0.5 hover:shadow-cardHover ${
              highlight && value > 0 ? '!border-brand-mid ring-1 ring-brand-mid' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon size={20} aria-hidden="true" />
              </span>
              <ArrowRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-brand">{value ?? '—'}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          </Link>
        ))}
      </div>

      <div className="card-base mt-8 p-7">
        <h2 className="text-base">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/library" className="btn-primary !py-2.5 text-sm">
            <FolderTree size={15} aria-hidden="true" /> Manage MBBS
          </Link>
          <Link to="/admin/mdcat-res" className="btn-primary !py-2.5 text-sm !bg-brand-mid hover:!bg-brand">
            <BookMarked size={15} aria-hidden="true" /> Manage MDCAT RES
          </Link>
          <Link to="/admin/mdcat" className="btn-secondary !py-2.5 text-sm">
            Update MDCAT countdown
          </Link>
        </div>
      </div>
    </>
  );
}
