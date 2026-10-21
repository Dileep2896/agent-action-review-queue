import { describe, expect, it } from 'vitest';
import { DEFAULT_POLICY, RULES } from '@/lib/policy';
import { scoreAction } from '@/lib/score';
import type { ActionContext, ProposedAction, RuleId } from '@/lib/types';
export const base: ProposedAction = {
  id: 'test',
  agentId: 'agent',
  createdAt: '2026-10-21T15:30:00Z',
  tool: 'send_email',
  payload: { to: 'contact', subject: 'Hello', body: 'Following up on our meeting.' },
  evidence: {
    kind: 'email',
    excerpt: 'Let us reconnect.',
    sourceTitle: 'Follow-up',
    at: '2026-10-20T12:00:00Z',
  },
};
export const ctx: ActionContext = {
  agent: {
    id: 'agent',
    name: 'Test agent',
    approvalRate: 0.88,
    scope: {
      tools: [
        'send_email',
        'update_deal',
        'create_task',
        'update_stripe_subscription',
        'post_slack',
      ],
    },
  },
  contact: {
    id: 'contact',
    name: 'Sam Lee',
    email: 'sam@example.test',
    title: 'Manager',
    companyId: 'company',
    timezone: 'America/New_York',
    doNotContact: false,
  },
  company: { id: 'company', name: 'Example', tags: [] },
  deal: {
    id: 'deal',
    companyId: 'company',
    amount: 6000,
    stage: 'Proposal',
    nextStep: 'Follow up',
  },
  priorDomains: ['example.test'],
};
const action = (tool: string, payload: unknown) => ({ ...base, tool, payload }) as ProposedAction;
const cases: [RuleId, ProposedAction, ActionContext, number][] = [
  ['deal_amount', base, { ...ctx, deal: { ...ctx.deal!, amount: 25000 } }, 15],
  [
    'stage_change',
    action('update_deal', { dealId: 'deal', changes: { stage: 'Closed Lost' } }),
    ctx,
    25,
  ],
  ['exec_recipient', base, { ...ctx, contact: { ...ctx.contact!, title: 'CFO' } }, 30],
  ['strategic_account', base, { ...ctx, company: { ...ctx.company!, tags: ['strategic'] } }, 20],
  ['first_touch', base, { ...ctx, priorDomains: [] }, 15],
  [
    'money_tool',
    action('update_stripe_subscription', { customerId: 'company', change: 'upgrade' }),
    ctx,
    35,
  ],
  [
    'pricing_language',
    action('send_email', { ...base.payload, body: 'We can offer a 15% discount.' }),
    ctx,
    25,
  ],
  [
    'external_slack',
    action('post_slack', { channel: 'shared', external: true, text: 'Hello' }),
    ctx,
    20,
  ],
  ['quiet_hours', { ...base, sendAt: '2026-10-21T03:00:00Z' }, ctx, 10],
  ['agent_track_record', base, { ...ctx, agent: { ...ctx.agent, approvalRate: 0.78 } }, 15],
  [
    'low_impact_internal',
    action('create_task', {
      title: 'Prepare brief',
      dueAt: '2026-10-22',
      assignee: 'Alex',
      recordId: 'deal',
    }),
    ctx,
    -20,
  ],
  ['scope_violation', base, { ...ctx, agent: { ...ctx.agent, scope: { tools: [] } } }, 0],
  ['do_not_contact', base, { ...ctx, contact: { ...ctx.contact!, doNotContact: true } }, 0],
  [
    'discount_cap',
    action('update_stripe_subscription', { customerId: 'company', change: 'discount', pct: 21 }),
    ctx,
    0,
  ],
];
describe('policy rules', () => {
  for (const [id, a, c, points] of cases) {
    it(`${id} fires with an explanation`, () => {
      const r = RULES.find((r) => r.id === id)!.evaluate(a, c, DEFAULT_POLICY);
      expect(r?.points).toBe(points);
      expect(r?.detail).toBeTruthy();
    });
    it(`${id} does not fire for baseline`, () =>
      expect(RULES.find((r) => r.id === id)!.evaluate(base, ctx, DEFAULT_POLICY)).toBeNull());
    it(`${id} can be disabled`, () =>
      expect(
        scoreAction(a, c, {
          ...DEFAULT_POLICY,
          rules: { ...DEFAULT_POLICY.rules, [id]: false },
        }).reasons.some((r) => r.ruleId === id),
      ).toBe(false));
  }
  it('very large deals add 25', () =>
    expect(
      RULES[0].evaluate(base, { ...ctx, deal: { ...ctx.deal!, amount: 100000 } }, DEFAULT_POLICY)
        ?.points,
    ).toBe(25));
  it('excellent agents earn a trust credit', () =>
    expect(
      RULES.find((r) => r.id === 'agent_track_record')!.evaluate(
        base,
        { ...ctx, agent: { ...ctx.agent, approvalRate: 0.95 } },
        DEFAULT_POLICY,
      )?.points,
    ).toBe(-10));
  it('backwards stage changes are risky', () =>
    expect(
      scoreAction(
        action('update_deal', { dealId: 'deal', changes: { stage: 'Discovery' } }),
        ctx,
        DEFAULT_POLICY,
      ).score,
    ).toBe(25));
  it('quiet hours use recipient timezone and exclude 07:00', () =>
    expect(
      RULES.find((r) => r.id === 'quiet_hours')!.evaluate(
        { ...base, sendAt: '2026-10-21T11:00:00Z' },
        ctx,
        DEFAULT_POLICY,
      ),
    ).toBeNull());
  it('email percentage promises respect discount cap', () =>
    expect(
      scoreAction(
        action('send_email', { ...base.payload, body: 'A 25% discount for you' }),
        ctx,
        DEFAULT_POLICY,
      ).tier,
    ).toBe('blocked'));
});

it('refund caps apply to percentages and absolute refund amounts', () => {
  const refund = (payload: unknown) =>
    ({ ...base, tool: 'update_stripe_subscription', payload }) as ProposedAction;
  for (const payload of [
    { customerId: 'company', change: 'refund', pct: 30 },
    { customerId: 'company', change: 'refund', amount: 1800 },
  ])
    expect(scoreAction(refund(payload), ctx, DEFAULT_POLICY).tier).toBe('blocked');
  expect(
    scoreAction(refund({ customerId: 'company', change: 'discount', pct: 20 }), ctx, DEFAULT_POLICY)
      .tier,
  ).not.toBe('blocked');
});
