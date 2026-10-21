import { actions } from '@/data/seed';
import { DEFAULT_POLICY } from '../policy';
import {
  AuditEventSchema,
  PolicySchema,
  ProposedActionSchema,
  type AuditEvent,
  type Policy,
  type ProposedAction,
} from '../types';
import type { ActionRepository } from './action-repository';
export class InMemoryActionRepository implements ActionRepository {
  private actions: ProposedAction[];
  private policy: Policy;
  private audit: AuditEvent[] = [];
  constructor(seed = actions, policy = DEFAULT_POLICY) {
    this.actions = ProposedActionSchema.array().parse(seed);
    this.policy = PolicySchema.parse(policy);
  }
  async list() {
    return structuredClone(this.actions);
  }
  async get(id: string) {
    return structuredClone(this.actions.find((a) => a.id === id));
  }
  async saveDecision(event: AuditEvent) {
    const parsed = AuditEventSchema.parse(event);
    if (this.audit.some((e) => e.id === parsed.id)) throw new Error('Duplicate audit event');
    this.audit.push(structuredClone(parsed));
  }
  async getPolicy() {
    return structuredClone(this.policy);
  }
  async savePolicy(policy: Policy) {
    this.policy = PolicySchema.parse(policy);
  }
  async listAudit() {
    return structuredClone(this.audit);
  }
}
export const repository = new InMemoryActionRepository();
