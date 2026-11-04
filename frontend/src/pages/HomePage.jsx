import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, MessageCircle, Sparkles, Target, Users } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { StatCounter } from '../components/StatCounter.jsx';
import { useStats } from '../hooks/queries.js';
import { SOCIALS } from '../lib/constants.js';

const FEATURES = [
  {
    to: '/mbbs',
    icon: BookOpen,
    title: 'MBBS',
    description:
      'Year-wise notes, clinical rotation guides, explanations and standard textbook references — curated and organised.',
    cta: 'Browse the library',
  },
  {
    to: '/mdcat',
    icon: Target,
    title: 'MDCAT Prep Zone',
    description:
      'A full-length mock test launching soon across all five subjects. Register for early access before bookings open.',
    cta: 'Get early access',
  },
  {
    href: SOCIALS.whatsapp.href,
    external: true,
    icon: Users,
    title: 'Study Communities',
    description:
      'City-wise WhatsApp groups where senior students answer questions daily, share quiz drills and announce new material.',
    cta: 'Join a group',
  },
];

function StatBlock({ value, label, loading }) {
  return (
    <div className="px-4 py-6 text-center sm:py-7">
      <div className="font-display text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
        {loading ? (
          <span className="inline-block h-9 w-16 animate-pulse rounded-lg bg-slate-200" aria-hidden="true" />
        ) : (
          <StatCounter value={value} />
        )}
      </div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

export function HomePage() {
  const { data: stats, isLoading } = useStats();

  return (
    <>
      <Seo path="/" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-mist">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(10,37,64,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(10,37,64,0.045) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 82% 12%, rgba(34,167,191,0.16) 0, transparent 40%), radial-gradient(circle at 6% 88%, rgba(14,116,144,0.10) 0, transparent 42%)',
          }}
        />

        <div className="container-site relative py-20 text-center sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-xs font-semibold text-secondary shadow-soft">
              <Sparkles size={14} aria-hidden="true" /> Curated by medical students · reviewed by graduates
            </p>
            <h1 className="mt-7 text-balance font-display text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.6rem]">
              Every MBBS &amp; MDCAT resource, organised in one place.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Structured notes, past papers, video lectures and study groups for every year of MBBS — plus a
              full-length MDCAT mock test launching soon.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/mbbs" className="btn-primary !px-7 !py-3">
                Explore MBBS <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/mdcat" className="btn-outline !px-7 !py-3">
                MDCAT Early Access
              </Link>
            </div>
          </div>

          <div
            className="card-base mx-auto mt-16 grid max-w-3xl grid-cols-3 divide-x divide-slate-100 overflow-hidden animate-fade-up"
            aria-label="Site statistics"
          >
            <StatBlock value={stats?.totalResources} label="Resources" loading={isLoading} />
            <StatBlock value={stats?.whatsappGroups} label="WhatsApp Groups" loading={isLoading} />
            <StatBlock value={stats?.studentsConnected} label="Students Connected" loading={isLoading} />
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="container-site py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">What you will find</p>
          <h2 className="section-title mt-2">Everything you need, in one place</h2>
          <p className="section-sub mx-auto mt-4 text-center">
            Stop searching through scattered Drive links and inactive groups. MediHub keeps everything under one roof.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ to, href, external, icon: Icon, title, description, cta }) => {
            const inner = (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-colors duration-200 group-hover:bg-secondary group-hover:text-white">
                  <Icon size={25} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition-all group-hover:gap-2.5">
                  {cta} <ArrowRight size={15} aria-hidden="true" />
                </span>
              </>
            );
            const classes =
              'card-base group flex flex-col p-7 transition-all duration-200 hover:-translate-y-1 hover:border-brand-border hover:shadow-cardHover';
            return external ? (
              <a key={title} href={href} target="_blank" rel="noopener noreferrer" className={classes}>
                {inner}
              </a>
            ) : (
              <Link key={title} to={to} className={classes}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* MDCAT teaser */}
      <section className="container-site pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-deep via-brand to-primary-dark p-8 shadow-cardHover sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 88% 18%, rgba(255,255,255,0.22) 0, transparent 42%), radial-gradient(circle at 4% 92%, rgba(220,234,242,0.14) 0, transparent 38%)',
            }}
          />
          <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm">
              <Target size={36} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-midlight">Coming soon</p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold text-white sm:text-3xl">
                The MDCAT mock test launches this December
              </h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                A full-length paper mirroring the current PMDC pattern — Biology, Chemistry, Physics, English and
                Logical Reasoning — with instant results and worked solutions. Join the early-access list for priority
                registration.
              </p>
            </div>
            <Link to="/mdcat" className="btn-onDark shrink-0">
              View countdown &amp; register
            </Link>
          </div>
        </div>
      </section>

      {/* Community strip */}
      <section className="border-t border-slate-100 bg-mist py-12 text-center">
        <a
          href={SOCIALS.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline focus-visible:underline"
        >
          <MessageCircle size={16} aria-hidden="true" /> New material is announced first in our WhatsApp communities
        </a>
      </section>
    </>
  );
}
