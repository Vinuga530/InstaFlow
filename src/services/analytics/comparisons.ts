import { NormalizedAccount } from '../../types/instagram';
import { AccountItem, HistoricalComparisonResult } from '../../types/analytics';
import { AccountMetadata } from '../../types/database';
import { enrichAccountItems } from './engine';

/**
 * Compares two historical snapshots to detect unfollowers, new followers, and relationship changes.
 *
 * CRITICAL RULE:
 * Unfollowers are strictly determined by comparing an earlier snapshot (base) against
 * a later snapshot (compare). A user in base followers who is missing in compare followers
 * is confirmed as an unfollower.
 *
 * @param baseSnapshotId ID of the older snapshot
 * @param compareSnapshotId ID of the newer snapshot
 * @param baseDate Timestamp of the older snapshot
 * @param compareDate Timestamp of the newer snapshot
 * @param baseFollowers Follower list from older snapshot
 * @param baseFollowing Following list from older snapshot
 * @param compareFollowers Follower list from newer snapshot
 * @param compareFollowing Following list from newer snapshot
 * @param metadataMap Saved user metadata (whitelist, notes, tags)
 */
export function compareSnapshots(
  baseSnapshotId: string,
  compareSnapshotId: string,
  baseDate: number,
  compareDate: number,
  baseFollowers: NormalizedAccount[],
  baseFollowing: NormalizedAccount[],
  compareFollowers: NormalizedAccount[],
  compareFollowing: NormalizedAccount[],
  metadataMap: Map<string, AccountMetadata> = new Map()
): HistoricalComparisonResult {
  const baseFollowerMap = new Map(baseFollowers.map((f) => [f.username.toLowerCase(), f]));
  const baseFollowingMap = new Map(baseFollowing.map((f) => [f.username.toLowerCase(), f]));

  const compareFollowerMap = new Map(compareFollowers.map((f) => [f.username.toLowerCase(), f]));
  const compareFollowingMap = new Map(compareFollowing.map((f) => [f.username.toLowerCase(), f]));

  const compareFollowerSet = new Set(compareFollowerMap.keys());
  const compareFollowingSet = new Set(compareFollowingMap.keys());

  // 1. Unfollowers: Accounts in older followers, but NOT in newer followers
  const rawUnfollowers: NormalizedAccount[] = [];
  for (const [username, account] of baseFollowerMap.entries()) {
    if (!compareFollowerMap.has(username)) {
      rawUnfollowers.push(account);
    }
  }

  // 2. New Followers: Accounts in newer followers, but NOT in older followers
  const rawNewFollowers: NormalizedAccount[] = [];
  for (const [username, account] of compareFollowerMap.entries()) {
    if (!baseFollowerMap.has(username)) {
      rawNewFollowers.push(account);
    }
  }

  // 3. User Unfollowed: Accounts in older following, but NOT in newer following
  const rawUnfollowedAccounts: NormalizedAccount[] = [];
  for (const [username, account] of baseFollowingMap.entries()) {
    if (!compareFollowingMap.has(username)) {
      rawUnfollowedAccounts.push(account);
    }
  }

  // 4. User Newly Followed: Accounts in newer following, but NOT in older following
  const rawNewFollowing: NormalizedAccount[] = [];
  for (const [username, account] of compareFollowingMap.entries()) {
    if (!baseFollowingMap.has(username)) {
      rawNewFollowing.push(account);
    }
  }

  // 5. Retained Mutuals: Mutual in base AND mutual in compare
  const rawRetainedMutuals: NormalizedAccount[] = [];
  for (const [username, account] of compareFollowerMap.entries()) {
    if (
      baseFollowerMap.has(username) &&
      baseFollowingMap.has(username) &&
      compareFollowingMap.has(username)
    ) {
      rawRetainedMutuals.push(account);
    }
  }

  // Enrich with full status and metadata
  const unfollowers = enrichAccountItems(
    rawUnfollowers,
    compareFollowerSet,
    compareFollowingSet,
    metadataMap,
    { isUnfollower: true }
  );

  const newFollowers = enrichAccountItems(
    rawNewFollowers,
    compareFollowerSet,
    compareFollowingSet,
    metadataMap,
    { isNewFollower: true }
  );

  const unfollowedAccounts = enrichAccountItems(
    rawUnfollowedAccounts,
    compareFollowerSet,
    compareFollowingSet,
    metadataMap
  );

  const newFollowing = enrichAccountItems(
    rawNewFollowing,
    compareFollowerSet,
    compareFollowingSet,
    metadataMap
  );

  const retainedMutuals = enrichAccountItems(
    rawRetainedMutuals,
    compareFollowerSet,
    compareFollowingSet,
    metadataMap
  );

  const netGrowth = compareFollowers.length - baseFollowers.length;

  return {
    baseSnapshotId,
    compareSnapshotId,
    baseDate,
    compareDate,
    unfollowers,
    newFollowers,
    unfollowedAccounts,
    newFollowing,
    retainedMutuals,
    netGrowth,
  };
}

