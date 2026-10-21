import {
  PolicySchema,
  ProposedActionSchema,
  type AuditEvent,
  type ContextResolver,
  type Policy,
  type ProposedAction,
  type ScoredAction,
} from './types';
import { scoreAction, scoreAll } from './score';
import { fieldDiff } from './diff';
import { NOW } from './time';
export type QueueItem = ScoredAction & { status: 'pending' | 'approved' | 'rejected' };
export type QueueState = {
  items: QueueItem[];
  policy: Policy;
  audit: Readonly<AuditEvent>[];
  history: QueueItem[][];
  resolve: ContextResolver;
};
export type QueueAction =
  | { type: 'approve'; id: string; editedPayload?: Record<string, unknown> }
  | { type: 'reject'; id: string; reason: string }
  | { type: 'batchApprove'; ids: string[] }
  | { type: 'undo' }
  | { type: 'setPolicy'; patch: Partial<Policy> };
export const createQueue = (
  actions: ProposedAction[],
  policy: Policy,
  resolve: ContextResolver,
): QueueState => ({
  items: scoreAll(actions, resolve, policy).map((i) => ({ ...i, status: 'pending' })),
  policy,
  audit: [],
  history: [],
  resolve,
});
function freezeEvent(e: AuditEvent): Readonly<AuditEvent> {
  if (e.diff) {
    for (const d of e.diff) Object.freeze(d);
    Object.freeze(e.diff);
  }
  return Object.freeze(e);
}
export function queueReducer(state: QueueState, event: QueueAction): QueueState {
  const audit = (e: Omit<AuditEvent, 'id' | 'actor' | 'at'>, index = 0) =>
    freezeEvent({
      ...e,
      id: `event-${state.audit.length + index + 1}`,
      actor: 'Alex Rivera',
      at: NOW,
    });
  if (event.type === 'setPolicy') {
    const policy = PolicySchema.parse({
      ...state.policy,
      ...event.patch,
      rules: { ...state.policy.rules, ...event.patch.rules },
    });
    return {
      ...state,
      policy,
      items: state.items.map((i) =>
        i.status === 'pending'
          ? { ...i, result: scoreAction(i.action, state.resolve(i.action), policy) }
          : i,
      ),
      audit: [
        ...state.audit,
        audit({
          actionId: 'policy',
          decision: 'policy_updated',
          tierAtDecision: 'auto',
          score: 0,
          diff: fieldDiff(state.policy, policy),
        }),
      ],
    };
  }
  if (event.type === 'undo') {
    const previous = state.history.at(-1);
    if (!previous) return state;
    const changed = state.items.filter(
      (i) => previous.find((p) => p.action.id === i.action.id)?.status !== i.status,
    );
    return {
      ...state,
      history: state.history.slice(0, -1),
      items: previous.map((i) =>
        i.status === 'pending'
          ? { ...i, result: scoreAction(i.action, state.resolve(i.action), state.policy) }
          : i,
      ),
      audit: [
        ...state.audit,
        ...changed.map((i, index) =>
          audit(
            {
              actionId: i.action.id,
              decision: 'undone',
              tierAtDecision: i.result.tier,
              score: i.result.score,
            },
            index,
          ),
        ),
      ],
    };
  }
  if (event.type === 'reject' && !event.reason.trim())
    throw new Error('A rejection reason is required');
  const ids = event.type === 'batchApprove' ? event.ids : [event.id];
  const events: Readonly<AuditEvent>[] = [];
  const items = state.items.map((i) => {
    if (!ids.includes(i.action.id) || i.status !== 'pending' || i.result.tier !== 'review')
      return i;
    let action = i.action;
    if (event.type === 'approve' && event.editedPayload) {
      action = ProposedActionSchema.parse({ ...action, payload: event.editedPayload });
      if (scoreAction(action, state.resolve(action), state.policy).tier === 'blocked')
        throw new Error('Edited action is blocked by policy');
    }
    const status = event.type === 'reject' ? 'rejected' : 'approved';
    events.push(
      audit(
        {
          actionId: action.id,
          decision: status,
          tierAtDecision: i.result.tier,
          score: i.result.score,
          ...(action !== i.action ? { diff: fieldDiff(i.action.payload, action.payload) } : {}),
          ...(event.type === 'reject' ? { reason: event.reason.trim() } : {}),
        },
        events.length,
      ),
    );
    return { ...i, action, status } as QueueItem;
  });
  return events.length
    ? {
        ...state,
        items,
        audit: [...state.audit, ...events],
        history: [...state.history, state.items],
      }
    : state;
}
