import { Link } from 'react-router-dom';
import { Award, BookMarked, GraduationCap, Users } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { SOCIALS } from '../lib/constants.js';

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="MediHub Pakistan is a study platform built by Pakistani medical students and graduates — curated notes, past papers and communities for MBBS and MDCAT."
        path="/about"
      />

      <section className="bg-gradient-to-br from-brand to-brand-mid py-14 text-white">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl !text-white sm:text-4xl">About MediHub Pakistan</h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-light sm:text-base">
            MediHub Pakistan is a study platform developed by medical students and recent graduates from institutions
            across the country. Our mission is to make high-quality academic resources organised, accessible and
            reliable for every MBBS student preparing for professional examinations and the MDCAT.
          </p>
        </div>
      </section>

      <section className="container-site py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              icon: BookMarked,
              title: 'Curated content',
              body: 'Every resource is contributed by senior students, reviewed against the PMDC curriculum, and organised by subject and academic year.',
            },
            {
              icon: Users,
              title: 'Community-driven',
              body: 'City-wise WhatsApp groups connect juniors with experienced seniors for daily doubt-solving, quiz drills and exam guidance.',
            },
            {
              icon: Award,
              title: 'Exam-focused',
              body: 'From professional-year past papers to a full-length MDCAT mock series, everything targets the examinations you actually sit.',
            },
            {
              icon: GraduationCap,
              title: 'Built by medics',
              body: 'The platform is maintained by practising doctors, house officers and final-year students who understand the demands of medical education in Pakistan.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card-base flex gap-5 p-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-brand-light p-8 text-center sm:p-12">
          <h2 className="text-xl sm:text-2xl">Contribute to the platform</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
            Share your notes, host a revision session, or moderate a WhatsApp group — we welcome contributions from
            students and faculty alike.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="btn-primary">
              Contact the team
            </Link>
            <a href={SOCIALS.whatsapp.href} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Join a community
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
