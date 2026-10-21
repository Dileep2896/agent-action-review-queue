import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Story } from '@/components/story/story';
it('renders all six story sections with reduced motion', () => {
  render(<Story />);
  for (const name of [
    'The problem space',
    'The permission problem',
    'Before and after',
    'The decision',
    'How it works',
    'The impact',
  ])
    expect(screen.getByRole('region', { name })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Open the Review Queue/ })).toHaveAttribute(
    'href',
    '/review',
  );
});
