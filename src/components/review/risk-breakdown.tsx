'use client';
import { useAccessibleMotion } from '@/lib/use-reduced-motion';
import { motion } from 'motion/react';
import type { Reason } from '@/lib/types';
export function RiskBreakdown({ reasons, loop = false }: { reasons: Reason[]; loop?: boolean }) {
  const reduced = useAccessibleMotion();
  return (
    <div className="risk-list">
      {reasons.length === 0 ? (
        <p className="muted">No risk signals. Within the current policy.</p>
      ) : (
        reasons.map((r, i) => (
          <div className="risk-row" key={r.ruleId} title={r.detail}>
            <div>
              <span>{r.label}</span>
              <strong className={r.points < 0 ? 'text-auto' : ''}>
                {r.points > 0 ? '+' : ''}
                {r.points === 0 ? 'Block' : r.points}
              </strong>
            </div>
            <div className="risk-track">
              <motion.div
                className={r.points < 0 ? 'credit' : r.points === 0 ? 'block' : ''}
                initial={reduced ? false : { scaleX: 0 }}
                animate={{
                  scaleX:
                    loop && !reduced
                      ? [
                          0,
                          Math.max(0.06, Math.abs(r.points) / 35),
                          Math.max(0.06, Math.abs(r.points) / 35),
                        ]
                      : Math.max(0.06, Math.abs(r.points) / 35),
                }}
                transition={{
                  delay: reduced ? 0 : i * 0.08,
                  duration: reduced ? 0 : loop ? 3 : 0.45,
                  repeat: loop && !reduced ? Infinity : 0,
                }}
              />
            </div>
            <small>{r.detail}</small>
          </div>
        ))
      )}
    </div>
  );
}
