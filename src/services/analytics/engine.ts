import { NormalizedAccount } from '../../types/instagram';
import { AccountItem, SnapshotMetrics } from '../../types/analytics';
import { AccountMetadata } from '../../types/database';
import { classifyAccount } from '../../utils/accountClassifier';

/**
 * Calculates accounts that the user follows, but who do not follow back.
 * Formula: Following \ Followers
 */
export function calculateNotFollowingBack(
  followers: NormalizedAccount[],
  following: NormalizedAccount[]
): NormalizedAccount[] {
  const followerUsernames = new Set(followers.map((f) => f.username.toLowerCase()));
  return following.filter((target) => !followerUsernames.has(target.username.toLowerCase()));
}

/**
 * Calculates "fans": accounts that follow the user, but the user does not follow back.
 * Formula: Followers \ Following
 */
export function calculateFans(
  followers: NormalizedAccount[],
  following: NormalizedAccount[]
): NormalizedAccount[] {
  const followingUsernames = new Set(following.map((f) => f.username.toLowerCase()));
  return followers.filter((target) => !followingUsernames.has(target.username.toLowerCase()));
}

/**
 * Calculates mutual followers: accounts that follow each other.
 * Formula: Followers ∩ Following
 */
export function calculateMutuals(
  followers: NormalizedAccount[],
  following: NormalizedAccount[]
): NormalizedAccount[] {
  const followingUsernames = new Set(following.map((f) => f.username.toLowerCase()));
  return followers.filter((target) => followingUsernames.has(target.username.toLowerCase()));
}

/**
 * Computes high-level analytics metrics for a single snapshot
 */
export function calculateSnapshotMetrics(
  followers: NormalizedAccount[],
  following: NormalizedAccount[],
  newFollowersCount = 0,
  unfollowersCount = 0
): SnapshotMetrics {
  const totalFollowers = followers.length;
  const totalFollowing = following.length;

  const followerUsernames = new Set(followers.map((f) => f.username.toLowerCase()));
  const followingUsernames = new Set(following.map((f) => f.username.toLowerCase()));

  let mutualCount = 0;
  for (const u of followerUsernames) {
    if (followingUsernames.has(u)) {
      mutualCount++;
    }
  }

  const notFollowingBackCount = totalFollowing - mutualCount;
  const fansCount = totalFollowers - mutualCount;

  const followBackRatio =
    totalFollowing > 0 ? Math.round((mutualCount / totalFollowing) * 1000) / 10 : 0;

  const netFollowerGrowth = newFollowersCount - unfollowersCount;

  return {
    totalFollowers,
    totalFollowing,
    mutualCount,
    notFollowingBackCount,
    fansCount,
    followBackRatio,
    newFollowersCount,
    unfollowersCount,
    netFollowerGrowth,
  };
}

/**
 * Enriches normalized accounts with relationship status and local metadata
 */
export function enrichAccountItems(
  accounts: NormalizedAccount[],
  followerSet: Set<string>,
  followingSet: Set<string>,
  metadataMap: Map<string, AccountMetadata>,
  flags?: { isUnfollower?: boolean; isNewFollower?: boolean }
): AccountItem[] {
  return accounts.map((acc) => {
    const norm = acc.username.toLowerCase();
    const isFollower = followerSet.has(norm);
    const isFollowing = followingSet.has(norm);
    const isMutual = isFollower && isFollowing;
    const meta = metadataMap.get(norm);
    const tags = meta?.tags || [];

    const classified = classifyAccount({
      username: acc.username,
      fullName: acc.fullName,
      isPrivate: acc.isPrivate,
      isVerified: acc.isVerified,
      tags,
    });

    return {
      ...acc,
      isFollower,
      isFollowing,
      isMutual,
      isWhitelisted: !!meta?.isWhitelisted,
      isVerified: classified.isVerified,
      isPrivate: classified.isPrivate,
      accountType: classified.accountType,
      notes: meta?.notes,
      tags,
      isUnfollower: flags?.isUnfollower,
      isNewFollower: flags?.isNewFollower,
    };
  });
}

