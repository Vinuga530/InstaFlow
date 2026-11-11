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
  Lock,
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
    const unsub = subscribeToTabDetectionChanges((state) => {
      if (state.activeTab?.detectedUsername && !usernameInput) {
        setUsernameInput(state.activeTab.detectedUsername);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (liveStatus?.activeTab?.detectedUsername && !usernameInput) {
      setUsernameInput(liveStatus.activeTab.detectedUsername);
    }
  }, [liveStatus]);

  const isTabDetected = !!liveStatus?.isInstagramTabOpen;
  const activeTab = liveStatus?.activeTab;
  const detectedUser = activeTab?.detectedUsername;

  const handleOpenInstagram = async () => {
    await liveIntegrationService.openInstagram();
    setTimeout(() => {
      fetchLiveStatus();
    }, 1000);
  };

  const handleStartScan = async () => {
    const target = usernameInput.trim().replace(/^@/, '');
    if (!target) {
      setErrorMessage('Please enter an Instagram handle to scan.');
      return;
    }

    if (!isTabDetected || !activeTab?.id) {
      setErrorMessage('No active Instagram tab detected. Please open Instagram in Chrome first.');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);
    setScanProgress({ percent: 5, message: 'Initiating scan in Instagram tab...' });

    try {
      const result = await runFollowerExporter({
        tabId: activeTab.id,
        username: target,
        collectType,
        detailed: true,
        scanSpeed,
        onProgress: (p) => {
          setScanProgress({ percent: p.percent, message: p.message });
        },
      });

      setScanResult(result);
      await loadSnapshots();

      if (result.snapshotId) {
        await selectSnapshot(result.snapshotId);
      }

      addToast({
        type: 'success',
        title: 'Scan Complete',
        message: `Identified ${result.notFollowingBack.length} accounts not following you back.`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Scan failed. Ensure you are logged into Instagram.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUnfollowSingle = async (uname: string, uid?: string) => {
    setUnfollowingUsername(uname);
    try {
      const ok = await unfollowAccount(uname, uid);
      if (ok) {
        addToast({
          type: 'success',
          title: 'Unfollowed',
          message: `Successfully unfollowed @${uname}.`,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Unfollow Failed',
        message: err.message,
      });
    } finally {
      setUnfollowingUsername(null);
    }
  };

  const handleExportCSV = () => {
    const list = scanResult?.notFollowingBack || notFollowingBack;
    if (!list.length) return;

    const accountsMap = new Map();
    for (const u of list) {
      accountsMap.set(u.username.toLowerCase(), {
        username: u.username,
        fullName: u.fullName || '',
        profileUrl: `https://www.instagram.com/${u.username}/`,
        relationshipType: 'following',
        isWhitelisted: false,
        timestamp: Date.now(),
      });
    }

    const filename = `instaflow_live_scan_${usernameInput || 'unfollowers'}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadAccountsAsCSV(Array.from(accountsMap.values()), filename);
  };

  const currentUnfollowers = scanResult?.notFollowingBack || notFollowingBack;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ─── Header & Connection Status Banner ─── */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-subtle shrink-0 ${
              isTabDetected
                ? 'bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/30'
                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]'
            }`}
          >
            <Activity className={`w-6 h-6 ${isTabDetected ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Live Browser Session Hub
              </h1>
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isTabDetected
                    ? 'bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/30'
                    : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}
              >
                {isTabDetected ? 'Instagram Connected' : 'Tab Not Detected'}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isTabDetected
                ? detectedUser
                  ? `Active profile: @${detectedUser} (${liveStatus?.tabCount || 1} tab open)`
                  : 'Instagram tab open and ready for scanning'
                : 'Keep an open instagram.com tab in Chrome to scan live followers on-demand.'}
            </p>
          </div>
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
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-5">
        <div className="border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Scan Configuration
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure scan target and pacing for the active Instagram session.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Account Handle
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[var(--text-secondary)] text-xs font-bold">@</span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="instagram_handle"
                disabled={isScanning}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
              />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Leave blank to automatically scan the currently logged-in account.
            </p>
          </div>

          {/* List to Collect */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Relationship Scope
            </label>
            <select
              value={collectType}
              onChange={(e) => setCollectType(e.target.value as ExportCollectType)}
              disabled={isScanning}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            >
              <option value="both">Both Followers &amp; Following (Find Unfollowers)</option>
              <option value="following">Following Only</option>
              <option value="followers">Followers Only</option>
            </select>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              &ldquo;Both&rdquo; cross-references lists to calculate not-following-back accounts.
            </p>
          </div>

          {/* Scan Speed */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Pacing / Throttle Rate
            </label>
            <select
              value={scanSpeed}
              onChange={(e) => setScanSpeed(e.target.value as ScanSpeed)}
              disabled={isScanning}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            >
              <option value="fast">Fast (800ms delays &bull; Active accounts)</option>
              <option value="medium">Medium (1.5s delays &bull; Recommended)</option>
              <option value="slow">Slow &bull; Gentle (2.5s delays &bull; High security)</option>
            </select>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Pacing introduces human-like pauses to prevent rate limits.
            </p>
          </div>
        </div>

        {/* Scan Button & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-[var(--status-positive)] shrink-0" />
            <span>Never stores passwords &bull; Sandboxed to your browser tab</span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleStartScan}
            disabled={isScanning || !isTabDetected}
            leftIcon={
              isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )
            }
          >
            {isScanning ? 'Scanning in Progress...' : 'Start Live Scan'}
          </Button>
        </div>
      </div>

      {/* ─── Scanning Progress Bar ─── */}
      {isScanning && (
        <div className="rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-subtle)] p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
              <span>{scanProgress.message}</span>
            </span>
            <span className="font-bold text-[var(--accent-primary)] tabular-nums">
              {scanProgress.percent}%
            </span>
          </div>

          <div className="w-full bg-[var(--bg-surface-subtle)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--accent-primary)] h-full rounded-full transition-all duration-300"
              style={{ width: `${scanProgress.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Keep the Instagram tab open while scanning is active. You may switch to other applications.
          </p>
        </div>
      )}

      {/* ─── Error Message Alert ─── */}
      {errorMessage && (
        <div className="rounded-2xl border border-[var(--status-negative)]/30 bg-[var(--status-negative-bg)] p-4 flex items-center justify-between gap-3 text-xs text-[var(--status-negative)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-semibold hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Scan Results & Immediate Actions ─── */}
      {currentUnfollowers.length > 0 && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Not Following You Back ({currentUnfollowers.length})
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning)]/20">
                  Detected
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Accounts you follow that do not follow your account in return.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setActiveCategory('not_following_back')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Full List View
              </Button>
            </div>
          </div>

          {/* Accounts List Rows */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {currentUnfollowers.slice(0, 10).map((u) => {
              const uname = u.username;
              const isUnfollowing = unfollowingUsername === uname;

              return (
                <div
                  key={uname}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar username={uname} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[var(--text-primary)] truncate">
                          @{uname}
                        </span>
                        {u.isVerified && (
                          <span title="Verified Account" className="inline-flex items-center text-blue-500">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-blue-500 text-white dark:text-[#151716]" />
                          </span>
                        )}
                        {u.isPrivate && (
                          <span title="Private Account" className="inline-flex items-center text-[var(--text-tertiary)]">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                        <a
                          href={`https://www.instagram.com/${uname}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                          title="Open Profile"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {u.fullName && (
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {u.fullName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <Badge variant={(u as any).accountType === 'page' ? 'page' : 'personal'} />
                    <Badge variant="not_following_back" showIcon={false} />
                    <button
                      onClick={() => handleUnfollowSingle(uname, (u as any).id)}
                      disabled={isUnfollowing}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold text-[var(--status-negative)] bg-[var(--status-negative-bg)] hover:opacity-90 border border-[var(--status-negative)]/25 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      {isUnfollowing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="w-3.5 h-3.5" />
                      )}
                      <span>Unfollow</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {currentUnfollowers.length > 10 && (
            <div className="pt-3 border-t border-[var(--border-subtle)] text-center">
              <button
                onClick={() => setActiveCategory('not_following_back')}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
              >
                <span>View remaining {currentUnfollowers.length - 10} accounts in table</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
