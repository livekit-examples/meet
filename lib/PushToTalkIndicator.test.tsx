import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { PushToTalkIndicator } from './PushToTalkIndicator';

describe('PushToTalkIndicator', () => {
  it('renders nothing when the companion is not connected', () => {
    const { container } = render(<PushToTalkIndicator connected={false} talking={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the idle hint when connected but not talking', () => {
    render(<PushToTalkIndicator connected talking={false} />);
    expect(screen.getByText(/Рация подключена/)).toBeTruthy();
  });

  it('shows the talking state while the key is held', () => {
    render(<PushToTalkIndicator connected talking />);
    expect(screen.getByText(/Говорите/)).toBeTruthy();
  });
});
