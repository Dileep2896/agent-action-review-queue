import {
  AgentSchema,
  CompanySchema,
  ContactSchema,
  DealSchema,
  ProposedActionSchema,
  toolNames,
  type ProposedAction,
  type ContextResolver,
} from '@/lib/types';
import { NOW } from '@/lib/time';
export const agents = AgentSchema.array().parse([
  {
    id: 'pipeline',
    name: 'Pipeline Monitor',
    approvalRate: 0.78,
    scope: { tools: [...toolNames] },
  },
  { id: 'triage', name: 'Inbound Triage', approvalRate: 0.97, scope: { tools: [...toolNames] } },
  {
    id: 'upsell',
    name: 'Upsell Agent',
    approvalRate: 0.88,
    scope: { tools: toolNames.filter((t) => t !== 'post_slack') },
  },
  {
    id: 'demo',
    name: 'Demo Prep',
    approvalRate: 0.99,
    scope: { tools: ['create_task', 'update_deal', 'send_email'] },
  },
]);
const names = [
  'Northwind Labs',
  'Lumen Health',
  'Parcel Robotics',
  'Fernway',
  'Brightloop',
  'Kestrel AI',
  'Okto Payments',
  'Halcyon Studio',
];
export const companies = CompanySchema.array().parse(
  names.map((name, i) => ({ id: `co${i}`, name, tags: i === 0 ? ['strategic'] : [] })),
);
export const contacts = ContactSchema.array().parse(
  names.map((_, i) => ({
    id: `c${i}`,
    name: [
      'Maya Chen',
      'Eli Brooks',
      'Nora Fischer',
      'James Park',
      'Ava Patel',
      'Leo Martin',
      'Sofia Tan',
      'Theo Wright',
    ][i],
    email: `${['maya', 'eli', 'nora', 'james', 'ava', 'leo', 'sofia', 'theo'][i]}@${['northwind', 'lumen', 'parcel', 'fernway', 'brightloop', 'kestrel', 'okto', 'halcyon'][i]}.example`,
    title: [
      'CFO',
      'VP of Operations',
      'Operations Manager',
      'Head of Growth',
      'Founder',
      'Engineering Manager',
      'COO',
      'Design Director',
    ][i],
    companyId: `co${i}`,
    timezone: i === 2 ? 'Europe/Berlin' : i === 6 ? 'Asia/Singapore' : 'America/New_York',
    doNotContact: i === 7,
  })),
);
export const deals = DealSchema.array().parse(
  [48000, 28000, 12000, 6000, 120000, 18000, 36000, 9000].map((amount, i) => ({
    id: `d${i}`,
    companyId: `co${i}`,
    amount,
    stage: 'Proposal',
    nextStep: 'Schedule a follow-up',
    closeDate: '2026-11-15',
  })),
);
export const threads = contacts
  .filter((c) => c.id !== 'c2')
  .map((c) => ({
    id: `thread-${c.id}`,
    domain: c.email.split('@')[1],
    excerpt: 'Thanks for the discussion. Please send over the next steps.',
  }));
const evidence = {
  kind: 'email',
  excerpt:
    'Hi Alex — we are aligned on the scope. Budget is the remaining question. Is there room to adjust the annual commitment? I can bring this to our finance review on Friday. — Maya',
  sourceTitle: 'Re: Northwind · annual plan',
  at: '2026-10-20T16:45:00Z',
};
const evidenceById: Record<
  string,
  { kind: 'email' | 'meeting' | 'usage'; excerpt: string; sourceTitle: string; at: string }
