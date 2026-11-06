import { NormalizedAccount } from '../../types/instagram';
import { normalizeUsername } from '../ingestion/normalizer';

export interface LiveHarvestResult {
  accountUsername: string;
  followers: NormalizedAccount[];
  following: NormalizedAccount[];
  scannedAt: number;
  /** Relationship diffs computed inside the browser tab */
  notFollowingBack: string[];
  fans: string[];
  mutuals: string[];
  followingCount: number;
  followersCount: number;
}

export type LiveScanProgressCallback = (percent: number, message: string) => void;

/**
 * Executes a browser-assisted DOM scan inside an active Instagram tab
 * using the emillvl / F4F Checker streaming accumulation pattern.
 *
 * Implements the full 6-phase pipeline from INSTA_NOT_FOLLOWING_BACK_LOGIC.md:
 *  Phase 1: Identify Profile & Counts
 *  Phase 2: Open Following Modal Dialog
 *  Phase 3: Automated Scroll & Virtual DOM Harvesting Loop (Following)
 *  Phase 4: Open Followers Modal & Repeat Harvesting
 *  Phase 5: Set Difference Diffing (A \ B)
 *  Phase 6: Format & Return Results
 */
export async function runLiveBrowserScan(
  tabId: number,
  onProgress?: LiveScanProgressCallback
): Promise<LiveHarvestResult> {
  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    throw new Error('Chrome scripting API is unavailable. Please run within the Chrome extension.');
  }

  onProgress?.(5, 'Phase 1: Identifying profile & counts...');

  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const cleanUser = (href: string | null) =>
        href ? href.replace(/\//g, '').split('?')[0].trim() : '';

      // ─── Floating Cozy HUD for In-Tab Visual Feedback ───
      let hudContainer: HTMLDivElement | null = null;
      let isAborted = false;

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          isAborted = true;
          updateHud('Scan stopped by user. Finalizing records...', 100);
        }
      };

      const createHud = () => {
        try {
          const existing = document.getElementById('instatrack-live-hud');
          if (existing) existing.remove();

          hudContainer = document.createElement('div');
          hudContainer.id = 'instatrack-live-hud';
          hudContainer.setAttribute(
            'style',
            'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 2147483647; ' +
              'background: rgba(24, 23, 22, 0.88); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); ' +
              'border: 1px solid rgba(255, 255, 255, 0.14); box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.2); ' +
              'border-radius: 9999px; padding: 10px 20px; color: #FBF9F5; ' +
              'font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; ' +
              'display: flex; align-items: center; gap: 12px; pointer-events: none; user-select: none; ' +
              'transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);'
          );

          hudContainer.innerHTML = `
            <style>
              @keyframes instatrack-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.8); }
              }
            </style>
            <span style="width: 9px; height: 9px; border-radius: 50%; background: #FF6B4A; display: inline-block; box-shadow: 0 0 10px #FF6B4A; animation: instatrack-pulse 1.4s infinite ease-in-out;"></span>
            <div style="display: flex; flex-direction: column; gap: 1px;">
              <span style="font-size: 13px; font-weight: 600; letter-spacing: -0.01em; color: #FAF8F5;">InstaTrack Live Scanner</span>
              <span id="instatrack-hud-msg" style="font-size: 11px; color: rgba(251, 249, 245, 0.75);">Initializing scanner...</span>
            </div>
            <div style="width: 72px; height: 5px; background: rgba(255, 255, 255, 0.15); border-radius: 9999px; overflow: hidden; margin-left: 4px;">
              <div id="instatrack-hud-bar" style="width: 5%; height: 100%; background: #FF6B4A; border-radius: 9999px; transition: width 0.25s ease;"></div>
            </div>
            <span style="font-size: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 2px 7px; color: rgba(251, 249, 245, 0.6); font-weight: 500;">ESC to pause</span>
          `;

          document.body.appendChild(hudContainer);
          window.addEventListener('keydown', onKeyDown);
        } catch {
          // Non-critical if DOM insertion fails
        }
      };

      const updateHud = (msg: string, pct?: number) => {
        try {
          const msgEl = document.getElementById('instatrack-hud-msg');
          const barEl = document.getElementById('instatrack-hud-bar');
          if (msgEl) msgEl.innerText = msg;
          if (barEl && typeof pct === 'number') {
            barEl.style.width = `${Math.min(100, Math.max(5, pct))}%`;
          }
        } catch {
          // Ignore DOM updates failure
        }
      };

      const removeHud = () => {
        try {
          window.removeEventListener('keydown', onKeyDown);
          const el = document.getElementById('instatrack-live-hud');
          if (el) el.remove();
        } catch {
          // Ignore
        }
      };

      createHud();

      try {
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1: Identify Profile & Target Counts
        // ═══════════════════════════════════════════════════════════════════
        const rawPath = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0];
        const pathSegments = rawPath.split('/');
        let currentUsername = pathSegments[0] || '';

        const excludedRoutes = ['explore', 'reels', 'direct', 'stories', 'accounts', 'emails', 'p', 'reel'];

        // If on feed or excluded route, check if header or meta indicates profile, or find profile link
        if (!currentUsername || excludedRoutes.includes(currentUsername.toLowerCase())) {
          const headerUser = document.querySelector('header h2, header h1, section h2')?.textContent?.trim().replace(/^@/, '');
          if (headerUser && !excludedRoutes.includes(headerUser.toLowerCase())) {
            currentUsername = headerUser;
          }
        }

        // If user is on Instagram home feed (/), auto-discover logged-in handle from navigation
        if (!currentUsername || excludedRoutes.includes(currentUsername.toLowerCase())) {
          const profileAnchor =
            document.querySelector<HTMLAnchorElement>('nav a[href^="/"] img[alt*="profile"]')?.closest('a') ||
            document.querySelector<HTMLAnchorElement>('a[href^="/"][role="link"] svg[aria-label*="Profile"]')?.closest('a') ||
            document.querySelector<HTMLAnchorElement>('nav a[href^="/"]:last-child');

          const candidateHref = profileAnchor?.getAttribute('href') || '';
          const candidateUser = candidateHref.replace(/\//g, '').split('?')[0].trim();

          if (candidateUser && !excludedRoutes.includes(candidateUser.toLowerCase())) {
            updateHud(`Redirecting to @${candidateUser}...`, 10);
            window.location.href = `https://www.instagram.com/${candidateUser}/`;
            throw new Error(
              `Redirected to your profile (@${candidateUser}). Please click Scan once the page finishes loading.`
            );
          }

          throw new Error(
            `Please open your Instagram profile page (e.g. instagram.com/your_username/) before scanning.`
          );
        }

        // Locate Following and Followers buttons/links with flexible regex matching
        const findLink = (pattern: RegExp): HTMLElement | null => {
          const candidates = Array.from(
            document.querySelectorAll<HTMLElement>('a, button, div[role="button"], li')
          );
          for (const el of candidates) {
            const href = el.getAttribute('href') || '';
            const text = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (pattern.test(href) || pattern.test(text)) {
              return el;
            }
          }
          return null;
        };

        const followingLink =
          findLink(new RegExp(`/${currentUsername}/following(/|\\?|$)`, 'i')) ||
          findLink(/\/following(\/|\?|$)/i) ||
          findLink(/\bfollowing\b/i);

        const followersLink =
          findLink(new RegExp(`/${currentUsername}/followers(/|\\?|$)`, 'i')) ||
          findLink(/\/followers(\/|\?|$)/i) ||
          findLink(/\bfollowers\b/i);

        if (!followingLink || !followersLink) {
          throw new Error(
            'Could not find the Followers or Following buttons on this page. Please ensure you are viewing a profile and the page has finished loading.'
          );
        }

        // Parse header count numbers (e.g. "1,245 following" → 1245, "12.5K" → 12500)
        const parseNumber = (el: HTMLElement) => {
          const title = el.getAttribute('title') || el.querySelector('[title]')?.getAttribute('title');
          if (title) {
            const num = title.replace(/[^0-9]/g, '');
            if (num) return parseInt(num, 10);
          }
          const text = (el.innerText || el.textContent || '').trim();
          const match = text.match(/([0-9]+(?:[.,][0-9]+)?)\s*([km])?/i);
          if (!match) return 0;
          let val = parseFloat(match[1].replace(',', '.'));
          const unit = (match[2] || '').toUpperCase();
          if (unit === 'K') val *= 1000;
          if (unit === 'M') val *= 1000000;
          return Math.round(val) || 0;
        };

        const targetFollowingCount = parseNumber(followingLink);
        const targetFollowersCount = parseNumber(followersLink);

        updateHud(`Ready: ${targetFollowingCount} following, ${targetFollowersCount} followers`, 10);

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2 & 3: Open Modal, Scroll & Harvest
        // ═══════════════════════════════════════════════════════════════════
        async function harvestList(
          trigger: HTMLElement,
          targetCount: number,
          label: string,
          basePct: number,
          scalePct: number
        ): Promise<Array<{ username: string; fullName?: string }>> {
          if (isAborted) return [];

          updateHud(`Opening ${label}...`, basePct);
          trigger.click();

          // Wait for the Instagram modal dialog & scroll container to render
          let scrollBox: HTMLElement | null = null;
          let dialog: HTMLElement | null = null;

          for (let i = 0; i < 30; i++) {
            if (isAborted) break;
            await sleep(250);
            dialog = document.querySelector<HTMLElement>('div[role="dialog"]');
            if (dialog) {
              const allDivs = Array.from(dialog.querySelectorAll<HTMLElement>('div'));
              scrollBox =
                allDivs.find((d) => {
                  try {
                    const style = window.getComputedStyle(d);
                    return (
                      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                      d.scrollHeight > d.clientHeight
                    );
                  } catch {
                    return false;
                  }
                }) ||
                dialog.querySelector<HTMLElement>('._aano') ||
                (dialog.querySelector('ul')?.parentElement as HTMLElement) ||
                dialog.querySelector<HTMLElement>('div[style*="overflow"]');

              if (scrollBox) break;
            }
          }

          if (!scrollBox && !isAborted) {
            throw new Error(`Could not open the ${label} list dialog. Instagram may have blocked or delayed the popup.`);
          }

          const userMap = new Map<string, { username: string; fullName?: string }>();
          let stagnantCount = 0;
          let lastHeight = 0;
          const hasTarget = targetCount > 0;

          while (!isAborted && (!hasTarget || userMap.size < targetCount) && stagnantCount < 8) {
            // 1. Scrape currently visible anchor elements in the virtual viewport
            const anchors = (scrollBox || document).querySelectorAll<HTMLAnchorElement>('a[role="link"]');
            let foundNewInPass = false;

            anchors.forEach((a) => {
              const href = a.getAttribute('href');
              if (!href || !href.startsWith('/')) return;
              const u = cleanUser(href);
              if (!u || excludedRoutes.includes(u.toLowerCase())) return;

              const key = u.toLowerCase();
              if (key !== currentUsername.toLowerCase() && !userMap.has(key)) {
                let fullName: string | undefined = undefined;
                try {
                  const row =
                    a.closest('div[role="none"]') ||
                    a.closest('li') ||
                    a.parentElement?.parentElement;
                  if (row) {
                    const textSpans = row.querySelectorAll('span');
                    for (const s of textSpans) {
                      const txt = s.innerText?.trim();
                      if (
                        txt &&
                        txt.toLowerCase() !== key &&
                        !txt.startsWith('@') &&
                        !txt.includes('Follow') &&
                        !txt.includes('Verified') &&
                        txt.length < 50
                      ) {
                        fullName = txt;
                        break;
                      }
                    }
                  }
                } catch {
                  // Fallback without full name
                }

                userMap.set(key, { username: u, fullName });
                foundNewInPass = true;
              }
            });

            // Update live HUD
            const harvested = userMap.size;
            const progressRatio = targetCount > 0 ? Math.min(1, harvested / targetCount) : 0.5;
            const currentPct = Math.round(basePct + progressRatio * scalePct);
            updateHud(`Scanning ${label}... (${harvested} / ${targetCount || '?'})`, currentPct);

            // 2. Programmatically scroll container
            if (scrollBox) {
              scrollBox.scrollTop = scrollBox.scrollHeight;
            }

            // 3. Stagnation detection
            if (!foundNewInPass && scrollBox && scrollBox.scrollHeight === lastHeight) {
              stagnantCount++;
            } else {
              stagnantCount = 0;
              if (scrollBox) lastHeight = scrollBox.scrollHeight;
            }

            // 4. Anti-bot jitter delay (800–1200ms randomized)
            await sleep(800 + Math.random() * 400);
          }

          // Close the modal
          const closeBtn =
            dialog?.querySelector<HTMLButtonElement>('button[aria-label="Close"]') ||
            dialog?.querySelector<HTMLButtonElement>('div[role="dialog"] svg[aria-label="Close"]')?.closest('button') ||
            dialog?.querySelector<HTMLButtonElement>('div[role="dialog"] [aria-label*="Close"]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          }

          // Wait for modal close animation
          await sleep(1000);
          return Array.from(userMap.values());
        }

        // Harvest Following first (10% -> 45%), then Followers (45% -> 80%)
        const rawFollowing = await harvestList(followingLink, targetFollowingCount, 'following', 10, 35);
        const rawFollowers = await harvestList(followersLink, targetFollowersCount, 'followers', 45, 35);

        updateHud('Comparing relationships...', 82);

        const getName = (item: any) => (typeof item === 'string' ? item : item.username);

        const followersSet = new Set(rawFollowers.map((u) => getName(u).toLowerCase()));
        const followingSet = new Set(rawFollowing.map((u) => getName(u).toLowerCase()));

        const notFollowingBack = rawFollowing
          .map(getName)
          .filter((u) => !followersSet.has(u.toLowerCase()));
        const fans = rawFollowers
          .map(getName)
          .filter((u) => !followingSet.has(u.toLowerCase()));
        const mutuals = rawFollowing
          .map(getName)
          .filter((u) => followersSet.has(u.toLowerCase()));

        updateHud(`Done! ${notFollowingBack.length} not following back.`, 95);
        await sleep(600);

        return {
          success: true,
          username: currentUsername,
          following: rawFollowing,
          followers: rawFollowers,
          notFollowingBack,
          fans,
          mutuals,
          followingCount: targetFollowingCount,
          followersCount: targetFollowersCount,
          timestamp: Date.now(),
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Failed to extract data from Instagram tab.',
        };
      } finally {
        removeHud();
      }
    },
  });

  if (!results || results.length === 0 || !results[0]?.result) {
    throw new Error('Failed to extract data from Instagram tab. The script returned no results.');
  }

  const scriptResult = results[0].result as any;
  if (scriptResult.success === false || scriptResult.error) {
    throw new Error(scriptResult.error || 'Failed to extract data from Instagram tab.');
  }

  const rawData = (scriptResult.data || scriptResult) as {
    username: string;
    following: Array<string | { username: string; fullName?: string }>;
    followers: Array<string | { username: string; fullName?: string }>;
    notFollowingBack: string[];
    fans: string[];
    mutuals: string[];
    followingCount: number;
    followersCount: number;
    timestamp: number;
  };

  const getItemUser = (item: any) => (typeof item === 'string' ? item : item.username);
  const getItemName = (item: any) => (typeof item === 'string' ? undefined : item.fullName);

  const followersSet = new Set((rawData.followers || []).map((u) => getItemUser(u).toLowerCase()));
  const followingSet = new Set((rawData.following || []).map((u) => getItemUser(u).toLowerCase()));

  const notFollowingBack =
    rawData.notFollowingBack ||
    (rawData.following || [])
      .map(getItemUser)
      .filter((u) => !followersSet.has(u.toLowerCase()));
  const fans =
    rawData.fans ||
    (rawData.followers || [])
      .map(getItemUser)
      .filter((u) => !followingSet.has(u.toLowerCase()));
  const mutuals =
    rawData.mutuals ||
    (rawData.following || [])
      .map(getItemUser)
      .filter((u) => followersSet.has(u.toLowerCase()));

  onProgress?.(80, `Phase 5 complete: Found ${notFollowingBack.length} not following back...`);

  const normalizedFollowers: NormalizedAccount[] = (rawData.followers || []).map((item) => {
    const u = getItemUser(item);
    const fn = getItemName(item);
    return {
      username: normalizeUsername(u),
      fullName: fn?.trim() || undefined,
      profileUrl: `https://www.instagram.com/${u}/`,
      timestamp: rawData.timestamp || Date.now(),
    };
  });

  const normalizedFollowing: NormalizedAccount[] = (rawData.following || []).map((item) => {
    const u = getItemUser(item);
    const fn = getItemName(item);
    return {
      username: normalizeUsername(u),
      fullName: fn?.trim() || undefined,
      profileUrl: `https://www.instagram.com/${u}/`,
      timestamp: rawData.timestamp || Date.now(),
    };
  });

  onProgress?.(90, 'Phase 6: Normalizing records and creating snapshot...');

  return {
    accountUsername: rawData.username || 'unknown',
    followers: normalizedFollowers,
    following: normalizedFollowing,
    notFollowingBack,
    fans,
    mutuals,
    followingCount: rawData.followingCount ?? normalizedFollowing.length,
    followersCount: rawData.followersCount ?? normalizedFollowers.length,
    scannedAt: rawData.timestamp || Date.now(),
  };
}
