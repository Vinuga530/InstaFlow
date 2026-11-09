import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { ToastContainer } from '../../components/layout/Toast';
import { OverviewView } from '../../components/views/OverviewView';
import { AccountListView } from '../../components/views/AccountListView';
import { HistoryView } from '../../components/views/HistoryView';
import { SettingsView } from '../../components/views/SettingsView';
import { LiveModeView } from '../../components/views/LiveModeView';
import { ImportModal } from '../../components/modals/ImportModal';
import { BrowserGuideModal } from '../../components/modals/BrowserGuideModal';
import { SnapshotCompareModal } from '../../components/modals/SnapshotCompareModal';
import { AccountNotesModal } from '../../components/modals/AccountNotesModal';
import { OnboardingFlow } from '../../components/onboarding/OnboardingFlow';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeCategory,
    setActiveCategory,
    loadSnapshots,
    isOnboardingCompleted,
    initOnboardingState,
    isLoading,
    loadingMessage,
  } = useAppStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isOnboardingRoute, setIsOnboardingRoute] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initOnboardingState();
      await loadSnapshots();
      setIsInitializing(false);
    };

    initialize();

    // Check URL hash on initial load (e.g. dashboard.html#onboarding or dashboard.html#live_mode)
    const validCategories = [
      'overview',
      'followers',
      'following',
      'not_following_back',
      'fans',
      'mutuals',
      'unfollowers',
      'new_followers',
      'history',
      'settings',
      'live_mode',
    ];

    const syncHashCategory = () => {
      const rawHash = window.location.hash.replace('#', '').trim();
      if (rawHash === 'onboarding') {
        setIsOnboardingRoute(true);
      } else {
        setIsOnboardingRoute(false);
        if (rawHash && validCategories.includes(rawHash)) {
          setActiveCategory(rawHash as any);
        }
      }
    };

    syncHashCategory();
    window.addEventListener('hashchange', syncHashCategory);
    return () => window.removeEventListener('hashchange', syncHashCategory);
  }, []);

  const renderActiveView = () => {
    switch (activeCategory) {
      case 'overview':
        return <OverviewView />;
      case 'live_mode':
        return <LiveModeView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      case 'followers':
      case 'following':
      case 'not_following_back':
      case 'fans':
      case 'mutuals':
      case 'unfollowers':
      case 'new_followers':
      default:
        return <AccountListView />;
    }
  };

  // Brief initial loading placeholder while retrieving storage state
  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  // Render full-screen Onboarding if incomplete or if navigating directly to #onboarding
  if (!isOnboardingCompleted || isOnboardingRoute) {
    return <OnboardingFlow onFinish={() => setIsOnboardingRoute(false)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-subtle)] selection:text-[var(--text-primary)]">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <ImportModal />
      <BrowserGuideModal />
      <SnapshotCompareModal />
      <AccountNotesModal />

      {/* Floating Notifications */}
      <ToastContainer />

      {/* Full-screen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-elevated">
            <Loader2 className="w-7 h-7 text-[var(--accent-primary)] animate-spin" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {loadingMessage || 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
