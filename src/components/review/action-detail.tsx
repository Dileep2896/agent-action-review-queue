'use client';
import { Mail, FileText, ShieldAlert, Check, PenLine, X, ArrowUpRight } from 'lucide-react';
import { contextFor } from '@/data/seed';
import type { QueueItem } from '@/lib/queue';
import { Button } from '@/components/ui/primitives';
import { RiskBreakdown } from './risk-breakdown';
import { EmailPreview } from './email-preview';
import { FieldDiff } from './field-diff';
export function ActionDetail({
  entry,
  onApprove,
  onEdit,
  onReject,
}: {
  entry: QueueItem;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}) {
  const { action, result, status } = entry;
  const ctx = contextFor(action);
  return (
    <article className="detail-panel">
      <div className="detail-top">
        <span className="tool-label">
          <Mail size={16} />
          {action.tool.replaceAll('_', ' ')}
        </span>
        <span className={`badge ${result.tier}`}>
          {result.tier === 'blocked' ? 'Policy violation' : `${result.score} risk score`}
        </span>
      </div>
      <h2>{action.summary}</h2>
      <div className="detail-agent">
        <span className={`avatar ${action.agentId}`}>
          {ctx.agent.name
            .split(' ')
            .map((w) => w[0])
            .join('')}
        </span>
        <span>
          {ctx.agent.name}
          <small>Proposed today at 8:30 AM</small>
        </span>
        {ctx.deal && (
          <strong>
            ${ctx.deal.amount.toLocaleString('en-US')}
            <small>Deal value</small>
          </strong>
        )}
      </div>
      <div className="section-caption">
        <FileText size={14} /> Source evidence <ArrowUpRight size={14} />
      </div>
      <div className="evidence">
        <strong>{action.evidence.sourceTitle}</strong>
        <p>“{action.evidence.excerpt}”</p>
        <small>{action.evidence.kind} · Oct 20, 2026</small>
      </div>
      <div className="section-caption">Proposed action</div>
      {action.tool === 'send_email' ? (
        <EmailPreview action={action} />
      ) : action.tool === 'update_deal' ? (
        <FieldDiff
          before={Object.fromEntries(
            Object.keys(action.payload.changes).map((k) => [
              k,
              ctx.deal?.[k as keyof typeof ctx.deal],
            ]),
          )}
          after={action.payload.changes}
        />
      ) : action.tool === 'update_stripe_subscription' ? (
        <FieldDiff before={{ change: 'Current plan', pct: 0 }} after={action.payload} />
      ) : action.tool === 'post_slack' ? (
        <div className="email-preview">
          <strong>#{action.payload.channel}</strong>
          <p>{action.payload.text}</p>
        </div>
      ) : (
        <div className="email-preview">
          <strong>{action.payload.title}</strong>
          <p>
            Assigned to {action.payload.assignee} · Due {action.payload.dueAt}
          </p>
        </div>
      )}
      <div className="section-caption risk-heading">
        <span>
          Why this{' '}
          {result.tier === 'blocked'
            ? 'was blocked'
            : result.tier === 'review'
              ? 'needs you'
              : 'can run'}
        </span>
        <span>{result.score}/100</span>
      </div>
      <RiskBreakdown key={action.id} reasons={result.reasons} />
      <footer className="decision-bar">
        {status !== 'pending' ? (
          <div className="decision-message">
            <Check size={18} /> {status === 'approved' ? 'Approved' : 'Rejected'} · recorded in the
            audit trail
          </div>
        ) : result.tier === 'blocked' ? (
          <div className="decision-message text-blocked">
            <ShieldAlert size={18} /> Blocked by policy. This action cannot be approved.
          </div>
        ) : result.tier === 'auto' ? (
          <div className="decision-message text-auto">
            <Check size={18} /> Automatically cleared by your policy
          </div>
        ) : (
          <>
            <Button variant="ghost" onClick={onReject} aria-label="Reject action">
              <X size={16} />
              Reject
            </Button>
            <span className="spacer" />
            <Button onClick={onEdit}>
              <PenLine size={14} />
              Edit & approve
            </Button>
            <Button variant="primary" onClick={onApprove} aria-label="Approve action">
              <Check size={16} />
              Approve<kbd>A</kbd>
            </Button>
          </>
        )}
      </footer>
    </article>
  );
}
