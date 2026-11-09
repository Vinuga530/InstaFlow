import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { liveIntegrationService } from '../../services/live/liveIntegrationService';
import { subscribeToTabDetectionChanges } from '../../services/live/tabDetectionService';
import {
  runFollowerExporter,
  ExportCollectType,
  ScanSpeed,
  FollowerExportResult,
} from '../../services/live/followerExporterService';
import { downloadAccountsAsCSV } from '../../services/export/downloadService';
import { formatRelativeTime } from '../../utils/formatters';
import {
  Activity,
  Zap,
  RefreshCw,
  ExternalLink,
  UserMinus,
  UserCheck,
  Users,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const LiveModeView: React.FC = () => {
  const {
    liveStatus,
    fetchLiveStatus,
    snapshots,
    activeSnapshot,
    loadSnapshots,
    selectSnapshot,
    notFollowingBack,
    unfollowAccount,
    addToast,
    setActiveCategory,
  } = useAppStore();

  const [usernameInput, setUsernameInput] = useState('');
  const [collectType, setCollectType] = useState<ExportCollectType>('both');
  const [scanSpeed, setScanSpeed] = useState<ScanSpeed>('fast');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: '',
  });
  const [scanResult, setScanResult] = useState<FollowerExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unfollowingUsername, setUnfollowingUsername] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveStatus();

    const unsubscribe = subscribeToTabDetectionChanges((freshState) => {
      if (freshState.activeTab?.detectedUsername && !usernameInput) {
        setUsernameInput(freshState.activeTab.detectedUsername);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (liveStatus?.activeTab?.detectedUsername && !usernameInput) {
      setUsernameInput(liveStatus.activeTab.detectedUsername);
    } else if (activeSnapshot?.accountUsername && !usernameInput) {
      setUsernameInput(activeSnapshot.accountUsername);
    }
  }, [liveStatus, activeSnapshot]);

  const handleOpenInstagram = async () => {
    await liveIntegrationService.openInstagram();
    setTimeout(() => {
      fetchLiveStatus();
    }, 1000);
  };

  const handleStartScan = async () => {
    if (!liveStatus?.activeTab?.id) {
      setErrorMessage('Please open an Instagram tab in your browser first.');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);
    setScanProgress({ percent: 5, message: 'Connecting to Instagram tab...' });

    try {
      const res = await runFollowerExporter({
        tabId: liveStatus.activeTab.id,
        username: usernameInput.trim().replace(/^@/, ''),
        collectType,
        detailed: true,
        scanSpeed,
        onProgress: (p) => {
          setScanProgress({
            percent: p.percent,
            message: p.message,
          });
        },
      });

      setScanResult(res);
      await loadSnapshots();
      if (res.snapshotId) {
        await selectSnapshot(res.snapshotId);
      }

      addToast({
        type: 'success',
        title: 'Scan Complete',
        message: `Analyzed ${res.allAccounts.length} accounts for @${res.username}.`,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Scan failed. Make sure you are logged into Instagram.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUnfollow = async (targetUsername: string) => {
    setUnfollowingUsername(targetUsername);
    try {
      await unfollowAccount(targetUsername);
    } finally {
      setUnfollowingUsername(null);
    }
  };

  const handleExportCSV = () => {
    const targetUname = usernameInput || activeSnapshot?.accountUsername || 'instagram';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `instagram_${targetUname}_accounts_${dateStr}.csv`;

    if (scanResult?.allAccounts?.length) {
      downloadAccountsAsCSV(scanResult.allAccounts, filename);
    } else if (notFollowingBack.length > 0) {
      downloadAccountsAsCSV(
        notFollowingBack.map((u) => ({
          username: u.username,
          fullName: u.fullName,
          profileUrl: u.profileUrl,
          relationship: 'not_following_back',
        })),
        filename
      );
    }
  };

  const isTabDetected = !!liveStatus?.isInstagramTabOpen;
  const detectedUser = liveStatus?.activeTab?.detectedUsername;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* ─── Header & Live Connection Status ─── */}
      <div className="rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium tracking-tight text-[#242823] dark:text-[#F0EEE6] flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                {isTabDetected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#71806C]/40 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isTabDetected ? 'bg-[#71806C] dark:bg-[#899783]' : 'bg-[#686E64]/50 dark:bg-[#A6AA9D]/50'
                  }`}
                />
              </span>
              <span>Live Account Scanner</span>
            </h1>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
                isTabDetected
                  ? 'bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#71806C] dark:text-[#899783] border-[#71806C]/30'
                  : 'bg-[#F5F3EC] dark:bg-[#151716] text-[#686E64] dark:text-[#A6AA9D] border-[#D5D2C5] dark:border-[#343B35]'
              }`}
            >
              {isTabDetected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <p className="text-xs text-[#686E64] dark:text-[#A6AA9D]">
            {isTabDetected
              ? detectedUser
                ? `Active Instagram session detected for @${detectedUser}. Ready to scan.`
                : 'Instagram tab is open. Ready to scan.'
              : 'Open Instagram in your browser to scan followers, find non-followers, and unfollow.'}
          </p>
        </div>

        {!isTabDetected ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenInstagram}
            leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Open Instagram Tab
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLiveStatus()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Tab State
          </Button>
        )}
      </div>

      {/* ─── Scanner Controls Card ─── */}
      <div className="rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#D5D2C5] dark:border-[#343B35] pb-3">
          <h2 className="text-sm font-semibold text-[#242823] dark:text-[#F0EEE6]">
            Scan Configuration
          </h2>
          <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] mt-0.5">
            Configure scan target and pacing for the active Instagram session.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
              Account Handle
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#686E64] dark:text-[#A6AA9D] text-xs font-bold">@</span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="instagram_handle"
                disabled={isScanning}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] text-xs font-medium text-[#242823] dark:text-[#F0EEE6] placeholder-[#686E64]/60 dark:placeholder-[#A6AA9D]/60 focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] transition-all"
              />
            </div>
            <p className="text-[10px] text-[#686E64] dark:text-[#A6AA9D]">
              Leave blank to automatically scan the currently logged-in account.
            </p>
          </div>

          {/* List to Collect */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
              Relationship Scope
            </label>
            <select
              value={collectType}
              onChange={(e) => setCollectType(e.target.value as ExportCollectType)}
              disabled={isScanning}
              className="w-full px-3 py-2 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] text-xs font-medium text-[#242823] dark:text-[#F0EEE6] focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] transition-all"
            >
              <option value="both">Both (Followers & Following · Detect Non-Followers)</option>
              <option value="followers">Followers List Only</option>
              <option value="following">Following List Only</option>
            </select>
            <p className="text-[10px] text-[#686E64] dark:text-[#A6AA9D]">
              "Both" is required to compute who is not following you back.
            </p>
          </div>

          {/* Scan Speed */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
              Pacing Speed
            </label>
            <select
              value={scanSpeed}
              onChange={(e) => setScanSpeed(e.target.value as ScanSpeed)}
              disabled={isScanning}
              className="w-full px-3 py-2 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] text-xs font-medium text-[#242823] dark:text-[#F0EEE6] focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] transition-all"
            >
              <option value="fast">Fast (Standard accounts under 5k)</option>
              <option value="balanced">Balanced (Recommended for 5k–20k)</option>
              <option value="careful">Careful (High-caution delay)</option>
            </select>
            <p className="text-[10px] text-[#686E64] dark:text-[#A6AA9D]">
              Automatically handles rate limits and exponential backoffs.
            </p>
          </div>
        </div>

        {/* Start Button & Progress */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#D5D2C5] dark:border-[#343B35]">
          <div className="flex items-center gap-2 text-xs text-[#686E64] dark:text-[#A6AA9D]">
            <ShieldCheck className="w-4 h-4 text-[#71806C] dark:text-[#899783]" />
            <span>Runs securely within your authenticated browser tab.</span>
          </div>

          <div className="flex items-center gap-2">
            {activeSnapshot && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export CSV
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleStartScan}
              disabled={isScanning || !isTabDetected}
              leftIcon={
                isScanning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )
              }
            >
              {isScanning ? 'Scanning...' : 'Start Live Scan'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isScanning && (
          <div className="p-4 rounded-xl bg-[#F5F3EC] dark:bg-[#151716] border border-[#D5D2C5] dark:border-[#343B35] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#242823] dark:text-[#F0EEE6] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#71806C] dark:text-[#899783]" />
                <span>{scanProgress.message || 'Scanning in progress...'}</span>
              </span>
              <span className="font-bold text-[#71806C] dark:text-[#899783]">{scanProgress.percent}%</span>
            </div>
            <div className="w-full bg-[#E2DFD6] dark:bg-[#1A1D1B] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#71806C] dark:bg-[#899783] h-full rounded-full transition-all duration-300"
                style={{ width: `${scanProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#A33F31]/10 border border-[#A33F31]/20 text-[#A33F31] dark:text-[#C45B4B] text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[11px] font-semibold text-[#A33F31] dark:text-[#C45B4B] hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ─── Active Relationship Overview (When Snapshot Exists) ─── */}
      {activeSnapshot && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-[#242823] dark:text-[#F0EEE6]">
                Latest Scan Results (@{activeSnapshot.accountUsername})
              </h2>
              <span className="text-xs text-[#686E64] dark:text-[#A6AA9D]">
                {formatRelativeTime(activeSnapshot.timestamp)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCategory('not_following_back')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Full Accounts List
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35] space-y-1">
              <span className="text-[11px] font-medium text-[#686E64] dark:text-[#A6AA9D]">Followers</span>
              <p className="text-xl font-semibold text-[#242823] dark:text-[#F0EEE6] tabular-nums">
                {activeSnapshot.followerCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35] space-y-1">
              <span className="text-[11px] font-medium text-[#686E64] dark:text-[#A6AA9D]">Following</span>
              <p className="text-xl font-semibold text-[#242823] dark:text-[#F0EEE6] tabular-nums">
                {activeSnapshot.followingCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35] space-y-1">
              <span className="text-[11px] font-medium text-[#9E7E43] dark:text-[#CBB279]">Not Following Back</span>
              <p className="text-xl font-semibold text-[#9E7E43] dark:text-[#CBB279] tabular-nums">
                {activeSnapshot.notFollowingBackCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35] space-y-1">
              <span className="text-[11px] font-medium text-[#71806C] dark:text-[#899783]">Mutual Connections</span>
              <p className="text-xl font-semibold text-[#71806C] dark:text-[#899783] tabular-nums">
                {activeSnapshot.mutualCount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Quick Unfollowers Table */}
          {notFollowingBack.length > 0 && (
            <div className="rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] overflow-hidden">
              <div className="p-4 border-b border-[#D5D2C5] dark:border-[#343B35] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
                    Accounts Not Following You Back
                  </h3>
                  <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">
                    Quickly unfollow non-reciprocal accounts directly from this hub.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#9E7E43]/15 text-[#9E7E43] dark:text-[#CBB279] border border-[#9E7E43]/30">
                  {notFollowingBack.length} accounts
                </span>
              </div>

              <div className="divide-y divide-[#D5D2C5]/50 dark:divide-[#343B35]/50 max-h-80 overflow-y-auto">
                {notFollowingBack.slice(0, 15).map((user) => {
                  const isBusy = unfollowingUsername === user.username;
                  return (
                    <div
                      key={user.username}
                      className="p-3 px-4 flex items-center justify-between gap-3 hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar username={user.username} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6] truncate">
                              @{user.username}
                            </span>
                            <a
                              href={user.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#686E64] dark:text-[#A6AA9D] hover:text-[#71806C] dark:hover:text-[#899783]"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {user.fullName && (
                            <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D] truncate">
                              {user.fullName}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnfollow(user.username)}
                        disabled={isBusy}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#A33F31]/10 hover:bg-[#A33F31]/15 text-[#A33F31] dark:text-[#C45B4B] border border-[#A33F31]/20 dark:border-[#C45B4B]/25 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
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

              {notFollowingBack.length > 15 && (
                <div className="p-3 text-center border-t border-[#D5D2C5] dark:border-[#343B35] bg-[#E2DFD6]/40 dark:bg-[#1A1D1B]/50">
                  <button
                    onClick={() => setActiveCategory('not_following_back')}
                    className="text-xs font-semibold text-[#71806C] dark:text-[#899783] hover:underline"
                  >
                    View all {notFollowingBack.length} accounts in Not Following Back →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
