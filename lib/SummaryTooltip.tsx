'use client';

import * as React from 'react';
import styles from '@/styles/SummaryTooltip.module.css';

const STORAGE_KEY = 'summary-email';

interface SummaryTooltipProps {
  onSkip: () => void;
  onSubscribe: (email: string) => void;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SummaryTooltip({
  onSkip,
  onSubscribe,
  onClose,
  isLoading = false,
  error = null,
}: SummaryTooltipProps) {
  const [email, setEmail] = React.useState('');
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Load email from localStorage on mount
  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(STORAGE_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (e) {
      console.error('Failed to load email from localStorage:', e);
    }
  }, []);

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add listener with a small delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubscribe = () => {
    if (email.trim()) {
      // Save email to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, email.trim());
      } catch (e) {
        console.error('Failed to save email to localStorage:', e);
      }
      onSubscribe(email.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email.trim()) {
      handleSubscribe();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className={styles.tooltipContainer} ref={tooltipRef}>
        <div className={styles.tooltip}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Starting transcription...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tooltipContainer} ref={tooltipRef}>
      <div className={styles.tooltip}>
        <p className={styles.title}>Want to receive a summary of this call?</p>
        <input
          type="email"
          className={styles.emailInput}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className={styles.buttons}>
          <button className={styles.skipButton} onClick={onSkip} disabled={isLoading}>
            Skip
          </button>
          <button
            className={styles.subscribeButton}
            onClick={handleSubscribe}
            disabled={isLoading || !email.trim()}
          >
            Subscribe
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

export default SummaryTooltip;

