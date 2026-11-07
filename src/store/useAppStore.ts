import { create } from 'zustand';
import { AppState, ThemeMode, ToastMessage } from '../types/store';
import { RelationshipCategory, SortField, SortOrder, AccountItem, DataSourceMode } from '../types/analytics';
import {
  getSnapshots,
  getSnapshot,
  deleteSnapshot as dbDeleteSnapshot,
  getSnapshotRelationships,
  getAccountMetadataMap,
  toggleAccountWhitelist,
  updateAccountNotes,
  removeFollowingRelationship,
} from '../db';
import {
  calculateNotFollowingBack,
  calculateFans,
  calculateMutuals,
  enrichAccountItems,
} from '../services/analytics/engine';
import { compareSnapshots } from '../services/analytics/comparisons';
import { NormalizedAccount } from '../types/instagram';
import { liveIntegrationService } from '../services/live/liveIntegrationService';
import { unfollowInstagramUser } from '../services/live/followerExporterService';
import { LiveSyncOptions, LiveSyncResult } from '../services/live/liveTypes';

export const useAppStore = create<AppState>((set, get) => ({
  // Theme state
  theme: 'dark',
  setTheme: (theme: ThemeMode) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
      }
    }
  },

  // Data Source Modes: Import Mode vs Live Mode
  dataSourceMode: 'import',
  setDataSourceMode: (mode: DataSourceMode) => {
    set({ dataSourceMode: mode });
    if (mode === 'live') {
      set({ activeCategory: 'live_mode' });
      get().fetchLiveStatus();
      get().fetchDiagnostics();
    } else {
      set({ activeCategory: 'overview' });
    }
  },

  // Live Mode state
  liveStatus: null,
  diagnostics: [],
  isLiveSyncing: false,
  liveSyncProgress: 0,
  liveSyncMessage: '',

  fetchLiveStatus: async () => {
    try {
      const status = await liveIntegrationService.getConnectionStatus();
      set({ liveStatus: status });
    } catch {
      // Ignore background errors
    }
  },

  updateLiveTabState: (tabState: any) => {
    const current = get().liveStatus;
    if (current && tabState) {
      set({
        liveStatus: {
          ...current,
          isInstagramTabOpen: tabState.isTabOpen,
          tabCount: tabState.tabCount,
          activeTab: tabState.activeTab || undefined,
          tabStatus: tabState.isTabOpen ? 'tab_detected' : 'tab_not_found',
          tabStatusLabel: tabState.isTabOpen
            ? tabState.activeTab?.detectedUsername
              ? `Instagram tab detected (@${tabState.activeTab.detectedUsername})`
              : `Instagram tab detected (${tabState.tabCount} tab${tabState.tabCount > 1 ? 's' : ''} open)`
            : 'Instagram tab not found',
        },
      });
    } else {
      get().fetchLiveStatus();
    }
  },

  fetchDiagnostics: async () => {
    try {
      const diags = await liveIntegrationService.getDiagnostics();
      set({ diagnostics: diags });
    } catch {
      // Ignore background errors
    }
  },

  triggerLiveSync: async (options: LiveSyncOptions): Promise<LiveSyncResult> => {
    set({
      isLiveSyncing: true,
      liveSyncProgress: 5,
      liveSyncMessage: 'Initiating live synchronization...',
    });

    try {
      const result = await liveIntegrationService.synchronize({
        ...options,
        onProgress: (pct, msg) => {
          set({ liveSyncProgress: pct, liveSyncMessage: msg });
        },
      });

      await get().fetchLiveStatus();
      await get().fetchDiagnostics();

      if (result.success && result.snapshotId) {
        await get().loadSnapshots();
        await get().selectSnapshot(result.snapshotId);
        get().addToast({
          type: 'success',
          title: 'Live Scan Completed',
          message: `Identified ${result.notFollowingBackCount ?? 0} accounts not following you back (@${result.followerCount} followers / ${result.followingCount} following).`,
        });
      } else if (!result.success) {
        get().addToast({
          type: 'warning',
          title: 'Live Sync Information',
          message:
            result.unsupportedReason ||
            result.error ||
            'Instagram does not permit unauthenticated live follower scraping.',
          duration: 6500,
        });
      }

      return result;
    } finally {
      set({ isLiveSyncing: false, liveSyncProgress: 0, liveSyncMessage: '' });
    }
  },

  // Snapshots & Navigation
  snapshots: [],
  activeSnapshot: null,
  activeCategory: 'overview',
  setActiveCategory: (category: RelationshipCategory) => {
    set({ activeCategory: category });
    if (category === 'live_mode') {
      set({ dataSourceMode: 'live' });
      get().fetchLiveStatus();
      get().fetchDiagnostics();
    }
  },

  // Data
  followers: [],
  following: [],
  notFollowingBack: [],
  fans: [],
  mutuals: [],
  newFollowers: [],
  unfollowers: [],
  accountMetadataMap: new Map(),

  // Filters & Sorting
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  sortField: 'username',
  setSortField: (field: SortField) => set({ sortField: field }),
  sortOrder: 'asc',
  setSortOrder: (order: SortOrder) => set({ sortOrder: order }),
  whitelistedOnly: false,
  setWhitelistedOnly: (value: boolean) => set({ whitelistedOnly: value }),

  // Bulk selection
  selectedUsernames: [],
  toggleSelectUsername: (username: string) => {
    const { selectedUsernames } = get();
    if (selectedUsernames.includes(username)) {
      set({ selectedUsernames: selectedUsernames.filter((u) => u !== username) });
    } else {
      set({ selectedUsernames: [...selectedUsernames, username] });
    }
  },
  selectAllUsernames: (usernames: string[]) => set({ selectedUsernames: usernames }),
  clearSelection: () => set({ selectedUsernames: [] }),

  // Modals state
  isImportModalOpen: false,
  setImportModalOpen: (open: boolean) => set({ isImportModalOpen: open }),
  isGuideModalOpen: false,
  setGuideModalOpen: (open: boolean) => set({ isGuideModalOpen: open }),
  isCompareModalOpen: false,
  setCompareModalOpen: (open: boolean) => set({ isCompareModalOpen: open }),
  compareSnapshotId: null,
  setCompareSnapshotId: (id: string | null) => set({ compareSnapshotId: id }),
  selectedAccountForNotes: null,
  setSelectedAccountForNotes: (account: AccountItem | null) =>
    set({ selectedAccountForNotes: account }),

  // Toasts
  toasts: [],
  addToast: (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    const duration = toast.duration || 3500;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  // Loading
  isLoading: false,
  loadingMessage: undefined,
  setLoading: (loading: boolean, message?: string) =>
    set({ isLoading: loading, loadingMessage: message }),

  // Load all snapshots
  loadSnapshots: async () => {
    try {
      get().setLoading(true, 'Loading snapshots...');
      const snaps = await getSnapshots();
      set({ snapshots: snaps });

      if (snaps.length > 0) {
        // If no active snapshot, pick the newest one
        const currentActive = get().activeSnapshot;
        if (!currentActive || !snaps.some((s) => s.id === currentActive.id)) {
          await get().selectSnapshot(snaps[0].id);
        }
      } else {
        set({
          activeSnapshot: null,
          followers: [],
          following: [],
          notFollowingBack: [],
          fans: [],
          mutuals: [],
          newFollowers: [],
          unfollowers: [],
        });
      }
    } finally {
      get().setLoading(false);
    }
  },

  // Select a specific snapshot and compute all analytics
  selectSnapshot: async (snapshotId: string) => {
    try {
      get().setLoading(true, 'Analyzing relationships...');
      const snap = await getSnapshot(snapshotId);
      if (!snap) return;

      const rawRels = await getSnapshotRelationships(snapshotId);
      const metadataMap = await getAccountMetadataMap();

      // Separate followers and following
      const rawFollowers: NormalizedAccount[] = [];
      const rawFollowing: NormalizedAccount[] = [];

      for (const rel of rawRels) {
        const item: NormalizedAccount = {
          username: rel.username,
          profileUrl: rel.profileUrl,
          fullName: rel.fullName,
          timestamp: rel.timestamp,
        };

        if (rel.relationshipType === 'follower' || rel.relationshipType === 'mutual') {
          rawFollowers.push(item);
        }
        if (rel.relationshipType === 'following' || rel.relationshipType === 'mutual') {
          rawFollowing.push(item);
        }
      }

      const followerSet = new Set(rawFollowers.map((f) => f.username.toLowerCase()));
      const followingSet = new Set(rawFollowing.map((f) => f.username.toLowerCase()));

      const rawNotFollowingBack = calculateNotFollowingBack(rawFollowers, rawFollowing);
      const rawFans = calculateFans(rawFollowers, rawFollowing);
      const rawMutuals = calculateMutuals(rawFollowers, rawFollowing);

      // Enrich with metadata
      const followers = enrichAccountItems(rawFollowers, followerSet, followingSet, metadataMap);
      const following = enrichAccountItems(rawFollowing, followerSet, followingSet, metadataMap);
      const notFollowingBack = enrichAccountItems(
        rawNotFollowingBack,
        followerSet,
        followingSet,
        metadataMap
      );
      const fans = enrichAccountItems(rawFans, followerSet, followingSet, metadataMap);
      const mutuals = enrichAccountItems(rawMutuals, followerSet, followingSet, metadataMap);

      // Historical comparison: check if there is a previous snapshot
      let newFollowers: AccountItem[] = [];
      let unfollowers: AccountItem[] = [];

      // Look up previous snapshot
      const allSnaps = get().snapshots;
      let prevSnapId = snap.previousSnapshotId;
      if (!prevSnapId) {
        // Find snapshot chronologically before this one
        const olderSnaps = allSnaps
          .filter((s) => s.timestamp < snap.timestamp && s.id !== snap.id)
          .sort((a, b) => b.timestamp - a.timestamp);
        if (olderSnaps.length > 0) {
          prevSnapId = olderSnaps[0].id;
        }
      }

      if (prevSnapId) {
        const prevRels = await getSnapshotRelationships(prevSnapId);
        const prevFollowers: NormalizedAccount[] = [];
        const prevFollowing: NormalizedAccount[] = [];

        for (const rel of prevRels) {
          const item: NormalizedAccount = {
            username: rel.username,
            profileUrl: rel.profileUrl,
            fullName: rel.fullName,
            timestamp: rel.timestamp,
          };
          if (rel.relationshipType === 'follower' || rel.relationshipType === 'mutual') {
            prevFollowers.push(item);
          }
          if (rel.relationshipType === 'following' || rel.relationshipType === 'mutual') {
            prevFollowing.push(item);
          }
        }

        const diff = compareSnapshots(
          prevSnapId,
          snap.id,
          0,
          snap.timestamp,
          prevFollowers,
          prevFollowing,
          rawFollowers,
          rawFollowing,
          metadataMap
        );

        unfollowers = diff.unfollowers;
        newFollowers = diff.newFollowers;
      }

      set({
        activeSnapshot: snap,
        followers,
        following,
        notFollowingBack,
        fans,
        mutuals,
        newFollowers,
        unfollowers,
        accountMetadataMap: metadataMap,
        selectedUsernames: [],
      });
    } finally {
      get().setLoading(false);
    }
  },

  // Delete a snapshot
  deleteSnapshot: async (snapshotId: string) => {
    try {
      get().setLoading(true, 'Deleting snapshot...');
      await dbDeleteSnapshot(snapshotId);
      get().addToast({
        type: 'success',
        title: 'Snapshot deleted',
        message: 'The snapshot was successfully removed from local storage.',
      });
      await get().loadSnapshots();
    } catch (err) {
      get().addToast({
        type: 'error',
        title: 'Delete failed',
        message: (err as Error).message,
      });
    } finally {
      get().setLoading(false);
    }
  },

  // Whitelist toggle
  toggleWhitelist: async (username: string) => {
    const isWhitelisted = await toggleAccountWhitelist(username);
    const updatedMap = new Map(get().accountMetadataMap);
    const existing = updatedMap.get(username) || {
      username,
      isWhitelisted: false,
      tags: [],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };
    updatedMap.set(username, { ...existing, isWhitelisted });

    // Update in-memory lists
    const updateList = (list: AccountItem[]) =>
      list.map((item) =>
        item.username.toLowerCase() === username.toLowerCase()
          ? { ...item, isWhitelisted }
          : item
      );

    set({
      accountMetadataMap: updatedMap,
      followers: updateList(get().followers),
      following: updateList(get().following),
      notFollowingBack: updateList(get().notFollowingBack),
      fans: updateList(get().fans),
      mutuals: updateList(get().mutuals),
      newFollowers: updateList(get().newFollowers),
      unfollowers: updateList(get().unfollowers),
    });

    get().addToast({
      type: 'info',
      title: isWhitelisted ? 'Account Whitelisted' : 'Removed from Whitelist',
      message: `@${username} has been ${isWhitelisted ? 'added to' : 'removed from'} your whitelist.`,
    });
  },

  // Save notes & tags
  saveAccountNotes: async (username: string, notes: string, tags: string[] = []) => {
    await updateAccountNotes(username, notes, tags);
    const updatedMap = new Map(get().accountMetadataMap);
    const existing = updatedMap.get(username) || {
      username,
      isWhitelisted: false,
      tags: [],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };
    updatedMap.set(username, { ...existing, notes, tags });

    const updateList = (list: AccountItem[]) =>
      list.map((item) =>
        item.username.toLowerCase() === username.toLowerCase()
          ? { ...item, notes, tags }
          : item
      );

    set({
      accountMetadataMap: updatedMap,
      followers: updateList(get().followers),
      following: updateList(get().following),
      notFollowingBack: updateList(get().notFollowingBack),
      fans: updateList(get().fans),
      mutuals: updateList(get().mutuals),
      newFollowers: updateList(get().newFollowers),
      unfollowers: updateList(get().unfollowers),
    });

    get().addToast({
      type: 'success',
      title: 'Notes Saved',
      message: `Updated notes for @${username}.`,
    });
  },

  // Unfollow account directly via active Instagram tab session
  unfollowAccount: async (targetUsername: string, targetUserId?: string) => {
    const norm = targetUsername.toLowerCase().trim();
    const tabId = get().liveStatus?.activeTab?.id;
    if (!tabId) {
      get().addToast({
        type: 'error',
        title: 'Instagram Tab Required',
        message: 'Please keep an Instagram tab open to unfollow accounts.',
      });
      return false;
    }

    try {
      const res = await unfollowInstagramUser({
        tabId,
        targetUserId,
        targetUsername: norm,
      });

      if (!res.success) {
        get().addToast({
          type: 'error',
          title: 'Unfollow Failed',
          message: res.error || `Could not unfollow @${targetUsername}`,
        });
        return false;
      }

      // Update Dexie
      const activeSnap = get().activeSnapshot;
      if (activeSnap) {
        await removeFollowingRelationship(activeSnap.id, norm);
      }

      // Update in-memory lists
      set((state) => ({
        following: state.following.filter((u) => u.username.toLowerCase() !== norm),
        notFollowingBack: state.notFollowingBack.filter((u) => u.username.toLowerCase() !== norm),
        mutuals: state.mutuals.filter((u) => u.username.toLowerCase() !== norm),
        activeSnapshot: state.activeSnapshot
          ? {
              ...state.activeSnapshot,
              followingCount: Math.max(0, state.activeSnapshot.followingCount - 1),
              notFollowingBackCount: Math.max(0, state.activeSnapshot.notFollowingBackCount - 1),
            }
          : null,
      }));

      get().addToast({
        type: 'success',
        title: 'Unfollowed',
        message: `@${targetUsername} has been unfollowed.`,
      });

      return true;
    } catch (err: any) {
      get().addToast({
        type: 'error',
        title: 'Unfollow Error',
        message: err?.message || `Failed to unfollow @${targetUsername}`,
      });
      return false;
    }
  },
}));

