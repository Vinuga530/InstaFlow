import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { officialExportAdapter } from '../../services/browser-adapter/instagramAdapter';
import { Button } from '../common/Button';
import {
  BookOpen,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileJson,
  Upload,
} from 'lucide-react';

export const BrowserGuideModal: React.FC = () => {
  const { isGuideModalOpen, setGuideModalOpen, setImportModalOpen } = useAppStore();

  if (!isGuideModalOpen) return null;

  const steps = officialExportAdapter.getGuideSteps();

  const handleOpenAccountsCenter = () => {
    officialExportAdapter.openDataDownloadPortal();
  };

  const handleOpenImport = () => {
    setGuideModalOpen(false);
    setImportModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)]">
                How to Download Your Instagram Data
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Official, 100% private step-by-step export instructions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setGuideModalOpen(false)}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Privacy Banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/20 text-[var(--text-primary)] text-xs">
            <ShieldCheck className="w-5 h-5 text-[var(--status-positive)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--text-primary)]">Why this is the safest method</p>
              <p className="mt-0.5 text-[var(--text-secondary)] leading-relaxed">
                Instagram actively flags and blocks accounts that share credentials with third-party tracking apps. By using Instagram&apos;s official &ldquo;Download Your Information&rdquo; portal, you never share your password or session cookies with anyone.
              </p>
            </div>
          </div>

          {/* Direct Link Action Card */}
          <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Meta Accounts Center Portal
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Direct shortcut to the data download request portal
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={handleOpenAccountsCenter}
            >
              Open Accounts Center
            </Button>
          </div>

          {/* Step by Step Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Follow These Steps
            </h4>

            <div className="space-y-2.5">
              {steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex items-start gap-3.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shrink-0 shadow-xs">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-[var(--text-primary)]">
                      {step.title}
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                    {step.actionUrl && (
                      <a
                        href={step.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-primary)] hover:underline pt-1"
                      >
                        <span>{step.actionLabel || 'Open link'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Format Tips */}
          <div className="p-4 rounded-2xl border border-[var(--status-warning)]/20 bg-[var(--status-warning-bg)] space-y-2">
            <h5 className="font-bold text-xs text-[var(--status-warning)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Two Crucial Settings to Select</span>
            </h5>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc list-inside">
              <li>
                Format: <strong className="text-[var(--text-primary)] font-bold">JSON</strong> (do NOT select HTML).
              </li>
              <li>
                Date range: <strong className="text-[var(--text-primary)] font-bold">All time</strong> (to include your entire follower history).
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between shrink-0">
          <span className="text-xs text-[var(--text-secondary)]">
            Already have your export file ready?
          </span>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={handleOpenImport}
          >
            Import File Now
          </Button>
        </div>
      </div>
    </div>
  );
};
