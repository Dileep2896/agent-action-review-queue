import { expect, it } from 'vitest';
import { actions, contextFor } from '@/data/seed';
import { DEFAULT_POLICY } from '@/lib/policy';
import { scoreAction } from '@/lib/score';
import { makeNeedsApproval, PolicyBlockedError } from '@/lib/ai/approval';
for (const tier of ['auto', 'review', 'blocked'] as const)
  it(`adapter handles ${tier}`, async () => {
    const a = actions.find((a) => scoreAction(a, contextFor(a), DEFAULT_POLICY).tier === tier)!;
    const fn = makeNeedsApproval(DEFAULT_POLICY, () => ({ action: a, ctx: contextFor(a) }));
    const result = fn(a.payload, { toolCallId: a.id, messages: [] });
    if (tier === 'blocked') await expect(result).rejects.toBeInstanceOf(PolicyBlockedError);
    else expect(await result).toBe(tier === 'review');
  });

it('real SDK tool definitions bind trusted context and validate inputs', async () => {
  const { makeAgentTools } = await import('@/lib/ai/tools');
  const { payloadSchemas } = await import('@/lib/types');
  const a = actions[0];
  const definitions = makeAgentTools(DEFAULT_POLICY, contextFor, a);
  expect(Object.keys(definitions)).toHaveLength(5);
  expect(definitions.send_email.inputSchema).toBe(payloadSchemas.send_email);
  const needsApproval = definitions.send_email.needsApproval;
  expect(typeof needsApproval).toBe('function');
  if (typeof needsApproval === 'function' && a.tool === 'send_email')
    expect(await needsApproval(a.payload, { toolCallId: 'sdk-call', messages: [] })).toBe(true);
  expect(payloadSchemas.send_email.safeParse({ to: 'c0', body: 'Hello' }).success).toBe(false);
});
