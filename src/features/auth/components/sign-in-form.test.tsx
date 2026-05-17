import * as React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';
import { SignInForm } from './sign-in-form';

afterEach(cleanup);

describe('SignInForm', () => {
  it('renders email and password fields', async () => {
    setup(<SignInForm onSubmit={jest.fn()} />);
    expect(await screen.findByTestId('sign-in-email')).toBeOnTheScreen();
    expect(screen.getByTestId('sign-in-password')).toBeOnTheScreen();
    expect(screen.getByTestId('sign-in-submit')).toBeOnTheScreen();
  });

  it('shows email validation error when email is invalid after submit', async () => {
    const { user } = setup(<SignInForm onSubmit={jest.fn()} />);
    const emailInput = screen.getByTestId('sign-in-email');
    await user.type(emailInput, 'not-an-email');
    await user.press(screen.getByTestId('sign-in-submit'));
    expect(await screen.findByText(/invalid email/i)).toBeOnTheScreen();
  });

  it('shows required error when email is empty on submit', async () => {
    const { user } = setup(<SignInForm onSubmit={jest.fn()} />);
    await user.press(screen.getByTestId('sign-in-submit'));
    expect(await screen.findByText(/email is required/i)).toBeOnTheScreen();
  });

  it('displays apiError prop when provided', async () => {
    setup(<SignInForm onSubmit={jest.fn()} apiError="Invalid credentials" />);
    expect(await screen.findByText('Invalid credentials')).toBeOnTheScreen();
  });

  it('calls onSubmit with email and password when form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { user } = setup(<SignInForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('sign-in-email'), 'user@example.com');
    await user.type(screen.getByTestId('sign-in-password'), 'Password123');
    await user.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123',
      });
    });
  });

  it('shows loading indicator while form is submitting', async () => {
    let resolveSubmit!: () => void;
    const onSubmit = jest.fn(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );
    const { user } = setup(<SignInForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('sign-in-email'), 'user@example.com');
    await user.type(screen.getByTestId('sign-in-password'), 'Password123');

    const pressPromise = user.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-submit-activity-indicator')).toBeOnTheScreen();
    });

    resolveSubmit();
    await pressPromise;
  });
});
