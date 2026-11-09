import React from 'react';
import { ArrowLeft, ArrowRight, Shield, HardDrive, WifiOff, Trash2, KeyRound } from 'lucide-react';

interface Screen04PrivacyProps {
  onContinue: () => void;
  onBack: () => void;
}

export const Screen04Privacy: React.FC<Screen04PrivacyProps> = ({ onContinue, onBack }) => {
  return (
    <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Step 4 &bull; Privacy Guarantees</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          Privacy without asterisks.
        </h1>
        <p className="mt-2.5 text-base sm:text-lg text-[var(--text-secondary)] font-normal">
          InstaFlow is engineered with zero-compromise local architecture.
        </p>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {/* Pillar 1: Where data is stored */}
        <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Where your data is stored
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            100% locally on your computer inside your browser&apos;s sandboxed <strong className="text-[var(--text-primary)]">IndexedDB</strong> storage. Never on remote cloud servers.
          </p>
        </div>

        {/* Pillar 2: What data is processed */}
        <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            What InstaFlow processes
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Only the follower/following usernames, profile links, and timestamps from your imported files or live browser session. No passwords, no DMs, no personal media.
          </p>
        </div>

        {/* Pillar 3: Zero Outbound Traffic */}
        <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Does anything leave your device?
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Absolutely nothing.</strong> Zero telemetry, zero analytics trackers, zero external API transmissions, and zero background ads.
          </p>
        </div>

        {/* Pillar 4: Complete Data Deletion */}
        <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--status-negative-bg)] text-[var(--status-negative)]">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            How to delete your data
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Full sovereignty: A single click on <strong className="text-[var(--text-primary)]">&ldquo;Clear Database&rdquo;</strong> in Settings permanently purges all stored accounts, history, and notes from your browser.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
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
          onClick={onContinue}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm bg-[var(--accent-primary)] hover:opacity-95 text-[var(--bg-canvas)] shadow-elevated transition-all active:scale-[0.98]"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
