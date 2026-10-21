import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ReviewApp } from '@/components/review/review-app';
import { actions } from '@/data/seed';
const setup = () => render(<ReviewApp initialActions={actions} />);
it('renders 68% and approval moves an action to Decided with audit', async () => {
  setup();
  expect(screen.getByTestId('autonomy')).toHaveTextContent('68%');
  await userEvent.click(screen.getByRole('button', { name: 'Approve action' }));
  expect(screen.getByRole('tab', { name: /Decided/ })).toHaveTextContent('1');
  expect(screen.getByTestId('audit')).toHaveTextContent('Approved');
});
it('reject is disabled until reason is supplied', async () => {
  setup();
  await userEvent.click(screen.getByRole('button', { name: 'Reject action' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'Reject action' })).toBeDisabled();
  await userEvent.type(within(dialog).getByLabelText('Reason'), 'Needs a personal reply');
  expect(within(dialog).getByRole('button', { name: 'Reject action' })).toBeEnabled();
});
it('batch approves three selected reviews', async () => {
  setup();
  for (const checkbox of screen.getAllByRole('checkbox').slice(0, 3))
    await userEvent.click(checkbox);
  await userEvent.click(screen.getByRole('button', { name: /Approve selected/ }));
  expect(screen.getByRole('tab', { name: /Decided/ })).toHaveTextContent('3');
});
it('policy slider updates autonomy to 76%', async () => {
  setup();
  await userEvent.click(screen.getByRole('button', { name: 'Policy settings' }));
  const slider = screen.getByRole('slider', { name: 'Review threshold' });
  slider.focus();
  for (let i = 0; i < 10; i++) fireEvent.keyDown(slider, { key: 'ArrowRight' });
  expect(screen.getByTestId('autonomy')).toHaveTextContent('76%');
});
it('command palette opens with keyboard', () => {
  setup();
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  expect(screen.getByRole('dialog', { name: 'Commands' })).toBeInTheDocument();
});
