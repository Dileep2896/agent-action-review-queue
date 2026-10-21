import { contacts } from '@/data/seed';
import type { ProposedAction } from '@/lib/types';
export function EmailPreview({
  action,
}: {
  action: Extract<ProposedAction, { tool: 'send_email' }>;
}) {
  const contact = contacts.find((c) => c.id === action.payload.to);
  return (
    <div className="email-preview">
      <div className="email-meta">
        <span>To</span>
        <strong>{contact?.name}</strong>
        <small>{contact?.email}</small>
      </div>
      <div className="email-meta">
        <span>Subject</span>
        <strong>{action.payload.subject}</strong>
      </div>
      <p>{action.payload.body}</p>
      <div className="draft-label">Drafted by your agent · awaiting your approval</div>
    </div>
  );
}
