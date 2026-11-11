/**
 * InstaTrack Follower Exporter Service
 *
 * Implements the 4-step exporter workflow:
 * 1. Target username (uses active browser Instagram session)
 * 2. Target list selection (Followers, Following, or Both / Not Following Back)
 * 3. Detailed info toggle (full name, verified, private status, bio)
 * 4. Rate-limit managed export with live progress, pause/cancel, and CSV/Excel/JSON downloads.
 */

import { saveSnapshot, getSnapshots, getSnapshotRelationships } from '../../db';
import { Snapshot, SnapshotRelationship } from '../../types/database';
import { NormalizedAccount } from '../../types/instagram';
import { normalizeUsername } from '../ingestion/normalizer';

export type ExportCollectType = 'both' | 'followers' | 'following';
export type ScanSpeed = 'fast' | 'balanced' | 'careful';

export interface FollowerExportOptions {
  tabId: number;
  username?: string;
  collectType: ExportCollectType;
  detailed?: boolean;
  scanSpeed?: ScanSpeed;
  onProgress?: (progress: {
    percent: number;
    message: string;
    collected: number;
    total?: number;
    rateLimitDelay?: number;
  }) => void;
}

export interface ExportedUser {
  id?: string;
  username: string;
  fullName?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  accountType?: 'personal' | 'page';
  profilePicUrl?: string;
  profileUrl: string;
  relationship?: 'follower' | 'following' | 'mutual' | 'not_following_back' | 'fan';
}

export interface FollowerExportResult {
  success: boolean;
  username: string;
  collectType: ExportCollectType;
  followers: ExportedUser[];
  following: ExportedUser[];
  notFollowingBack: ExportedUser[];
  fans: ExportedUser[];
  mutuals: ExportedUser[];
  unfollowers: ExportedUser[];
  newFollowers: ExportedUser[];
  allAccounts: ExportedUser[];
  snapshotId?: string;
  timestamp: number;
  error?: string;
}

