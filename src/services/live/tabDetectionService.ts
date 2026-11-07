/**
 * Centralized Instagram Browser Tab Detection Service
 *
 * Reliably tracks open Instagram tabs, SPA navigation, tab switches,
 * multiple tabs, and connection state across the background worker,
 * popup, and dashboard.
 */

import { normalizeUsername } from '../ingestion/normalizer';

export interface DetectedTab {
  id?: number;
  url?: string;
  title?: string;
  detectedUsername?: string;
  active: boolean;
  audible?: boolean;
}

export interface TabDetectionState {
  isTabOpen: boolean;
  tabCount: number;
  activeTab: DetectedTab | null;
  tabs: DetectedTab[];
  lastChecked: number;
  error?: string;
}

export const INSTAGRAM_STORAGE_KEY = 'instatrack_live_tab_state';
export const INSTAGRAM_TAB_CHANGED_MESSAGE = 'INSTAGRAM_TAB_CHANGED';
export const QUERY_INSTAGRAM_TABS_MESSAGE = 'QUERY_INSTAGRAM_TABS';

// Instagram URL patterns to search across Chrome
export const INSTAGRAM_MATCH_PATTERNS = [
  '*://*.instagram.com/*',
  '*://instagram.com/*',
  'https://*.instagram.com/*',
  'https://instagram.com/*',
];

// Development diagnostic logging
const DEBUG = true;
export function logTabDebug(category: string, message: string, data?: any) {
  if (DEBUG) {
    if (data !== undefined) {
      console.log(`[InstaTrack:${category}] ${message}`, data);
    } else {
      console.log(`[InstaTrack:${category}] ${message}`);
    }
  }
}

// Paths that are not user profile handles
const RESERVED_PATHNAMES = new Set([
  'explore',
  'reels',
  'stories',
  'direct',
  'accounts',
  'developer',
  'legal',
  'about',
  'p',
  'reel',
  'tv',
  'privacy',
  'terms',
  'api',
  'directory',
  'web',
  'emails',
]);

/**
 * Checks whether a given URL is a valid Instagram page.
 * Supports bare domain (instagram.com), www, mobile (m.instagram.com),
 * and all official subdomains (about, help, accountscenter, etc.).
 */
export function isInstagramUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'instagram.com' || host.endsWith('.instagram.com');
  } catch {
    return /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*instagram\.com(?:\/.*)?$/i.test(url);
  }
}

/**
 * Extracts a normalized username if an Instagram URL is a profile page
 */
export function extractUsernameFromUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (host !== 'instagram.com' && !host.endsWith('.instagram.com')) {
      return undefined;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      const candidate = segments[0].toLowerCase();
      if (!RESERVED_PATHNAMES.has(candidate)) {
        return normalizeUsername(candidate);
      }
    }
  } catch {
    // Non-standard or incomplete URL
  }
  return undefined;
}

/**
 * Queries all open Instagram tabs in the current browser window and active profile.
 * Scans all browser tabs directly via chrome.tabs.query({}) to avoid match-pattern discrepancies.
 */
