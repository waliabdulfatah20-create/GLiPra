/**
 * WaterGlass — jest-expo RTL test. Presentational; we assert the accessibility
 * label reflects the fill count (the reanimated fill height is mocked to 0 in tests).
 */
import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { WaterGlass } from './water-glass';

describe('water glass', () => {
  afterEach(cleanup);

  it('exposes the fill count via the accessibility label', () => {
    render(<WaterGlass filled={3} total={8} />);
    expect(screen.getByLabelText('3 of 8 glasses of water')).toBeTruthy();
  });

  it('renders an empty glass with zero filled', () => {
    render(<WaterGlass filled={0} total={8} />);
    expect(screen.getByLabelText('0 of 8 glasses of water')).toBeTruthy();
  });
});
