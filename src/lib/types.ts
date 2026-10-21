import { z } from 'zod';
export const toolNames = [
  'send_email',
  'update_deal',
  'create_task',
  'update_stripe_subscription',
  'post_slack',
] as const;
export const ruleIds = [
  'deal_amount',
  'stage_change',
  'exec_recipient',
  'strategic_account',
  'first_touch',
  'money_tool',
  'pricing_language',
  'external_slack',
  'quiet_hours',
  'agent_track_record',
  'low_impact_internal',
  'scope_violation',
  'do_not_contact',
  'discount_cap',
] as const;
export type RuleId = (typeof ruleIds)[number];
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  approvalRate: z.number().min(0).max(1),
  scope: z.object({ tools: z.array(z.enum(toolNames)) }),
});
export const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  title: z.string(),
  companyId: z.string(),
  timezone: z.string(),
  doNotContact: z.boolean(),
});
export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  tags: z.array(z.string()),
});
export const stages = [
  'Discovery',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
] as const;
export const DealSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  amount: z.number().nonnegative(),
  stage: z.enum(stages),
  nextStep: z.string().optional(),
  closeDate: z.string().optional(),
});
export const payloadSchemas = {
  send_email: z.object({
    to: z.string(),
    subject: z.string().min(1),
    body: z.string().min(1),
    threadId: z.string().optional(),
  }),
  update_deal: z.object({
    dealId: z.string(),
    changes: z.object({
      stage: z.enum(stages).optional(),
      amount: z.number().nonnegative().optional(),
      closeDate: z.string().optional(),
      nextStep: z.string().optional(),
    }),
  }),
  create_task: z.object({
    title: z.string().min(1),
    dueAt: z.string(),
    assignee: z.string(),
    recordId: z.string(),
  }),
  update_stripe_subscription: z.object({
    customerId: z.string(),
    change: z.enum(['discount', 'upgrade', 'downgrade', 'refund']),
    pct: z.number().min(0).max(100).optional(),
    amount: z.number().nonnegative().optional(),
  }),
  post_slack: z.object({ channel: z.string(), external: z.boolean(), text: z.string().min(1) }),
};
const base = {
  id: z.string(),
  agentId: z.string(),
  createdAt: z.string(),
  sendAt: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  summary: z.string().optional(),
  evidence: z.object({
    kind: z.enum(['email', 'meeting', 'usage']),
    excerpt: z.string(),
    sourceTitle: z.string(),
    at: z.string(),
  }),
};
export const ProposedActionSchema = z.discriminatedUnion('tool', [
  z.object({ ...base, tool: z.literal('send_email'), payload: payloadSchemas.send_email }),
  z.object({ ...base, tool: z.literal('update_deal'), payload: payloadSchemas.update_deal }),
  z.object({ ...base, tool: z.literal('create_task'), payload: payloadSchemas.create_task }),
  z.object({
    ...base,
    tool: z.literal('update_stripe_subscription'),
    payload: payloadSchemas.update_stripe_subscription,
  }),
  z.object({ ...base, tool: z.literal('post_slack'), payload: payloadSchemas.post_slack }),
]);
export const PolicySchema = z.object({
  reviewThreshold: z.number().int().min(0).max(100),
  largeDealAmount: z.number().positive(),
  maxDiscountPct: z.number().min(0).max(100),
  rules: z.record(z.enum(ruleIds), z.boolean()),
});
export const ReasonSchema = z.object({
  ruleId: z.enum(ruleIds),
  label: z.string(),
  points: z.number(),
  detail: z.string(),
});
export const TierSchema = z.enum(['auto', 'review', 'blocked']);
export const AuditEventSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  actor: z.string(),
  decision: z.enum(['approved', 'rejected', 'undone', 'policy_updated']),
  tierAtDecision: TierSchema,
  score: z.number(),
  diff: z
    .array(
      z.object({
        field: z.string(),
        before: z.unknown().optional(),
        after: z.unknown().optional(),
      }),
    )
    .optional(),
  reason: z.string().optional(),
  at: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type Deal = z.infer<typeof DealSchema>;
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type Reason = z.infer<typeof ReasonSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type Tier = z.infer<typeof TierSchema>;
export type ScoreResult = { score: number; tier: Tier; reasons: Reason[] };
export type ActionContext = {
  agent: Agent;
  contact?: Contact;
  company?: Company;
  deal?: Deal;
  priorDomains: string[];
};
export type ContextResolver = (action: ProposedAction) => ActionContext;
export type ScoredAction = { action: ProposedAction; result: ScoreResult };
