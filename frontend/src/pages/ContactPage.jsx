import { useState } from 'react';
import { Clock, Instagram, Loader2, Mail, MessageCircle } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { useToast } from '../components/Toaster.jsx';
import { useSubmitContact } from '../hooks/queries.js';
import { SITE, SOCIALS } from '../lib/constants.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!form.email.trim()) errors.email = 'Please enter your email address';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Please enter a valid email address';
  if (!form.subject.trim()) errors.subject = 'Please enter a subject';
  else if (form.subject.trim().length < 3) errors.subject = 'Subject must be at least 3 characters';
  if (!form.message.trim()) errors.message = 'Please write a message';
  else if (form.message.trim().length < 10) errors.message = 'Message must be at least 10 characters';
  return errors;
}

export function ContactPage() {
  const toast = useToast();
  const submitContact = useSubmitContact();

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      const res = await submitContact.mutateAsync(form);
      toast.success(res?.message ?? 'Message sent successfully.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err?.message ?? 'Could not send your message. Please try again.');
    }
  };

  const sending = submitContact.isPending;

  return (
    <>
      <Seo
        title="Contact"
        description="Questions, feedback or resource contributions? Contact the MediHub Pakistan team."
        path="/contact"
      />

      <section className="bg-gradient-to-br from-brand to-brand-mid py-14 text-white">
        <div className="container-site">
          <h1 className="text-3xl !text-white sm:text-4xl">Contact us</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-light sm:text-base">
            Report a broken link, contribute resources, or share feedback — every message is reviewed by the team.
          </p>
        </div>
      </section>

      <section className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <div className="card-base p-7 sm:p-10">
          <h2 className="text-xl">Send us a message</h2>
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="contact-name"
                label="Full name"
                type="text"
                autoComplete="name"
                placeholder="Ayesha Khan"
                value={form.name}
                onChange={(ev) => setField('name', ev.target.value)}
                error={errors.name}
              />
              <Field
                id="contact-email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(ev) => setField('email', ev.target.value)}
                error={errors.email}
              />
            </div>

            <Field
              id="contact-subject"
              label="Subject"
              placeholder="e.g. Sharing 3rd-year pathology notes"
              value={form.subject}
              onChange={(ev) => setField('subject', ev.target.value)}
              error={errors.subject}
            />

            <div>
              <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Message <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <textarea
                id="contact-message"
                rows={6}
                placeholder="How can we help?"
                className="input-field resize-y"
                value={form.message}
                onChange={(ev) => setField('message', ev.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
              />
              <p className="mt-1 text-xs text-slate-400">Please write at least 10 characters so we understand your question.</p>
              {errors.message && (
                <p id="contact-message-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.message}
                </p>
              )}
            </div>

            <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto">
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…
                </>
              ) : (
                <>
                  <Mail size={16} aria-hidden="true" /> Send message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <h2 className="sr-only">Other ways to reach us</h2>

          <SocialCard
            href={`mailto:${SITE.supportEmail}`}
            icon={<Mail size={22} aria-hidden="true" />}
            title="Email"
            body={SITE.supportEmail}
            color="bg-brand-light text-brand border-brand-border hover:bg-brand-border/50"
          />
          <SocialCard
            href={SOCIALS.whatsapp.href}
            icon={<MessageCircle size={22} aria-hidden="true" />}
            title="WhatsApp"
            body={SOCIALS.whatsapp.tagline}
            color="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          />
          <SocialCard
            href={SOCIALS.instagram.href}
            icon={<Instagram size={22} aria-hidden="true" />}
            title="Instagram"
            body={SOCIALS.instagram.tagline}
            color="bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100"
          />

          <div className="rounded-2xl bg-brand-light p-6 text-sm leading-relaxed text-brand">
            <p className="flex items-center gap-2 font-bold">
              <Clock size={15} aria-hidden="true" /> Response time
            </p>
            <p className="mt-2">
              We reply to all messages within 48 hours, Monday to Saturday. Resource requests are handled faster through
              our WhatsApp communities.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}

function Field({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} <span aria-hidden="true" className="text-red-500">*</span>
      </label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="input-field" {...props} />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SocialCard({ href, icon, title, body, color }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={`flex items-center gap-4 rounded-2xl border p-5 transition-colors ${color}`}
      aria-label={`${title}: ${body}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center">{icon}</span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block break-all text-xs opacity-80">{body}</span>
      </span>
    </a>
  );
}