import * as React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';
import { ForgotPasswordForm } from './forgot-password-form';

afterEach(cleanup);

describe('ForgotPasswordForm', () => {
  it('renders email field and submit button', async () => {
    setup(<ForgotPasswordForm onSubmit={jest.fn()} />);
    expect(await screen.findByTestId('forgot-email')).toBeOnTheScreen();
    expect(screen.getByTestId('forgot-submit')).toBeOnTheScreen();
  });

  it('shows required error when email is empty on submit', async () => {
    const { user } = setup(<ForgotPasswordForm onSubmit={jest.fn()} />);
    await user.press(screen.getByTestId('forgot-submit'));
    expect(await screen.findByText(/email is required/i)).toBeOnTheScreen();
  });

  it('shows success state when showSuccess prop is true', async () => {
    setup(<ForgotPasswordForm onSubmit={jest.fn()} showSuccess />);
    expect(await screen.findByText(/check your email/i)).toBeOnTheScreen();
  });

  it('calls onSubmit with email when form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { user } = setup(<ForgotPasswordForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('forgot-email'), 'user@example.com');
    await user.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com' });
    });
  });
});
