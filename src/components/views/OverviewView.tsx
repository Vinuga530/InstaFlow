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
      <section className="rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Account Avatar */}
          <div className="w-12 h-12 rounded-xl bg-[#71806C]/15 dark:bg-[#899783]/20 border border-[#71806C]/30 dark:border-[#899783]/35 flex items-center justify-center text-[#505D4A] dark:text-[#C5D2C0] shadow-subtle shrink-0">
            <span className="font-semibold text-lg uppercase">
              {(activeSnapshot.accountUsername || 'M')[0]}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-medium tracking-tight text-[#242823] dark:text-[#F0EEE6]">
                @{activeSnapshot.accountUsername || 'instagram_account'}
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-[#E2DFD6] dark:bg-[#272C28] text-[#686E64] dark:text-[#A6AA9D] border border-[#D5D2C5] dark:border-[#343B35]">
                {activeSnapshot.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#686E64] dark:text-[#A6AA9D]">
              {/* Connection Status Pill */}
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E2DFD6] dark:bg-[#272C28] border border-[#D5D2C5] dark:border-[#343B35]">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isTabDetected ? 'bg-[#71806C] dark:bg-[#899783] animate-pulse' : 'bg-[#BCB8A9] dark:bg-[#444E46]'
                  }`}
                />
                <span className={isTabDetected ? 'text-[#242823] dark:text-[#F0EEE6] font-medium' : 'text-[#686E64] dark:text-[#A6AA9D]'}>
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
            leftIcon={<Activity className="w-3.5 h-3.5" />}
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
      {/* SECTION B — Relationship Statistics (Quiet 4-Grid)           */}
      {/* ============================================================ */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold text-[#8D9387] dark:text-[#72776C] uppercase tracking-wider px-1">
          Relationship Overview
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Followers"
            value={followers.length}
            subtext="Accounts following you"
            icon={<Users className="w-4 h-4" />}
            iconColor="text-[#686E64] dark:text-[#A6AA9D]"
            iconBg="bg-[#E2DFD6] dark:bg-[#272C28]"
            onClick={() => setActiveCategory('followers')}
          />

          <StatCard
            title="Following"
            value={following.length}
            subtext="Accounts you follow"
            icon={<UserCheck className="w-4 h-4" />}
            iconColor="text-[#686E64] dark:text-[#A6AA9D]"
            iconBg="bg-[#E2DFD6] dark:bg-[#272C28]"
            onClick={() => setActiveCategory('following')}
          />

          <StatCard
            title="Mutual Friends"
            value={mutuals.length}
            subtext={`${followBackRatio}% reciprocal`}
            icon={<Users2 className="w-4 h-4" />}
            iconColor="text-[#71806C] dark:text-[#899783]"
            iconBg="bg-[#71806C]/10 dark:bg-[#899783]/15"
            onClick={() => setActiveCategory('mutuals')}
          />

          <StatCard
            title="Not Following Back"
            value={notFollowingBack.length}
            subtext="You follow, they do not"
            icon={<ArrowUpRight className="w-4 h-4" />}
            iconColor="text-[#9E7E43] dark:text-[#C0A268]"
            iconBg="bg-[#9E7E43]/10 dark:bg-[#C0A268]/15"
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
          <h2 className="text-xs font-semibold text-[#8D9387] dark:text-[#72776C] uppercase tracking-wider">
            Recent Changes
          </h2>

          {snapshots.length > 1 && (
            <span
              className={`text-xs font-medium tabular-nums px-2.5 py-0.5 rounded-full ${
                netGrowth >= 0
                  ? 'bg-[#71806C]/15 text-[#5A6755] dark:text-[#A6B5A0]'
                  : 'bg-[#A33F31]/10 text-[#8A3226] dark:text-[#DC7C6E]'
              }`}
            >
              Net change: {netGrowth >= 0 ? `+${netGrowth}` : netGrowth} followers
            </span>
          )}
        </div>

        {snapshots.length < 2 ? (
          <div className="p-6 rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] text-center space-y-2 shadow-subtle">
            <p className="text-xs text-[#686E64] dark:text-[#A6AA9D]">
              Only 1 snapshot recorded so far. Import a second data export later to detect unfollowers and new followers over time.
            </p>
            <button
              onClick={() => setActiveCategory('history')}
              className="text-xs font-medium text-[#71806C] dark:text-[#899783] hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>View snapshot history</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lost Followers (Unfollowers) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] space-y-3 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#D5D2C5] dark:border-[#343B35]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#A33F31]/10 text-[#8A3226] dark:text-[#DC7C6E] flex items-center justify-center">
                    <UserMinus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-medium text-[#242823] dark:text-[#F0EEE6]">
                    Lost Followers ({unfollowers.length})
                  </h3>
                </div>
                {unfollowers.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('unfollowers')}
                    className="text-[11px] font-medium text-[#A33F31] dark:text-[#DC7C6E] hover:underline flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {unfollowers.length === 0 ? (
                <p className="text-xs text-[#8D9387] dark:text-[#72776C] py-6 text-center">
                  No accounts stopped following you between snapshots.
                </p>
              ) : (
                <div className="divide-y divide-[#D5D2C5]/60 dark:divide-[#343B35]/60">
                  {unfollowers.slice(0, 4).map((acc) => (
                    <div
                      key={acc.username}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#242823] dark:text-[#F0EEE6] truncate max-w-[180px]">
                        @{acc.username}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="unfollower" showIcon={false} />
                        <a
                          href={acc.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8D9387] hover:text-[#A33F31] dark:hover:text-[#DC7C6E] p-1"
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
            <div className="p-4 sm:p-5 rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] space-y-3 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#D5D2C5] dark:border-[#343B35]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#71806C]/15 text-[#5A6755] dark:text-[#A6B5A0] flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-medium text-[#242823] dark:text-[#F0EEE6]">
                    New Followers ({newFollowers.length})
                  </h3>
                </div>
                {newFollowers.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('new_followers')}
                    className="text-[11px] font-medium text-[#71806C] dark:text-[#899783] hover:underline flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {newFollowers.length === 0 ? (
                <p className="text-xs text-[#8D9387] dark:text-[#72776C] py-6 text-center">
                  No new followers gained between snapshots.
                </p>
              ) : (
                <div className="divide-y divide-[#D5D2C5]/60 dark:divide-[#343B35]/60">
                  {newFollowers.slice(0, 4).map((acc) => (
                    <div
                      key={acc.username}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#242823] dark:text-[#F0EEE6] truncate max-w-[180px]">
                        @{acc.username}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="new" showIcon={false} />
                        <a
                          href={acc.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8D9387] hover:text-[#71806C] dark:hover:text-[#899783] p-1"
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
