/**
 * RatingSlider — jest-expo RTL tests for the intensity bar-scale.
 * Each of the 5 segments exposes an accessibilityLabel `${label}: ${n} of 5`.
 */
import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { RatingSlider } from './rating-slider';

jest.mock('@/lib/haptics', () => ({ haptics: { selection: jest.fn() } }));

describe('rating slider', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the label and both end labels', () => {
    render(
      <RatingSlider
        label="Nausea"
        value={1}
        onChange={jest.fn()}
        lowLabel="None"
        highLabel="Severe"
        tone="severity"
      />,
    );
    expect(screen.getByText('Nausea')).toBeTruthy();
    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.getByText('Severe')).toBeTruthy();
  });

  it('renders 5 segments and marks the selected one', () => {
    render(
      <RatingSlider
        label="Energy"
        value={3}
        onChange={jest.fn()}
        lowLabel="Exhausted"
        highLabel="Energized"
        tone="positive"
      />,
    );
    for (let n = 1; n <= 5; n++)
      expect(screen.getByLabelText(`Energy: ${n} of 5`)).toBeTruthy();
    expect(screen.getByLabelText('Energy: 3 of 5').props.accessibilityState?.selected).toBe(true);
    expect(screen.getByLabelText('Energy: 1 of 5').props.accessibilityState?.selected).toBe(false);
  });

  it('fires onChange with the tapped rating value', () => {
    const onChange = jest.fn();
    render(
      <RatingSlider
        label="Nausea"
        value={1}
        onChange={onChange}
        lowLabel="None"
        highLabel="Severe"
        tone="severity"
      />,
    );
    fireEvent.press(screen.getByLabelText('Nausea: 4 of 5'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
