/**
 * InstaTrack Follower Exporter Service
 *
 * Implements the 4-step exporter workflow:
 * 1. Target username (uses active browser Instagram session)
 * 2. Target list selection (Followers, Following, or Both / Not Following Back)
 * 3. Detailed info toggle (full name, verified, private status, bio)
 * 4. Rate-limit managed export with live progress, pause/cancel, and CSV/Excel/JSON downloads.
 */

import { saveSnapshot } from '../../db';
import { Snapshot, SnapshotRelationship } from '../../types/database';
import { NormalizedAccount } from '../../types/instagram';
import { normalizeUsername } from '../ingestion/normalizer';

export type ExportCollectType = 'both' | 'followers' | 'following';
export type ScanSpeed = 'fast' | 'balanced' | 'careful';

export interface FollowerExportOptions {
  tabId: number;
  username: string;
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
  allAccounts: ExportedUser[];
  snapshotId?: string;
  timestamp: number;
  error?: string;
}

export async function runFollowerExporter(
  options: FollowerExportOptions
): Promise<FollowerExportResult> {
  const { tabId, username, collectType, detailed, onProgress } = options;

  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    throw new Error('Chrome scripting API is unavailable. Run inside the Chrome extension.');
  }

  onProgress?.({
    percent: 5,
    message: `Connecting to Instagram session for @${username}...`,
    collected: 0,
  });

  // Inject the in-page worker into the active Instagram tab
  const injection = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (targetUser: string, targetType: string, isDetailed: boolean, speedMode: string) => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const cleanUsername = targetUser.trim().replace(/^@/, '');

      // Helper: read cookie
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
      };

      const csrftoken = getCookie('csrftoken') || '';
      const dsUserId = getCookie('ds_user_id') || '';

      const headers: Record<string, string> = {
        'x-ig-app-id': '936619743392459',
        'x-requested-with': 'XMLHttpRequest',
        'x-instagram-ajax': '1',
      };
      if (csrftoken) headers['x-csrftoken'] = csrftoken;

      try {
        // Step 1: Resolve Target User ID and counts
        let userId = '';
        let resolvedUsername = cleanUsername;
        let targetFollowersCount = 0;
        let targetFollowingCount = 0;

        if (cleanUsername) {
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
          } catch {
            // Fallback below
          }
        }

        // Fallback: If userId not found, use current logged-in user
        if (!userId && dsUserId) {
          userId = dsUserId;
        }

        if (!userId) {
          throw new Error(
            `Could not resolve user ID for @${cleanUsername || 'account'}. Please ensure you are logged into Instagram.`
          );
        }

        // Step 2 & 3: Helper to paginate user list via friendships API
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
            const url: string = `https://www.instagram.com/api/v1/friendships/${userId}/${endpoint}/?count=200&search_surface=follow_list_page${endpoint === 'following' ? '&order=date_followed_latest' : ''
              }${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ''}`;

            let res: Response;
            try {
              res = await fetch(url, { headers, credentials: 'include' });
            } catch (netErr) {
              await sleep(2000);
              stagnantRetries++;
              continue;
            }

            if (res.status === 429) {
              // Rate limited - back off for 12 seconds
              await sleep(12000);
              stagnantRetries++;
              continue;
            }

            if (!res.ok) {
              stagnantRetries++;
              await sleep(2000);
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

            // Reset stagnant counter on success
            stagnantRetries = 0;

            // High-performance adaptive pacing delay
            if (speedMode === 'fast') {
              if (page <= 12) {
                await sleep(60 + Math.random() * 80);
              } else if (page % 25 === 0) {
                await sleep(1200);
              } else {
                await sleep(180 + Math.random() * 140);
              }
            } else if (speedMode === 'balanced') {
              if (page <= 4) {
                await sleep(150 + Math.random() * 150);
              } else if (page % 15 === 0) {
                await sleep(4000);
              } else {
                await sleep(450 + Math.random() * 450);
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
          username: resolvedUsername,
          followers: rawFollowers,
          following: rawFollowing,
          followersCount: targetFollowersCount || rawFollowers.length,
          followingCount: targetFollowingCount || rawFollowing.length,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Error harvesting data from Instagram.',
        };
      }
    },
    args: [username, collectType, !!detailed, options.scanSpeed || 'fast'],
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
    message: 'Analyzing relationships and preparing structured data...',
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

  // If only followers or only following was collected
  if (collectType === 'followers') {
    raw.followers.forEach((u: any) => allAccountsMap.set(u.username.toLowerCase(), u));
  } else if (collectType === 'following') {
    raw.following.forEach((u: any) => allAccountsMap.set(u.username.toLowerCase(), u));
  }

  const allAccounts = Array.from(allAccountsMap.values());

  // Save as Snapshot in InstaTrack Dexie DB
  const snapshotId = `snap_export_${Date.now()}`;
  try {
    const now = Date.now();

    // Build SnapshotRelationship records with correct schema fields
    const relationships: Omit<SnapshotRelationship, 'id'>[] = [];
    const seenUsernames = new Set<string>();

    // Process followers — mark mutuals as 'mutual', others as 'follower'
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

    // Process following — only add those not already seen (non-mutuals = 'following')
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
      unfollowerCount: 0,
      newFollowerCount: 0,
      notes: `Exported via Follower Exporter (${collectType})`,
    };

    await saveSnapshot(newSnapshot, relationships);
  } catch {
    // Ignore db save errors during standalone export
  }

  onProgress?.({
    percent: 100,
    message: `Export completed! ${allAccounts.length} accounts collected.`,
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
    allAccounts,
    snapshotId,
    timestamp: Date.now(),
  };
}
