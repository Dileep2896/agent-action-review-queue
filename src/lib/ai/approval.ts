import type { ModelMessage } from 'ai';
import { scoreAction } from '../score';
import type { ActionContext, Policy, ProposedAction, ScoreResult } from '../types';
export class PolicyBlockedError extends Error {
  constructor(public readonly result: ScoreResult) {
    super(`Policy blocked: ${result.reasons.map((r) => r.label).join(', ')}`);
    this.name = 'PolicyBlockedError';
  }
}
export type ApprovalOptions = { toolCallId: string; messages: ModelMessage[] };
export function makeNeedsApproval(
  policy: Policy,
  ctxResolver: (
    input: unknown,
    options: ApprovalOptions,
  ) =>
    | { action: ProposedAction; ctx: ActionContext }
    | Promise<{ action: ProposedAction; ctx: ActionContext }>,
) {
  return async (input: unknown, options: ApprovalOptions): Promise<boolean> => {
    const { action, ctx } = await ctxResolver(input, options);
    const result = scoreAction(action, ctx, policy);
    if (result.tier === 'blocked') throw new PolicyBlockedError(result);
    return result.tier === 'review';
  };
}
