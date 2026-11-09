import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatRelativeTime } from '../../utils/formatters';
import { seedSampleData } from '../../utils/sampleData';
import { subscribeToTabDetectionChanges } from '../../services/live/tabDetectionService';
import {
  runFollowerExporter,
  ExportedUser,
  FollowerExportResult,
} from '../../services/live/followerExporterService';
import { downloadAccountsAsCSV } from '../../services/export/downloadService';
import { BrandLogo } from '../../components/common/BrandLogo';
import {
  ExternalLink,
  Sun,
  Moon,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Search,
  UserMinus,
  RefreshCw,
  Download,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const Popup: React.FC = () => {
  const {
    activeSnapshot,
    followers,
    following,
    notFollowingBack,
    loadSnapshots,
    selectSnapshot,
    theme,
    setTheme,
    liveStatus,
    fetchLiveStatus,
    updateLiveTabState,
    unfollowAccount,
    initOnboardingState,
    isOnboardingCompleted,
    customUsername,
  } = useAppStore();

  // Target account
  const [username, setUsername] = useState<string>('');

  // Scanning State & Progress
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: '',
  });
  const [exportResult, setExportResult] = useState<FollowerExportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unfollow action tracking
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
  const [unfollowedUsers, setUnfollowedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    initOnboardingState();
    loadSnapshots();
    fetchLiveStatus();

    const unsubscribe = subscribeToTabDetectionChanges((freshState) => {
      updateLiveTabState(freshState);
      if (freshState.activeTab?.detectedUsername && !username) {
        setUsername(freshState.activeTab.detectedUsername);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Pre-populate username when customUsername or tab detected
  useEffect(() => {
    if (customUsername && !username) {
      setUsername(customUsername);
    } else if (liveStatus?.activeTab?.detectedUsername && !username) {
      setUsername(liveStatus.activeTab.detectedUsername);
    }
  }, [liveStatus, customUsername]);

  const openDashboard = (initialCategory = 'overview') => {
    const dashboardUrl = chrome?.runtime?.getURL
      ? chrome.runtime.getURL('dashboard.html')
      : '/src/entrypoints/dashboard/index.html';

    const fullUrl = `${dashboardUrl}#${initialCategory}`;

    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: fullUrl });
    } else {
      window.open(fullUrl, '_blank');
    }
  };

  const handleStartScan = async () => {
    const targetUser = username.trim().replace(/^@/, '');
    if (!targetUser) {
      setErrorMsg('Please enter an Instagram handle');
      return;
    }

    if (!liveStatus?.isInstagramTabOpen || !liveStatus.activeTab?.id) {
      setErrorMsg('Please open an active Instagram tab in Chrome first.');
      return;
    }

    setErrorMsg(null);
    setIsScanning(true);
    setProgress({ percent: 10, message: 'Connecting to Instagram...' });

    try {
      const result = await runFollowerExporter({
        tabId: liveStatus.activeTab.id,
        username: targetUser,
        collectType: 'both',
        detailed: true,
        scanSpeed: 'fast',
        onProgress: (p) => {
          setProgress({
            percent: p.percent,
            message: p.message,
          });
        },
      });

      setExportResult(result);
      await loadSnapshots();
      if (result.snapshotId) {
        await selectSnapshot(result.snapshotId);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Scan failed. Ensure you are logged into Instagram.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUnfollowUser = async (targetUser: { username: string; id?: string }) => {
    const uname = targetUser.username;
    const targetId = (targetUser as any).id || (targetUser as any).userId;

    setUnfollowingId(uname);
    setErrorMsg(null);

    try {
      const ok = await unfollowAccount(uname, targetId);
      if (ok) {
        setUnfollowedUsers((prev) => new Set([...prev, uname.toLowerCase()]));
      }
    } catch (e: any) {
      setErrorMsg(e.message || `Unfollow failed for @${uname}`);
    } finally {
      setUnfollowingId(null);
    }
  };

  const handleDownloadCSV = () => {
    if (!currentUnfollowers.length) return;

    const filename = `instaflow_not_following_back_${username || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;

    const accountsMap = new Map();
    for (const u of currentUnfollowers) {
      accountsMap.set(u.username.toLowerCase(), {
        username: u.username,
        fullName: u.fullName || '',
        profileUrl: `https://www.instagram.com/${u.username}/`,
        relationshipType: 'following',
        isWhitelisted: false,
        timestamp: Date.now(),
      });
    }

    const accountsList = Array.from(accountsMap.values());
    downloadAccountsAsCSV(accountsList, filename);
  };

  const handleLoadDemo = async () => {
    await seedSampleData();
    await loadSnapshots();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isTabDetected = !!liveStatus?.isInstagramTabOpen;

  // Active unfollowers list
  const currentUnfollowers: Array<ExportedUser | { username: string; fullName?: string }> = useMemo(() => {
    if (exportResult) {
      return exportResult.notFollowingBack;
    }
    return notFollowingBack.map((u) => ({
      username: u.username,
      fullName: u.fullName,
      profileUrl: u.profileUrl,
    }));
  }, [exportResult, notFollowingBack]);

  const followersCount = exportResult?.followers?.length ?? followers.length;
  const followingCount = exportResult?.following?.length ?? following.length;
  const hasData = !!(exportResult || activeSnapshot);

  const filteredUnfollowers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return currentUnfollowers;
    return currentUnfollowers.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        (u.fullName && u.fullName.toLowerCase().includes(query))
    );
  }, [currentUnfollowers, searchQuery]);

  return (
    <div className="w-[350px] max-h-[580px] p-3.5 flex flex-col gap-2.5 bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans select-none border border-[var(--border-subtle)] rounded-2xl overflow-hidden transition-colors">
      {/* Onboarding Incomplete Banner */}
      {!isOnboardingCompleted && (
        <button
          onClick={() => openDashboard('onboarding')}
          className="w-full px-3 py-1.5 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-[11px] font-semibold flex items-center justify-between hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Finish first-install setup</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Header */}
      <header className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-2">
          <BrandLogo className="w-7 h-7 rounded-xl shadow-xs shrink-0 overflow-hidden" size={28} />
          <span className="font-logo text-base tracking-wide text-[var(--text-primary)]">
            InstaTrack
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isTabDetected ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-positive)] animate-pulse" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              <span>Open IG</span>
            </span>
          )}

          <button
            onClick={toggleTheme}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => openDashboard('overview')}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            title="Open Full Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Target Account Input */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-2.5 text-[var(--text-secondary)] text-xs font-bold">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleStartScan()}
            placeholder="instagram_username"
            disabled={isScanning}
            className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-all placeholder:text-[var(--text-tertiary)]"
          />
        </div>

        {!hasData && (
          <button
            onClick={handleStartScan}
            disabled={isScanning || !username.trim()}
            className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--bg-canvas)] text-xs font-semibold transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Scan</span>
          </button>
        )}
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
              <span className="truncate">{progress.message || 'Scanning Instagram...'}</span>
            </span>
            <span className="font-semibold text-[var(--accent-primary)] text-xs shrink-0">{progress.percent}%</span>
          </div>
          <div className="w-full bg-[var(--bg-surface-subtle)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--accent-primary)] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative)]/20 text-[var(--status-negative)] text-xs flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-[10px] font-semibold text-[var(--status-negative)] hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Results Summary Card (When Data Exists) */}
      {hasData && (
        <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[var(--status-warning)] tracking-tight leading-none">
                {currentUnfollowers.length}
              </span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Not Following Back
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              {followersCount.toLocaleString()} followers · {followingCount.toLocaleString()} following
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="p-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs font-semibold transition-all flex items-center gap-1"
              title="Re-scan account"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleDownloadCSV}
              className="py-1.5 px-2.5 rounded-lg bg-[var(--accent-primary)] hover:opacity-90 text-[var(--bg-canvas)] text-xs font-semibold transition-all shadow-subtle flex items-center gap-1"
              title="Download CSV report"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Unfollowers List */}
      {hasData ? (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
          {/* Search Input */}
          <div className="relative flex items-center shrink-0">
            <Search className="w-3 h-3 absolute left-2.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentUnfollowers.length} unfollowers...`}
              className="w-full pl-7 pr-2.5 py-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs focus:outline-none"
            />
          </div>

          {/* Accounts Rows */}
          {filteredUnfollowers.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
              {filteredUnfollowers.map((user) => {
                const uname = user.username;
                const isUnfollowed = unfollowedUsers.has(uname.toLowerCase());
                const isBusy = unfollowingId === uname;

                return (
                  <div
                    key={uname}
                    className="p-1.5 px-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between gap-2 transition-all hover:border-[var(--accent-primary)]/40"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-canvas)] flex items-center justify-center text-[10px] font-bold shrink-0 text-[var(--text-primary)]">
                        {uname[0]?.toUpperCase() || '@'}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={`https://www.instagram.com/${uname}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[var(--text-primary)] hover:underline truncate block leading-tight"
                        >
                          @{uname}
                        </a>
                        {user.fullName && (
                          <span className="text-[10px] text-[var(--text-secondary)] truncate block leading-tight">
                            {user.fullName}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnfollowUser(user)}
                      disabled={isUnfollowed || isBusy}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
                        isUnfollowed
                          ? 'bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/30 cursor-default'
                          : isBusy
                          ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] cursor-not-allowed'
                          : 'bg-[var(--status-negative-bg)] hover:opacity-90 text-[var(--status-negative)] border border-[var(--status-negative)]/25 active:scale-95'
                      }`}
                    >
                      {isBusy ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isUnfollowed ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Unfollowed</span>
                        </>
                      ) : (
                        <>
                          <UserMinus className="w-3 h-3" />
                          <span>Unfollow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-[var(--text-secondary)]">
              {searchQuery ? (
                <p>No unfollowers match &ldquo;{searchQuery}&rdquo;</p>
              ) : (
                <p className="font-semibold text-[var(--status-positive)]">
                  Everyone you follow follows you back!
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State (First Run) */
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center">
            <UserMinus className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-[var(--text-primary)]">
              Find Who Doesn&apos;t Follow Back
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Scan your Instagram following to view accounts not following you back.
            </p>
          </div>
          <button
            onClick={handleStartScan}
            disabled={isScanning || !username.trim()}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[var(--bg-canvas)] bg-[var(--accent-primary)] hover:opacity-90 transition-all shadow-subtle active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Find Unfollowers</span>
          </button>
          <button
            onClick={handleLoadDemo}
            className="text-[10px] text-[var(--text-secondary)] hover:underline pt-1"
          >
            Load demo data
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-secondary)] shrink-0">
        <span>
          {activeSnapshot
            ? `Updated ${formatRelativeTime(activeSnapshot.timestamp)}`
            : 'InstaTrack Extension'}
        </span>
        <button
          onClick={() => openDashboard('overview')}
          className="hover:underline flex items-center gap-0.5 font-semibold text-[var(--text-primary)]"
        >
          <span>Full Dashboard</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </footer>
    </div>
  );
};
