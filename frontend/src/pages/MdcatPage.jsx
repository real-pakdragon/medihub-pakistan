import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, ArrowRight, CheckCircle2, FileText, FlaskConical, Loader2, Mail } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { CountdownTimer } from '../components/CountdownTimer.jsx';
import { useToast } from '../components/Toaster.jsx';
import { useMdcatStatus, useResources, useSubscribe } from '../hooks/queries.js';
import { subscribeSchema } from '../lib/schemas.js';
import { MDCAT_PAPER_GROUPS, MDCAT_SUBJECTS } from '../lib/constants.js';

export function MdcatPage() {
  const { data: status, isLoading } = useMdcatStatus();
  const { data: papersData, isLoading: papersLoading } = useResources({ category: 'past_papers', limit: 48 });
  const toast = useToast();
  const subscribe = useSubscribe();
  const [confirmedEmail, setConfirmedEmail] = useState(false);

  const papers = papersData?.data ?? [];
  const groups = MDCAT_PAPER_GROUPS.map((group) => ({
    ...group,
    papers: papers.filter((p) => p.title.toUpperCase().includes(group.keyword.toUpperCase())),
  })).filter((g) => g.papers.length > 0);
  const otherPapers = papers.filter(
    (p) => !groups.some((g) => p.title.toUpperCase().includes(g.keyword.toUpperCase()))
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(subscribeSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      const res = await subscribe.mutateAsync({ email });
      toast.success(res.message);
      setConfirmedEmail(true);
      reset();
    } catch (err) {
      toast.error(err?.message ?? 'Subscription failed — please try again.');
    }
  });

  return (
    <>
      <Seo
        title="MDCAT Prep"
        description="Full-length MDCAT mock test covering Biology, Chemistry, Physics, English and Logical Reasoning. Register for early access."
        path="/mdcat"
      />

      <section className="bg-gradient-to-br from-brand via-[#0f4a6e] to-brand-mid text-white">
        <div className="container-site py-16 text-center sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <FlaskConical size={14} aria-hidden="true" />
            {status ? status.currentPhase : isLoading ? 'Loading…' : ''}
          </p>
          <h1 className="mx-auto mt-6 max-w-2xl text-3xl !text-white sm:text-4xl lg:text-[2.75rem]">
            Full-length MDCAT Mock Test
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-light sm:text-base">
            {status?.phaseDescription ??
              'A complete PMDC-pattern paper with instant scoring and worked solutions — launching soon.'}
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-4" aria-hidden="true">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/10 sm:h-28" />
                ))}
              </div>
            ) : (
              <CountdownTimer launchDate={status?.launchDate} />
            )}
          </div>

          {status?.launchDate && (
            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-brand-light">
              <CalendarClock size={14} aria-hidden="true" />
              Scheduled for{' '}
              {new Date(status.launchDate).toLocaleString('en-PK', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          )}
        </div>
      </section>

      {/* Subjects */}
      <section className="container-site py-16">
        <h2 className="text-center text-2xl sm:text-3xl">What the mock covers</h2>
        <ul className="mt-8 flex flex-wrap justify-center gap-3" aria-label="MDCAT subjects">
          {MDCAT_SUBJECTS.map((subject) => (
            <li
              key={subject}
              className="rounded-full border-2 border-brand-border bg-brand-light px-6 py-3 text-sm font-semibold text-brand"
            >
              {subject}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            { title: 'Real exam pattern', body: '210 MCQs mirroring the latest PMDC syllabus weightage and timing.' },
            { title: 'Instant analytics', body: 'Subject-wise breakdown shows exactly where you lose marks.' },
            { title: 'Worked solutions', body: 'Every question explained by top MDCAT scorers — no bare answer keys.' },
          ].map(({ title, body }) => (
            <div key={title} className="card-base p-6 text-center">
              <h3 className="text-base">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Email capture */}
      <section className="bg-brand-light py-16">
        <div className="container-site max-w-xl">
          <div className="card-base p-8 text-center sm:p-10">
            <h2 className="text-2xl">Register for early access</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Leave your email and we&apos;ll send you the mock test link along with the solutions pack before public
              registration opens.
            </p>

            {confirmedEmail ? (
              <div
                className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-emerald-50 p-5 text-emerald-800"
                role="status"
              >
                <CheckCircle2 size={28} aria-hidden="true" />
                <p className="text-sm font-semibold">
                  Registration received. Check your inbox to confirm your email address.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3">
                <label htmlFor="notify-email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="notify-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'notify-email-error' : undefined}
                    className="input-field pl-11"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p id="notify-email-error" role="alert" className="text-left text-xs font-medium text-red-600">
                    {errors.email.message}
                  </p>
                )}
                <button type="submit" disabled={subscribe.isPending} className="btn-primary w-full">
                  {subscribe.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Adding you…
                    </>
                  ) : (
                    'Notify me at launch'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Past papers by university */}
      <section className="container-site py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Learn from the real thing</p>
          <h2 className="section-title mt-2">Past papers by university</h2>
          <p className="section-sub mt-4">
            Full-length MDCAT papers conducted by individual universities, preserved exactly as they were set.
            Practise them under timed conditions before attempting our mock.
          </p>
        </div>

        <div className="mt-6 max-w-2xl">
          <Link
            to="/mdcat/practice"
            className="btn btn-primary"
          >
            Practise online — attempt MCQs &amp; get scored <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="mt-2 text-sm text-smoke">Timed sets with instant scoring and worked explanations.</p>
        </div>

        {papersLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="card-base h-40 animate-pulse" aria-hidden="true" />
            ))}
          </div>
        ) : groups.length === 0 && otherPapers.length === 0 ? (
          <div className="card-base mt-10 p-8 text-center text-sm text-slate-500">
            No past papers published yet — check back soon.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {groups.map(({ university, shortName, province, papers: groupPapers }) => (
              <article key={university} className="card-base flex flex-col p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold">{university}</h3>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                      {shortName}
                    </p>
                  </div>
                  <span className="pill">{province}</span>
                </div>

                <ul className="mt-5 flex-1 space-y-3">
                  {groupPapers.map((paper) => {
                    const pdf = paper.links?.find((l) => l.type === 'pdf') ?? paper.links?.[0];
                    return (
                      <li
                        key={paper.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                            <FileText size={17} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{paper.title}</p>
                            {pdf && (
                              <a
                                href={pdf.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-secondary hover:underline"
                              >
                                {pdf.label}
                              </a>
                            )}
                          </div>
                        </div>
                        {pdf && (
                          <a
                            href={pdf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline shrink-0 !px-4 !py-1.5 text-xs"
                          >
                            View paper
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}

            {otherPapers.length > 0 && (
              <article className="card-base flex flex-col p-7">
                <h3 className="font-display text-xl font-semibold">Other universities</h3>
                <ul className="mt-5 flex-1 space-y-3">
                  {otherPapers.map((paper) => {
                    const pdf = paper.links?.find((l) => l.type === 'pdf') ?? paper.links?.[0];
                    return (
                      <li key={paper.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{paper.title}</p>
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {paper.yearTag}
                          </span>
                        </div>
                        {pdf && (
                          <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="btn-outline shrink-0 !px-4 !py-1.5 text-xs">
                            View
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            )}
          </div>
        )}

        <p className="mt-6 text-sm text-slate-500">
          Have an official past paper we are missing?{' '}
          <Link to="/contact" className="font-semibold text-secondary hover:underline">
            Send it to us
          </Link>{' '}
          and help other students.
        </p>
      </section>
    </>
  );
}
