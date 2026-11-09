import React from 'react';
import { ArrowLeft, ArrowRight, FileArchive, Globe, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

interface Screen03DataSetupProps {
  onContinue: () => void;
  onBack: () => void;
}

export const Screen03DataSetup: React.FC<Screen03DataSetupProps> = ({ onContinue, onBack }) => {
  return (
    <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] mb-3">
          <Database className="w-3.5 h-3.5" />
          <span>Step 3 &bull; Data Ingestion</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          How your data gets here.
        </h1>
        <p className="mt-2.5 text-base sm:text-lg text-[var(--text-secondary)] font-normal">
          InstaFlow is 100% on-device. Here are the genuine methods supported by the application:
        </p>
      </div>

      {/* Methods Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
        {/* Method 1: Official Data Export */}
        <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-all shadow-subtle">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                <FileArchive className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/20">
                Recommended &bull; Safest
              </span>
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1.5">
              Official Meta Data Export
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Download your information directly from Instagram&apos;s Accounts Center as a ZIP file (JSON format) and drop it into InstaFlow.
            </p>

            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                <span>Zero risk to your Instagram account — uses official Meta archives.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                <span>Includes complete follower timestamps &amp; historical follow dates.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                <span>Processed 100% client-side via in-memory ZIP extraction.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
              Available anytime via the &ldquo;Import Data&rdquo; button
            </span>
          </div>
        </div>

        {/* Method 2: Live Browser Tab Sync */}
        <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-all shadow-subtle">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                <Globe className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                On-Demand Scan
              </span>
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1.5">
              Live Browser Tab Session
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Keep an authenticated <code className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] font-mono text-[11px]">instagram.com</code> tab open in your browser to inspect follower lists in real-time.
            </p>

            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                <span>No password required — leverages your active browser login.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                <span>Automatic tab detection detects when your profile page is open.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                <span>Safe rate-limited DOM scrolling with pause controls.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
              Accessible via &ldquo;Live Mode&rdquo; in the sidebar
            </span>
          </div>
        </div>
      </div>

      {/* Honest Architecture Disclaimer */}
      <div className="mt-6 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--status-positive)] shrink-0" />
        <p className="text-xs text-[var(--text-secondary)]">
          <strong className="font-semibold text-[var(--text-primary)]">No Artificial Promises:</strong> InstaFlow does not use unauthorized background bots or remote server scrapers. We only support genuine client-side imports and your active browser session.
        </p>
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
