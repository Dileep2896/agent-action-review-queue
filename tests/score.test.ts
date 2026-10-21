import { expect, it } from 'vitest';
import { actions, contextFor } from '@/data/seed';
import { DEFAULT_POLICY } from '@/lib/policy';
import { scoreAction, scoreAll, tierCounts, autonomyRate } from '@/lib/score';
it('seeds exactly 34 valid actions: 23/9/2 and 68%', () => {
  const scored = scoreAll(actions, contextFor, DEFAULT_POLICY);
  expect(actions).toHaveLength(34);
  expect(tierCounts(scored)).toEqual({ auto: 23, review: 9, blocked: 2 });
  expect(autonomyRate(scored)).toBe(68);
});
it('threshold 50 re-tiers exactly three: 26/6/2 and 76%', () => {
  const scored = scoreAll(actions, contextFor, { ...DEFAULT_POLICY, reviewThreshold: 50 });
  expect(tierCounts(scored)).toEqual({ auto: 26, review: 6, blocked: 2 });
  expect(autonomyRate(scored)).toBe(76);
});
it('scores are clamped and reasons sorted', () => {
  for (const a of actions) {
    const r = scoreAction(a, contextFor(a), DEFAULT_POLICY);
    expect(r.score).toBe(
      Math.max(
        0,
        Math.min(
          100,
          r.reasons.reduce((s, r) => s + r.points, 0),
        ),
      ),
    );
    expect(r.reasons.map((r) => r.points)).toEqual(
      r.reasons.map((r) => r.points).sort((a, b) => b - a),
    );
  }
});
it('hard blocks override low scores', () => {
  const entry = scoreAll(actions, contextFor, DEFAULT_POLICY).find((x) =>
    x.result.reasons.some((r) => r.ruleId === 'scope_violation'),
  )!;
  expect(entry.result.tier).toBe('blocked');
  expect(entry.result.score).toBeLessThan(40);
});
it('empty autonomy is zero', () => expect(autonomyRate([])).toBe(0));
