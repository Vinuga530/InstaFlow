import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, AtSign, CheckCircle2 } from 'lucide-react';

interface Screen02UsernameProps {
  onContinue: () => void;
  onBack: () => void;
}

export const Screen02Username: React.FC<Screen02UsernameProps> = ({ onContinue, onBack }) => {
  const { customUsername, setCustomUsername, liveStatus } = useAppStore();
  const [inputVal, setInputVal] = useState(customUsername || '');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-fill detected username from open tab if present and empty
  useEffect(() => {
    if (!inputVal && liveStatus?.activeTab?.detectedUsername) {
      setInputVal(liveStatus.activeTab.detectedUsername);
    }
  }, [liveStatus]);

  // Real-time Instagram username validation
  const validateUsername = (raw: string): { isValid: boolean; error: string | null } => {
    const trimmed = raw.trim().replace(/^@/, '');
    if (!trimmed) {
      return { isValid: false, error: 'Please enter your Instagram username to proceed.' };
    }
    if (trimmed.length > 30) {
      return { isValid: false, error: 'Instagram usernames cannot exceed 30 characters.' };
    }
    // Instagram usernames only contain letters, numbers, periods, and underscores
    const validPattern = /^[a-zA-Z0-9._]+$/;
    if (!validPattern.test(trimmed)) {
      return {
        isValid: false,
        error: 'Usernames can only contain letters, numbers, periods, and underscores.',
      };
    }
    if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
      return { isValid: false, error: 'Usernames cannot start or end with a period.' };
    }
    if (trimmed.includes('..')) {
      return { isValid: false, error: 'Usernames cannot contain consecutive periods.' };
    }
    return { isValid: true, error: null };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputVal(raw);
    const { error: validationError } = validateUsername(raw);
    setError(validationError);
  };

  const handleProceed = () => {
    const { isValid, error: validationError } = validateUsername(inputVal);
    if (!isValid) {
      setError(validationError);
      return;
    }
    const clean = inputVal.trim().replace(/^@/, '').toLowerCase();
    setCustomUsername(clean);
    onContinue();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProceed();
    }
  };

  const isValidInput = inputVal.trim().length > 0 && !error;

  return (
    <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] mb-3">
          <AtSign className="w-3.5 h-3.5" />
          <span>Step 2 &bull; Account Identity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          Who&apos;s your network?
        </h1>
        <p className="mt-2.5 text-base sm:text-lg text-[var(--text-secondary)] font-normal">
          Enter your Instagram username to personalize your experience.
        </p>
      </div>

      {/* Material 3 Expressive Large Input Container */}
      <div className="space-y-4">
        <label
          htmlFor="instagram-username-input"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
        >
          Instagram Handle
        </label>

        <div
          className={`relative flex items-center rounded-3xl border-2 transition-all duration-200 bg-[var(--bg-surface)] px-5 py-4 ${
            error
              ? 'border-[var(--status-negative)] ring-2 ring-[var(--status-negative-bg)]'
              : isFocused
              ? 'border-[var(--accent-primary)] ring-4 ring-[var(--accent-subtle)] bg-[var(--bg-surface-elevated)]'
              : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
          }`}
        >
          {/* Prefix */}
          <span className="text-2xl font-bold text-[var(--accent-primary)] select-none mr-2">
            @
          </span>

          {/* Text Input */}
          <input
            id="instagram-username-input"
            type="text"
            value={inputVal}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="your_username"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            aria-describedby="username-helper"
            aria-invalid={!!error}
            className="w-full bg-transparent text-xl sm:text-2xl font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none tracking-tight"
          />

          {/* Validation Feedback Icon */}
          <div className="ml-3 shrink-0">
            {error ? (
              <AlertCircle className="w-6 h-6 text-[var(--status-negative)] animate-in fade-in" />
            ) : isValidInput ? (
              <CheckCircle2 className="w-6 h-6 text-[var(--status-positive)] animate-in fade-in" />
            ) : null}
          </div>
        </div>

        {/* Dynamic Helper / Error Message */}
        <div id="username-helper" className="min-h-[22px] px-2">
          {error ? (
            <p className="text-xs font-medium text-[var(--status-negative)] flex items-center gap-1.5 animate-in fade-in">
              <span>{error}</span>
            </p>
          ) : (
            <p className="text-xs text-[var(--text-secondary)]">
              Letters, numbers, periods, and underscores. 1–30 characters.
            </p>
          )}
        </div>
      </div>

      {/* Strict Privacy & Scope Reassurance Card */}
      <div className="mt-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--status-positive)] shrink-0" />
          <span>Strict Security &amp; Local Scope</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          InstaFlow only requests your username to label local reports, compare snapshots, and personalize your experience.
          We <span className="font-semibold text-[var(--text-primary)]">never request your password</span>, and entering a username does <span className="font-semibold text-[var(--text-primary)]">not</span> connect or scrape your account.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          disabled={!inputVal.trim() || !!error}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm bg-[var(--accent-primary)] hover:opacity-95 text-[var(--bg-canvas)] shadow-elevated transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
