import { expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/actions/route';
import { POST } from '@/app/api/actions/[id]/decision/route';
const request = (id: string, body: unknown) =>
  POST(
    new NextRequest(`http://localhost/api/actions/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
it('GET returns scored actions and validates threshold', async () => {
  const response = await GET(new NextRequest('http://localhost/api/actions?threshold=50'));
  const data = await response.json();
  expect(data.filter((x: { result: { tier: string } }) => x.result.tier === 'auto')).toHaveLength(
    26,
  );
  expect((await GET(new NextRequest('http://localhost/api/actions?threshold=bad'))).status).toBe(
    400,
  );
  expect((await GET(new NextRequest('http://localhost/api/actions?threshold=101'))).status).toBe(
    400,
  );
});
it('decision route rejects unknown, blocked, auto, malformed, and repeated actions', async () => {
  expect((await request('missing', { decision: 'approve' })).status).toBe(404);
  expect((await request('a10', { decision: 'approve' })).status).toBe(409);
  expect((await request('a12', { decision: 'approve' })).status).toBe(409);
  expect((await request('a02', { decision: 'reject', reason: ' ' })).status).toBe(400);
  expect(
    (
      await request('a02', {
        decision: 'approve',
        editedPayload: { dealId: 'd1', changes: { amount: -1 } },
      })
    ).status,
  ).toBe(400);
  expect(
    (await request('a02', { decision: 'reject', reason: 'Confirm with sales owner' })).status,
  ).toBe(200);
  expect((await request('a02', { decision: 'approve' })).status).toBe(409);
});
