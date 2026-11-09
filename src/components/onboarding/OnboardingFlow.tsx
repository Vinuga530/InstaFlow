import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BrandLogo } from '../common/BrandLogo';
import { Screen01ThemeSelect } from './Screen01ThemeSelect';
import { Screen02Username } from './Screen02Username';
import { Screen03DataSetup } from './Screen03DataSetup';
import { Screen04Privacy } from './Screen04Privacy';
import { Screen05FinalReview } from './Screen05FinalReview';

interface OnboardingFlowProps {
  onFinish?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onFinish }) => {
  const {
    onboardingStep,
    setOnboardingStep,
    completeOnboarding,
    initOnboardingState,
    setActiveCategory,
  } = useAppStore();

  useEffect(() => {
    initOnboardingState();
  }, []);

  const handleNext = () => {
    const next = Math.min(onboardingStep + 1, 5);
    setOnboardingStep(next);
  };

  const handleBack = () => {
    const prev = Math.max(onboardingStep - 1, 1);
    setOnboardingStep(prev);
  };

  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setOnboardingStep(step);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    if (window.location.hash === '#onboarding') {
      window.location.hash = '#overview';
    }
    setActiveCategory('overview');
    if (onFinish) {
      onFinish();
    }
  };

  const stepTitles = [
    'Theme Selection',
    'Username',
    'Data Sources',
    'Privacy Policy',
    'Review',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">
      {/* Top Navigation & Progress Bar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-3">
          <BrandLogo className="w-9 h-9 rounded-2xl shrink-0 overflow-hidden shadow-subtle" size={36} />
          <div>
            <span className="text-xl font-logo tracking-wide block leading-none text-[var(--text-primary)]">
              InstaTrack
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] block mt-0.5">
              Private Follower Analytics
            </span>
          </div>
        </div>

        {/* Step Progress Pills - Material 3 Expressive */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            {[1, 2, 3, 4, 5].map((step) => {
              const isPast = step < onboardingStep;
              const isCurrent = step === onboardingStep;
              return (
                <div
                  key={step}
                  title={`Step ${step}: ${stepTitles[step - 1]}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-8 bg-[var(--accent-primary)]'
                      : isPast
                      ? 'w-4 bg-[var(--accent-primary)]/50'
                      : 'w-2 bg-[var(--border-subtle)]'
                  }`}
                />
              );
            })}
          </div>

          <div className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
            Step {onboardingStep} of 5
          </div>
        </div>
      </header>

      {/* Main Screen Content with Padding */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        {onboardingStep === 1 && <Screen01ThemeSelect onContinue={handleNext} />}
        {onboardingStep === 2 && <Screen02Username onContinue={handleNext} onBack={handleBack} />}
        {onboardingStep === 3 && <Screen03DataSetup onContinue={handleNext} onBack={handleBack} />}
        {onboardingStep === 4 && <Screen04Privacy onContinue={handleNext} onBack={handleBack} />}
        {onboardingStep === 5 && (
          <Screen05FinalReview
            onComplete={handleFinish}
            onBack={handleBack}
            onGoToStep={handleGoToStep}
          />
        )}
      </main>

      {/* Understated Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-[var(--text-tertiary)] border-t border-[var(--border-subtle)] shrink-0">
        <span>InstaFlow Client &bull; 100% On-Device &bull; Manifest V3</span>
        <span>All data remains strictly on your machine</span>
      </footer>
    </div>
  );
};
