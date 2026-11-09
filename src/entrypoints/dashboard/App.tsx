import React, { useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeCategory,
    setActiveCategory,
    loadSnapshots,
    theme,
    setTheme,
    isLoading,
    loadingMessage,
  } = useAppStore();

  useEffect(() => {
    // Initialize theme
    setTheme(theme);
    // Load historical snapshots from Dexie
    loadSnapshots();

    // Check URL hash on initial load (e.g. dashboard.html#live_mode)
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
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && validCategories.includes(hash)) {
        setActiveCategory(hash as any);
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F3EC] dark:bg-[#151716] text-[#242823] dark:text-[#F0EEE6] font-sans selection:bg-[#71806C]/20 dark:selection:bg-[#899783]/25 selection:text-[#242823] dark:selection:text-[#F0EEE6]">
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
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[#EAE8DF]/95 dark:bg-[#202421]/95 border border-[#D5D2C5] dark:border-[#343B35] shadow-elevated">
            <Loader2 className="w-7 h-7 text-[#71806C] dark:text-[#899783] animate-spin" />
            <span className="text-sm font-medium text-[#242823] dark:text-[#F0EEE6]">
              {loadingMessage || 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

