/**
 * Instagram raw export data structures and normalized internal models
 */

// Raw string list data item commonly found in Instagram export JSON files
export interface InstagramStringListData {
  href?: string;
  value?: string;
  timestamp?: number;
}

// Modern Instagram connection entry
export interface InstagramModernEntry {
  title?: string;
  media_list_data?: unknown[];
  string_list_data?: InstagramStringListData[];
}

// Wrapper format for followers: { "relationships_followers": [...] }
export interface InstagramFollowersExportWrapper {
  relationships_followers?: InstagramModernEntry[];
}

// Wrapper format for following: { "relationships_following": [...] }
export interface InstagramFollowingExportWrapper {
  relationships_following?: InstagramModernEntry[];
}

// Legacy format: { "followers": { "username": timestamp, ... } } or arrays
export type InstagramLegacyFollowers = Record<string, number>;

// Normalized account relationship entry
export interface NormalizedAccount {
  username: string;
  fullName?: string;
  profileUrl: string;
  timestamp: number; // Unix timestamp in milliseconds
  userId?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  accountType?: 'personal' | 'page';
  raw?: unknown;
}

// Result of parsing an Instagram export (either from JSON or ZIP)
export interface ParsedInstagramData {
  accountUsername?: string;
  exportDate: Date;
  followers: NormalizedAccount[];
  following: NormalizedAccount[];
  missingFollowersFile?: boolean;
  missingFollowingFile?: boolean;
  sourceType: 'zip' | 'json' | 'manual';
  sourceFileName?: string;
  rawFileCount?: number;
}

