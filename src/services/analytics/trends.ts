import { Snapshot } from '../../types/database';
import { HistoricalTrendPoint } from '../../types/analytics';

/**
 * Builds time-series trend points from a list of snapshots, ordered chronologically.
 */
export function buildHistoricalTrendPoints(snapshots: Snapshot[]): HistoricalTrendPoint[] {
  // Sort ascending by timestamp for timeline graphs
  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);

  return sorted.map((s) => {
    const d = new Date(s.timestamp);
    const dateLabel = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return {
      snapshotId: s.id,
      timestamp: s.timestamp,
      dateLabel,
      followers: s.followerCount,
      following: s.followingCount,
      mutuals: s.mutualCount,
      notFollowingBack: s.notFollowingBackCount,
      newFollowers: s.newFollowerCount,
      unfollowers: s.unfollowerCount,
    };
  });
}

