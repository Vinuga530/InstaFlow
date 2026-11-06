export type LiveDataSourceType = 'browser_assisted' | 'meta_graph_api';

export type BrowserTabStatus =
  | 'tab_detected'
  | 'tab_not_found'
  | 'permission_waiting'
  | 'browser_unavailable';

export type SyncExecutionStatus =
  | 'idle'
  | 'sync_in_progress'
  | 'sync_successful'
  | 'sync_failed'
  | 'source_unavailable';

export interface InstagramTabInfo {
  id?: number;
  url?: string;
  title?: string;
  detectedUsername?: string;
  active?: boolean;
}

export interface LiveConnectionStatus {
  isBrowserAvailable: boolean;
  tabStatus: BrowserTabStatus;
  syncStatus: SyncExecutionStatus;
  isInstagramTabOpen: boolean;
  activeTab?: InstagramTabInfo;
  tabCount: number;
  isMetaApiConnected: boolean;
  metaAccountUsername?: string;
  lastSuccessfulSync?: number;
  lastAttemptedSync?: number;
  statusMessage: string;
  tabStatusLabel: string;
  syncStatusLabel: string;
  dataFreshness: 'fresh' | 'stale' | 'never';
}

export interface LiveSyncOptions {
  sourceType: LiveDataSourceType;
  apiToken?: string;
  customLabel?: string;
  onProgress?: (percent: number, message: string) => void;
}

export interface LiveSyncResult {
  success: boolean;
  snapshotId?: string;
  followerCount: number;
  followingCount: number;
  notFollowingBackCount?: number;
  fansCount?: number;
  mutualCount?: number;
  notFollowingBack?: string[];
  timestamp: number;
  error?: string;
  unsupportedReason?: string;
  recordsCount?: number;
}

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  detail: string;
}
