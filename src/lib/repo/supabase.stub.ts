/** Production integration reference only; no client, credentials, or network calls.
 *
 * import { createServerClient } from '@supabase/ssr';
 * class SupabaseActionRepository implements ActionRepository {
 *   constructor(private client: ReturnType<typeof createServerClient>) {}
 *   async list() {
 *     const { data, error } = await this.client.from('proposed_actions').select('action');
 *     if (error) throw error;
 *     return ProposedActionSchema.array().parse(data.map(row => row.action));
 *   }
 *   // get: select by id, constrained by workspace RLS.
 *   // saveDecision: transaction inserting audit event and updating action status.
 *   // getPolicy/savePolicy: workspace-scoped, versioned policies.
 *   // Server derives actor from authenticated session, never from request JSON.
 * }
 */
export {};