export async function runFollowerExporter(
  options: FollowerExportOptions
): Promise<FollowerExportResult> {
  const { tabId, username = '', collectType, detailed = true, onProgress } = options;

  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    throw new Error('Chrome scripting API is unavailable. Run inside the Chrome extension.');
  }

  onProgress?.({
    percent: 5,
    message: 'Connecting to Instagram session...',
    collected: 0,
  });

  // Inject in-page worker into the active Instagram tab
  const injection = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (targetUser: string, targetType: string, isDetailed: boolean, speedMode: string) => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const cleanUsername = targetUser.trim().replace(/^@/, '');

      // 1. Session resolution across modern Instagram architectures
      let viewerId = '';
      let viewerUsername = '';
      let viewerFullName = '';
      let csrfToken = '';

      // Strategy A: /data/shared_data/ (standard logged-in endpoint)
      try {
        const sRes = await fetch('/data/shared_data/', { credentials: 'include' });
        if (sRes.ok) {
          const sJson = await sRes.json();
          const v = sJson?.config?.viewer;
          if (v) {
            viewerId = String(v.id || sJson?.config?.viewerId || '');
            viewerUsername = v.username || '';
            viewerFullName = v.full_name || '';
            csrfToken = sJson?.config?.csrf_token || '';
          }
        }
      } catch {}

      // Strategy B: window._sharedData
      if (!viewerId && (window as any)._sharedData?.config) {
        const conf = (window as any)._sharedData.config;
        if (conf.viewer) {
          viewerId = String(conf.viewer.id || conf.viewerId || '');
          viewerUsername = conf.viewer.username || '';
          viewerFullName = conf.viewer.full_name || '';
          csrfToken = conf.csrf_token || csrfToken;
        }
      }

      // Strategy C: document.cookie fallback
      if (!csrfToken) {
        const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
        if (match) csrfToken = decodeURIComponent(match[1]);
      }
      if (!viewerId) {
        const match = document.cookie.match(/(?:^|;\s*)ds_user_id=([^;]*)/);
        if (match) viewerId = decodeURIComponent(match[1]);
      }

      // Strategy D: Page scripts search
      if (!viewerId) {
        for (const s of Array.from(document.querySelectorAll('script'))) {
          const text = s.textContent || '';
          const mId = text.match(/"viewerId"\s*:\s*"(\d+)"/) || text.match(/"USER_ID"\s*:\s*"(\d+)"/);
          if (mId) {
            viewerId = mId[1];
            break;
          }
        }
      }

      const headers: Record<string, string> = {
        'x-ig-app-id': '936619743392459',
        'x-asbd-id': '129477',
        'x-requested-with': 'XMLHttpRequest',
        'x-instagram-ajax': '1',
      };
      if (csrfToken) headers['x-csrftoken'] = csrfToken;

      // 2. Resolve Target User ID and counts
      let userId = '';
      let resolvedUsername = cleanUsername;
      let targetFollowersCount = 0;
      let targetFollowingCount = 0;

      const isSelf =
        !cleanUsername ||
        (viewerUsername && cleanUsername.toLowerCase() === viewerUsername.toLowerCase());

      if (isSelf) {
        userId = viewerId;
        resolvedUsername = viewerUsername || cleanUsername;
        if (userId) {
          try {
            const infoRes = await fetch(`https://www.instagram.com/api/v1/users/${userId}/info/`, {
              headers,
              credentials: 'include',
            });
            if (infoRes.ok) {
              const infoJson = await infoRes.json();
              const u = infoJson?.user;
              if (u) {
                targetFollowersCount = u.follower_count || 0;
                targetFollowingCount = u.following_count || 0;
                if (u.username) resolvedUsername = u.username;
              }
            }
          } catch {}
        }
      } else {
        // Query target profile info
        try {
          const profileRes = await fetch(
            `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanUsername)}`,
            { headers, credentials: 'include' }
          );
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const u = profileData?.data?.user;
            if (u) {
              userId = String(u.id);
              resolvedUsername = u.username || cleanUsername;
              targetFollowersCount = u.edge_followed_by?.count || 0;
              targetFollowingCount = u.edge_follow?.count || 0;
            }
          }
        } catch {}

        // Fallback: search endpoint
        if (!userId) {
          try {
            const sRes = await fetch(
              `https://www.instagram.com/api/v1/web/search/topsearch/?context=blended&query=${encodeURIComponent(cleanUsername)}&rank_token=0.5`,
              { headers, credentials: 'include' }
            );
            if (sRes.ok) {
              const sData = await sRes.json();
              const match = (sData?.users || []).find(
                (entry: any) => entry?.user?.username?.toLowerCase() === cleanUsername.toLowerCase()
              );
              if (match?.user?.pk) {
                userId = String(match.user.pk);
                resolvedUsername = match.user.username;
              }
            }
          } catch {}
        }
      }

      if (!userId) {
        userId = viewerId;
      }

      if (!userId) {
        throw new Error(
          `Could not connect to Instagram session. Please make sure you are logged in at instagram.com in this browser.`
        );
      }

      // 3. Harvest follower/following lists
      const harvestList = async (
        endpoint: 'followers' | 'following',
        targetCount: number
      ) => {
        const list: any[] = [];
        let maxId: string | null = null;
        let hasMore = true;
        let stagnantRetries = 0;
        let page = 0;

        while (hasMore && stagnantRetries < 5) {
          page++;
          const url: string = `https://www.instagram.com/api/v1/friendships/${userId}/${endpoint}/?count=200&search_surface=follow_list_page${
            endpoint === 'following' ? '&order=date_followed_latest' : ''
          }${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ''}`;

          let res: Response;
          try {
            res = await fetch(url, { headers, credentials: 'include' });
          } catch {
            await sleep(2000);
            stagnantRetries++;
            continue;
          }

          if (res.status === 429) {
            // Rate limit backoff: wait 15 seconds
            await sleep(15000);
            stagnantRetries++;
            continue;
          }

          if (!res.ok) {
            stagnantRetries++;
            await sleep(2500);
            continue;
          }

          const data = await res.json();
          const users = data?.users || [];
          if (users.length === 0) {
            break;
          }

          for (const u of users) {
            list.push({
              id: String(u.pk || u.id || ''),
              username: u.username,
              fullName: isDetailed ? u.full_name : undefined,
              isVerified: isDetailed ? !!u.is_verified : undefined,
              isPrivate: isDetailed ? !!u.is_private : undefined,
              profilePicUrl: isDetailed ? u.profile_pic_url : undefined,
              profileUrl: `https://www.instagram.com/${u.username}/`,
              followsViewer: u.follows_viewer === true || u.friendship_status?.followed_by === true,
            });
          }

          if (data.next_max_id) {
            maxId = data.next_max_id;
            hasMore = true;
          } else {
            hasMore = false;
          }

          stagnantRetries = 0;

          // Adaptive pacing delays
          if (speedMode === 'fast') {
            if (page <= 10) {
              await sleep(100 + Math.random() * 80);
            } else if (page % 20 === 0) {
              await sleep(1500);
            } else {
              await sleep(200 + Math.random() * 120);
            }
          } else if (speedMode === 'balanced') {
            if (page <= 4) {
              await sleep(200 + Math.random() * 150);
            } else if (page % 10 === 0) {
              await sleep(3500);
            } else {
              await sleep(400 + Math.random() * 300);
            }
          } else {
            // Careful mode
            await sleep(1000 + Math.random() * 1000);
          }
        }

        return list;
      };

      let rawFollowers: any[] = [];
      let rawFollowing: any[] = [];

      if (targetType === 'followers' || targetType === 'both') {
        rawFollowers = await harvestList('followers', targetFollowersCount);
      }

      if (targetType === 'following' || targetType === 'both') {
        rawFollowing = await harvestList('following', targetFollowingCount);
      }

      return {
        success: true,
        username: resolvedUsername || 'instagram_account',
        followers: rawFollowers,
        following: rawFollowing,
        followersCount: targetFollowersCount || rawFollowers.length,
        followingCount: targetFollowingCount || rawFollowing.length,
      };
    },
    args: [username, collectType, detailed, options.scanSpeed || 'fast'],
  });

  if (!injection || injection.length === 0 || !injection[0]?.result) {
    throw new Error('Failed to execute export on Instagram tab. Tab may have closed.');
  }

  const raw = injection[0].result as any;
  if (!raw.success) {
    throw new Error(raw.error || 'Failed to export Instagram data.');
  }

  onProgress?.({
    percent: 85,
    message: 'Analyzing relationships and comparing history...',
    collected: raw.followers.length + raw.following.length,
  });

  const followersMap = new Map<string, ExportedUser>();
  const followingMap = new Map<string, ExportedUser>();

  (raw.followers || []).forEach((u: any) => {
    const key = u.username.toLowerCase();
    followersMap.set(key, { ...u, relationship: 'follower' });
  });

  (raw.following || []).forEach((u: any) => {
    const key = u.username.toLowerCase();
    followingMap.set(key, { ...u, relationship: 'following' });
  });

  // Calculate Difference Sets
  const notFollowingBack: ExportedUser[] = [];
  const mutuals: ExportedUser[] = [];
  const fans: ExportedUser[] = [];

  followingMap.forEach((u, key) => {
    if (followersMap.has(key)) {
      mutuals.push({ ...u, relationship: 'mutual' });
    } else {
      notFollowingBack.push({ ...u, relationship: 'not_following_back' });
    }
  });

  followersMap.forEach((u, key) => {
    if (!followingMap.has(key)) {
      fans.push({ ...u, relationship: 'fan' });
    }
  });

  // Consolidate all accounts for export
  const allAccountsMap = new Map<string, ExportedUser>();
  mutuals.forEach((u) => allAccountsMap.set(u.username.toLowerCase(), u));
  notFollowingBack.forEach((u) => allAccountsMap.set(u.username.toLowerCase(), u));
  fans.forEach((u) => allAccountsMap.set(u.username.toLowerCase(), u));

  if (collectType === 'followers') {
    raw.followers.forEach((u: any) => allAccountsMap.set(u.username.toLowerCase(), u));
  } else if (collectType === 'following') {
    raw.following.forEach((u: any) => allAccountsMap.set(u.username.toLowerCase(), u));
  }

  const allAccounts = Array.from(allAccountsMap.values());

  // Historical Comparison with previous snapshot
  let unfollowers: ExportedUser[] = [];
  let newFollowers: ExportedUser[] = [];
  let previousSnapshotId: string | undefined;

  try {
    const allSnaps = await getSnapshots();
    const olderSnaps = allSnaps
      .filter((s) => s.accountUsername?.toLowerCase() === raw.username.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp);

    if (olderSnaps.length > 0) {
      const prevSnap = olderSnaps[0];
      previousSnapshotId = prevSnap.id;
      const prevRels = await getSnapshotRelationships(prevSnap.id);

      const prevFollowerSet = new Set<string>();
      for (const r of prevRels) {
        if (r.relationshipType === 'follower' || r.relationshipType === 'mutual') {
          prevFollowerSet.add(r.username.toLowerCase());
        }
      }

      // Unfollowers: were followers previously, but missing in current followersMap
      if (collectType === 'both' || collectType === 'followers') {
        for (const prevUser of prevFollowerSet) {
          if (!followersMap.has(prevUser)) {
            unfollowers.push({
              username: prevUser,
              profileUrl: `https://www.instagram.com/${prevUser}/`,
              relationship: 'not_following_back',
            });
          }
        }

        // New Followers: in current followersMap, but not in prevFollowerSet
        followersMap.forEach((u, key) => {
          if (!prevFollowerSet.has(key)) {
            newFollowers.push(u);
          }
        });
      }
    }
  } catch {}

  // Save as Snapshot in InstaTrack Dexie DB
  const snapshotId = `snap_${Date.now()}`;
  try {
    const now = Date.now();
    const relationships: Omit<SnapshotRelationship, 'id'>[] = [];
    const seenUsernames = new Set<string>();

    for (const [key, user] of followersMap) {
      const isMutual = followingMap.has(key);
      const relType = isMutual ? 'mutual' : 'follower';
      if (!seenUsernames.has(key)) {
        seenUsernames.add(key);
        relationships.push({
          snapshotId,
          username: user.username.toLowerCase(),
          relationshipType: relType as any,
          profileUrl: user.profileUrl,
          fullName: user.fullName,
          timestamp: now,
        });
      }
    }

    for (const [key, user] of followingMap) {
      if (!seenUsernames.has(key)) {
        seenUsernames.add(key);
        relationships.push({
          snapshotId,
          username: user.username.toLowerCase(),
          relationshipType: 'following',
          profileUrl: user.profileUrl,
          fullName: user.fullName,
          timestamp: now,
        });
      }
    }

    const newSnapshot: Snapshot = {
      id: snapshotId,
      timestamp: now,
      label: `@${raw.username} (${collectType})`,
      accountUsername: raw.username,
      sourceType: 'live_browser',
      followerCount: followersMap.size,
      followingCount: followingMap.size,
      notFollowingBackCount: notFollowingBack.length,
      fansCount: fans.length,
      mutualCount: mutuals.length,
      unfollowerCount: unfollowers.length,
      newFollowerCount: newFollowers.length,
      previousSnapshotId,
      notes: `Exported via Follower Exporter (${collectType})`,
    };

    await saveSnapshot(newSnapshot, relationships);
  } catch (err) {
    console.error('Failed to save snapshot to Dexie:', err);
  }

  onProgress?.({
    percent: 100,
    message: `Scan complete! ${allAccounts.length} accounts analyzed.`,
    collected: allAccounts.length,
  });

  return {
    success: true,
    username: raw.username,
    collectType,
    followers: Array.from(followersMap.values()),
    following: Array.from(followingMap.values()),
    notFollowingBack,
    fans,
    mutuals,
    unfollowers,
    newFollowers,
    allAccounts,
    snapshotId,
    timestamp: Date.now(),
  };
}

