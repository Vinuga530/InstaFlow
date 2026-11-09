import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { THEME_LIST } from '../../styles/themes';
import { ThemeId } from '../../types/theme';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

interface Screen01ThemeSelectProps {
  onContinue: () => void;
}

export const Screen01ThemeSelect: React.FC<Screen01ThemeSelectProps> = ({ onContinue }) => {
  const { activeThemeId, setThemeId } = useAppStore();

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      {/* Header section - Material 3 Expressive Editorial */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 &bull; Visual Identity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          Make it yours.
        </h1>
        <p className="mt-2.5 text-base sm:text-lg text-[var(--text-secondary)] font-normal max-w-xl">
          Choose a theme to start your InstaFlow experience.
        </p>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 flex-1">
        {THEME_LIST.map((theme) => {
          const isSelected = activeThemeId === theme.id;
          const preview = theme.preview;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setThemeId(theme.id as ThemeId)}
              className={`group text-left p-5 sm:p-6 rounded-3xl transition-all duration-200 select-none flex flex-col justify-between border relative overflow-hidden active:scale-[0.99] ${
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-elevated)] ring-2 ring-[var(--accent-primary)] shadow-elevated'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] shadow-subtle'
              }`}
            >
              {/* Card Top: Name & Selection Indicator */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                      {theme.name}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {theme.appearance}
                    </span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-canvas)] shadow-subtle scale-100'
                        : 'border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] opacity-40 group-hover:opacity-80'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                  {theme.description}
                </p>

                {/* 4-Color Signature Palette Swatches */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)] mr-1">
                    Palette:
                  </span>
                  {theme.palette.map((color, idx) => (
                    <div
                      key={idx}
                      className="group/swatch relative flex items-center justify-center"
                      title={color}
                    >
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-black/15 shadow-sm transition-transform group-hover/swatch:scale-110"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Realistic Mini Application UI Preview */}
              <div
                className="w-full rounded-2xl p-3.5 border transition-all pointer-events-none mt-2"
                style={{
                  backgroundColor: preview.canvas,
                  borderColor: theme.tokens.borderSubtle,
                }}
              >
                {/* Mini Header */}
                <div
                  className="flex items-center justify-between pb-2 mb-2 border-b"
                  style={{ borderColor: theme.tokens.borderSubtle }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preview.accent }}
                    />
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: preview.text }}
                    >
                      InstaTrack
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: preview.badgeBg,
                      color: preview.badgeText,
                    }}
                  >
                    @network
                  </span>
                </div>

                {/* Mini Metric Card & Row */}
                <div className="space-y-1.5">
                  <div
                    className="p-2 rounded-xl flex items-center justify-between"
                    style={{
                      backgroundColor: preview.surface,
                      border: `1px solid ${theme.tokens.borderSubtle}`,
                    }}
                  >
                    <div>
                      <div
                        className="text-[9px]"
                        style={{ color: preview.subtext }}
                      >
                        Not Following Back
                      </div>
                      <div
                        className="text-xs font-bold"
                        style={{ color: preview.text }}
                      >
                        142 accounts
                      </div>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        backgroundColor: preview.accent,
                        color: preview.canvas,
                      }}
                    >
                      &uarr;
                    </div>
                  </div>

                  <div
                    className="p-1.5 rounded-lg flex items-center justify-between text-[9px]"
                    style={{ backgroundColor: preview.card }}
                  >
                    <span style={{ color: preview.text }}>@sample_user</span>
                    <span style={{ color: preview.subtext }}>Mutual &bull; 100%</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Action Section */}
      <div className="mt-8 pt-5 border-t border-[var(--border-subtle)] flex items-center justify-end">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm bg-[var(--accent-primary)] hover:opacity-95 text-[var(--bg-canvas)] shadow-elevated transition-all active:scale-[0.98]"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
