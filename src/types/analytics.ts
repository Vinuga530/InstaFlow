import { NormalizedAccount } from './instagram';

export type DataSourceMode = 'import' | 'live';

export type RelationshipCategory =
  | 'overview'
  | 'live_mode'
  | 'followers'
  | 'following'
  | 'not_following_back'
  | 'fans'
  | 'mutuals'
  | 'unfollowers'
  | 'new_followers'
  | 'history'
  | 'settings';

export type SortField = 'username' | 'timestamp' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface AccountItem extends NormalizedAccount {
  isFollowing: boolean; // Do I follow them?
  isFollower: boolean; // Do they follow me?
  isMutual: boolean;
  isWhitelisted: boolean;
  isNewFollower?: boolean;
  isUnfollower?: boolean;
  unfollowedDate?: number;
  notes?: string;
  tags?: string[];
}

export interface SnapshotMetrics {
  totalFollowers: number;
  totalFollowing: number;
  mutualCount: number;
  notFollowingBackCount: number; // Following - Followers
  fansCount: number; // Followers - Following
  followBackRatio: number; // (Mutual / Following) * 100
  newFollowersCount: number;
  unfollowersCount: number;
  netFollowerGrowth: number;
}

export interface HistoricalComparisonResult {
  baseSnapshotId: string;
  compareSnapshotId: string;
  baseDate: number;
  compareDate: number;
  // Accounts present in base followers but missing in compare followers
  unfollowers: AccountItem[];
  // Accounts present in compare followers but missing in base followers
  newFollowers: AccountItem[];
  // Accounts user unfollowed between base and compare
  unfollowedAccounts: AccountItem[];
  // Accounts user newly followed between base and compare
  newFollowing: AccountItem[];
  // Accounts mutual in both
  retainedMutuals: AccountItem[];
  netGrowth: number;
}

export interface HistoricalTrendPoint {
  snapshotId: string;
  timestamp: number;
  dateLabel: string;
  followers: number;
  following: number;
  mutuals: number;
  notFollowingBack: number;
  newFollowers: number;
  unfollowers: number;
}

