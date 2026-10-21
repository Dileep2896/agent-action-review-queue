import { expect, it } from 'vitest';
import { fieldDiff } from '@/lib/diff';
it('returns changed, added and removed fields only', () =>
  expect(
    fieldDiff(
      { stage: 'Proposal', amount: 20, old: true },
      { stage: 'Closed Won', amount: 20, next: 'Call' },
    ),
  ).toEqual([
    { field: 'stage', before: 'Proposal', after: 'Closed Won' },
    { field: 'old', before: true, after: undefined },
    { field: 'next', before: undefined, after: 'Call' },
  ]));
it('compares nested values structurally', () =>
  expect(fieldDiff({ x: { a: 1 } }, { x: { a: 1 } })).toEqual([]));
