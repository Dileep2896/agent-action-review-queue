import { RULES } from './policy';
import type {
  ActionContext,
  ContextResolver,
  Policy,
  ProposedAction,
  ScoreResult,
  ScoredAction,
} from './types';
export function scoreAction(
  action: ProposedAction,
  ctx: ActionContext,
  policy: Policy,
): ScoreResult {
  const fired = RULES.filter((r) => policy.rules[r.id])
    .map((rule) => ({ rule, reason: rule.evaluate(action, ctx, policy) }))
    .filter((x) => x.reason !== null);
  const reasons = fired.map((x) => x.reason!).sort((a, b) => b.points - a.points);
  const score = Math.max(
    0,
    Math.min(
      100,
      reasons.reduce((sum, r) => sum + r.points, 0),
    ),
  );
  return {
    score,
    tier: fired.some((x) => x.rule.hardBlock)
      ? 'blocked'
      : score >= policy.reviewThreshold
        ? 'review'
        : 'auto',
    reasons,
  };
}
export const scoreAll = (
  actions: ProposedAction[],
  resolve: ContextResolver,
  policy: Policy,
): ScoredAction[] =>
  actions.map((action) => ({ action, result: scoreAction(action, resolve(action), policy) }));
export const tierCounts = (items: ScoredAction[]) =>
  items.reduce(
    (counts, entry) => ({ ...counts, [entry.result.tier]: counts[entry.result.tier] + 1 }),
    { auto: 0, review: 0, blocked: 0 },
  );
export const autonomyRate = (items: ScoredAction[]) =>
  items.length ? Math.round((tierCounts(items).auto / items.length) * 100) : 0;
