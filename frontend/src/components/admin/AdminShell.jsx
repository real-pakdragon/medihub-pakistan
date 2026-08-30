import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarClock, ExternalLink, Inbox, Library, LogOut, Users } from 'lucide-react';

import { logoutAdmin, useIsAuthenticated } from '../../hooks/queries.js';
import { getStoredToken, api } from '../../api/client.js';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { to: '/admin/resources', label: 'Resources', icon: Library },
  { to: '/admin/messages', label: 'Messages', icon: Inbox },
  { to: '/admin/subscribers', label: 'Subscribers', icon: Users },
  { to: '/admin/mdcat', label: 'MDCAT Config', icon: CalendarClock },
];

export function ProtectedAdmin({ children }) {
  const authenticated = useIsAuthenticated();
  if (!authenticated) return <Navigate to="/admin/login" replace />;
  return children ?? <Outlet />;
}

export function AdminShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ['admin-me'],
    queryFn: () => api.get('/admin/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(getStoredToken()),
  });

  useEffect(() => {
    if (me.isError && me.error?.status === 401) {
      logoutAdmin(qc);
      navigate('/admin/login', { replace: true });
    }
  }, [me.isError, me.error, qc, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-brand to-brand-mid shadow-card">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <Link to="/admin" className="text-base font-extrabold tracking-tight text-white">
            MediHub <span className="font-medium text-brand-light">Admin</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-white">
            {me.data && <span className="hidden sm:inline opacity-80">{me.data.data.email}</span>}
            <button
              type="button"
              onClick={() => {
                logoutAdmin(qc);
                navigate('/', { replace: true });
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors hover:bg-white/10"
            >
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
        <nav className="container-site -mb-px flex gap-1 overflow-x-auto pb-0" aria-label="Admin sections">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-slate-50 !text-brand' : 'text-brand-light hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </NavLink>
          ))}
          <NavLink
            to="/"
            className="ml-auto hidden shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium text-brand-light hover:text-white sm:flex"
          >
            View site <ExternalLink size={14} aria-hidden="true" />
          </NavLink>
        </nav>
      </header>

      <main className="container-site flex-1 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-brand-light bg-white py-4 text-center text-xs text-slate-400">
        MediHub Pakistan admin ·{' '}
        <Link to="/" className="inline-flex items-center gap-1 hover:text-brand">
          <ArrowLeft size={12} /> back to site
        </Link>
      </footer>
    </div>
  );
}
