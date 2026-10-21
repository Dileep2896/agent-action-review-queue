import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { Story } from '@/components/story/story';
it('hydrates the story without mismatches when reduced motion is preferred', async () => {
  const element = document.createElement('div');
  element.innerHTML = renderToString(<Story />);
  document.body.append(element);
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(element, <Story />, { onRecoverableError: (e) => errors.push(e) });
  });
  expect(errors).toEqual([]);
  expect(element.textContent).toContain('76%');
  await act(async () => root.unmount());
  element.remove();
});
