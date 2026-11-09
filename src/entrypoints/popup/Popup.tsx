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
    <div className="w-[350px] max-h-[580px] p-3.5 flex flex-col gap-2.5 bg-[#F5F3EC] dark:bg-[#151716] text-[#242823] dark:text-[#F0EEE6] font-sans select-none border border-[#D5D2C5] dark:border-[#343B35] rounded-2xl overflow-hidden transition-colors">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between pb-2 border-b border-[#D5D2C5] dark:border-[#343B35] shrink-0">
        <div className="flex items-center gap-2">
          <BrandLogo className="w-7 h-7 rounded-lg shadow-sm shrink-0 overflow-hidden" size={28} />
          <span className="font-logo text-base tracking-wide text-[#242823] dark:text-[#F0EEE6]">
            InstaTrack
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isTabDetected ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#71806C] dark:text-[#899783] border border-[#71806C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#71806C] dark:bg-[#899783] animate-pulse" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAE8DF] dark:bg-[#202421] text-[#686E64] dark:text-[#A6AA9D] border border-[#D5D2C5] dark:border-[#343B35]">
              <span>Open IG</span>
            </span>
          )}

          <button
            onClick={toggleTheme}
            className="p-1 rounded-lg text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#202421] transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => openDashboard('overview')}
            className="p-1 rounded-lg text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#202421] transition-colors"
            title="Open Full Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── Target Account Input ─── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-2.5 text-[#686E64] dark:text-[#A6AA9D] text-xs font-bold">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleStartScan()}
            placeholder="instagram_username"
            disabled={isScanning}
            className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] text-xs font-semibold text-[#242823] dark:text-[#F0EEE6] focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] transition-all placeholder:text-[#686E64]/60 dark:placeholder:text-[#A6AA9D]/60"
          />
        </div>

        {!hasData && (
          <button
            onClick={handleStartScan}
            disabled={isScanning || !username.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#71806C] hover:bg-[#5d6a59] dark:bg-[#899783] dark:hover:bg-[#71806c] text-[#F5F3EC] dark:text-[#151716] text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
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

      {/* ─── Scanning Progress ─── */}
      {isScanning && (
        <div className="p-3 rounded-xl bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#242823] dark:text-[#F0EEE6] flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#71806C] dark:text-[#899783]" />
              <span className="truncate">{progress.message || 'Scanning Instagram...'}</span>
            </span>
            <span className="font-semibold text-[#71806C] dark:text-[#899783] text-xs shrink-0">{progress.percent}%</span>
          </div>
          <div className="w-full bg-[#E2DFD6] dark:bg-[#1A1D1B] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#71806C] dark:bg-[#899783] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── Error Message ─── */}
      {errorMsg && (
        <div className="p-2 rounded-xl bg-[#A33F31]/10 border border-[#A33F31]/20 text-[#A33F31] dark:text-[#C45B4B] text-xs flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-[10px] font-semibold text-[#A33F31] dark:text-[#C45B4B] hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Results Summary Card (When Data Exists) ─── */}
      {hasData && (
        <div className="p-2.5 rounded-xl bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[#9E7E43] dark:text-[#CBB279] tracking-tight leading-none">
                {currentUnfollowers.length}
              </span>
              <span className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
                Not Following Back
              </span>
            </div>
            <p className="text-[10px] text-[#686E64] dark:text-[#A6AA9D] mt-0.5">
              {followersCount.toLocaleString()} followers · {followingCount.toLocaleString()} following
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="p-1.5 rounded-lg bg-[#F5F3EC] dark:bg-[#151716] border border-[#D5D2C5] dark:border-[#343B35] hover:bg-[#E2DFD6] dark:hover:bg-[#272C28] text-[#242823] dark:text-[#F0EEE6] text-xs font-semibold transition-all flex items-center gap-1"
              title="Re-scan account"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleDownloadCSV}
              className="py-1.5 px-2.5 rounded-lg bg-[#71806C] hover:bg-[#5d6a59] dark:bg-[#899783] dark:hover:bg-[#71806c] text-[#F5F3EC] dark:text-[#151716] text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
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
            <Search className="w-3 h-3 absolute left-2.5 text-[#686E64] dark:text-[#A6AA9D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentUnfollowers.length} unfollowers...`}
              className="w-full pl-7 pr-2.5 py-1 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] placeholder:text-[#686E64]/60 dark:placeholder:text-[#A6AA9D]/60 text-xs focus:outline-none"
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
                    className="p-1.5 px-2 rounded-xl border border-[#D5D2C5]/60 dark:border-[#343B35]/60 bg-[#EAE8DF] dark:bg-[#202421] flex items-center justify-between gap-2 transition-all hover:border-[#71806C]/40 dark:hover:border-[#899783]/40"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#F5F3EC] dark:bg-[#151716] flex items-center justify-center text-[10px] font-bold shrink-0 text-[#242823] dark:text-[#F0EEE6]">
                        {uname[0]?.toUpperCase() || '@'}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={`https://www.instagram.com/${uname}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6] hover:underline truncate block leading-tight"
                        >
                          @{uname}
                        </a>
                        {user.fullName && (
                          <span className="text-[10px] text-[#686E64] dark:text-[#A6AA9D] truncate block leading-tight">
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
                          ? 'bg-[#71806C]/15 text-[#71806C] dark:text-[#899783] border border-[#71806C]/30 cursor-default'
                          : isBusy
                          ? 'bg-[#E2DFD6] dark:bg-[#272C28] text-[#686E64] dark:text-[#A6AA9D] cursor-not-allowed'
                          : 'bg-[#A33F31]/10 hover:bg-[#A33F31]/15 text-[#A33F31] dark:text-[#C45B4B] border border-[#A33F31]/20 dark:border-[#C45B4B]/25 active:scale-95'
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
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-[#686E64] dark:text-[#A6AA9D]">
              {searchQuery ? (
                <p>No unfollowers match "{searchQuery}"</p>
              ) : (
                <p className="font-semibold text-[#71806C] dark:text-[#899783]">
                  Everyone you follow follows you back!
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State (First Run) */
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3 bg-[#EAE8DF] dark:bg-[#202421] rounded-xl border border-[#D5D2C5] dark:border-[#343B35]">
          <div className="w-10 h-10 rounded-full bg-[#71806C]/15 text-[#71806C] dark:text-[#899783] flex items-center justify-center">
            <UserMinus className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
              Find Who Doesn't Follow Back
            </h3>
            <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">
              Scan your Instagram following to view accounts not following you back.
            </p>
          </div>
          <button
            onClick={handleStartScan}
            disabled={isScanning || !username.trim()}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[#F5F3EC] dark:text-[#151716] bg-[#71806C] hover:bg-[#5d6a59] dark:bg-[#899783] dark:hover:bg-[#71806c] transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Find Unfollowers</span>
          </button>
          <button
            onClick={handleLoadDemo}
            className="text-[10px] text-[#686E64] dark:text-[#A6AA9D] hover:underline pt-1"
          >
            Load demo data
          </button>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer className="pt-2 border-t border-[#D5D2C5] dark:border-[#343B35] flex items-center justify-between text-[10px] text-[#686E64] dark:text-[#A6AA9D] shrink-0">
        <span>
          {activeSnapshot
            ? `Updated ${formatRelativeTime(activeSnapshot.timestamp)}`
            : 'InstaTrack Extension'}
        </span>
        <button
          onClick={() => openDashboard('overview')}
          className="hover:underline flex items-center gap-0.5 font-semibold text-[#242823] dark:text-[#F0EEE6]"
        >
          <span>Full Dashboard</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </footer>
    </div>
  );
};
