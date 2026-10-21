import { tool } from 'ai';
import {
  payloadSchemas,
  ProposedActionSchema,
  type ContextResolver,
  type Policy,
  type ProposedAction,
} from '../types';
import { makeNeedsApproval } from './approval';
// Context is bound by the trusted host, never accepted from model-generated arguments.
export function makeAgentTools(
  policy: Policy,
  resolve: ContextResolver,
  base: Omit<ProposedAction, 'tool' | 'payload'>,
) {
  const approval = (name: ProposedAction['tool']) =>
    makeNeedsApproval(policy, (input, { toolCallId }) => {
      const action = ProposedActionSchema.parse({
        ...base,
        id: toolCallId,
        tool: name,
        payload: input,
      });
      return { action, ctx: resolve(action) };
    });
  return {
    send_email: tool({
      description: 'Draft an email to an existing CRM contact',
      inputSchema: payloadSchemas.send_email,
      needsApproval: approval('send_email'),
    }),
    update_deal: tool({
      description: 'Propose changes to a CRM deal',
      inputSchema: payloadSchemas.update_deal,
      needsApproval: approval('update_deal'),
    }),
    create_task: tool({
      description: 'Create an internal follow-up task',
      inputSchema: payloadSchemas.create_task,
      needsApproval: approval('create_task'),
    }),
    update_stripe_subscription: tool({
      description: 'Propose a subscription adjustment',
      inputSchema: payloadSchemas.update_stripe_subscription,
      needsApproval: approval('update_stripe_subscription'),
    }),
    post_slack: tool({
      description: 'Draft a message to a Slack channel',
      inputSchema: payloadSchemas.post_slack,
      needsApproval: approval('post_slack'),
    }),
  };
}
