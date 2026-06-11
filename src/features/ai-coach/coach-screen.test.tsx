/**
 * Coach screen — jest-expo RTL tests. Queried via testID + literal message content so
 * assertions don't depend on whether i18n resolves keys or English in the test env.
 * ProGate is mocked to render its children (Pro path); useAiCoach is mocked.
 */
import * as React from 'react';

import CoachScreen from '@/app/(app)/coach';
import { useAiCoach } from '@/features/ai-coach/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

jest.mock('@/features/ai-coach/hooks');
jest.mock('@/features/subscription/pro-gate', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/lib/haptics', () => ({ haptics: { medium: jest.fn() } }));

const mockSend = jest.fn();

function setup(overrides: Record<string, unknown> = {}) {
  (useAiCoach as jest.Mock).mockReturnValue({
    messages: [],
    sendMessage: mockSend,
    isLoading: false,
    error: null,
    ...overrides,
  });
}

describe('coach screen', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('shows 3 suggestion chips and the send button in the empty state', () => {
    setup();
    render(<CoachScreen />);
    expect(screen.getAllByTestId('coach-chip')).toHaveLength(3);
    expect(screen.getByTestId('coach-send')).toBeTruthy();
  });

  it('sends a suggestion when a chip is tapped', () => {
    setup();
    render(<CoachScreen />);
    fireEvent.press(screen.getAllByTestId('coach-chip')[0]);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('hides the chips once a conversation has started and renders the messages', () => {
    setup({
      messages: [
        { id: 'u1', role: 'user', content: 'My question here', timestamp: new Date() },
        { id: 'a1', role: 'assistant', content: 'My answer here', timestamp: new Date() },
      ],
    });
    render(<CoachScreen />);
    expect(screen.queryAllByTestId('coach-chip')).toHaveLength(0);
    expect(screen.getByText('My question here')).toBeTruthy();
    expect(screen.getByText('My answer here')).toBeTruthy();
  });

  it('does not send when the input is empty (send disabled)', () => {
    setup();
    render(<CoachScreen />);
    fireEvent.press(screen.getByTestId('coach-send'));
    expect(mockSend).not.toHaveBeenCalled();
  });
});
