import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { liveIntegrationService } from '../../services/live/liveIntegrationService';
import { subscribeToTabDetectionChanges } from '../../services/live/tabDetectionService';
import { LiveDataSourceType } from '../../services/live/liveTypes';
import { exportAccountsToCSV } from '../../services/export/csvExporter';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import {
  Activity,
  Globe,
  Key,
  RefreshCw,
  Clock,
  ShieldCheck,
  ExternalLink,
  Layers,
  Info,
  Radio,
  Lock,
  UserMinus,
  UserCheck,
  Users,
  Download,
  Star,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const LiveModeView: React.FC = () => {
  const {
    liveStatus,
    diagnostics,
    isLiveSyncing,
    liveSyncProgress,
    liveSyncMessage,
    fetchLiveStatus,
    fetchDiagnostics,
    triggerLiveSync,
    setDataSourceMode,
    setImportModalOpen,
    setGuideModalOpen,
    addToast,
    snapshots,
    activeSnapshot,
    notFollowingBack,
    fans,
    mutuals,
    setActiveCategory,
    toggleWhitelist,
    setSelectedAccountForNotes,
  } = useAppStore();

  const [selectedSource, setSelectedSource] = useState<LiveDataSourceType>('browser_assisted');
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [syncSuccessInfo, setSyncSuccessInfo] = useState<{
    followerCount: number;
    followingCount: number;
  } | null>(null);

  useEffect(() => {
    fetchLiveStatus();
    fetchDiagnostics();

    const unsubscribe = subscribeToTabDetectionChanges(() => {
      fetchLiveStatus();
      fetchDiagnostics();
    });

    liveIntegrationService.getApiToken().then((tok) => {
      if (tok) {
        setApiTokenInput(tok);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenInstagram = async () => {
    await liveIntegrationService.openInstagram();
    setTimeout(() => {
      fetchLiveStatus();
      fetchDiagnostics();
    }, 800);
  };

  const handleSaveToken = async () => {
    await liveIntegrationService.saveApiToken(apiTokenInput.trim() || null);
    await fetchLiveStatus();
    await fetchDiagnostics();
    addToast({
      type: 'success',
      title: 'Token Saved',
      message: apiTokenInput.trim()
        ? 'Meta Graph API token saved locally in your browser.'
        : 'Meta Graph API token removed.',
    });
    setShowTokenInput(false);
  };

  const handleSyncNow = async () => {
    setSyncNotice(null);
    setSyncSuccessInfo(null);
    const result = await triggerLiveSync({
      sourceType: selectedSource,
      apiToken: apiTokenInput.trim() || undefined,
      customLabel: customLabel.trim() || undefined,
    });

    if (result.success) {
      setSyncSuccessInfo({
        followerCount: result.followerCount,
        followingCount: result.followingCount,
      });
    } else if (result.unsupportedReason) {
      setSyncNotice(result.unsupportedReason);
    }
  };

  const liveSnapshots = snapshots.filter(
    (s) => s.sourceType === 'live_browser' || s.sourceType === 'live_api'
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* 1. Header & Primary Mode Switcher */}
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-fredoka font-normal tracking-wide text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                {liveStatus?.isInstagramTabOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    liveStatus?.isInstagramTabOpen ? 'bg-emerald-500' : 'bg-neutral-400'
                  }`}
                />
              </span>
              <span>Live Synchronization Hub</span>
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-neutral-100 dark:bg-[#282522] text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.06]">
              Live Channel
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time browser session detection and authorized synchronization.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center rounded-xl p-0.5 bg-neutral-100 dark:bg-[#282522] border border-black/[0.04] dark:border-white/[0.06] text-xs font-medium">
          <button
            onClick={() => setDataSourceMode('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Import Mode</span>
          </button>
          <button
            onClick={() => setDataSourceMode('live')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white shadow-cozy font-semibold transition-all"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Decoupled Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Browser Tab Status (Presence Only) */}
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 shadow-subtle flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Browser Tab Presence
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  liveStatus?.tabStatus === 'tab_detected'
                    ? 'bg-emerald-500'
                    : liveStatus?.tabStatus === 'permission_waiting'
                    ? 'bg-amber-500'
                    : 'bg-neutral-400'
                }`}
              />
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {liveStatus?.tabStatusLabel || 'Scanning tabs...'}
              </span>
            </div>

            <p className="text-xs text-neutral-500 truncate">
              {liveStatus?.activeTab?.url || 'No active instagram.com tab open.'}
            </p>
          </div>

          <div className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<ExternalLink className="w-3 h-3" />}
              onClick={handleOpenInstagram}
            >
              {liveStatus?.isInstagramTabOpen ? 'Focus Tab' : 'Open Instagram'}
            </Button>
            <button
              onClick={() => {
                fetchLiveStatus();
                fetchDiagnostics();
              }}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
              title="Refresh tab detection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Data Source Synchronization Status */}
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 shadow-subtle flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Sync Status
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  liveStatus?.syncStatus === 'sync_successful'
                    ? 'bg-emerald-500'
                    : liveStatus?.syncStatus === 'sync_failed'
                    ? 'bg-rose-500'
                    : 'bg-neutral-400'
                }`}
              />
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {liveStatus?.syncStatusLabel || 'Ready to synchronize'}
              </span>
            </div>

            <p className="text-xs text-neutral-500">
              {liveStatus?.isMetaApiConnected
                ? 'Authorized Meta API Scope Connected'
                : 'Official Meta Export Bridge Available'}
            </p>
          </div>

          <div className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-xs font-medium text-brand-500 hover:underline"
            >
              {showTokenInput
                ? 'Close Token Panel'
                : liveStatus?.isMetaApiConnected
                ? 'Configure Token'
                : 'Configure Meta Token'}
            </button>
            <span className="text-[11px] text-neutral-400">OAuth / DYI</span>
          </div>
        </div>

        {/* Card 3: Data Freshness */}
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 shadow-subtle flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Data Freshness
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                liveStatus?.dataFreshness === 'fresh'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : liveStatus?.dataFreshness === 'stale'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
              }`}
            >
              {liveStatus?.dataFreshness === 'fresh'
                ? 'Fresh (< 24h old)'
                : liveStatus?.dataFreshness === 'stale'
                ? 'Stale (> 24h old)'
                : 'Never Synchronized'}
            </span>

            <p className="text-xs text-neutral-500 pt-1">
              Last Success:{' '}
              {liveStatus?.lastSuccessfulSync
                ? formatRelativeTime(liveStatus.lastSuccessfulSync)
                : 'None yet'}
            </p>
          </div>

          <div className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] text-xs text-neutral-400 flex items-center justify-between">
            <span>Stored Live Snapshots:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {liveSnapshots.length}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Token Panel Drawer */}
      {showTokenInput && (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/80 dark:bg-[#242220] p-4.5 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-500" />
              <span>Meta Graph API Token Configuration</span>
            </h4>
            <span className="text-[10px] text-neutral-400">Stored strictly in local IndexedDB</span>
          </div>

          <p className="text-xs text-neutral-500">
            For real-time account sync via official Meta Developer credentials. Paste a User or Page Access Token from the Meta Developers Portal.
          </p>

          <div className="flex gap-2">
            <input
              type="password"
              value={apiTokenInput}
              onChange={(e) => setApiTokenInput(e.target.value)}
              placeholder="Paste Meta Access Token (EAA...)"
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-black/[0.07] dark:border-white/[0.1] bg-white dark:bg-[#1B1918] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <Button variant="primary" size="xs" onClick={handleSaveToken}>
              Save
            </Button>
            {liveStatus?.isMetaApiConnected && (
              <Button
                variant="danger"
                size="xs"
                onClick={() => {
                  setApiTokenInput('');
                  liveIntegrationService.saveApiToken(null).then(() => {
                    fetchLiveStatus();
                    fetchDiagnostics();
                  });
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. Synchronization Execution Panel */}
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Synchronize Live Data
            </h3>
            <p className="text-xs text-neutral-500">
              Scan relationships across your verified data channels.
            </p>
          </div>

          {/* Source Selector */}
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="liveSource"
                checked={selectedSource === 'browser_assisted'}
                onChange={() => setSelectedSource('browser_assisted')}
                className="text-brand-500 focus:ring-brand-500"
              />
              <span className="text-neutral-700 dark:text-neutral-300">
                Browser Integration
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="liveSource"
                checked={selectedSource === 'meta_graph_api'}
                onChange={() => setSelectedSource('meta_graph_api')}
                className="text-brand-500 focus:ring-brand-500"
              />
              <span className="text-neutral-700 dark:text-neutral-300">
                Meta Graph API
              </span>
            </label>
          </div>
        </div>

        {/* Source Explainer Banner */}
        {selectedSource === 'browser_assisted' && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Assisted Browser Live Scan
              </span>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Interacts with your active Instagram tab to harvest your following and follower lists into memory. Never asks for your password or cookies, and stores the results as an immutable snapshot in IndexedDB.
              </p>
            </div>
          </div>
        )}

        {/* Sync Progress Bar */}
        {isLiveSyncing && (
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between text-xs font-medium text-brand-500">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{liveSyncMessage}</span>
              </span>
              <span className="tabular-nums">{liveSyncProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-200"
                style={{ width: `${liveSyncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Custom snapshot label (optional)"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-black/[0.07] dark:border-white/[0.1] bg-neutral-50/70 dark:bg-[#242220] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            isLoading={isLiveSyncing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />}
            onClick={handleSyncNow}
          >
            Synchronize Now
          </Button>
        </div>

        {/* Sync Status / Guidance Notice */}
        {syncNotice && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Live Scanning Status & Guidance</span>
            </div>
            <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              {syncNotice}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              {liveStatus?.isInstagramTabOpen ? (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleOpenInstagram}
                  leftIcon={<ExternalLink className="w-3 h-3" />}
                >
                  Focus Instagram Profile Tab
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleOpenInstagram}
                  leftIcon={<ExternalLink className="w-3 h-3" />}
                >
                  Open Instagram
                </Button>
              )}
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setGuideModalOpen(true)}
              >
                Data Download Guide
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setImportModalOpen(true)}
              >
                Switch to Import Mode
              </Button>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {syncSuccessInfo && (
          <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-fredoka text-sm">Live Synchronization Complete!</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                Saved to IndexedDB
              </span>
            </div>
            <p className="text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              Successfully captured <strong>{syncSuccessInfo.followerCount.toLocaleString()} followers</strong> and <strong>{syncSuccessInfo.followingCount.toLocaleString()} following</strong>. Mutuals, fans, and non-followers have been computed into an immutable snapshot.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Button
                variant="primary"
                size="xs"
                rightIcon={<ArrowRight className="w-3 h-3" />}
                onClick={() => setActiveCategory('not_following_back')}
              >
                Inspect Non-Followers
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setActiveCategory('overview')}
              >
                View Overview
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3.5. Live Harvested Relationship Analysis */}
      {activeSnapshot && (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 sm:p-6 shadow-subtle space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fredoka text-base text-neutral-900 dark:text-neutral-50">
                  Latest Relationship Diff: @{activeSnapshot.accountUsername}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  {activeSnapshot.sourceType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Computed via set operations: Following ({activeSnapshot.followingCount}) \ Followers ({activeSnapshot.followerCount})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => {
                  exportAccountsToCSV(notFollowingBack, `instatrack_not_following_back_${activeSnapshot.accountUsername}`);
                  addToast({
                    type: 'success',
                    title: 'CSV Exported',
                    message: `Exported ${notFollowingBack.length} accounts not following you back.`,
                  });
                }}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="xs"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setActiveCategory('not_following_back')}
              >
                View All ({notFollowingBack.length})
              </Button>
            </div>
          </div>

          {/* 3 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setActiveCategory('not_following_back')}
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:bg-rose-500/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Not Following Back
                </span>
                <UserMinus className="w-4 h-4 text-rose-500" />
              </div>
              <span className="font-fredoka text-2xl text-rose-600 dark:text-rose-400 block mt-1">
                {notFollowingBack.length}
              </span>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                Accounts you follow who do not follow back
              </p>
            </div>

            <div
              onClick={() => setActiveCategory('fans')}
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Fans / Admirers
                </span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-fredoka text-2xl text-amber-600 dark:text-amber-400 block mt-1">
                {fans.length}
              </span>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                Accounts following you that you don't follow back
              </p>
            </div>

            <div
              onClick={() => setActiveCategory('mutuals')}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Mutual Follows
                </span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="font-fredoka text-2xl text-emerald-600 dark:text-emerald-400 block mt-1">
                {mutuals.length}
              </span>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                Accounts you mutually follow back
              </p>
            </div>
          </div>

          {/* Non-Followers Quick Preview List */}
          {notFollowingBack.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-0.5">
                Preview of Accounts Not Following Back (Top {Math.min(notFollowingBack.length, 5)})
              </span>
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-[#141312]/50">
                {notFollowingBack.slice(0, 5).map((acc) => (
                  <div
                    key={acc.username}
                    className="p-3 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar username={acc.username} size="sm" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate block">
                          @{acc.username}
                        </span>
                        {acc.fullName && (
                          <span className="text-[11px] text-neutral-400 truncate block">
                            {acc.fullName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleWhitelist(acc.username)}
                        className="p-1 rounded text-neutral-400 hover:text-amber-500 transition-colors"
                        title={acc.isWhitelisted ? 'Whitelisted' : 'Add to Whitelist'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            acc.isWhitelisted ? 'text-amber-400 fill-amber-400' : ''
                          }`}
                        />
                      </button>
                      <a
                        href={acc.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-neutral-400 hover:text-rose-500 transition-colors"
                        title="View profile on Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Diagnostics & Security Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 shadow-subtle space-y-3">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Connection Diagnostics
          </h4>

          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05] text-xs">
            {diagnostics.map((diag) => (
              <div key={diag.id} className="py-2.5 flex items-start justify-between gap-3">
                <div>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {diag.label}
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{diag.detail}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    diag.status === 'pass'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : diag.status === 'warn'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {diag.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 shadow-subtle space-y-3">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Privacy & Account Protection
          </h4>

          <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              InstaTrack is engineered with a strict privacy guarantee. Other third-party tracker apps that simulate automated logins by hijacking session cookies are frequently flagged and banned by Instagram's automated safety systems.
            </p>
            <p>
              InstaTrack ensures 100% account safety by adhering strictly to safe data pathways:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-neutral-500 pl-1 text-[11px]">
              <li>
                <strong className="text-neutral-700 dark:text-neutral-300">Client-Side Browser Tab Harvesting:</strong> Scans rendered DOM lists in your active tab without extracting cookies or sharing passwords.
              </li>
              <li>
                <strong className="text-neutral-700 dark:text-neutral-300">Official Meta Accounts Center Data Exports:</strong> 100% complete, zero risk, handles accounts of any scale.
              </li>
              <li>
                <strong className="text-neutral-700 dark:text-neutral-300">Official Meta Graph API:</strong> For Creator & Business accounts via approved OAuth tokens.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
