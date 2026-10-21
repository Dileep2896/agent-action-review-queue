'use client';
import { useAccessibleMotion } from '@/lib/use-reduced-motion';
import { motion } from 'motion/react';
import { History, Check, Undo2, SlidersHorizontal, X } from 'lucide-react';
import type { AuditEvent } from '@/lib/types';
export function AuditTimeline({ events }: { events: Readonly<AuditEvent>[] }) {
  const reduced = useAccessibleMotion();
  return (
    <section className="audit-panel" data-testid="audit">
      <h2>
        <History size={17} /> Audit trail <span>{events.length} events</span>
      </h2>
      {events.length === 0 ? (
        <p className="muted">
          Every decision leaves a trace. Your approvals, edits, and policy changes will appear here.
        </p>
      ) : (
        <div className="audit-events">
          {events
            .slice()
            .reverse()
            .map((e) => (
              <motion.div
                key={e.id}
                initial={reduced ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="audit-event"
              >
                {e.decision === 'approved' ? (
                  <Check size={16} />
                ) : e.decision === 'rejected' ? (
                  <X size={16} />
                ) : e.decision === 'undone' ? (
                  <Undo2 size={16} />
                ) : (
                  <SlidersHorizontal size={16} />
                )}
                <div>
                  <strong>
                    {e.decision === 'policy_updated'
                      ? 'Policy updated'
                      : e.decision === 'undone'
                        ? 'Decision undone'
                        : e.decision === 'approved'
                          ? 'Approved'
                          : 'Rejected'}
                  </strong>
                  <span>
                    {' '}
                    {e.actionId === 'policy' ? '' : e.actionId} · {e.actor}
                  </span>
                  <p>
                    {e.reason ??
                      (e.diff?.length
                        ? `${e.diff.length} field${e.diff.length > 1 ? 's' : ''} changed`
                        : `${e.tierAtDecision} · risk score ${e.score}`)}
                  </p>
                </div>
                <time>8:30 AM</time>
              </motion.div>
            ))}
        </div>
      )}
    </section>
  );
}
