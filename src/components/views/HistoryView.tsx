import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters';
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
        message: `Saved snapshot report for "${snap.label}".`,
      });
    } else {
      selectSnapshot(snap.id).then(() => {
        addToast({
          type: 'info',
          title: 'Snapshot Loaded',
          message: `Switched to "${snap.label}". Click export again to download.`,
        });
      });
    }
  };

  if (snapshots.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={<History className="w-10 h-10 text-[#8C827A] dark:text-[#A8A199]" />}
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
          <h3 className="font-fredoka text-xl text-[#292522] dark:text-[#F7F4EF]">
            Recorded Snapshots ({snapshots.length})
          </h3>
          <p className="text-xs text-[#8C827A] dark:text-[#A8A199] mt-0.5">
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
                  ? 'border-[#E05A47] bg-[#E05A47]/[0.03] dark:bg-[#E05A47]/[0.06] shadow-cozy ring-2 ring-[#E05A47]/20'
                  : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] shadow-cozy hover:border-black/[0.12] dark:hover:border-white/[0.16]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-fredoka text-base text-[#292522] dark:text-[#F7F4EF]">
                      {snap.label}
                    </h4>
                    {isLatest && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Latest
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E05A47] text-white shadow-cozy shadow-[#E05A47]/20">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8C827A] dark:text-[#A8A199] flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#8C827A] dark:text-[#A8A199]" />
                      {formatDateTime(snap.timestamp)}
                    </span>
                    <span className="font-semibold text-[#59534E] dark:text-[#D1CBC5]">
                      @{snap.accountUsername || 'unknown'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-[#59534E] dark:text-[#D1CBC5]">
                      {snap.sourceType}
                    </span>
                  </div>
                  {snap.notes && (
                    <p className="text-xs text-[#8C827A] dark:text-[#A8A199] italic pt-0.5">
                      "{snap.notes}"
                    </p>
                  )}
                </div>

                {/* Center: Stat Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-black/[0.04] dark:border-white/[0.04]">
                    <Users className="w-3.5 h-3.5 text-[#E05A47]" />
                    <span className="font-fredoka text-sm text-[#292522] dark:text-[#F7F4EF]">
                      {formatNumber(snap.followerCount)}
                    </span>
                    <span className="text-[#8C827A] dark:text-[#A8A199] font-medium">followers</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-black/[0.04] dark:border-white/[0.04]">
                    <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                    <span className="font-fredoka text-sm text-[#292522] dark:text-[#F7F4EF]">
                      {formatNumber(snap.followingCount)}
                    </span>
                    <span className="text-[#8C827A] dark:text-[#A8A199] font-medium">following</span>
                  </div>

                  {snap.unfollowerCount > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/10">
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>-{snap.unfollowerCount} lost</span>
                    </div>
                  )}

                  {snap.newFollowerCount > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/10">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+{snap.newFollowerCount} gained</span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 pt-2 lg:pt-0">
                  {!isActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => selectSnapshot(snap.id)}
                    >
                      View
                    </Button>
                  )}

                  {snapshots.length > 1 && !isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<GitCompare className="w-3.5 h-3.5" />}
                      onClick={() => handleCompareWith(snap.id)}
                    >
                      Compare
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleExportSnapshot(snap)}
                    title="Export snapshot as JSON"
                  >
                    Export
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={deletingId === snap.id}
                    onClick={() => handleDelete(snap.id, snap.label)}
                    title="Delete this snapshot"
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

