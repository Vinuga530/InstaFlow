import { Snapshot, AccountMetadata } from './database';
import { AccountItem, RelationshipCategory, SortField, SortOrder, DataSourceMode } from './analytics';
import { LiveConnectionStatus, LiveSyncOptions, LiveSyncResult, DiagnosticCheck } from '../services/live/liveTypes';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface AppState {
  // Theme & Appearance
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Data Source Modes: Import Mode vs Live Mode
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;

  // Snapshots & Navigation
  snapshots: Snapshot[];
  activeSnapshot: Snapshot | null;
  activeCategory: RelationshipCategory;
  setActiveCategory: (category: RelationshipCategory) => void;
  loadSnapshots: () => Promise<void>;
  selectSnapshot: (snapshotId: string) => Promise<void>;
  deleteSnapshot: (snapshotId: string) => Promise<void>;

  // Data for the active snapshot
  followers: AccountItem[];
  following: AccountItem[];
  notFollowingBack: AccountItem[];
  fans: AccountItem[];
  mutuals: AccountItem[];
  newFollowers: AccountItem[];
  unfollowers: AccountItem[];
  accountMetadataMap: Map<string, AccountMetadata>;

  // Live Mode State
  liveStatus: LiveConnectionStatus | null;
  diagnostics: DiagnosticCheck[];
  isLiveSyncing: boolean;
  liveSyncProgress: number;
  liveSyncMessage: string;
  fetchLiveStatus: () => Promise<void>;
  updateLiveTabState: (tabState: any) => void;
  fetchDiagnostics: () => Promise<void>;
  triggerLiveSync: (options: LiveSyncOptions) => Promise<LiveSyncResult>;

  // Filter & Search Controls
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  whitelistedOnly: boolean;
  setWhitelistedOnly: (value: boolean) => void;

  // Selection for bulk actions
  selectedUsernames: string[];
  toggleSelectUsername: (username: string) => void;
  selectAllUsernames: (usernames: string[]) => void;
  clearSelection: () => void;

  // Modals state
  isImportModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;
  isGuideModalOpen: boolean;
  setGuideModalOpen: (open: boolean) => void;
  isCompareModalOpen: boolean;
  setCompareModalOpen: (open: boolean) => void;
  compareSnapshotId: string | null;
  setCompareSnapshotId: (id: string | null) => void;
  selectedAccountForNotes: AccountItem | null;
  setSelectedAccountForNotes: (account: AccountItem | null) => void;

  // Account metadata actions
  toggleWhitelist: (username: string) => Promise<void>;
  saveAccountNotes: (username: string, notes: string, tags?: string[]) => Promise<void>;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Global Loading State
  isLoading: boolean;
  loadingMessage?: string;
  setLoading: (loading: boolean, message?: string) => void;
}
