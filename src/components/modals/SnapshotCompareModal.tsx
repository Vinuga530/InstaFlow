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
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#D5D2C5] dark:border-[#343B35] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#71806C] dark:text-[#899783] flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#242823] dark:text-[#F0EEE6]">
                Snapshot Comparison & Historical Diff
              </h3>
              <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] mt-0.5">
                Compare relationship changes between two distinct snapshots in time.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-[#686E64] hover:text-[#242823] dark:hover:text-[#F0EEE6] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Selectors */}
        <div className="p-4 bg-[#F5F3EC] dark:bg-[#151716] border-b border-[#D5D2C5] dark:border-[#343B35] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-[#686E64] dark:text-[#A6AA9D] uppercase tracking-wider shrink-0">
              Base Snapshot:
            </span>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full sm:w-52 px-3 py-2 text-xs rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] font-medium"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({formatDate(s.timestamp)})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-[#686E64] dark:text-[#A6AA9D] hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-[#686E64] dark:text-[#A6AA9D] uppercase tracking-wider shrink-0">
              Compare With:
            </span>
            <select
              value={compareId}
              onChange={(e) => setCompareId(e.target.value)}
              className="w-full sm:w-52 px-3 py-2 text-xs rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] font-medium"
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
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] shrink-0 text-center">
            <div className="p-3 rounded-2xl bg-[#A33F31]/10 border border-[#A33F31]/20 text-[#A33F31] dark:text-[#C45B4B]">
              <span className="text-[11px] font-semibold block text-[#A33F31] dark:text-[#C45B4B] uppercase tracking-wider">
                Unfollowers
              </span>
              <span className="font-semibold text-xl block mt-0.5 tabular-nums">-{diffResult.unfollowers.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#71806C]/10 border border-[#71806C]/20 text-[#71806C] dark:text-[#899783]">
              <span className="text-[11px] font-semibold block text-[#71806C] dark:text-[#899783] uppercase tracking-wider">
                New Followers
              </span>
              <span className="font-semibold text-xl block mt-0.5 tabular-nums">+{diffResult.newFollowers.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#9E7E43]/10 border border-[#9E7E43]/20 text-[#9E7E43] dark:text-[#CBB279]">
              <span className="text-[11px] font-semibold block text-[#9E7E43] dark:text-[#CBB279] uppercase tracking-wider">
                You Unfollowed
              </span>
              <span className="font-semibold text-xl block mt-0.5 tabular-nums">{diffResult.unfollowedAccounts.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#71806C]/10 border border-[#71806C]/20 text-[#71806C] dark:text-[#899783]">
              <span className="text-[11px] font-semibold block text-[#71806C] dark:text-[#899783] uppercase tracking-wider">
                Net Growth
              </span>
              <span className="font-semibold text-xl block mt-0.5 tabular-nums">
                {diffResult.netGrowth >= 0 ? `+${diffResult.netGrowth}` : diffResult.netGrowth}
              </span>
            </div>
          </div>
        )}

        {/* Segmented Pill Tabs */}
        {diffResult && (
          <div className="px-6 py-3 border-b border-[#D5D2C5] dark:border-[#343B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex p-0.5 bg-[#F5F3EC] dark:bg-[#151716] border border-[#D5D2C5] dark:border-[#343B35] rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab('unfollowers')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'unfollowers'
                    ? 'bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] font-semibold border border-[#D5D2C5]/80 dark:border-[#343B35]'
                    : 'text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6]'
                }`}
              >
                Unfollowers ({diffResult.unfollowers.length})
              </button>
              <button
                onClick={() => setActiveTab('new_followers')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'new_followers'
                    ? 'bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] font-semibold border border-[#D5D2C5]/80 dark:border-[#343B35]'
                    : 'text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6]'
                }`}
              >
                New Followers ({diffResult.newFollowers.length})
              </button>
              <button
                onClick={() => setActiveTab('unfollowed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'unfollowed'
                    ? 'bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] font-semibold border border-[#D5D2C5]/80 dark:border-[#343B35]'
                    : 'text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6]'
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
              <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] font-medium">
                Please select two different snapshots to view relationship changes.
              </p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] font-medium">
                No accounts found in this category between the two snapshots.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D5D2C5]/50 dark:divide-[#343B35]/50">
              {currentList.map((acc) => (
                <div
                  key={acc.username}
                  className="py-3.5 flex items-center justify-between hover:bg-[#E2DFD6]/40 dark:hover:bg-[#272C28]/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar username={acc.username} size="sm" />
                    <div>
                      <span className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
                        @{acc.username}
                      </span>
                      {acc.fullName && (
                        <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">{acc.fullName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {acc.isWhitelisted && <Badge variant="whitelisted" />}
                    <a
                      href={acc.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl text-[#686E64] hover:text-[#71806C] dark:hover:text-[#899783] transition-colors"
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

