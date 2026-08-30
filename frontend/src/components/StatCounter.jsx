import { useEffect, useState } from 'react';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function StatCounter({ value, duration = 1600 }) {
  const [display, setDisplay] = useState(0);
  const numeric = Number(value) || 0;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(numeric);
      return undefined;
    }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(easeOut(progress) * numeric));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numeric, duration]);

  return <span>{display.toLocaleString('en-PK')}</span>;
}
