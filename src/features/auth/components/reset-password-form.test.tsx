import * as React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';
import { ResetPasswordForm } from './reset-password-form';

afterEach(cleanup);

describe('resetPasswordForm', () => {
  it('renders both password fields and the submit button', async () => {
    setup(<ResetPasswordForm onSubmit={jest.fn()} />);
    expect(await screen.findByTestId('reset-password')).toBeOnTheScreen();
    expect(screen.getByTestId('reset-confirm-password')).toBeOnTheScreen();
    expect(screen.getByTestId('reset-submit')).toBeOnTheScreen();
  });

  it('shows a length error for a short password', async () => {
    const { user } = setup(<ResetPasswordForm onSubmit={jest.fn()} />);
    await user.type(screen.getByTestId('reset-password'), 'short');
    await user.press(screen.getByTestId('reset-submit'));
    expect(await screen.findByText(/at least 8 characters/i)).toBeOnTheScreen();
  });

  it('shows a mismatch error when confirmation differs', async () => {
    const onSubmit = jest.fn();
    const { user } = setup(<ResetPasswordForm onSubmit={onSubmit} />);
    await user.type(screen.getByTestId('reset-password'), 'longenough1');
    await user.type(screen.getByTestId('reset-confirm-password'), 'different1');
    await user.press(screen.getByTestId('reset-submit'));
    expect(await screen.findByText(/passwords do not match/i)).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the success state when showSuccess is true', async () => {
    setup(<ResetPasswordForm onSubmit={jest.fn()} showSuccess />);
    expect(await screen.findByText(/password updated/i)).toBeOnTheScreen();
  });

  it('calls onSubmit with the new password when valid and matching', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { user } = setup(<ResetPasswordForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('reset-password'), 'longenough1');
    await user.type(screen.getByTestId('reset-confirm-password'), 'longenough1');
    await user.press(screen.getByTestId('reset-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ password: 'longenough1' });
    });
  });
});
