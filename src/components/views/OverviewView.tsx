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
  ChevronRight,
  ArrowRight,
  Compass,
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
    customUsername,
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
    const detectedUsername = liveStatus?.activeTab?.detectedUsername || customUsername;

    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <EmptyState
          icon={
            isTabDetected ? (
              <Activity className="w-8 h-8 text-[var(--accent-primary)] animate-pulse" />
            ) : (
              <Compass className="w-8 h-8 text-[var(--accent-primary)]" />
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
              : 'Open Instagram in your browser to scan who unfollowed you, or import an official Instagram data archive.'
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
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--status-warning)]" />}
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

  const displayHandle = activeSnapshot.accountUsername || customUsername || 'account';

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* SECTION A — Account Identity Card */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Account Avatar */}
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shadow-subtle shrink-0 font-bold text-lg uppercase">
            {displayHandle[0] || '@'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                @{displayHandle}
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {activeSnapshot.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--text-secondary)]">
              {/* Connection Status Pill */}
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isTabDetected ? 'bg-[var(--status-positive)] animate-pulse' : 'bg-[var(--border-strong)]'
                  }`}
                />
                <span className={isTabDetected ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'}>
                  {isTabDetected
                    ? detectedUsername
                      ? `Instagram active (@${detectedUsername})`
                      : 'Instagram tab active'
                    : 'No Instagram tab open'}
                </span>
              </span>

              <span>&bull;</span>

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

      {/* SECTION B — Relationship Statistics (4-Grid) */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-1">
          Relationship Overview
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Followers"
            value={followers.length}
            subtext="Accounts following you"
            icon={<Users className="w-4 h-4" />}
            iconColor="text-[var(--text-secondary)]"
            iconBg="bg-[var(--bg-surface-subtle)]"
            onClick={() => setActiveCategory('followers')}
          />

          <StatCard
            title="Following"
            value={following.length}
            subtext="Accounts you follow"
            icon={<UserCheck className="w-4 h-4" />}
            iconColor="text-[var(--text-secondary)]"
            iconBg="bg-[var(--bg-surface-subtle)]"
            onClick={() => setActiveCategory('following')}
          />

          <StatCard
            title="Mutual Friends"
            value={mutuals.length}
            subtext={`${followBackRatio}% reciprocal`}
            icon={<Users2 className="w-4 h-4" />}
            iconColor="text-[var(--status-positive)]"
            iconBg="bg-[var(--status-positive-bg)]"
            onClick={() => setActiveCategory('mutuals')}
          />

          <StatCard
            title="Not Following Back"
            value={notFollowingBack.length}
            subtext="You follow, they do not"
            icon={<ArrowUpRight className="w-4 h-4" />}
            iconColor="text-[var(--status-warning)]"
            iconBg="bg-[var(--status-warning-bg)]"
            active={notFollowingBack.length > 0}
            onClick={() => setActiveCategory('not_following_back')}
          />
        </div>
      </section>

      {/* SECTION C — Recent Changes & Snapshot Comparison */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Recent Changes
          </h2>

          {snapshots.length > 1 && (
            <span
              className={`text-xs font-semibold tabular-nums px-2.5 py-0.5 rounded-full ${
                netGrowth >= 0
                  ? 'bg-[var(--status-positive-bg)] text-[var(--status-positive)]'
                  : 'bg-[var(--status-negative-bg)] text-[var(--status-negative)]'
              }`}
            >
              Net change: {netGrowth >= 0 ? `+${netGrowth}` : netGrowth} followers
            </span>
          )}
        </div>

        {snapshots.length < 2 ? (
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-2 shadow-subtle">
            <p className="text-xs text-[var(--text-secondary)]">
              Only 1 snapshot recorded so far. Import a second data export later to detect unfollowers and new followers over time.
            </p>
            <button
              onClick={() => setActiveCategory('history')}
              className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>View snapshot history</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lost Followers (Unfollowers) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--status-negative-bg)] text-[var(--status-negative)] flex items-center justify-center">
                    <UserMinus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)]">
                    Lost Followers ({unfollowers.length})
                  </h3>
                </div>
                {unfollowers.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('unfollowers')}
                    className="text-[11px] font-semibold text-[var(--status-negative)] hover:underline flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {unfollowers.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] py-6 text-center">
                  No accounts stopped following you between snapshots.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {unfollowers.slice(0, 4).map((acc) => (
                    <div
                      key={acc.username}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                        @{acc.username}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="unfollower" showIcon={false} />
                        <a
                          href={acc.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-tertiary)] hover:text-[var(--status-negative)] p-1"
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
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)] flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)]">
                    New Followers ({newFollowers.length})
                  </h3>
                </div>
                {newFollowers.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('new_followers')}
                    className="text-[11px] font-semibold text-[var(--status-positive)] hover:underline flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {newFollowers.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] py-6 text-center">
                  No new followers gained between snapshots.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {newFollowers.slice(0, 4).map((acc) => (
                    <div
                      key={acc.username}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                        @{acc.username}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="new" showIcon={false} />
                        <a
                          href={acc.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-tertiary)] hover:text-[var(--status-positive)] p-1"
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
