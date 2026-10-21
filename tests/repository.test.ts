import { it, expect } from 'vitest';
import { InMemoryActionRepository } from '@/lib/repo/in-memory';
import { DEFAULT_POLICY } from '@/lib/policy';
it('repository returns isolated validated data', async () => {
  const repo = new InMemoryActionRepository();
  const first = await repo.list();
  first.pop();
  expect(await repo.list()).toHaveLength(34);
  const policy = await repo.getPolicy();
  policy.reviewThreshold = 90;
  expect((await repo.getPolicy()).reviewThreshold).toBe(40);
  await repo.savePolicy({ ...DEFAULT_POLICY, reviewThreshold: 50 });
  expect((await repo.getPolicy()).reviewThreshold).toBe(50);
});
