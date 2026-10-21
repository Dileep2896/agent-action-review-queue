'use client';
import { useAccessibleMotion } from '@/lib/use-reduced-motion';
import { AnimatePresence, motion } from 'motion/react';
import {
  Mail,
  GitBranch,
  CreditCard,
  MessageSquare,
  ListChecks,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import { agents } from '@/data/seed';
import type { QueueItem } from '@/lib/queue';
import { Checkbox } from '@/components/ui/primitives';
const icons = {
  send_email: Mail,
  update_deal: GitBranch,
  update_stripe_subscription: CreditCard,
  post_slack: MessageSquare,
  create_task: ListChecks,
};
export function ActionList({
  items,
  activeId,
  onSelect,
  selected,
  onCheck,
}: {
  items: QueueItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  selected: string[];
  onCheck: (id: string, checked: boolean) => void;
}) {
  const reduced = useAccessibleMotion();
  return (
    <div className="action-list" aria-label="Actions">
      <AnimatePresence initial={false}>
        {items.map((entry) => {
          const { action, result } = entry;
          const agent = agents.find((a) => a.id === action.agentId)!;
          const Icon = icons[action.tool];
          return (
            <motion.div
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : 24 }}
              transition={{ duration: 0.2 }}
              key={action.id}
              className={`action-row ${activeId === action.id ? 'selected' : ''}`}
            >
              {entry.status === 'pending' && result.tier === 'review' ? (
                <Checkbox
                  checked={selected.includes(action.id)}
                  onChange={(checked) => onCheck(action.id, checked)}
                  label={`Select ${action.summary}`}
                />
              ) : (
                <span className="row-marker">
                  <Icon size={15} />
                </span>
              )}
              <button
                className="action-select"
                onClick={() => onSelect(action.id)}
                aria-pressed={activeId === action.id}
              >
                <div className="row-agent">
                  <span className={`avatar small ${action.agentId}`}>
                    {agent.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </span>
                  <span>{agent.name}</span>
                  <small>8:30 AM</small>
                </div>
                <strong>{action.summary}</strong>
                <div className="row-meta">
                  <span>
                    <Icon size={12} />
                    {action.tool.replaceAll('_', ' ')}
                  </span>
                  <span className={`badge ${result.tier}`}>
                    {entry.status !== 'pending'
                      ? entry.status
                      : result.tier === 'blocked'
                        ? 'Blocked'
                        : `${result.score} risk`}
                  </span>
                </div>
              </button>
              <ChevronRight size={15} className="row-chevron" />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {items.length === 0 && (
        <div className="empty">
          <CheckCheck size={36} />
          <h3>Inbox zero. Your agents are trusted.</h3>
          <p>No actions match this view.</p>
        </div>
      )}
    </div>
  );
}