> = {
  a02: {
    kind: 'meeting',
    excerpt:
      'Eli: We have paused the procurement project until next quarter. Please close the current evaluation and reconnect in January.',
    sourceTitle: 'Lumen Health · procurement review',
    at: '2026-10-20T17:00:00Z',
  },
  a03: {
    kind: 'email',
    excerpt:
      'Can you apply the agreed 15% annual-plan discount before our next billing cycle? Our team is ready to renew.',
    sourceTitle: 'Lumen Health · renewal request',
    at: '2026-10-20T17:20:00Z',
  },
  a04: {
    kind: 'meeting',
    excerpt:
      'Nora shared her email at the robotics summit and asked for pricing details. There is no existing email thread with Parcel Robotics.',
    sourceTitle: 'Parcel Robotics · event notes',
    at: '2026-10-20T13:00:00Z',
  },
  a05: {
    kind: 'email',
    excerpt:
      'Our implementation lead asked for the rollout schedule in the shared Northwind Slack Connect channel.',
    sourceTitle: 'Northwind Labs · onboarding handoff',
    at: '2026-10-20T19:10:00Z',
  },
  a06: {
    kind: 'meeting',
    excerpt:
      'Ava: Please send the rollout roadmap directly to me. I need to align the engineering leads before Friday.',
    sourceTitle: 'Brightloop · founder discovery call',
    at: '2026-10-20T19:00:00Z',
  },
  a07: {
    kind: 'email',
    excerpt:
      'Eli: Thursday afternoon works well. Could you send the next steps for our team before then?',
    sourceTitle: 'Re: Lumen Health · next steps',
    at: '2026-10-20T20:00:00Z',
  },
  a08: {
    kind: 'email',
    excerpt:
      'James: Thanks for the walkthrough. We would like to review the annual contract together on Thursday.',
    sourceTitle: 'Fernway · annual plan discussion',
    at: '2026-10-20T16:00:00Z',
  },
  a09: {
    kind: 'meeting',
    excerpt:
      'Nora: A new robotics division is joining the evaluation. We should revisit discovery before considering the existing proposal.',
    sourceTitle: 'Parcel Robotics · scope review',
    at: '2026-10-20T18:00:00Z',
  },
  a10: {
    kind: 'usage',
    excerpt:
      'The account reached 90% of its monthly allowance. The upsell agent proposed notifying the internal Slack channel, which is outside its allowed tools.',
    sourceTitle: 'Usage monitor · allowance alert',
    at: '2026-10-20T22:00:00Z',
  },
  a11: {
    kind: 'email',
    excerpt:
      'Theo: Please stop contacting me about this project. The CRM contact preference was updated to do not contact.',
    sourceTitle: 'Halcyon Studio · contact preference',
    at: '2026-10-20T15:00:00Z',
  },
};
const rows: unknown[] = [];
function add(
  id: string,
  agentId: string,
  tool: string,
  payload: unknown,
  summary: string,
  extra: Record<string, unknown> = {},
) {
  rows.push({
    id,
    agentId,
    tool,
    payload,
    summary,
    createdAt: NOW,
    evidence:
      evidenceById[id] ??
      (id === 'a01'
        ? evidence
        : {
            kind: 'usage',
            excerpt:
              'The latest account activity is ready for a routine internal follow-up. No customer commitment is requested.',
            sourceTitle: summary,
            at: '2026-10-20T18:30:00Z',
          }),
    ...extra,
  });
}
add(
  'a01',
  'pipeline',
  'send_email',
  {
    to: 'c0',
    subject: 'A path forward for Northwind',
    body: 'Hi Maya,\n\nThanks for sharing the context from your finance review. We can offer a 15% discount on the annual plan to help your team get started.\n\nWould you have 20 minutes on Thursday to talk through next steps?\n\nBest,\nAlex',
    threadId: 'thread-c0',
  },
  'Offer Northwind’s CFO a 15% discount',
  { dealId: 'd0' },
);
add(
  'a02',
  'pipeline',
  'update_deal',
  { dealId: 'd1', changes: { stage: 'Closed Lost', nextStep: 'Reconnect next quarter' } },
  'Move Lumen Health to Closed Lost',
);
add(
  'a03',
  'upsell',
  'update_stripe_subscription',
  { customerId: 'co1', change: 'discount', pct: 15 },
  'Apply a 15% annual-plan discount',
  { dealId: 'd1', companyId: 'co1' },
);
add(
  'a04',
  'pipeline',
  'send_email',
  {
    to: 'c2',
    subject: 'Following up from the event',
    body: 'Hi Nora, it was great connecting. Shall we find time to discuss the price?',
  },
  'First outreach to Parcel Robotics at 23:00',
  { sendAt: '2026-10-21T21:00:00Z' },
);
add(
  'a05',
  'pipeline',
  'post_slack',
  {
    channel: 'northwind-connect',
    external: true,
    text: 'The rollout is ready for your team. We will share the onboarding schedule tomorrow.',
  },
  'Share rollout details in Slack Connect',
  { companyId: 'co0' },
);
add(
  'a06',
  'pipeline',
  'send_email',
  {
    to: 'c4',
    subject: 'Your rollout roadmap',
    body: 'Hi Ava, here is the rollout roadmap we discussed.',
  },
  'Send Brightloop’s founder the rollout plan',
  { dealId: 'd4' },
);
// Exactly three review actions score 40–49 and graduate at threshold 50.
add(
  'a07',
  'pipeline',
  'send_email',
  {
    to: 'c1',
    subject: 'Next steps for Lumen',
    body: 'Hi Eli, would Thursday work for a follow-up?',
  },
  'Follow up with Lumen’s VP of Operations',
);
add(
  'a08',
  'pipeline',
  'send_email',
  {
    to: 'c3',
    subject: 'The annual plan',
    body: 'Hi James, happy to walk you through the contract on Thursday.',
  },
  'Send Fernway the contract follow-up',
);
add(
  'a09',
  'pipeline',
  'update_deal',
  { dealId: 'd2', changes: { stage: 'Discovery' } },
  'Reopen discovery with Parcel Robotics',
);
add(
  'a10',
  'upsell',
  'post_slack',
  { channel: 'account-updates', external: false, text: 'Usage has reached 90% of the plan.' },
  'Post to Slack without permission',
);
add(
  'a11',
  'pipeline',
  'send_email',
  { to: 'c7', subject: 'Checking in', body: 'Hi Theo, how are things going?' },
  'Email a contact who has opted out',
);
for (let i = 0; i < 15; i++)
  add(
    `a${12 + i}`,
    i < 10 ? 'triage' : 'demo',
    'create_task',
    {
      title: [
        'Prepare account brief',
        'Route inbound request',
        'Enrich company profile',
        'Schedule discovery call',
        'Summarize meeting notes',
      ][i % 5],
      dueAt: '2026-10-22',
      assignee: ['Alex Rivera', 'Jamie Wu', 'Morgan Lee'][i % 3],
      recordId: `d${i % 8}`,
    },
    `${['Prepare account brief', 'Route inbound request', 'Enrich company profile', 'Schedule discovery call', 'Summarize meeting notes'][i % 5]} · ${names[i % 8]}`,
    {
      evidence: {
        kind: i % 2 ? 'meeting' : 'email',
        excerpt:
          'Please connect our team with the right person and share a short account brief before the call.',
        sourceTitle: `${names[i % 8]} · inbound request`,
        at: '2026-10-20T18:00:00Z',
      },
    },
  );
