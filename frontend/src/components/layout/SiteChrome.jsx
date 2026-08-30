import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, Mail, MessageCircle, Menu, X } from 'lucide-react';

import { SITE, SOCIALS } from '../../lib/constants.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/mbbs', label: 'MBBS Library' },
  { to: '/mdcat', label: 'MDCAT Prep' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 shadow-nav backdrop-blur-md">
      <nav className="container-site flex h-[4.5rem] items-center justify-between gap-4" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2.5 text-primary" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <GraduationCap size={22} aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight sm:text-xl">
            MediHub <span className="font-display font-semibold text-secondary">Pakistan</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href={SOCIALS.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary ml-3 !py-2"
          >
            <MessageCircle size={16} aria-hidden="true" /> WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="rounded-full p-2 text-primary transition-colors hover:bg-soft"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200/70 bg-white lg:hidden">
          <div className="container-site flex flex-col gap-1 py-4" onClick={() => setOpen(false)}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-secondary/10 text-secondary' : 'text-slate-600 hover:bg-soft'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <a href={SOCIALS.whatsapp.href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2 !py-2.5">
              <MessageCircle size={16} aria-hidden="true" /> Join us on WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-brand-dark text-slate-400">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5 text-lg font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-brand-midlight">
              <GraduationCap size={20} aria-hidden="true" />
            </span>
            {SITE.name}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Curated study resources for Pakistani MBBS and MDCAT students — maintained by medical students and
            graduates.
          </p>
          <p className="mt-6 flex items-center gap-2 text-sm">
            <Mail size={15} aria-hidden="true" />
            <a href={`mailto:${SITE.supportEmail}`} className="transition-colors hover:text-white">
              {SITE.supportEmail}
            </a>
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-midlight">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-midlight">Connect</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={SOCIALS.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MediHub on WhatsApp"
                className="inline-flex items-center gap-2 transition-colors hover:text-white"
              >
                <MessageCircle size={15} aria-hidden="true" /> WhatsApp Communities
              </a>
            </li>
            <li>
              <a
                href={SOCIALS.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MediHub Instagram"
                className="transition-colors hover:text-white"
              >
                Instagram @medihubpk
              </a>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-white">
                Contact the team
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {SITE.name} — Study resources for Pakistani MBBS &amp; MDCAT students.
      </div>
    </footer>
  );
}
