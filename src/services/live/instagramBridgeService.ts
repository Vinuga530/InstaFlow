/**
 * InstaTrack High-Performance Instagram Bridge & Harvester Engine
 *
 * Implements the complete logic from leading extensions (Unfolks & LoyaltyLens):
 * - Direct session auth via /data/shared_data/ and cookies (csrftoken, ds_user_id)
 * - Rapid friendship pagination (count=200 per page) with adaptive pacing (Fast, Balanced, Careful)
 * - Inline follow-back detection (follows_viewer / friendship_status)
 * - Safe rate-limit back-off and checkpoint handling
 * - 1-Click Unfollow via /api/v1/friendships/destroy/
 * - Automatic Dexie DB snapshot persistence
 */

import { saveSnapshot } from '../../db';
import { Snapshot, SnapshotRelationship } from '../../types/database';
import { NormalizedAccount } from '../../types/instagram';

export const APP_ID = '936619743392459';
export const PAGE_SIZE = 200;

export type ScanSpeed = 'fast' | 'balanced' | 'careful';

export interface PacingConfig {
  fastPages: number;
  fastDelayMinMs: number;
  fastDelayMaxMs: number;
  delayMinMs: number;
  delayMaxMs: number;
  pauseEveryPages: number;
  pauseMs: number;
}

export const PACING: Record<ScanSpeed, PacingConfig> = {
  fast: {
    fastPages: 12,
    fastDelayMinMs: 60,
    fastDelayMaxMs: 140,
    delayMinMs: 180,
    delayMaxMs: 320,
    pauseEveryPages: 25,
    pauseMs: 1200,
  },
  balanced: {
    fastPages: 4,
    fastDelayMinMs: 150,
    fastDelayMaxMs: 300,
    delayMinMs: 450,
    delayMaxMs: 900,
    pauseEveryPages: 15,
    pauseMs: 4000,
  },
  careful: {
    fastPages: 0,
    fastDelayMinMs: 0,
    fastDelayMaxMs: 0,
    delayMinMs: 1000,
    delayMaxMs: 2000,
    pauseEveryPages: 10,
    pauseMs: 8000,
  },
};

export interface InstagramViewer {
  id: string;
  username: string;
  fullName?: string;
  profilePicUrl?: string;
}

export interface InstagramBridgeAccount {
  id: string;
  username: string;
  fullName?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  profilePicUrl?: string;
  profileUrl: string;
  followsViewer?: boolean;
  followedByViewer?: boolean;
  relationship?: 'not_following_back' | 'mutual' | 'fan' | 'following' | 'follower';
}

export interface ScanProgressEvent {
  phase: 'init' | 'following' | 'followers' | 'analyzing' | 'done' | 'rate_limited';
  current: number;
  total: number;
  percent: number;
  message: string;
  retryInMs?: number;
}

export interface ScanResult {
  success: boolean;
  viewer: InstagramViewer;
  following: InstagramBridgeAccount[];
  followers: InstagramBridgeAccount[];
  notFollowingBack: InstagramBridgeAccount[];
  fans: InstagramBridgeAccount[];
  mutuals: InstagramBridgeAccount[];
  snapshotId?: string;
  timestamp: number;
  error?: string;
}

/**
 * Executes inside the Instagram Web tab context with full native session access.
 */
