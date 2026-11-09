import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import { exportSnapshotJSON } from '../../services/export/jsonExporter';
import {
  History,
  GitCompare,
  Trash2,
  Download,
  Calendar,
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const {
    snapshots,
    activeSnapshot,
    selectSnapshot,
    deleteSnapshot,
    setCompareModalOpen,
    setCompareSnapshotId,
    setImportModalOpen,
    followers,
    following,
    notFollowingBack,
    fans,
    mutuals,
    unfollowers,
    newFollowers,
    addToast,
  } = useAppStore();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCompareWith = (snapshotId: string) => {
    setCompareSnapshotId(snapshotId);
    setCompareModalOpen(true);
  };

  const handleDelete = async (id: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete snapshot "${label}"? This action cannot be undone.`)) {
      setDeletingId(id);
      await deleteSnapshot(id);
      setDeletingId(null);
    }
  };

  const handleExportSnapshot = (snap: typeof snapshots[0]) => {
    if (activeSnapshot?.id === snap.id) {
      exportSnapshotJSON(snap, {
        followers,
        following,
        notFollowingBack,
        fans,
        mutuals,
        unfollowers,
        newFollowers,
      });
      addToast({
        type: 'success',
        title: 'Snapshot Exported',
        message: `Saved ${snap.label} to JSON file.`,
      });
    } else {
      selectSnapshot(snap.id).then(() => {
        exportSnapshotJSON(snap, {
          followers,
          following,
          notFollowingBack,
          fans,
          mutuals,
          unfollowers,
          newFollowers,
        });
        addToast({
          type: 'success',
          title: 'Snapshot Exported',
          message: `Loaded & saved ${snap.label} to JSON file.`,
        });
      });
    }
  };

  if (snapshots.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={<History className="w-10 h-10 text-[var(--text-secondary)]" />}
          title="No Snapshot History Yet"
          description="Every time you import your Instagram data export, InstaTrack records a dated snapshot so you can comfortably track follower gains, losses, and mutual connections over time."
          actionLabel="Import First Snapshot"
          onAction={() => setImportModalOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold tracking-tight text-xl text-[var(--text-primary)]">
            Recorded Snapshots ({snapshots.length})
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Switch between snapshots to review historical data, or compare any two points in time.
          </p>
        </div>

        {snapshots.length >= 2 && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<GitCompare className="w-4 h-4" />}
            onClick={() => setCompareModalOpen(true)}
          >
            Compare Snapshots
          </Button>
        )}
      </div>

      {/* Snapshot Cards Timeline */}
      <div className="space-y-3.5">
        {snapshots.map((snap, index) => {
          const isActive = activeSnapshot?.id === snap.id;
          const isLatest = index === 0;

          return (
            <div
              key={snap.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] ring-1 ring-[var(--accent-primary)]/40'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-base text-[var(--text-primary)]">
                      {snap.label}
                    </h4>
                    {isLatest && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                        Latest
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-[var(--bg-canvas)]">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      {formatDateTime(snap.timestamp)}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      @{snap.accountUsername || 'unknown'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {snap.sourceType}
                    </span>
                  </div>
                </div>

                {/* Center: Stat Badges */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block leading-none">
                        Followers
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                        {formatNumber(snap.followerCount)}
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block leading-none">
                        Following
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                        {formatNumber(snap.followingCount)}
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl border border-[var(--status-warning)]/20 bg-[var(--status-warning-bg)] flex items-center gap-2">
                    <div>
                      <span className="text-[10px] text-[var(--status-warning)] block leading-none font-medium">
                        Not Following Back
                      </span>
                      <span className="text-xs font-bold text-[var(--status-warning)] tabular-nums">
                        {formatNumber(snap.notFollowingBackCount)}
                      </span>
                    </div>
                  </div>

                  {snap.newFollowerCount > 0 && (
                    <div className="px-2.5 py-1.5 rounded-xl border border-[var(--status-positive)]/20 bg-[var(--status-positive-bg)] text-[var(--status-positive)] flex items-center gap-1 text-xs font-semibold tabular-nums">
                      <UserPlus className="w-3 h-3" />
                      <span>+{snap.newFollowerCount}</span>
                    </div>
                  )}

                  {snap.unfollowerCount > 0 && (
                    <div className="px-2.5 py-1.5 rounded-xl border border-[var(--status-negative)]/20 bg-[var(--status-negative-bg)] text-[var(--status-negative)] flex items-center gap-1 text-xs font-semibold tabular-nums">
                      <UserMinus className="w-3 h-3" />
                      <span>-{snap.unfollowerCount}</span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isActive && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => selectSnapshot(snap.id)}
                    >
                      Select
                    </Button>
                  )}

                  {snapshots.length >= 2 && !isActive && (
                    <Button
                      variant="secondary"
                      size="xs"
                      leftIcon={<GitCompare className="w-3 h-3" />}
                      onClick={() => handleCompareWith(snap.id)}
                      title="Compare against this snapshot"
                    >
                      Compare
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleExportSnapshot(snap)}
                    title="Export JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="xs"
                    isLoading={deletingId === snap.id}
                    onClick={() => handleDelete(snap.id, snap.label)}
                    title="Delete Snapshot"
                    className="hover:text-[var(--status-negative)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
