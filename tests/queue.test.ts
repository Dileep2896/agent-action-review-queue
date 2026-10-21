import { expect, it } from 'vitest';
import { actions, contextFor } from '@/data/seed';
import { createQueue, queueReducer } from '@/lib/queue';
import { DEFAULT_POLICY } from '@/lib/policy';
const initial = () => createQueue(actions, DEFAULT_POLICY, contextFor);
const reviewId = () => initial().items.find((i) => i.result.tier === 'review')!.action.id;
it('approve appends immutable audit', () => {
  const s = initial();
  const n = queueReducer(s, { type: 'approve', id: reviewId() });
  expect(n.items.find((i) => i.action.id === reviewId())?.status).toBe('approved');
  expect(n.audit).toHaveLength(1);
  expect(s.audit).toHaveLength(0);
  expect(Object.isFrozen(n.audit[0])).toBe(true);
});
it('edit and approve records field diff', () => {
  const s = initial();
  const entry = s.items.find((i) => i.action.id === reviewId())!;
  const n = queueReducer(s, {
    type: 'approve',
    id: reviewId(),
    editedPayload: { ...entry.action.payload, body: 'An updated draft' },
  });
  expect(n.audit[0].diff).toEqual(
    expect.arrayContaining([expect.objectContaining({ field: 'body', after: 'An updated draft' })]),
  );
});
it('reject requires nonblank reason', () => {
  expect(() => queueReducer(initial(), { type: 'reject', id: reviewId(), reason: ' ' })).toThrow(
    /reason/i,
  );
  expect(
    queueReducer(initial(), {
      type: 'reject',
      id: reviewId(),
      reason: 'Needs a personal follow-up',
    }).audit[0].reason,
  ).toBe('Needs a personal follow-up');
});
it('batch ignores auto, blocked, duplicate and unknown IDs', () => {
  const s = initial();
  const n = queueReducer(s, {
    type: 'batchApprove',
    ids: [...s.items.map((i) => i.action.id), reviewId(), 'missing'],
  });
  expect(n.audit).toHaveLength(9);
  expect(n.items.filter((i) => i.status === 'approved')).toHaveLength(9);
});
it('undo restores last batch while preserving append-only audit', () => {
  const s = initial();
  const n = queueReducer(s, {
    type: 'batchApprove',
    ids: s.items
      .filter((i) => i.result.tier === 'review')
      .slice(0, 3)
      .map((i) => i.action.id),
  });
  const u = queueReducer(n, { type: 'undo' });
  expect(u.items).toEqual(s.items);
  expect(u.audit.slice(0, 3)).toEqual(n.audit);
  expect(u.audit.filter((e) => e.decision === 'undone')).toHaveLength(3);
});
it('policy updates pending only', () => {
  const s = initial();
  const id = s.items.find(
    (i) => i.result.score >= 40 && i.result.score < 50 && i.result.tier === 'review',
  )!.action.id;
  const n = queueReducer(queueReducer(s, { type: 'approve', id }), {
    type: 'setPolicy',
    patch: { reviewThreshold: 50 },
  });
  expect(n.items.find((i) => i.action.id === id)?.result.tier).toBe('review');
  expect(n.items.filter((i) => i.status === 'pending' && i.result.tier === 'auto')).toHaveLength(
    25,
  );
  expect(n.audit.some((e) => e.decision === 'policy_updated')).toBe(true);
});
it('cannot approve blocked, reapprove decided, or edit into a violation', () => {
  const s = initial();
  const blocked = s.items.find((i) => i.result.tier === 'blocked')!.action.id;
  expect(queueReducer(s, { type: 'approve', id: blocked })).toBe(s);
  const n = queueReducer(s, { type: 'approve', id: reviewId() });
  expect(queueReducer(n, { type: 'approve', id: reviewId() })).toBe(n);
  expect(() =>
    queueReducer(s, {
      type: 'approve',
      id: reviewId(),
      editedPayload: { to: 'c0', subject: 'Offer', body: 'A 90% discount' },
    }),
  ).toThrow(/blocked/i);
});

it('undo after a policy change restores pending items under the current policy', () => {
  const s = initial();
  const id = 'a07';
  const approved = queueReducer(s, { type: 'approve', id });
  const changed = queueReducer(approved, { type: 'setPolicy', patch: { reviewThreshold: 50 } });
  const undone = queueReducer(changed, { type: 'undo' });
  expect(undone.items.find((i) => i.action.id === id)?.result.tier).toBe('auto');
  expect(undone.items.find((i) => i.action.id === id)?.status).toBe('pending');
  expect(undone.policy.reviewThreshold).toBe(50);
});
