import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { repository } from '@/lib/repo/in-memory';
import { contextFor } from '@/data/seed';
import { scoreAll } from '@/lib/score';
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('threshold');
  const threshold = z.coerce.number().int().min(0).max(100).safeParse(raw);
  if (raw !== null && !threshold.success)
    return NextResponse.json({ error: 'Invalid threshold' }, { status: 400 });
  const policy = await repository.getPolicy();
  return NextResponse.json(
    scoreAll(await repository.list(), contextFor, {
      ...policy,
      ...(raw !== null && threshold.success ? { reviewThreshold: threshold.data } : {}),
    }),
  );
}
