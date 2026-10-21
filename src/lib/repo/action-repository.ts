import type { ProposedAction, AuditEvent, Policy } from '../types';
export interface ActionRepository {
  list(): Promise<ProposedAction[]>;
  get(id: string): Promise<ProposedAction | undefined>;
  saveDecision(event: AuditEvent): Promise<void>;
  getPolicy(): Promise<Policy>;
  savePolicy(policy: Policy): Promise<void>;
  listAudit(): Promise<AuditEvent[]>;
}
