import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { getSnapshotRelationships } from '../../db';
import { compareSnapshots } from '../../services/analytics/comparisons';
import { HistoricalComparisonResult, AccountItem } from '../../types/analytics';
import { exportAccountsToCSV } from '../../services/export/csvExporter';
import { NormalizedAccount } from '../../types/instagram';
import {
  GitCompare,
  X,
  UserMinus,
  UserPlus,
  ArrowRight,
  Download,
  ExternalLink,
  Users,
} from 'lucide-react';

export const SnapshotCompareModal: React.FC = () => {
  const {
    isCompareModalOpen,
    setCompareModalOpen,
    snapshots,
    activeSnapshot,
    compareSnapshotId,
    setCompareSnapshotId,
    accountMetadataMap,
    addToast,
  } = useAppStore();

  const [baseId, setBaseId] = useState<string>('');
  const [compareId, setCompareId] = useState<string>('');
  const [diffResult, setDiffResult] = useState<HistoricalComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<'unfollowers' | 'new_followers' | 'unfollowed' | 'new_following'>('unfollowers');
  const [isComparing, setIsComparing] = useState(false);

  // Initialize selected snapshots
  useEffect(() => {
    if (snapshots.length >= 2) {
      if (compareSnapshotId && compareSnapshotId !== activeSnapshot?.id) {
        setBaseId(compareSnapshotId);
        setCompareId(activeSnapshot?.id || snapshots[0].id);
      } else {
        // Oldest as base, newest as compare
        const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
        setBaseId(sorted[0].id);
        setCompareId(sorted[sorted.length - 1].id);
      }
    }
  }, [snapshots, compareSnapshotId, activeSnapshot]);

  // Run diff when baseId or compareId change
  useEffect(() => {
    if (!baseId || !compareId || baseId === compareId) {
      setDiffResult(null);
      return;
    }

    const runComparison = async () => {
      try {
        setIsComparing(true);
        const baseSnap = snapshots.find((s) => s.id === baseId);
        const compareSnap = snapshots.find((s) => s.id === compareId);

        if (!baseSnap || !compareSnap) return;

        const baseRels = await getSnapshotRelationships(baseId);
        const compareRels = await getSnapshotRelationships(compareId);

        const extractAccounts = (rels: typeof baseRels) => {
          const followers: NormalizedAccount[] = [];
          const following: NormalizedAccount[] = [];

          for (const r of rels) {
            const acc: NormalizedAccount = {
              username: r.username,
              profileUrl: r.profileUrl,
              fullName: r.fullName,
              timestamp: r.timestamp,
            };
            if (r.relationshipType === 'follower' || r.relationshipType === 'mutual') {
              followers.push(acc);
            }
            if (r.relationshipType === 'following' || r.relationshipType === 'mutual') {
              following.push(acc);
            }
          }
          return { followers, following };
        };

        const baseData = extractAccounts(baseRels);
        const compareData = extractAccounts(compareRels);

        const diff = compareSnapshots(
          baseId,
          compareId,
          baseSnap.timestamp,
          compareSnap.timestamp,
          baseData.followers,
          baseData.following,
          compareData.followers,
          compareData.following,
          accountMetadataMap
        );

        setDiffResult(diff);
      } finally {
        setIsComparing(false);
      }
    };

    runComparison();
  }, [baseId, compareId, snapshots, accountMetadataMap]);

  if (!isCompareModalOpen) return null;

  const handleClose = () => {
    setCompareModalOpen(false);
    setCompareSnapshotId(null);
  };

  const handleExportDiff = () => {
    if (!diffResult) return;
    let list: AccountItem[] = [];
    let name = 'diff';

    if (activeTab === 'unfollowers') {
      list = diffResult.unfollowers;
      name = 'unfollowers';
    } else if (activeTab === 'new_followers') {
      list = diffResult.newFollowers;
      name = 'new_followers';
    } else if (activeTab === 'unfollowed') {
      list = diffResult.unfollowedAccounts;
      name = 'user_unfollowed';
    } else {
      list = diffResult.newFollowing;
      name = 'user_new_following';
    }

    exportAccountsToCSV(list, `instatrack_comparison_${name}`);
    addToast({
      type: 'success',
      title: 'Exported',
      message: `Saved ${list.length} accounts to CSV.`,
    });
  };

  const currentList = diffResult
    ? activeTab === 'unfollowers'
      ? diffResult.unfollowers
      : activeTab === 'new_followers'
      ? diffResult.newFollowers
      : activeTab === 'unfollowed'
      ? diffResult.unfollowedAccounts
      : diffResult.newFollowing
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#1B1918]/95 backdrop-blur-2xl shadow-cozy-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-cozy shadow-purple-500/10">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fredoka text-lg text-[#292522] dark:text-[#F7F4EF]">
                Snapshot Comparison & Historical Diff
              </h3>
              <p className="text-xs text-[#8C827A] dark:text-[#A8A199] mt-0.5">
                Compare relationship changes between two distinct snapshots in time.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-[#8C827A] hover:text-[#292522] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Selectors */}
        <div className="p-4 bg-[#FAF8F5]/80 dark:bg-[#141312]/80 border-b border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-[#8C827A] dark:text-[#A8A199] uppercase tracking-wider shrink-0">
              Base Snapshot:
            </span>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full sm:w-52 px-3 py-2 text-xs rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] text-[#292522] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-[#E05A47]/30 font-medium"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({formatDate(s.timestamp)})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-[#8C827A] dark:text-[#A8A199] hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-[#8C827A] dark:text-[#A8A199] uppercase tracking-wider shrink-0">
              Compare With:
            </span>
            <select
              value={compareId}
              onChange={(e) => setCompareId(e.target.value)}
              className="w-full sm:w-52 px-3 py-2 text-xs rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] text-[#292522] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-[#E05A47]/30 font-medium"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({formatDate(s.timestamp)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Metric Summary Cards */}
        {diffResult && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/40 dark:bg-[#1B1918]/40 shrink-0 text-center">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <span className="text-[11px] font-bold block text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider">
                Unfollowers
              </span>
              <span className="font-fredoka text-xl block mt-0.5">-{diffResult.unfollowers.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
              <span className="text-[11px] font-bold block text-purple-600/80 dark:text-purple-400/80 uppercase tracking-wider">
                New Followers
              </span>
              <span className="font-fredoka text-xl block mt-0.5">+{diffResult.newFollowers.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <span className="text-[11px] font-bold block text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider">
                You Unfollowed
              </span>
              <span className="font-fredoka text-xl block mt-0.5">{diffResult.unfollowedAccounts.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <span className="text-[11px] font-bold block text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">
                Net Growth
              </span>
              <span className="font-fredoka text-xl block mt-0.5">
                {diffResult.netGrowth >= 0 ? `+${diffResult.netGrowth}` : diffResult.netGrowth}
              </span>
            </div>
          </div>
        )}

        {/* Apple Segmented Pill Tabs */}
        {diffResult && (
          <div className="px-6 py-3 border-b border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('unfollowers')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'unfollowers'
                    ? 'bg-white dark:bg-[#252220] text-rose-600 dark:text-rose-400 shadow-cozy font-bold'
                    : 'text-[#8C827A] dark:text-[#A8A199] hover:text-[#292522] dark:hover:text-[#F7F4EF]'
                }`}
              >
                Unfollowers ({diffResult.unfollowers.length})
              </button>
              <button
                onClick={() => setActiveTab('new_followers')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'new_followers'
                    ? 'bg-white dark:bg-[#252220] text-purple-600 dark:text-purple-400 shadow-cozy font-bold'
                    : 'text-[#8C827A] dark:text-[#A8A199] hover:text-[#292522] dark:hover:text-[#F7F4EF]'
                }`}
              >
                New Followers ({diffResult.newFollowers.length})
              </button>
              <button
                onClick={() => setActiveTab('unfollowed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'unfollowed'
                    ? 'bg-white dark:bg-[#252220] text-amber-600 dark:text-amber-400 shadow-cozy font-bold'
                    : 'text-[#8C827A] dark:text-[#A8A199] hover:text-[#292522] dark:hover:text-[#F7F4EF]'
                }`}
              >
                You Unfollowed ({diffResult.unfollowedAccounts.length})
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportDiff}
            >
              Export CSV
            </Button>
          </div>
        )}

        {/* Diff List */}
        <div className="flex-1 overflow-y-auto p-6">
          {baseId === compareId ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-[#8C827A] dark:text-[#A8A199] font-medium">
                Please select two different snapshots to view relationship changes.
              </p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-[#8C827A] dark:text-[#A8A199] font-medium">
                No accounts found in this category between the two snapshots.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {currentList.map((acc) => (
                <div
                  key={acc.username}
                  className="py-3.5 flex items-center justify-between hover:bg-black/[0.01] dark:hover:bg-white/[0.01] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar username={acc.username} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-[#292522] dark:text-[#F7F4EF]">
                        @{acc.username}
                      </span>
                      {acc.fullName && (
                        <p className="text-[11px] text-[#8C827A] dark:text-[#A8A199]">{acc.fullName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {acc.isWhitelisted && <Badge variant="whitelisted" />}
                    <a
                      href={acc.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl text-[#8C827A] hover:text-[#E05A47] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                      title="Open Instagram profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

