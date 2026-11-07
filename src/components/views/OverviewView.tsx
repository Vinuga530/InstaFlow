import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { seedSampleData } from '../../utils/sampleData';
import { formatRelativeTime } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  ArrowUpRight,
  Users2,
  Upload,
  Sparkles,
  ExternalLink,
  Activity,
  History,
  ChevronRight,
  ArrowRight,
  Heart,
  Smile,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const {
    activeSnapshot,
    snapshots,
    followers,
    following,
    notFollowingBack,
    mutuals,
    unfollowers,
    newFollowers,
    liveStatus,
    setActiveCategory,
    setDataSourceMode,
    setImportModalOpen,
    loadSnapshots,
    addToast,
    setLoading,
  } = useAppStore();

  const handleSeedSample = async () => {
    try {
      setLoading(true, 'Generating demo data...');
      await seedSampleData();
      await loadSnapshots();
      addToast({
        type: 'success',
        title: 'Demo Data Loaded',
        message: 'Successfully loaded 2 snapshots for testing.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to generate demo data',
        message: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!activeSnapshot) {
    const isTabDetected = !!liveStatus?.isInstagramTabOpen;
    const detectedUsername = liveStatus?.activeTab?.detectedUsername;

    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <EmptyState
          icon={
            isTabDetected ? (
              <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
            ) : (
              <Smile className="w-8 h-8 text-[#E05A47]" />
            )
          }
          title={
            isTabDetected
              ? detectedUsername
                ? `Connected to @${detectedUsername}`
                : 'Instagram Session Active'
              : 'Welcome to InstaTrack'
          }
          description={
            isTabDetected
              ? 'Your Instagram tab is connected. Run a scan to see who unfollowed you and who is not following you back.'
              : 'Open Instagram in your browser to scan who unfollowed you, or import an Instagram data export.'
          }
          actionLabel={isTabDetected ? 'Scan Account Now' : 'Open Live Scanner'}
          onAction={() => setActiveCategory('live_mode')}
        />

        <div className="flex flex-col items-center pt-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setImportModalOpen(true)}
          >
            Import ZIP / JSON File Instead
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            onClick={handleSeedSample}
          >
            Load Demo Comparison
          </Button>
        </div>
      </div>
    );
  }

  const isTabDetected = !!liveStatus?.isInstagramTabOpen;
  const detectedUsername = liveStatus?.activeTab?.detectedUsername;
  const followBackRatio =
    following.length > 0 ? Math.round((mutuals.length / following.length) * 1000) / 10 : 0;
  const netGrowth = newFollowers.length - unfollowers.length;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* ============================================================ */}
      {/* SECTION A — Cozy Account Identity Card                      */}
      {/* ============================================================ */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Friendly Account Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-cozy shrink-0">
            <span className="font-fredoka text-lg uppercase">
              {(activeSnapshot.accountUsername || 'M')[0]}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-fredoka font-normal tracking-wide text-neutral-900 dark:text-neutral-50">
                @{activeSnapshot.accountUsername || 'instagram_account'}
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-neutral-100 dark:bg-[#282522] text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.06]">
                {activeSnapshot.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-400">
              {/* Connection Status Pill */}
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100/80 dark:bg-neutral-800/60 border border-black/[0.03] dark:border-white/[0.05]">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isTabDetected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                  }`}
                />
                <span className={isTabDetected ? 'text-neutral-700 dark:text-neutral-300 font-medium' : 'text-neutral-400'}>
                  {isTabDetected
                    ? detectedUsername
                      ? `Instagram active (@${detectedUsername})`
                      : 'Instagram tab active'
                    : 'No Instagram tab open'}
                </span>
              </span>

              <span>•</span>

              {/* Last Data Refresh */}
              <span>
                Imported {formatRelativeTime(activeSnapshot.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Activity className="w-3.5 h-3.5 text-rose-500" />}
            onClick={() => {
              setDataSourceMode('live');
              setActiveCategory('live_mode');
            }}
          >
            Live Hub
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setImportModalOpen(true)}
          >
            Import Data
          </Button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION B — Relationship Statistics (Cozy 4-Grid)           */}
      {/* ============================================================ */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1">
          Relationship Overview
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Followers"
            value={followers.length}
            subtext="Accounts following you"
            icon={<Users className="w-4 h-4" />}
            iconColor="text-rose-500"
            iconBg="bg-rose-500/10"
            onClick={() => setActiveCategory('followers')}
          />

          <StatCard
            title="Following"
            value={following.length}
            subtext="Accounts you follow"
            icon={<UserCheck className="w-4 h-4" />}
            iconColor="text-purple-500"
            iconBg="bg-purple-500/10"
            onClick={() => setActiveCategory('following')}
          />

          <StatCard
            title="Mutual Friends"
            value={mutuals.length}
            subtext={`${followBackRatio}% reciprocal`}
            icon={<Users2 className="w-4 h-4" />}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
            onClick={() => setActiveCategory('mutuals')}
          />

          <StatCard
            title="Not Following Back"
            value={notFollowingBack.length}
            subtext="You follow, they do not"
            icon={<ArrowUpRight className="w-4 h-4" />}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10"
            active={notFollowingBack.length > 0}
            onClick={() => setActiveCategory('not_following_back')}
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION C — Recent Changes & Snapshot Comparison            */}
      {/* ============================================================ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Recent Changes
          </h2>

          {snapshots.length > 1 && (
            <span
              className={`text-xs font-semibold tabular-nums px-2.5 py-0.5 rounded-full ${
                netGrowth >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              Net change: {netGrowth >= 0 ? `+${netGrowth}` : netGrowth} followers
            </span>
          )}
        </div>

        {snapshots.length < 2 ? (
          <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] text-center space-y-2 shadow-subtle">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Only 1 snapshot recorded so far. Import a second data export later to detect unfollowers and new followers over time.
            </p>
            <button
              onClick={() => setActiveCategory('history')}
              className="text-xs font-semibold text-brand-500 hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>View snapshot history</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lost Followers (Unfollowers) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] space-y-3 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <UserMinus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    Lost Followers ({unfollowers.length})
                  </h3>
                </div>
                {unfollowers.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('unfollowers')}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {unfollowers.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">
                  No accounts stopped following you between snapshots.
                </p>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                  {unfollowers.slice(0, 4).map((acc) => (
                    <div
                      key={acc.username}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">
                        @{acc.username}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="unfollower" showIcon={false} />
                        <a
                          href={acc.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-400 hover:text-rose-500 p-1"
                          title="Open Profile"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Followers Gained */}
            <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] space-y-3 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    New Followers ({newFollowers.length})
                  </h3>
                </div>
                {newFollowers.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('new_followers')}
                    className="text-[11px] font-semibold text-purple-500 hover:text-purple-600 flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {newFollowers.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">
                  No new followers gained between snapshots.
                </p>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                  {newFollowers.slice(0, 4).map((acc) => (
                    <div
                      key={acc.username}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">
                        @{acc.username}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="new" showIcon={false} />
                        <a
                          href={acc.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-400 hover:text-purple-500 p-1"
                          title="Open Profile"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