/**
 * Unfollows a user on Instagram via the active authenticated tab session.
 * Uses a 5-tier waterfall resolution for the target's internal Instagram User ID (pk)
 * and dual endpoints (/friendships/destroy/ and /friendships/.../unfollow/).
 */
export async function unfollowInstagramUser(options: {
  tabId: number;
  targetUserId?: string;
  targetUsername: string;
}): Promise<{ success: boolean; targetUserId?: string; error?: string }> {
  const { tabId, targetUserId, targetUsername } = options;

  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    throw new Error('Chrome scripting API unavailable.');
  }

  // Pre-fetch authentic CSRF token via Chrome cookies API if available
  let chromeCookieCsrf = '';
  if (typeof chrome !== 'undefined' && chrome.cookies?.get) {
    try {
      const c = await chrome.cookies.get({ url: 'https://www.instagram.com', name: 'csrftoken' });
      if (c?.value) {
        chromeCookieCsrf = c.value;
      }
    } catch {}
  }

  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (uid: string, uname: string, passedCsrf: string) => {
        // Safe JSON parser to prevent "Unexpected token '<', <!DOCTYPE... is not valid JSON"
        const safeParseJson = async (r: Response): Promise<{ isJson: boolean; data: any; text: string }> => {
          try {
            const raw = await r.text();
            const trimmed = raw.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              return { isJson: true, data: JSON.parse(trimmed), text: raw };
            }
            return { isJson: false, data: null, text: raw };
          } catch {
            return { isJson: false, data: null, text: '' };
          }
        };

        // Helper to extract cookie value
        const getCookie = (name: string): string => {
          const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
          return match ? decodeURIComponent(match[1]) : '';
        };

        // 1. Multi-source CSRF token resolution
        let csrfToken = passedCsrf || getCookie('csrftoken');

        if (!csrfToken) {
          const metaCsrf = document.querySelector('meta[name="csrf-token"]');
          if (metaCsrf) {
            csrfToken = metaCsrf.getAttribute('content') || '';
          }
        }

        if (!csrfToken) {
          // Scan inline script tags for csrf_token
          const scripts = document.querySelectorAll('script');
          for (const s of scripts) {
            const text = s.textContent || '';
            const m = text.match(/"csrf_token"\s*:\s*"([^"]+)"/);
            if (m && m[1]) {
              csrfToken = m[1];
              break;
            }
          }
        }

        if (!csrfToken && (window as any)._sharedData?.config?.csrf_token) {
          csrfToken = (window as any)._sharedData.config.csrf_token;
        }

        if (!csrfToken) {
          try {
            const sRes = await fetch('/data/shared_data/', { credentials: 'include' });
            if (sRes.ok) {
              const { isJson, data } = await safeParseJson(sRes);
              if (isJson && data?.config?.csrf_token) {
                csrfToken = data.config.csrf_token;
              }
            }
          } catch {}
        }

        // 2. Multi-tier resolution for target user id
        let finalId = uid ? String(uid).trim() : '';
        const targetClean = uname.trim().toLowerCase().replace(/^@/, '');

        // Strategy 1: Active Tab DOM if currently viewing target profile
        if (!finalId) {
          try {
            const currentPath = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
            if (currentPath === targetClean) {
              const metaOwner = document.querySelector('meta[property="instapp:owner_user_id"]');
              const ownerId = metaOwner?.getAttribute('content');
              if (ownerId && /^\d+$/.test(ownerId)) {
                finalId = ownerId;
              } else {
                const iosMeta = document.querySelector('meta[property="al:ios:url"]');
                const iosHref = iosMeta?.getAttribute('content') || '';
                const iosMatch = iosHref.match(/id=(\d+)/);
                if (iosMatch && iosMatch[1]) {
                  finalId = iosMatch[1];
                }
              }
            }
          } catch {}
        }

        // Strategy 2: Fetch target profile HTML and parse owner_user_id or script tags
        if (!finalId) {
          try {
            const htmlRes = await fetch(`https://www.instagram.com/${encodeURIComponent(targetClean)}/`, {
              credentials: 'include',
            });
            if (htmlRes.ok) {
              const html = await htmlRes.text();
              const metaMatch =
                html.match(/<meta[^>]+property=["']instapp:owner_user_id["'][^>]+content=["'](\d+)["']/i) ||
                html.match(/<meta[^>]+content=["'](\d+)["'][^>]+property=["']instapp:owner_user_id["']/i);
              if (metaMatch && metaMatch[1]) {
                finalId = metaMatch[1];
              } else {
                const scriptMatch =
                  html.match(/"profilePage_(\d+)"/i) ||
                  html.match(/"owner"\s*:\s*\{\s*"id"\s*:\s*"(\d+)"/i) ||
                  html.match(/"user_id"\s*:\s*"(\d+)"/i) ||
                  html.match(/"pk"\s*:\s*"(\d+)"/i);
                if (scriptMatch && scriptMatch[1]) {
                  finalId = scriptMatch[1];
                }
              }
            }
          } catch {}
        }

        // Strategy 3: Instagram Web Search / Topsearch API endpoint
        if (!finalId) {
          try {
            const searchUrls = [
              `https://www.instagram.com/api/v1/web/search/topsearch/?context=user&query=${encodeURIComponent(targetClean)}`,
              `https://www.instagram.com/web/search/topsearch/?context=user&query=${encodeURIComponent(targetClean)}`,
            ];
            for (const sUrl of searchUrls) {
              if (finalId) break;
              const searchRes = await fetch(sUrl, {
                headers: {
                  'x-ig-app-id': '936619743392459',
                  'x-asbd-id': '129477',
                  'x-csrftoken': csrfToken,
                  'x-requested-with': 'XMLHttpRequest',
                },
                credentials: 'include',
              });
              if (searchRes.ok) {
                const { isJson, data } = await safeParseJson(searchRes);
                if (isJson) {
                  const users = data?.users || [];
                  const matched = users.find(
                    (u: any) =>
                      u?.user?.username?.toLowerCase() === targetClean
                  );
                  if (matched?.user) {
                    const foundId = matched.user.pk || matched.user.pk_id || matched.user.id;
                    if (foundId) finalId = String(foundId);
                  }
                }
              }
            }
          } catch {}
        }

        // Strategy 4: Web Profile Info API
        if (!finalId) {
          try {
            const pRes = await fetch(
              `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(targetClean)}`,
              {
                headers: {
                  'x-ig-app-id': '936619743392459',
                  'x-asbd-id': '129477',
                  'x-csrftoken': csrfToken,
                  'x-requested-with': 'XMLHttpRequest',
                },
                credentials: 'include',
              }
            );
            if (pRes.ok) {
              const { isJson, data } = await safeParseJson(pRes);
              if (isJson) {
                const id = data?.data?.user?.id || data?.data?.user?.pk;
                if (id) finalId = String(id);
              }
            }
          } catch {}
        }

        // Strategy 5: Profile page with __a=1 query parameter
        if (!finalId) {
          try {
            const aRes = await fetch(
              `https://www.instagram.com/${encodeURIComponent(targetClean)}/?__a=1&__d=dis`,
              {
                headers: {
                  'x-ig-app-id': '936619743392459',
                  'x-requested-with': 'XMLHttpRequest',
                },
                credentials: 'include',
              }
            );
            if (aRes.ok) {
              const { isJson, data } = await safeParseJson(aRes);
              if (isJson) {
                const id =
                  data?.graphql?.user?.id ||
                  data?.user?.id ||
                  data?.user?.pk ||
                  data?.data?.user?.id;
                if (id) finalId = String(id);
              }
            }
          } catch {}
        }

        if (!finalId) {
          return {
            success: false,
            error: `Could not resolve user ID for @${uname}. Please open their profile or ensure you are logged into Instagram.`,
          };
        }

        if (!csrfToken) {
          return {
            success: false,
            targetUserId: finalId,
            error: 'Could not resolve Instagram CSRF security token. Please ensure you are logged into Instagram in your open tab.',
          };
        }

        // 3. Post unfollow request with primary and fallback endpoints
        const defaultHeaders: Record<string, string> = {
          'x-ig-app-id': '936619743392459',
          'x-asbd-id': '129477',
          'x-requested-with': 'XMLHttpRequest',
          'x-instagram-ajax': '1',
          'x-csrftoken': csrfToken,
          'content-type': 'application/x-www-form-urlencoded',
          'accept': '*/*',
        };

        const postBody = `user_id=${encodeURIComponent(finalId)}`;
        const endpoints = [
          `https://www.instagram.com/api/v1/friendships/destroy/${finalId}/`,
          `https://www.instagram.com/api/v1/web/friendships/${finalId}/unfollow/`,
          `https://www.instagram.com/web/friendships/${finalId}/unfollow/`,
        ];

        let lastError = '';
        for (const endpoint of endpoints) {
          try {
            const unfollowRes = await fetch(endpoint, {
              method: 'POST',
              headers: defaultHeaders,
              body: postBody,
              credentials: 'include',
            });

            const { isJson, data, text } = await safeParseJson(unfollowRes);

            if (isJson) {
              const isSuccess =
                data?.status === 'ok' ||
                data?.friendship_status?.following === false ||
                data?.following === false;

              if (isSuccess) {
                return { success: true, targetUserId: finalId, data };
              }

              if (data?.feedback_message || data?.message) {
                lastError = data.feedback_message || data.message;
              }
            } else {
              // Gracefully handle non-JSON HTML responses without crashing
              if (unfollowRes.status === 401 || unfollowRes.status === 403 || text.includes('login')) {
                lastError = 'Instagram session expired or unauthorized. Please open Instagram and log in.';
              } else if (unfollowRes.status === 429 || text.includes('checkpoint') || text.includes('feedback_required')) {
                lastError = 'Instagram rate limit or verification checkpoint triggered. Please open Instagram to verify.';
              } else if (unfollowRes.status === 404) {
                lastError = 'Instagram user ID was not found.';
              } else {
                lastError = `Instagram rejected the request (HTTP ${unfollowRes.status}).`;
              }
            }
          } catch (postErr: any) {
            lastError = postErr?.message || 'Network error';
          }
        }

        // Strategy 6: In-DOM Button Click fallback (if active tab is on target's profile page)
        try {
          const currentPath = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
          if (currentPath === targetClean) {
            const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
            const followingBtn = buttons.find((b) => {
              const txt = (b.textContent || '').trim().toLowerCase();
              return txt === 'following' || txt === 'requested';
            });
            if (followingBtn) {
              (followingBtn as HTMLElement).click();
              await new Promise((resolve) => setTimeout(resolve, 400));
              const dialogButtons = Array.from(
                document.querySelectorAll('div[role="dialog"] button, div[role="dialog"] div[role="button"]')
              );
              const confirmBtn = dialogButtons.find((b) => {
                const txt = (b.textContent || '').trim().toLowerCase();
                return txt === 'unfollow';
              });
              if (confirmBtn) {
                (confirmBtn as HTMLElement).click();
                return { success: true, targetUserId: finalId };
              }
            }
          }
        } catch {}

        return {
          success: false,
          targetUserId: finalId,
          error: lastError || `Instagram rejected the unfollow request for @${uname}.`,
        };
      },
      args: [targetUserId || '', targetUsername, chromeCookieCsrf],
    });

    const scriptResult = res?.[0]?.result as any;
    if (scriptResult?.success) {
      return { success: true, targetUserId: scriptResult.targetUserId };
    } else {
      return {
        success: false,
        targetUserId: scriptResult?.targetUserId,
        error: scriptResult?.error || `Failed to unfollow @${targetUsername}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || `Execution error while unfollowing @${targetUsername}`,
    };
  }
}
