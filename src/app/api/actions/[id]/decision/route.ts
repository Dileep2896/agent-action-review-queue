import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { repository } from '@/lib/repo/in-memory';
import { contextFor } from '@/data/seed';
import { createQueue, queueReducer } from '@/lib/queue';
const schema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('approve'),
    editedPayload: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({ decision: z.literal('reject'), reason: z.string().trim().min(1) }),
]);
// Demo endpoint: one process-local repository. Production needs auth + a transaction.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = schema.safeParse(await request.json());
    if (!input.success)
      return NextResponse.json({ error: 'Invalid decision or missing reason' }, { status: 400 });
    const { id } = await params;
    const action = await repository.get(id);
    if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    const events = await repository.listAudit();
    if (events.some((e) => e.actionId === id))
      return NextResponse.json({ error: 'Already decided' }, { status: 409 });
    const state = createQueue([action], await repository.getPolicy(), contextFor);
    const next = queueReducer(
      state,
      input.data.decision === 'approve'
        ? { type: 'approve', id, editedPayload: input.data.editedPayload }
        : { type: 'reject', id, reason: input.data.reason },
    );
    if (!next.audit.length)
      return NextResponse.json({ error: 'Only review actions may be decided' }, { status: 409 });
    const event = { ...next.audit[0], id: crypto.randomUUID() };
    await repository.saveDecision(event);
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: 'Invalid or policy-blocked action' }, { status: 400 });
  }
}
