'use client';
import * as React from 'react';

type Props = {
  onClick: () => void;
  /** Delay the fade-in to hide a transient not-playing state (e.g. YouTube's cued→playing). */
  delayed?: boolean;
};

/**
 * Click-to-play fallback for viewers: browsers block unmuted autoplay until
 * the user interacts with the page, so the player shows this overlay instead
 * of failing silently.
 */
export function GestureOverlay({ onClick, delayed }: Props) {
  const className = `lk-button lk-watch-together-gesture${
    delayed ? ' lk-watch-together-gesture-delayed' : ''
  }`;
  return (
    <button type="button" className={className} onClick={onClick}>
      ▶ Click to play
    </button>
  );
}
