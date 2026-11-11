import { create } from 'zustand';
import { AppState, ThemeMode, ToastMessage } from '../types/store';
import { ThemeId } from '../types/theme';
import { DEFAULT_THEME_ID, applyThemeToDocument, THEMES } from '../styles/themes';
import {
  getOnboardingState,
  persistThemeId,
  persistOnboardingStep,
  persistUsername,
  markOnboardingCompleted,
  resetOnboardingFlow,
} from '../services/storage/onboardingService';
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
import { queryCurrentInstagramTabs } from '../services/live/tabDetectionService';
import { unfollowInstagramUser } from '../services/live/followerExporterService';
import { LiveSyncOptions, LiveSyncResult } from '../services/live/liveTypes';

export const useAppStore = create<AppState>((set, get) => ({
  // Theme state
  theme: 'dark',
  activeThemeId: DEFAULT_THEME_ID,

  setThemeId: (themeId: ThemeId) => {
    const validId = THEMES[themeId] ? themeId : DEFAULT_THEME_ID;
    set({
      activeThemeId: validId,
      theme: THEMES[validId].appearance === 'dark' ? 'dark' : 'light',
    });
    applyThemeToDocument(validId);
    persistThemeId(validId);
  },

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        const currentId = get().activeThemeId;
        if (THEMES[currentId]?.appearance !== 'dark') {
          get().setThemeId('slate_sand');
        }
      } else if (theme === 'light') {
        root.classList.remove('dark');
        const currentId = get().activeThemeId;
        if (THEMES[currentId]?.appearance !== 'light') {
          get().setThemeId('sunset_bloom');
        }
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
        get().setThemeId(isDark ? 'slate_sand' : 'sunset_bloom');
      }
    }
  },

  // Onboarding System
  isOnboardingCompleted: false,
  onboardingStep: 1,
  customUsername: '',

  setOnboardingStep: (step: number) => {
    set({ onboardingStep: step });
    persistOnboardingStep(step);
  },

  setCustomUsername: (username: string) => {
    const clean = username.trim().replace(/^@/, '');
    set({ customUsername: clean });
    persistUsername(clean);
  },

  completeOnboarding: async () => {
    set({ isOnboardingCompleted: true });
    await markOnboardingCompleted();
  },

  resetOnboarding: async () => {
    set({ isOnboardingCompleted: false, onboardingStep: 1 });
    await resetOnboardingFlow();
  },

  initOnboardingState: async () => {
    try {
      const state = await getOnboardingState();
      set({
        isOnboardingCompleted: state.isOnboardingCompleted,
        onboardingStep: state.onboardingStep,
        activeThemeId: state.themeId,
        customUsername: state.username,
        theme: THEMES[state.themeId]?.appearance === 'dark' ? 'dark' : 'light',
      });
      applyThemeToDocument(state.themeId);
    } catch {
      applyThemeToDocument(DEFAULT_THEME_ID);
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
      const followerSet = new Set<string>();
      const followingSet = new Set<string>();

      for (const rel of rawRels) {
        const item: NormalizedAccount = {
          username: rel.username,
          profileUrl: rel.profileUrl,
          fullName: rel.fullName,
          timestamp: rel.timestamp,
        };

        const lower = rel.username.toLowerCase();
        if (rel.relationshipType === 'follower' || rel.relationshipType === 'mutual') {
          rawFollowers.push(item);
          followerSet.add(lower);
        }
        if (rel.relationshipType === 'following' || rel.relationshipType === 'mutual') {
          rawFollowing.push(item);
          followingSet.add(lower);
        }
      }

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
    const norm = username.toLowerCase().trim();
    const isWhitelisted = await toggleAccountWhitelist(norm);
    const updatedMap = new Map(get().accountMetadataMap);
    const existing = updatedMap.get(norm) || {
      username: norm,
      isWhitelisted: false,
      tags: [],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };
    updatedMap.set(norm, { ...existing, isWhitelisted });

    // Update in-memory lists
    const updateList = (list: AccountItem[]) =>
      list.map((item) =>
        item.username.toLowerCase() === norm
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
    const norm = username.toLowerCase().trim();
    await updateAccountNotes(norm, notes, tags);
    const updatedMap = new Map(get().accountMetadataMap);
    const existing = updatedMap.get(norm) || {
      username: norm,
      isWhitelisted: false,
      tags: [],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };
    updatedMap.set(norm, { ...existing, notes, tags });

    const updateList = (list: AccountItem[]) =>
      list.map((item) =>
        item.username.toLowerCase() === norm
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
    let tabId = get().liveStatus?.activeTab?.id;
    if (!tabId) {
      await get().fetchLiveStatus();
      tabId = get().liveStatus?.activeTab?.id;
    }

    if (!tabId) {
      try {
        const tabState = await queryCurrentInstagramTabs();
        tabId = tabState.activeTab?.id || tabState.tabs?.[0]?.id;
      } catch {}
    }

    if (!tabId) {
      get().addToast({
        type: 'error',
        title: 'Instagram Tab Required',
        message: 'Please keep an Instagram tab open to unfollow accounts.',
      });
      return false;
    }

    let finalTargetUserId = targetUserId;
    if (!finalTargetUserId) {
      const match =
        get().following.find((u) => u.username.toLowerCase() === norm) ||
        get().followers.find((u) => u.username.toLowerCase() === norm);
      if (match) {
        finalTargetUserId = (match as any).userId || (match as any).id;
      }
    }

    try {
      const res = await unfollowInstagramUser({
        tabId,
        targetUserId: finalTargetUserId,
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

      const wasMutual = get().mutuals.some((u) => u.username.toLowerCase() === norm);
      const targetInFollowers = get().followers.find((u) => u.username.toLowerCase() === norm);

      // Update in-memory lists
      set((state) => {
        const following = state.following.filter((u) => u.username.toLowerCase() !== norm);
        const notFollowingBack = state.notFollowingBack.filter((u) => u.username.toLowerCase() !== norm);
        const mutuals = state.mutuals.filter((u) => u.username.toLowerCase() !== norm);

        let fans = state.fans;
        let followers = state.followers;

        if (wasMutual && targetInFollowers) {
          const updatedTarget: AccountItem = {
            ...targetInFollowers,
            isFollowing: false,
            isFollower: true,
            isMutual: false,
          };
          fans = [updatedTarget, ...state.fans];
          followers = state.followers.map((u) =>
            u.username.toLowerCase() === norm ? updatedTarget : u
          );
        }

        const activeSnapshot = state.activeSnapshot
          ? {
              ...state.activeSnapshot,
              followingCount: Math.max(0, state.activeSnapshot.followingCount - 1),
              notFollowingBackCount: wasMutual
                ? state.activeSnapshot.notFollowingBackCount
                : Math.max(0, state.activeSnapshot.notFollowingBackCount - 1),
              mutualCount: wasMutual
                ? Math.max(0, (state.activeSnapshot.mutualCount || 0) - 1)
                : (state.activeSnapshot.mutualCount || 0),
              fansCount: wasMutual
                ? (state.activeSnapshot.fansCount || 0) + 1
                : (state.activeSnapshot.fansCount || 0),
            }
          : null;

        return {
          following,
          notFollowingBack,
          mutuals,
          fans,
          followers,
          activeSnapshot,
        };
      });

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

