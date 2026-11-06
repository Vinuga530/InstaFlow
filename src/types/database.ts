/**
 * Database entity types for IndexedDB (Dexie.js)
 */

export type RelationshipType = 'follower' | 'following' | 'mutual';

export interface Snapshot {
  id: string; // Unique UUID
  timestamp: number; // Snapshot creation timestamp (ms)
  label: string; // User-defined or auto-generated label (e.g., "Nov 3, 2026 Export")
  accountUsername: string; // Primary Instagram account username
  followerCount: number;
  followingCount: number;
  notFollowingBackCount: number;
  fansCount: number;
  mutualCount: number;
  newFollowerCount: number; // In comparison to predecessor snapshot
  unfollowerCount: number; // In comparison to predecessor snapshot
  notes?: string;
  sourceType: 'zip' | 'json' | 'mock' | 'live_browser' | 'live_api';
  fileName?: string;
  previousSnapshotId?: string; // Pointer to the prior snapshot used for diffing
}

export interface SnapshotRelationship {
  id?: number; // Auto-incremented primary key
  snapshotId: string; // Foreign key referencing Snapshot.id
  username: string; // Normalized Instagram handle (lowercase, no @)
  fullName?: string;
  profileUrl: string;
  relationshipType: RelationshipType;
  timestamp: number; // When the follow occurred (from Instagram export)
}

export interface AccountMetadata {
  username: string; // Primary key (lowercase)
  isWhitelisted: boolean; // Flag to ignore in unfollower/non-follower alerts
  notes?: string; // Custom user notes
  tags: string[]; // E.g., ['friend', 'client', 'creator']
  firstSeen: number;
  lastSeen: number;
}

export interface ImportHistoryRecord {
  id: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  status: 'success' | 'partial' | 'failed';
  snapshotId?: string;
  errorMessage?: string;
  followerCount?: number;
  followingCount?: number;
}

export interface AppSetting {
  key: string; // E.g., 'theme', 'preferred_view', 'auto_backup'
  value: unknown;
}

