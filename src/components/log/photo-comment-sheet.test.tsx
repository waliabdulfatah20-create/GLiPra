/**
 * PhotoCommentSheet — RTL tests for the initialComment prop (Rescan flow).
 * i18n returns keys in the test env, so labels are asserted via key strings.
 */
import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { PhotoCommentSheet } from './photo-comment-sheet';

describe('photo comment sheet', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('pre-fills the input with initialComment and analyzes with edits applied', () => {
    const onAnalyze = jest.fn();
    render(
      <PhotoCommentSheet
        visible
        initialComment="half plate of rice"
        onAnalyze={onAnalyze}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.getByDisplayValue('half plate of rice')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('log.photo_comment_title'), 'grilled salmon');
    fireEvent.press(screen.getByLabelText('log.photo_comment_analyze'));
    expect(onAnalyze).toHaveBeenCalledWith('grilled salmon');
  });

  it('starts empty on a fresh capture and skips with no comment', () => {
    const onAnalyze = jest.fn();
    render(<PhotoCommentSheet visible onAnalyze={onAnalyze} onDismiss={jest.fn()} />);
    expect(screen.getByLabelText('log.photo_comment_title').props.value).toBe('');
    fireEvent.press(screen.getByLabelText('log.photo_comment_skip'));
    expect(onAnalyze).toHaveBeenCalledWith(undefined);
  });
});