export async function runInPageScan(
  speed: ScanSpeed = 'fast',
  onProgress?: (event: ScanProgressEvent) => void
): Promise<ScanResult> {
  const pacing = PACING[speed];

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomRange = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));

  // Helper: Read cookie
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  let csrfToken = getCookie('csrftoken') || '';
  const dsUserId = getCookie('ds_user_id') || '';

  const igHeaders = (): Record<string, string> => ({
    'x-ig-app-id': APP_ID,
    'x-asbd-id': '129477',
    'x-csrftoken': csrfToken,
    'x-requested-with': 'XMLHttpRequest',
    'x-instagram-ajax': '1',
  });

  // 1. Resolve Viewer Data
  let viewer: InstagramViewer = {
    id: dsUserId,
    username: 'my_account',
  };

  try {
    const sharedDataRes = await fetch('/data/shared_data/', { credentials: 'include' });
    if (sharedDataRes.ok) {
      const data = await sharedDataRes.json();
      if (data?.config?.csrf_token) {
        csrfToken = data.config.csrf_token;
      }
      if (data?.config?.viewer) {
        viewer = {
          id: String(data.config.viewerId || data.config.viewer.id || dsUserId),
          username: data.config.viewer.username,
          fullName: data.config.viewer.full_name,
          profilePicUrl: data.config.viewer.profile_pic_url,
        };
      }
    }
  } catch {
    // Fallback to cookie
  }

  if (!viewer.id) {
    throw new Error('Not logged into Instagram. Please log in to Instagram in this browser and try again.');
  }

  onProgress?.({
    phase: 'init',
    current: 0,
    total: 100,
    percent: 5,
    message: `Connected to @${viewer.username}. Reading counts...`,
  });

  // 2. Read Exact Profile Counts
  let followingTotal = 0;
  let followersTotal = 0;

  try {
    const infoRes = await fetch(`https://www.instagram.com/api/v1/users/${viewer.id}/info/`, {
      headers: igHeaders(),
      credentials: 'include',
    });
    if (infoRes.ok) {
      const infoJson = await infoRes.json();
      followingTotal = infoJson?.user?.following_count || 0;
      followersTotal = infoJson?.user?.follower_count || 0;
    }
  } catch {
    // Ignore counts failure
  }

  const grandTotal = Math.max(1, followingTotal + (followersTotal || followingTotal));

  // Helper for pagination
  const harvestEndpoint = async (
    endpoint: 'following' | 'followers',
    totalTarget: number,
    basePct: number,
    scalePct: number
  ): Promise<InstagramBridgeAccount[]> => {
    const accounts: InstagramBridgeAccount[] = [];
    const seen = new Set<string>();
    let maxId: string | null = null;
    let page = 0;
    let stagnantCount = 0;

    while (stagnantCount < 5) {
      page++;
      const url = new URL(`https://www.instagram.com/api/v1/friendships/${viewer.id}/${endpoint}/`);
      url.searchParams.set('count', String(PAGE_SIZE));
      url.searchParams.set('search_surface', 'follow_list_page');
      if (endpoint === 'following') {
        url.searchParams.set('order', 'date_followed_latest');
      }
      if (maxId) {
        url.searchParams.set('max_id', maxId);
      }

      let res: Response;
      try {
        res = await fetch(url.toString(), {
          headers: igHeaders(),
          credentials: 'include',
        });
      } catch {
        stagnantCount++;
        await sleep(2000);
        continue;
      }

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after')) || 12;
        onProgress?.({
          phase: 'rate_limited',
          current: accounts.length,
          total: totalTarget,
          percent: Math.min(95, Math.round(basePct + (accounts.length / (totalTarget || 1)) * scalePct)),
          message: `Instagram rate limit reached. Waiting ${retryAfter}s before resuming...`,
          retryInMs: retryAfter * 1000,
        });
        await sleep(retryAfter * 1000);
        stagnantCount++;
        continue;
      }

      if (!res.ok) {
        stagnantCount++;
        await sleep(1500);
        continue;
      }

      const json = await res.json();
      const users = json?.users || [];
      if (users.length === 0) {
        break;
      }

      for (const u of users) {
        const uid = String(u.pk || u.id);
        const uname = u.username;
        if (!seen.has(uname.toLowerCase())) {
          seen.add(uname.toLowerCase());
          accounts.push({
            id: uid,
            username: uname,
            fullName: u.full_name,
            isVerified: !!u.is_verified,
            isPrivate: !!u.is_private,
            profilePicUrl: u.profile_pic_url,
            profileUrl: `https://www.instagram.com/${uname}/`,
            followsViewer: u.follows_viewer === true || u.friendship_status?.followed_by === true,
            followedByViewer: endpoint === 'following',
          });
        }
      }

      const currentCount = accounts.length;
      const progressRatio = totalTarget > 0 ? Math.min(1, currentCount / totalTarget) : 0.5;
      const pct = Math.min(95, Math.round(basePct + progressRatio * scalePct));

      onProgress?.({
        phase: endpoint,
        current: currentCount,
        total: totalTarget,
        percent: pct,
        message: `Scanning ${endpoint}... (${currentCount} / ${totalTarget || '?'})`,
      });

      if (json.next_max_id) {
        maxId = json.next_max_id;
      } else {
        break;
      }

      // Adaptive Pacing Delay
      if (page <= pacing.fastPages) {
        await sleep(randomRange(pacing.fastDelayMinMs, pacing.fastDelayMaxMs));
      } else if (pacing.pauseEveryPages > 0 && page % pacing.pauseEveryPages === 0) {
        await sleep(pacing.pauseMs);
      } else {
        await sleep(randomRange(pacing.delayMinMs, pacing.delayMaxMs));
      }
    }

    return accounts;
  };

  // 3. Harvest Following List First (10% to 55%)
  const followingAccounts = await harvestEndpoint('following', followingTotal, 10, 45);

  // 4. Determine which following accounts already state `followsViewer`
  const knownFollowers = new Set<string>();
  const needsFollowerCheck = new Set<string>();

  followingAccounts.forEach((acc) => {
    if (acc.followsViewer === true) {
      knownFollowers.add(acc.username.toLowerCase());
    } else {
      needsFollowerCheck.add(acc.username.toLowerCase());
    }
  });

  // 5. Harvest Followers List (55% to 85%)
  const followerAccounts = await harvestEndpoint('followers', followersTotal, 55, 30);
  followerAccounts.forEach((acc) => {
    knownFollowers.add(acc.username.toLowerCase());
  });

  // 6. Relationship Difference Sets
  onProgress?.({
    phase: 'analyzing',
    current: followingAccounts.length + followerAccounts.length,
    total: grandTotal,
    percent: 90,
    message: 'Calculating unfollowers, mutuals, and fan relationships...',
  });

  const followerUsernames = knownFollowers;
  const followingUsernames = new Set(followingAccounts.map((a) => a.username.toLowerCase()));

  const notFollowingBack: InstagramBridgeAccount[] = [];
  const mutuals: InstagramBridgeAccount[] = [];
  const fans: InstagramBridgeAccount[] = [];

  followingAccounts.forEach((acc) => {
    if (followerUsernames.has(acc.username.toLowerCase())) {
      mutuals.push({ ...acc, relationship: 'mutual' });
    } else {
      notFollowingBack.push({ ...acc, relationship: 'not_following_back' });
    }
  });

  followerAccounts.forEach((acc) => {
    if (!followingUsernames.has(acc.username.toLowerCase())) {
      fans.push({ ...acc, relationship: 'fan' });
    }
  });

  onProgress?.({
    phase: 'done',
    current: followingAccounts.length + followerAccounts.length,
    total: grandTotal,
    percent: 100,
    message: `Scan complete! ${notFollowingBack.length} accounts do not follow you back.`,
  });

  return {
    success: true,
    viewer,
    following: followingAccounts,
    followers: followerAccounts,
    notFollowingBack,
    fans,
    mutuals,
    timestamp: Date.now(),
  };
}

