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
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5] dark:bg-[#121110] text-[#292522] dark:text-[#F7F4EF] font-sans selection:bg-[#E05A47]/20 selection:text-[#E05A47]">
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
          <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/95 dark:bg-[#1B1918]/95 border border-black/[0.06] dark:border-white/[0.08] shadow-cozy-lg">
            <Loader2 className="w-8 h-8 text-[#E05A47] animate-spin" />
            <span className="font-fredoka text-sm text-[#292522] dark:text-[#F7F4EF]">
              {loadingMessage || 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

