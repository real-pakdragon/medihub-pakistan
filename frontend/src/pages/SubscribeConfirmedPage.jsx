import { Link } from 'react-router-dom';
import { CheckCircle2, Link2Off } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { useSearchParams } from 'react-router-dom';

export function SubscribeConfirmedPage() {
  const [params] = useSearchParams();
  const invalid = params.get('status') === 'invalid';

  return (
    <>
      <Seo title="Subscription confirmed" path="/subscribe/confirmed" />
      <section className="container-site flex min-h-[60vh] items-center justify-center py-20">
        <div className="card-base max-w-md p-10 text-center">
          {invalid ? (
            <>
              <Link2Off size={44} className="mx-auto text-red-500" aria-hidden="true" />
              <h1 className="mt-4 text-xl">Invalid or expired link</h1>
              <p className="mt-2 text-sm text-slate-500">
                This confirmation link is invalid or has expired. Please submit your email again on the MDCAT page to
                receive a new one.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 size={48} className="mx-auto text-emerald-600" aria-hidden="true" />
              <h1 className="mt-4 text-xl">Email confirmed</h1>
              <p className="mt-2 text-sm text-slate-500">
                Your early-access registration is complete. We&apos;ll notify you by email as soon as the MDCAT mock
                test goes live.
              </p>
            </>
          )}
          <Link to="/mdcat" className="btn-primary mt-6">
            Back to MDCAT Prep
          </Link>
        </div>
      </section>
    </>
  );
}