/**
 * Unfollows an Instagram account directly via authenticated API call.
 */
export async function inPageUnfollow(
  targetUserId: string,
  targetUsername?: string
): Promise<{ success: boolean; error?: string }> {
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie?.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  let csrfToken = getCookie('csrftoken') || '';
  if (!csrfToken && typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) csrfToken = meta.getAttribute('content') || '';
  }
  if (!csrfToken && typeof document !== 'undefined') {
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
  if (!csrfToken && typeof window !== 'undefined' && (window as any)._sharedData?.config?.csrf_token) {
    csrfToken = (window as any)._sharedData.config.csrf_token;
  }
  if (!csrfToken) {
    try {
      const sRes = await fetch('/data/shared_data/', { credentials: 'include' });
      if (sRes.ok) {
        const sData = await sRes.json();
        csrfToken = sData?.config?.csrf_token || '';
      }
    } catch {}
  }

  let finalId = targetUserId;
  if (!finalId && targetUsername) {
    const uname = targetUsername.trim().toLowerCase().replace(/^@/, '');
    if (typeof document !== 'undefined') {
      try {
        const metaOwner = document.querySelector('meta[property="instapp:owner_user_id"]');
        const ownerId = metaOwner?.getAttribute('content');
        if (ownerId && /^\d+$/.test(ownerId)) {
          finalId = ownerId;
        }
      } catch {}
    }

    if (!finalId) {
      try {
        const htmlRes = await fetch(`https://www.instagram.com/${encodeURIComponent(uname)}/`, { credentials: 'include' });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const mMatch = html.match(/<meta[^>]+property=["']instapp:owner_user_id["'][^>]+content=["'](\d+)["']/i) ||
            html.match(/<meta[^>]+content=["'](\d+)["'][^>]+property=["']instapp:owner_user_id["']/i);
          if (mMatch && mMatch[1]) finalId = mMatch[1];
        }
      } catch {}
    }
  }

  if (!finalId) {
    return { success: false, error: 'Could not resolve user ID to unfollow.' };
  }

  const defaultHeaders: Record<string, string> = {
    'x-ig-app-id': APP_ID,
    'x-asbd-id': '129477',
    'x-requested-with': 'XMLHttpRequest',
    'x-instagram-ajax': '1',
    'content-type': 'application/x-www-form-urlencoded',
  };
  if (csrfToken) {
    defaultHeaders['x-csrftoken'] = csrfToken;
  }

  const postBody = `user_id=${encodeURIComponent(finalId)}`;
  const endpoints = [
    `https://www.instagram.com/api/v1/friendships/destroy/${finalId}/`,
    `https://www.instagram.com/api/v1/web/friendships/${finalId}/unfollow/`,
  ];

  let lastError = '';
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: defaultHeaders,
        body: postBody,
        credentials: 'include',
      });

      if (res.status === 429) {
        return { success: false, error: 'Instagram rate limit: please wait a few moments before unfollowing.' };
      }

      let isJson = false;
      let data: any = null;
      let text = '';
      try {
        text = await res.text();
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          data = JSON.parse(trimmed);
          isJson = true;
        }
      } catch {}

      if (isJson && (data?.status === 'ok' || data?.friendship_status?.following === false || data?.following === false)) {
        return { success: true };
      }
      if (isJson && (data?.feedback_message || data?.message)) {
        lastError = data.feedback_message || data.message;
      } else if (!isJson) {
        if (res.status === 401 || res.status === 403 || text.includes('login')) {
          lastError = 'Instagram session expired. Please log into Instagram in your open tab.';
        } else if (res.status === 429 || text.includes('checkpoint') || text.includes('feedback_required')) {
          lastError = 'Instagram action limit reached. Please wait a few moments before unfollowing.';
        } else {
          lastError = `Instagram rejected request (HTTP ${res.status}).`;
        }
      }
    } catch (err: any) {
      lastError = err?.message || 'Network request failed.';
    }
  }

  return { success: false, error: lastError || 'Could not unfollow account.' };
}

