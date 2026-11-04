import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" />
      <section className="container-site flex min-h-[60vh] items-center justify-center py-20 text-center">
        <div>
          <Compass size={56} className="mx-auto text-brand-mid" aria-hidden="true" />
          <h1 className="mt-5 text-3xl">404 — page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
            The page you are looking for does not exist or has been moved. Use the links below to continue.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/" className="btn-primary">
              Go home
            </Link>
            <Link to="/mbbs" className="btn-secondary">
              MBBS
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
