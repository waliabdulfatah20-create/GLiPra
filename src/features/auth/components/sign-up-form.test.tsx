import * as React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';
import { SignUpForm } from './sign-up-form';

afterEach(cleanup);

describe('SignUpForm', () => {
  it('renders email and password fields', async () => {
    setup(<SignUpForm onSubmit={jest.fn()} />);
    expect(await screen.findByTestId('sign-up-email')).toBeOnTheScreen();
    expect(screen.getByTestId('sign-up-password')).toBeOnTheScreen();
    expect(screen.getByTestId('sign-up-submit')).toBeOnTheScreen();
  });

  it('renders password strength bar', async () => {
    setup(<SignUpForm onSubmit={jest.fn()} />);
    expect(await screen.findByTestId('password-strength-bar')).toBeOnTheScreen();
  });

  it('shows required error when email is empty on submit', async () => {
    const { user } = setup(<SignUpForm onSubmit={jest.fn()} />);
    await user.press(screen.getByTestId('sign-up-submit'));
    expect(await screen.findByText(/email is required/i)).toBeOnTheScreen();
  });

  it('calls onSubmit with email and password when form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { user } = setup(<SignUpForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('sign-up-email'), 'new@example.com');
    await user.type(screen.getByTestId('sign-up-password'), 'Password123!');
    await user.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'Password123!',
      });
    });
  });

  it('shows loading indicator while submitting', async () => {
    let resolveSubmit!: () => void;
    const onSubmit = jest.fn(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );
    const { user } = setup(<SignUpForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('sign-up-email'), 'new@example.com');
    await user.type(screen.getByTestId('sign-up-password'), 'Password123!');

    const pressPromise = user.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('sign-up-submit-activity-indicator')).toBeOnTheScreen();
    });

    resolveSubmit();
    await pressPromise;
  });
});