/**
 * Saves scan results to InstaTrack Dexie DB as an official Snapshot.
 */
export async function commitScanToSnapshot(scanResult: ScanResult): Promise<string> {
  const now = Date.now();
  const snapshotId = `snap_live_${now}`;
  const relationships: Omit<SnapshotRelationship, 'id'>[] = [];
  const followingSet = new Set(scanResult.following.map((a) => a.username.toLowerCase()));
  const followerSet = new Set(scanResult.followers.map((a) => a.username.toLowerCase()));

  scanResult.followers.forEach((acc) => {
    const isMutual = followingSet.has(acc.username.toLowerCase());
    relationships.push({
      snapshotId,
      username: acc.username.toLowerCase(),
      relationshipType: isMutual ? 'mutual' : 'follower',
      profileUrl: acc.profileUrl,
      fullName: acc.fullName,
      timestamp: now,
    });
  });

  scanResult.following.forEach((acc) => {
    if (!followerSet.has(acc.username.toLowerCase())) {
      relationships.push({
        snapshotId,
        username: acc.username.toLowerCase(),
        relationshipType: 'following',
        profileUrl: acc.profileUrl,
        fullName: acc.fullName,
        timestamp: now,
      });
    }
  });

  const snapshot: Snapshot = {
    id: snapshotId,
    timestamp: now,
    label: `@${scanResult.viewer.username} (Live Scan)`,
    accountUsername: scanResult.viewer.username,
    sourceType: 'live_browser',
    followerCount: scanResult.followers.length,
    followingCount: scanResult.following.length,
    notFollowingBackCount: scanResult.notFollowingBack.length,
    fansCount: scanResult.fans.length,
    mutualCount: scanResult.mutuals.length,
    unfollowerCount: 0,
    newFollowerCount: 0,
    notes: 'Synchronized via InstaTrack High-Performance Engine',
  };

  await saveSnapshot(snapshot, relationships);
  return snapshotId;
}

