/**
 * InstaTrack Background Service Worker (Manifest V3)
 *
 * Implements persistent top-level tab listeners for reliable Instagram detection:
 * - Listens to tab creation, URL updates, SPA navigation, activation, and closure.
 * - Broadcasts tab state to active popup and dashboard pages in real-time.
 * - Caches state in chrome.storage.local for instantaneous recovery on service worker wake-up.
 */

import {
  queryCurrentInstagramTabs,
  cacheTabDetectionState,
  isInstagramUrl,
  logTabDebug,
  INSTAGRAM_TAB_CHANGED_MESSAGE,
  QUERY_INSTAGRAM_TABS_MESSAGE,
} from '../services/live/tabDetectionService';
import { runLiveBrowserScan } from '../services/live/liveBrowserAdapter';
import { getSnapshots } from '../db';

export default defineBackground(() => {
  logTabDebug('SW', 'Service worker initialized in top-level execution scope');

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Evaluates open Instagram tabs, caches to storage, and notifies frontend listeners.
   */
  const triggerTabDetection = (reason: string) => {
    logTabDebug('SW', `Tab detection triggered by: ${reason}`);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      try {
        const state = await queryCurrentInstagramTabs();
        await cacheTabDetectionState(state);

        logTabDebug('SW', `Broadcasting ${INSTAGRAM_TAB_CHANGED_MESSAGE}: isTabOpen=${state.isTabOpen}`);

        // Broadcast to any open popup or dashboard views
        chrome.runtime.sendMessage({
          type: INSTAGRAM_TAB_CHANGED_MESSAGE,
          state,
        }).catch(() => {
          // Normal when popup or dashboard are not open
        });
      } catch (err) {
        logTabDebug('SW', 'Error during Instagram tab detection:', err);
      }
    }, 150);
  };

  // 1. Initial detection on extension install or update
  chrome.runtime.onInstalled.addListener((details) => {
    logTabDebug('SW', `chrome.runtime.onInstalled: reason=${details.reason}`);
    if (details.reason === 'install') {
      chrome.storage.local.set({
        instaflow_onboarding_completed: false,
        instaflow_onboarding_step: 1,
      }).catch(() => {});
      chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html#onboarding'),
      });
    }
    triggerTabDetection('onInstalled');
  });

  // 2. Initial detection on service worker startup / wake-up
  chrome.runtime.onStartup.addListener(() => {
    logTabDebug('SW', 'chrome.runtime.onStartup fired');
    triggerTabDetection('onStartup');
  });

  // Immediate detection on script load
  triggerTabDetection('initial-script-load');

  // 3. Tab URL change & SPA navigation listener
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const tabUrl = changeInfo.url || tab.url || (tab as any).pendingUrl || '';
    if (
      changeInfo.url ||
      changeInfo.title ||
      changeInfo.status === 'complete' ||
      isInstagramUrl(tabUrl)
    ) {
      logTabDebug('SW', `chrome.tabs.onUpdated: tabId=${tabId}, status=${changeInfo.status}, url=${tabUrl || 'none'}`);
      triggerTabDetection(`onUpdated (tab ${tabId})`);
    }
  });

  // 4. Tab switch / activation listener
  chrome.tabs.onActivated.addListener((activeInfo) => {
    logTabDebug('SW', `chrome.tabs.onActivated: tabId=${activeInfo.tabId}`);
    triggerTabDetection('onActivated');
  });

  // 5. Tab closed listener
  chrome.tabs.onRemoved.addListener((tabId) => {
    logTabDebug('SW', `chrome.tabs.onRemoved: tabId=${tabId}`);
    triggerTabDetection('onRemoved');
  });

  // 6. Tab created or replaced
  chrome.tabs.onCreated.addListener((tab) => {
    const tabUrl = tab.url || (tab as any).pendingUrl || '';
    logTabDebug('SW', `chrome.tabs.onCreated: tabId=${tab.id}, url=${tabUrl}`);
    triggerTabDetection('onCreated');
  });

  if (chrome.tabs.onReplaced) {
    chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
      logTabDebug('SW', `chrome.tabs.onReplaced: added=${addedTabId}, removed=${removedTabId}`);
      triggerTabDetection('onReplaced');
    });
  }

  // 7. Message bus for dashboard & popup requests
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    logTabDebug('SW', `Received runtime message: type=${message?.type}`);

    if (message?.type === 'OPEN_DASHBOARD') {
      const targetCategory = message.category || 'overview';
      chrome.tabs.create({
        url: chrome.runtime.getURL(`dashboard.html#${targetCategory}`),
      });
      sendResponse({ status: 'ok' });
      return false;
    }

    if (message?.type === QUERY_INSTAGRAM_TABS_MESSAGE) {
      queryCurrentInstagramTabs().then((state) => {
        sendResponse(state);
      });
      return true; // asynchronous sendResponse
    }

    if (message?.type === 'EXECUTE_LIVE_BROWSER_SCAN') {
      (async () => {
        let tabId = message.tabId || _sender.tab?.id;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          tabId = activeTab?.id;
        }

        if (!tabId) {
          sendResponse({ success: false, error: 'No active Instagram tab found to scan.' });
          return;
        }

        logTabDebug('SW', `Executing live browser scan on tabId=${tabId}`);
        runLiveBrowserScan(tabId, (percent, msg) => {
          chrome.runtime.sendMessage({
            type: 'LIVE_SCAN_PROGRESS',
            percent,
            message: msg,
          }).catch(() => {});
        })
          .then((data) => {
            logTabDebug('SW', 'Live browser scan completed successfully');
            sendResponse({ success: true, data });
          })
          .catch((err) => {
            logTabDebug('SW', 'Live browser scan failed:', err);
            sendResponse({ success: false, error: (err as Error).message });
          });
      })();
      return true; // asynchronous sendResponse
    }

    if (message?.type === 'GET_INJECTED_POPUP_DATA') {
      (async () => {
        try {
          const snaps = await getSnapshots();
          const latestSnap = snaps.length > 0 ? snaps[0] : null;
          const tabState = await queryCurrentInstagramTabs();
          sendResponse({
            success: true,
            data: {
              activeSnapshot: latestSnap
                ? {
                    accountUsername: latestSnap.accountUsername,
                    followerCount: latestSnap.followerCount,
                    followingCount: latestSnap.followingCount,
                    timestamp: latestSnap.timestamp,
                    notFollowingBackCount: latestSnap.notFollowingBackCount,
                    sourceType: latestSnap.sourceType,
                  }
                : null,
              snapshotsCount: snaps.length,
              tabState,
            },
          });
        } catch (err) {
          sendResponse({ success: false, error: (err as Error).message });
        }
      })();
      return true; // asynchronous sendResponse
    }

    return false;
  });
});
