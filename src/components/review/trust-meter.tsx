'use client';
import { useAccessibleMotion } from '@/lib/use-reduced-motion';
import { useEffect, useRef } from 'react';
import { animate, motion } from 'motion/react';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { autonomyRate, tierCounts } from '@/lib/score';
import type { ScoredAction } from '@/lib/types';
export function AnimatedNumber({
  value,
  suffix = '',
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduced = useAccessibleMotion();
  useEffect(() => {
    if (!ref.current) return;
    if (reduced) {
      ref.current.textContent = `${value}${suffix}`;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, suffix, reduced]);
  return (
    <span className={className} ref={ref}>
      {value}
      {suffix}
    </span>
  );
}
export function TrustRing({ value }: { value: number }) {
  const reduced = useAccessibleMotion();
  return (
    <div className="trust-ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r="51" />
        <motion.circle
          className="ring-fill"
          cx="60"
          cy="60"
          r="51"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: reduced ? 0 : 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div data-testid="autonomy">
        <AnimatedNumber value={value} suffix="%" />
        <small>autonomy</small>
      </div>
    </div>
  );
}
export function TrustMeter({ items }: { items: ScoredAction[] }) {
  const counts = tierCounts(items);
  return (
    <section className="trust-panel" aria-label="Agent autonomy">
      <TrustRing value={autonomyRate(items)} />
      <div className="trust-copy">
        <div className="eyebrow">
          <ShieldCheck size={15} /> Your agents, earning trust
        </div>
        <h2>
          The work moved forward.
          <br />
          You stayed in control.
        </h2>
        <p>
          {counts.auto} of {items.length} proposed actions cleared your policy automatically.
        </p>
      </div>
      <div className="trust-stats">
        <div className="tier-track">
          {(['auto', 'review', 'blocked'] as const).map((t) => (
            <motion.span
              key={t}
              className={t}
              animate={{ flex: counts[t] }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </div>
        <div className="stat-columns">
          {(['auto', 'review', 'blocked'] as const).map((t, i) => (
            <div key={t}>
              <span>
                <i className={`dot ${t}`} />
                {['Auto-run', 'Need review', 'Blocked'][i]}
              </span>
              <strong>
                {counts[t]}
                <ArrowUpRight size={14} />
              </strong>
            </div>
          ))}
        </div>
        <small>Policy applied to all {items.length} actions · demo workspace</small>
      </div>
    </section>
  );
}
