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
    setTheme(theme);
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

  // Pre-populate username when tab detected
  useEffect(() => {
    if (liveStatus?.activeTab?.detectedUsername && !username) {
      setUsername(liveStatus.activeTab.detectedUsername);
    }
  }, [liveStatus]);

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
      setErrorMsg('Please enter an Instagram username');
      return;
    }

    if (!liveStatus?.activeTab?.id) {
      setErrorMsg('Please open an Instagram tab in your browser first.');
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
    const targetUname = username || activeSnapshot?.accountUsername || 'instagram';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `instagram_${targetUname}_unfollowers_${dateStr}.csv`;

    if (exportResult?.allAccounts?.length) {
      downloadAccountsAsCSV(exportResult.allAccounts, filename);
      return;
    }

    // Build from current snapshot
    const accountsMap = new Map<string, any>();
    following.forEach((acc) => {
      accountsMap.set(acc.username, {
        username: acc.username,
        fullName: acc.fullName,
        relationship: 'following',
        profileUrl: acc.profileUrl,
      });
    });
    followers.forEach((acc) => {
      const existing = accountsMap.get(acc.username);
      if (existing) {
        existing.relationship = 'mutual';
      } else {
        accountsMap.set(acc.username, {
          username: acc.username,
          fullName: acc.fullName,
          relationship: 'follower',
          profileUrl: acc.profileUrl,
        });
      }
    });
    notFollowingBack.forEach((acc) => {
      const existing = accountsMap.get(acc.username);
      if (existing) {
        existing.relationship = 'not_following_back';
      }
    });

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
    <div className="w-[350px] max-h-[580px] p-3.5 flex flex-col gap-2.5 bg-[#FAF8F5] dark:bg-[#121110] text-[#292522] dark:text-[#F7F4EF] font-sans select-none border border-black/[0.06] dark:border-white/[0.08] shadow-cozy-lg rounded-2xl overflow-hidden transition-colors">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E05A47] via-[#D94E34] to-[#C93B20] flex items-center justify-center text-white shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </div>
          <span className="font-logo text-base tracking-wide text-[#292522] dark:text-[#F7F4EF]">
            InstaTrack
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isTabDetected ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
              <span>Open IG</span>
            </span>
          )}

          <button
            onClick={toggleTheme}
            className="p-1 rounded-lg text-[#8C827A] dark:text-[#A8A199] hover:text-[#292522] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => openDashboard('overview')}
            className="p-1 rounded-lg text-[#8C827A] dark:text-[#A8A199] hover:text-[#292522] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            title="Open Full Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── Target Account Input ─── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-2.5 text-[#8C827A] dark:text-[#A8A199] text-xs font-bold">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleStartScan()}
            placeholder="instagram_username"
            disabled={isScanning}
            className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] text-xs font-semibold text-[#292522] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-[#E05A47]/30 transition-all placeholder:text-neutral-400"
          />
        </div>

        {!hasData && (
          <button
            onClick={handleStartScan}
            disabled={isScanning || !username.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#E05A47] hover:bg-[#D94E34] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-white" />
            )}
            <span>Scan</span>
          </button>
        )}
      </div>

      {/* ─── Scanning Progress ─── */}
      {isScanning && (
        <div className="p-3 rounded-xl bg-white dark:bg-[#1B1918] border border-black/[0.06] dark:border-white/[0.08] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#292522] dark:text-[#F7F4EF] flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E05A47]" />
              <span className="truncate">{progress.message || 'Scanning Instagram...'}</span>
            </span>
            <span className="font-bold text-[#E05A47] text-xs shrink-0">{progress.percent}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#E05A47] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── Error Message ─── */}
      {errorMsg && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-[10px] font-bold text-rose-500 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Results Summary Card (When Data Exists) ─── */}
      {hasData && (
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#1B1918] border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-rose-500 tracking-tight leading-none">
                {currentUnfollowers.length}
              </span>
              <span className="text-xs font-bold text-[#292522] dark:text-[#F7F4EF]">
                Not Following Back
              </span>
            </div>
            <p className="text-[10px] text-[#8C827A] dark:text-[#A8A199] mt-0.5">
              {followersCount.toLocaleString()} followers · {followingCount.toLocaleString()} following
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#292522] dark:text-[#F7F4EF] text-xs font-semibold transition-all flex items-center gap-1"
              title="Re-scan account"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleDownloadCSV}
              className="py-1.5 px-2.5 rounded-lg bg-[#E05A47] hover:bg-[#D94E34] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
              title="Download CSV report"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Unfollowers List ─── */}
      {hasData ? (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
          {/* Search Input */}
          <div className="relative flex items-center shrink-0">
            <Search className="w-3 h-3 absolute left-2.5 text-[#8C827A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentUnfollowers.length} unfollowers...`}
              className="w-full pl-7 pr-2.5 py-1 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] text-xs focus:outline-none"
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
                    className="p-1.5 px-2 rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1B1918] flex items-center justify-between gap-2 transition-all hover:border-black/[0.08] dark:hover:border-white/[0.12]"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-neutral-600 dark:text-neutral-300">
                        {uname[0]?.toUpperCase() || '@'}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={`https://www.instagram.com/${uname}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#292522] dark:text-[#F7F4EF] hover:underline truncate block leading-tight"
                        >
                          @{uname}
                        </a>
                        {user.fullName && (
                          <span className="text-[10px] text-[#8C827A] dark:text-[#A8A199] truncate block leading-tight">
                            {user.fullName}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnfollowUser(user)}
                      disabled={isUnfollowed || isBusy}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                        isUnfollowed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                          : isBusy
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                          : 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 active:scale-95'
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
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-[#8C827A] dark:text-[#A8A199]">
              {searchQuery ? (
                <p>No unfollowers match "{searchQuery}"</p>
              ) : (
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Everyone you follow follows you back! 🎉
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State (First Run) */
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3 bg-white dark:bg-[#1B1918] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <UserMinus className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-[#292522] dark:text-[#F7F4EF]">
              Find Who Doesn't Follow Back
            </h3>
            <p className="text-[11px] text-[#8C827A] dark:text-[#A8A199]">
              Scan your Instagram following to view accounts not following you back.
            </p>
          </div>
          <button
            onClick={handleStartScan}
            disabled={isScanning || !username.trim()}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-[#E05A47] hover:bg-[#D94E34] transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Find Unfollowers</span>
          </button>
          <button
            onClick={handleLoadDemo}
            className="text-[10px] text-[#8C827A] hover:underline pt-1"
          >
            Load demo data
          </button>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[10px] text-[#8C827A] dark:text-[#A8A199] shrink-0">
        <span>
          {activeSnapshot
            ? `Updated ${formatRelativeTime(activeSnapshot.timestamp)}`
            : 'InstaTrack Extension'}
        </span>
        <button
          onClick={() => openDashboard('overview')}
          className="hover:underline flex items-center gap-0.5 font-bold text-[#292522] dark:text-[#F7F4EF]"
        >
          <span>Full Dashboard</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </footer>
    </div>
  );
};
