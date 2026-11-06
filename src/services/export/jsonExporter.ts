import { AccountItem } from '../../types/analytics';
import { Snapshot } from '../../types/database';
import { downloadBlob } from './csvExporter';

/**
 * Exports account items to clean JSON format
 */
export function exportAccountsToJSON(
  accounts: AccountItem[],
  filename: string,
  extraMeta?: Record<string, unknown>
): void {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalCount: accounts.length,
    metadata: extraMeta || {},
    accounts: accounts.map((acc) => ({
      username: acc.username,
      profileUrl: acc.profileUrl,
      fullName: acc.fullName,
      isFollower: acc.isFollower,
      isFollowing: acc.isFollowing,
      isMutual: acc.isMutual,
      isWhitelisted: acc.isWhitelisted,
      timestamp: acc.timestamp,
      dateFollowed: acc.timestamp ? new Date(acc.timestamp).toISOString() : null,
      notes: acc.notes,
      tags: acc.tags,
    })),
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  downloadBlob(
    jsonStr,
    filename.endsWith('.json') ? filename : `${filename}.json`,
    'application/json;charset=utf-8;'
  );
}

/**
 * Exports a full snapshot report as JSON
 */
export function exportSnapshotJSON(
  snapshot: Snapshot,
  allAccounts: {
    followers: AccountItem[];
    following: AccountItem[];
    notFollowingBack: AccountItem[];
    fans: AccountItem[];
    mutuals: AccountItem[];
    unfollowers: AccountItem[];
    newFollowers: AccountItem[];
  }
): void {
  const filename = `instatrack_snapshot_${snapshot.label.replace(/\s+/g, '_')}_${new Date(snapshot.timestamp).toISOString().split('T')[0]}.json`;

  const payload = {
    app: 'InstaTrack',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    snapshot,
    data: allAccounts,
  };

  downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json;charset=utf-8;');
}