export async function queryCurrentInstagramTabs(): Promise<TabDetectionState> {
  const now = Date.now();
  logTabDebug('Detection', 'Running queryCurrentInstagramTabs...');

  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    logTabDebug('Detection', 'chrome.tabs.query unavailable (running outside extension)');
    const cached = await getCachedTabDetectionState();
    if (cached) return cached;
    return {
      isTabOpen: false,
      tabCount: 0,
      activeTab: null,
      tabs: [],
      lastChecked: now,
      error: 'Chrome tabs API unavailable',
    };
  }

  try {
    // Query ALL browser tabs without restrictive filters
    const allTabs = await chrome.tabs.query({});
    logTabDebug('Detection', `Total browser tabs inspected: ${allTabs.length}`);

    // Filter to Instagram tabs
    const validTabs: DetectedTab[] = [];
    for (const t of allTabs) {
      const candidateUrl = t.url || (t as any).pendingUrl || '';
      if (isInstagramUrl(candidateUrl)) {
        const username = extractUsernameFromUrl(candidateUrl);
        validTabs.push({
          id: t.id,
          url: candidateUrl,
          title: t.title,
          detectedUsername: username,
          active: !!t.active,
          audible: !!t.audible,
        });
        logTabDebug('Detection', `Matched Instagram tab: id=${t.id}, active=${t.active}, url=${candidateUrl}, user=@${username || 'none'}`);
      }
    }

    // Determine the most relevant tab: active tab first, then first available
    const activeTab = validTabs.find((t) => t.active) || (validTabs.length > 0 ? validTabs[0] : null);

    // If active tab has no username from URL (e.g. home feed), probe active session
    if (
      typeof chrome !== 'undefined' &&
      chrome.scripting?.executeScript &&
      activeTab?.id &&
      !activeTab.detectedUsername
    ) {
      try {
        const probe = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: async () => {
            try {
              const res = await fetch('/data/shared_data/', { credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                return data?.config?.viewer?.username || null;
              }
            } catch {}
            return null;
          },
        });
        const found = probe?.[0]?.result;
        if (found && typeof found === 'string') {
          activeTab.detectedUsername = normalizeUsername(found);
        }
      } catch {
        // Tab might be in transition or restricted
      }
    }

    const state: TabDetectionState = {
      isTabOpen: validTabs.length > 0,
      tabCount: validTabs.length,
      activeTab,
      tabs: validTabs,
      lastChecked: now,
    };

    logTabDebug('Detection', `Query finished: isTabOpen=${state.isTabOpen}, tabCount=${state.tabCount}`);

    // Cache the fresh state immediately
    await cacheTabDetectionState(state);

    return state;
  } catch (err) {
    logTabDebug('Detection', 'Error during queryCurrentInstagramTabs:', err);
    return {
      isTabOpen: false,
      tabCount: 0,
      activeTab: null,
      tabs: [],
      lastChecked: now,
      error: (err as Error).message,
    };
  }
}

/**
 * Saves current tab state to local storage for fast immediate recovery on worker restart
 */
export async function cacheTabDetectionState(state: TabDetectionState): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      await chrome.storage.local.set({ [INSTAGRAM_STORAGE_KEY]: state });
      logTabDebug('Storage', 'Cached fresh tab state to chrome.storage.local');
    } catch (err) {
      logTabDebug('Storage', 'Failed to cache tab state:', err);
    }
  }
}

/**
 * Reads cached tab state from local storage
 */
export async function getCachedTabDetectionState(): Promise<TabDetectionState | null> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const res = await chrome.storage.local.get(INSTAGRAM_STORAGE_KEY);
      return (res[INSTAGRAM_STORAGE_KEY] as TabDetectionState) || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Subscribes to live tab detection state changes from background worker,
 * storage updates, and runs an initial fresh query.
 */
export function subscribeToTabDetectionChanges(
  callback: (state: TabDetectionState) => void
): () => void {
  logTabDebug('Subscription', 'Setting up subscribeToTabDetectionChanges');

  // 1. Run live query immediately and dispatch fresh result
  queryCurrentInstagramTabs().then((fresh) => {
    callback(fresh);
  });

  // 2. Listen to storage changes
  const storageListener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[INSTAGRAM_STORAGE_KEY]?.newValue) {
      logTabDebug('Subscription', 'Received storage change for tab detection state');
      callback(changes[INSTAGRAM_STORAGE_KEY].newValue);
    }
  };

  // 3. Listen to runtime messages
  const messageListener = (message: any) => {
    if (message?.type === INSTAGRAM_TAB_CHANGED_MESSAGE && message.state) {
      logTabDebug('Subscription', 'Received INSTAGRAM_TAB_CHANGED runtime message');
      callback(message.state);
    }
  };

  if (typeof chrome !== 'undefined') {
    chrome.storage?.onChanged?.addListener(storageListener);
    chrome.runtime?.onMessage?.addListener(messageListener);
  }

  // Cleanup function
  return () => {
    logTabDebug('Subscription', 'Cleaning up subscribeToTabDetectionChanges');
    if (typeof chrome !== 'undefined') {
      chrome.storage?.onChanged?.removeListener(storageListener);
      chrome.runtime?.onMessage?.removeListener(messageListener);
    }
  };
}