for (let i = 0; i < 5; i++)
  add(
    `a${27 + i}`,
    'triage',
    'update_deal',
    { dealId: `d${i + 1}`, changes: { nextStep: 'Send meeting recap and confirm the next call' } },
    `Update next steps · ${names[i + 1]}`,
  );
add(
  'a32',
  'upsell',
  'send_email',
  {
    to: 'c5',
    subject: 'Your usage summary',
    body: 'Hi Leo, your team has had a productive week. Here is the activity recap.',
  },
  'Send Kestrel AI the weekly activity recap',
);
add(
  'a33',
  'triage',
  'send_email',
  {
    to: 'c3',
    subject: 'Thanks for reaching out',
    body: 'Hi James, I have connected you with Alex for your next call.',
  },
  'Acknowledge Fernway’s inbound request',
);
add(
  'a34',
  'pipeline',
  'post_slack',
  {
    channel: 'sales-internal',
    external: false,
    text: 'Weekly pipeline summary is ready for the team.',
  },
  'Share the internal pipeline summary',
);
export const actions = ProposedActionSchema.array().parse(rows);
export const contextFor: ContextResolver = (action: ProposedAction) => {
  const agent = agents.find((a) => a.id === action.agentId);
  if (!agent) throw new Error('Unknown agent');
  const contact =
    action.tool === 'send_email' ? contacts.find((c) => c.id === action.payload.to) : undefined;
  if (action.tool === 'send_email' && !contact) throw new Error('Unknown recipient');
  const dealId = action.tool === 'update_deal' ? action.payload.dealId : action.dealId;
  const deal = deals.find((d) => d.id === dealId);
  const companyId = action.companyId ?? contact?.companyId ?? deal?.companyId;
  return {
    agent,
    contact,
    deal,
    company: companies.find((c) => c.id === companyId),
    priorDomains: threads.map((t) => t.domain),
  };
};
