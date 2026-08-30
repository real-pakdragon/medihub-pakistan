import { useEffect, useMemo, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

function getRemaining(target) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    done: diff === 0,
  };
}

export function CountdownTimer({ launchDate }) {
  const target = useMemo(() => new Date(launchDate), [launchDate]);
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    setRemaining(getRemaining(target));
    const id = window.setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (Number.isNaN(target.getTime())) {
    return <p className="text-sm text-brand-light/80">Launch date coming soon.</p>;
  }

  const units = [
    { label: 'Days', value: remaining.days },
    { label: 'Hours', value: remaining.hours },
    { label: 'Minutes', value: remaining.minutes },
    { label: 'Seconds', value: remaining.seconds },
  ];

  return (
    <div role="timer" aria-label="Countdown to MDCAT mock test launch" className="grid grid-cols-4 gap-2 sm:gap-4">
      {units.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/20 bg-white/10 px-2 py-4 text-center backdrop-blur-sm sm:py-6"
        >
          <div className="text-2xl font-extrabold tabular-nums text-white sm:text-4xl">{pad(value)}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand-light sm:text-xs">
            {label}
          </div>
        </div>
      ))}
      {remaining.done && (
        <p className="col-span-4 mt-2 text-center text-sm font-semibold text-white">The wait is over — it's live!</p>
      )}
    </div>
  );
}
