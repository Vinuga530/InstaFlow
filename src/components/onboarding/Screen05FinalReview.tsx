import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { THEMES } from '../../styles/themes';
import { ArrowLeft, CheckCircle, Palette, AtSign, ShieldCheck, Sparkles } from 'lucide-react';

interface Screen05FinalReviewProps {
  onComplete: () => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
}

export const Screen05FinalReview: React.FC<Screen05FinalReviewProps> = ({
  onComplete,
  onBack,
  onGoToStep,
}) => {
  const { activeThemeId, customUsername } = useAppStore();
  const activeTheme = THEMES[activeThemeId] || THEMES.slate_sand;

  return (
    <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 5 &bull; Final Confirmation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          You&apos;re ready to explore.
        </h1>
        <p className="mt-2.5 text-base sm:text-lg text-[var(--text-secondary)] font-normal">
          Review your personalized settings before entering your private dashboard.
        </p>
      </div>

      {/* Review Summary Cards */}
      <div className="space-y-4 flex-1">
        {/* Selected Theme Review */}
        <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-primary)] shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                Selected Theme
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h4 className="text-base font-bold text-[var(--text-primary)] truncate">
                  {activeTheme.name}
                </h4>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]">
                  {activeTheme.appearance}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1">
              {activeTheme.palette.map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-black/15 shadow-sm"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs font-semibold text-[var(--accent-primary)] hover:underline px-2 py-1"
            >
              Change
            </button>
          </div>
        </div>

        {/* Selected Username Review */}
        <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-primary)] shrink-0">
              <AtSign className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                Target Instagram Handle
              </span>
              <h4 className="text-base font-bold text-[var(--text-primary)] truncate mt-0.5">
                {customUsername ? `@${customUsername}` : '@account'}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline px-2 py-1 shrink-0"
          >
            Edit
          </button>
        </div>

        {/* Local Storage & Zero Telemetry Confirmation */}
        <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex items-center gap-3.5">
          <ShieldCheck className="w-6 h-6 text-[var(--status-positive)] shrink-0" />
          <div className="text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)] block">
              100% Local &amp; Private Storage Ready
            </span>
            All future imports and comparisons will remain strictly sandboxed in your browser.
          </div>
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
          onClick={onComplete}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-sm bg-[var(--accent-primary)] hover:opacity-95 text-[var(--bg-canvas)] shadow-elevated transition-all active:scale-[0.98]"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Finish setup</span>
        </button>
      </div>
    </div>
  );
};
