import {
  ruleIds,
  stages,
  type Policy,
  type Reason,
  type RuleId,
  type ProposedAction,
  type ActionContext,
} from './types';
import { localHour } from './time';
export const DEFAULT_POLICY: Policy = {
  reviewThreshold: 40,
  largeDealAmount: 25000,
  maxDiscountPct: 20,
  rules: Object.fromEntries(ruleIds.map((id) => [id, true])) as Policy['rules'],
};
type Rule = {
  id: RuleId;
  label: string;
  hardBlock?: boolean;
  evaluate: (a: ProposedAction, c: ActionContext, p: Policy) => Reason | null;
};
const rule = (
  id: RuleId,
  label: string,
  check: (
    a: ProposedAction,
    c: ActionContext,
    p: Policy,
  ) => { points: number; detail: string } | null,
  hardBlock = false,
): Rule => ({
  id,
  label,
  hardBlock,
  evaluate: (a, c, p) => {
    const r = check(a, c, p);
    return r ? { ruleId: id, label, ...r } : null;
  },
});
export const RULES: Rule[] = [
  rule('deal_amount', 'High-value deal', (a, c, p) =>
    c.deal && c.deal.amount >= p.largeDealAmount
      ? {
          points: c.deal.amount >= 4 * p.largeDealAmount ? 25 : 15,
          detail: `$${c.deal.amount.toLocaleString('en-US')} deal exceeds the $${p.largeDealAmount.toLocaleString('en-US')} threshold`,
        }
      : null,
  ),
  rule('stage_change', 'Sensitive stage change', (a, c) =>
    a.tool === 'update_deal' &&
    a.payload.changes.stage &&
    (a.payload.changes.stage.startsWith('Closed') ||
      (c.deal && stages.indexOf(a.payload.changes.stage) < stages.indexOf(c.deal.stage)))
      ? { points: 25, detail: `${c.deal?.stage ?? 'Current stage'} → ${a.payload.changes.stage}` }
      : null,
  ),
  rule('exec_recipient', 'Executive recipient', (a, c) =>
    a.tool === 'send_email' &&
    /\b(CEO|CFO|CTO|COO|VP|Founder|Chief|Vice President)\b/i.test(c.contact?.title ?? '')
      ? { points: 30, detail: `${c.contact?.name} is ${c.contact?.title}` }
      : null,
  ),
  rule('strategic_account', 'Strategic account', (a, c) =>
    c.company?.tags.includes('strategic')
      ? { points: 20, detail: `${c.company.name} is a strategic account` }
      : null,
  ),
  rule('first_touch', 'First contact', (a, c) =>
    a.tool === 'send_email' && c.contact && !c.priorDomains.includes(c.contact.email.split('@')[1])
      ? { points: 15, detail: `No prior conversation with ${c.contact.email.split('@')[1]}` }
      : null,
  ),
  rule('money_tool', 'Billing change', (a) =>
    a.tool === 'update_stripe_subscription'
      ? { points: 35, detail: `Subscription ${a.payload.change} changes customer billing` }
      : null,
  ),
  rule('pricing_language', 'Pricing commitment', (a) =>
    a.tool === 'send_email' && /discount|%|price|refund|contract/i.test(a.payload.body)
      ? { points: 25, detail: 'Draft includes a pricing or contractual commitment' }
      : null,
  ),
  rule('external_slack', 'External audience', (a) =>
    a.tool === 'post_slack' && a.payload.external
      ? { points: 20, detail: `#${a.payload.channel} is shared with customers` }
      : null,
  ),
  rule('quiet_hours', 'Outside working hours', (a, c) => {
    if (a.tool !== 'send_email' || !c.contact) return null;
    const h = localHour(c.contact.timezone, a.sendAt ?? a.createdAt);
    return h >= 20 || h < 7
      ? { points: 10, detail: `Scheduled at ${h}:00 in ${c.contact.timezone}` }
      : null;
  }),
  rule('agent_track_record', 'Agent track record', (a, c) =>
    c.agent.approvalRate < 0.8
      ? {
          points: 15,
          detail: `${Math.round(c.agent.approvalRate * 100)}% approved across the last 20 reviews`,
        }
      : c.agent.approvalRate >= 0.95
        ? {
            points: -10,
            detail: `${Math.round(c.agent.approvalRate * 100)}% approval rate earns a trust credit`,
          }
        : null,
  ),
  rule('low_impact_internal', 'Low-impact internal action', (a) =>
    a.tool === 'create_task'
      ? { points: -20, detail: 'Internal task; no customer-facing communication' }
      : null,
  ),
  rule(
    'scope_violation',
    'Outside agent scope',
    (a, c) =>
      !c.agent.scope.tools.includes(a.tool)
        ? { points: 0, detail: `${c.agent.name} is not permitted to use ${a.tool}` }
        : null,
    true,
  ),
  rule(
    'do_not_contact',
    'Do not contact',
    (a, c) =>
      a.tool === 'send_email' && c.contact?.doNotContact
        ? { points: 0, detail: `${c.contact.name} has opted out of contact` }
        : null,
    true,
  ),
  rule(
    'discount_cap',
    'Discount limit exceeded',
    (a, c, p) => {
      const pct =
        a.tool === 'update_stripe_subscription' &&
        (a.payload.change === 'discount' || a.payload.change === 'refund')
          ? (a.payload.pct ??
            (a.payload.amount && c.deal ? (100 * a.payload.amount) / c.deal.amount : 0))
          : a.tool === 'send_email' && /discount|refund/i.test(a.payload.body)
            ? Math.max(
                0,
                ...Array.from(a.payload.body.matchAll(/(\d+(?:\.\d+)?)\s*%/g), (m) => Number(m[1])),
              )
            : 0;
      return pct > p.maxDiscountPct
        ? { points: 0, detail: `${pct}% exceeds the ${p.maxDiscountPct}% policy cap` }
        : null;
    },
    true,
  ),
];
