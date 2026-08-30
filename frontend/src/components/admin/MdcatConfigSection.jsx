import { useEffect, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';

import { useMdcatStatus, useUpdateMdcatConfig } from '../../hooks/queries.js';
import { useToast } from '../Toaster.jsx';

const toInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function MdcatConfigSection() {
  const toast = useToast();
  const { data: status, isLoading } = useMdcatStatus();
  const updateConfig = useUpdateMdcatConfig();

  const [launchDate, setLaunchDate] = useState('');
  const [currentPhase, setCurrentPhase] = useState('');
  const [phaseDescription, setPhaseDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status) {
      setLaunchDate(toInputValue(status.launchDate));
      setCurrentPhase(status.currentPhase);
      setPhaseDescription(status.phaseDescription);
    }
  }, [status]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const date = new Date(launchDate);
    if (!launchDate || Number.isNaN(date.getTime())) {
      setError('Pick a valid launch date and time');
      return;
    }
    try {
      await updateConfig.mutateAsync({ launchDate: date.toISOString(), currentPhase, phaseDescription });
      toast.success('Countdown updated — the public site now shows the new date.');
      setError('');
    } catch (err) {
      toast.error(err?.message ?? 'Update failed');
    }
  };

  if (isLoading) return <p className="p-6 text-center text-sm text-slate-400">Loading config…</p>;

  return (
    <section aria-labelledby="admin-mdcat-title" className="max-w-xl">
      <h1 id="admin-mdcat-title" className="text-xl sm:text-2xl">
        MDCAT Countdown Settings
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        The public countdown timer reads these values live from the API — changes apply instantly.
      </p>

      <form onSubmit={onSubmit} noValidate className="card-base mt-6 space-y-5 p-7">
        <div>
          <label htmlFor="mdcat-launch" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Launch date &amp; time *
          </label>
          <input
            id="mdcat-launch"
            type="datetime-local"
            className="input-field"
            value={launchDate}
            onChange={(e) => setLaunchDate(e.target.value)}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="mdcat-phase" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Current phase badge
          </label>
          <input
            id="mdcat-phase"
            type="text"
            maxLength={60}
            className="input-field"
            placeholder="e.g. Registration Open"
            value={currentPhase}
            onChange={(e) => setCurrentPhase(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="mdcat-desc" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Phase description
          </label>
          <textarea
            id="mdcat-desc"
            rows={3}
            maxLength={300}
            className="input-field resize-y"
            placeholder="Shown under the headline on /mdcat"
            value={phaseDescription}
            onChange={(e) => setPhaseDescription(e.target.value)}
          />
        </div>

        <button type="submit" disabled={updateConfig.isPending} className="btn-primary">
          {updateConfig.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Saving…
            </>
          ) : (
            <>
              <CalendarClock size={16} aria-hidden="true" /> Save countdown settings
            </>
          )}
        </button>
      </form>
    </section>
  );
}
