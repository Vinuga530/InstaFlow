/**
 * InstaTrack Injected Custom DOM Overlay (Content Script)
 *
 * Bypasses Chrome's native rectangular popup window frame completely by injecting
 * a custom rounded UI directly into the active webpage's DOM.
 *
 * Features:
 * - 100% CSS control over border-radius (26px Apple squircle), elevation shadows,
 *   and top-right fixed positioning.
 * - Shadow DOM encapsulation (zero style bleeding to/from host webpage).
 * - Live tab session detection, active snapshot stats, and quick 1-click scanning.
 * - Smooth spring slide-down animation and keyboard/click-outside dismissal.
 */

export default defineContentScript({
  matches: ['*://*.instagram.com/*', '*://instagram.com/*'],
  main() {
    let overlayHost: HTMLElement | null = null;
    let isClosing = false;

    // Helper: format relative time
    const getRelativeTime = (timestamp: number) => {
      const diffMs = Date.now() - timestamp;
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };

    // Helper: detect profile username from current window URL
    const getPageUsername = () => {
      const path = window.location.pathname.replace(/^\/|\/$/g, '');
      const segments = path.split('/');
      const excluded = ['explore', 'reels', 'direct', 'stories', 'accounts', 'emails', 'p', 'reel'];
      if (segments[0] && !excluded.includes(segments[0].toLowerCase())) {
        return segments[0];
      }
      return null;
    };

    // Remove overlay with smooth animation
    const closeOverlay = () => {
      if (!overlayHost || isClosing) return;
      isClosing = true;

      const shadow = overlayHost.shadowRoot;
      const card = shadow?.querySelector('.instatrack-card') as HTMLElement | null;
      if (card) {
        card.classList.add('closing');
      }

      setTimeout(() => {
        if (overlayHost) {
          overlayHost.remove();
          overlayHost = null;
        }
        isClosing = false;
      }, 190);
    };

    // Mount and display the custom rounded overlay
    const openOverlay = async () => {
      if (overlayHost) {
        closeOverlay();
        return;
      }

      // Query background service worker for active snapshot and extension state
      let popupData: any = null;
      try {
        const res = await chrome.runtime.sendMessage({ type: 'GET_INJECTED_POPUP_DATA' });
        if (res?.success) {
          popupData = res.data;
        }
      } catch (e) {
        // Fallback to local storage or defaults
      }

      const activeSnapshot = popupData?.activeSnapshot;
      const pageUser = getPageUsername();
      const isDark =
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches ||
        document.body.getAttribute('data-theme') === 'dark';

      // Create Host Element attached to page DOM
      overlayHost = document.createElement('div');
      overlayHost.id = 'instatrack-custom-overlay-root';
      overlayHost.style.position = 'fixed';
      overlayHost.style.top = '0';
      overlayHost.style.left = '0';
      overlayHost.style.width = '100vw';
      overlayHost.style.height = '100vh';
      overlayHost.style.pointerEvents = 'none';
      overlayHost.style.zIndex = '2147483647';

      const shadow = overlayHost.attachShadow({ mode: 'open' });

      // Build isolated CSS styles with full control over border-radius, shadows, & positioning
      const fontUrl = chrome.runtime.getURL ? chrome.runtime.getURL('fonts/FredokaOne-Regular.ttf') : '';
      const cassandraFontUrl = chrome.runtime.getURL ? chrome.runtime.getURL('fonts/Cassandra.ttf') : '';

      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: 'Fredoka One';
          src: url('${fontUrl}') format('truetype');
          font-weight: 400;
          font-style: normal;
        }

        @font-face {
          font-family: 'Cassandra';
          src: url('${cassandraFontUrl}') format('truetype');
          font-weight: 400;
          font-style: normal;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }

        /* Backdrop Click-Catcher (Dismiss outside) */
        .instatrack-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: auto;
          background: transparent;
        }

        /* The Custom Rounded Card Floating Top-Right */
        .instatrack-card {
          position: fixed;
          top: 18px;
          right: 18px;
          width: 350px;
          max-width: calc(100vw - 36px);
          pointer-events: auto;
          border-radius: 26px; /* High-end Apple squircle radius */
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
          user-select: none;
          
          /* Custom Elevation & Glassmorphism */
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          
          /* Spring entrance animation */
          animation: instatrackSlideDown 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .instatrack-card.closing {
          animation: instatrackSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Light Theme (Warm Cozy Oat) */
        .instatrack-card.light {
          background: rgba(250, 248, 245, 0.94);
          color: #292522;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 
            0 24px 64px -12px rgba(41, 37, 34, 0.28),
            0 12px 24px -6px rgba(41, 37, 34, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.8) inset;
        }

        /* Dark Theme (Warm Espresso) */
        .instatrack-card.dark {
          background: rgba(27, 25, 24, 0.95);
          color: #F7F4EF;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 24px 64px -12px rgba(0, 0, 0, 0.65),
            0 12px 24px -6px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.06) inset;
        }

        @keyframes instatrackSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-14px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes instatrackSlideUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
        }

        /* Header Bar */
        .instatrack-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .dark .instatrack-header {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .instatrack-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .instatrack-logo {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #E05A47 0%, #D94E34 50%, #C93B20 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 10px rgba(224, 90, 71, 0.3);
        }

        .instatrack-title {
          font-family: 'Cassandra', cursive, sans-serif;
          font-size: 18px;
          letter-spacing: 0.3px;
          line-height: 1.1;
        }

        .instatrack-subtitle {
          font-size: 10px;
          font-weight: 500;
          color: #8C827A;
        }
        .dark .instatrack-subtitle {
          color: #A8A199;
        }

        .instatrack-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .instatrack-btn-dash {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #8C827A;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .instatrack-btn-dash:hover {
          color: #292522;
          background: rgba(0, 0, 0, 0.04);
        }
        .dark .instatrack-btn-dash {
          color: #A8A199;
        }
        .dark .instatrack-btn-dash:hover {
          color: #F7F4EF;
          background: rgba(255, 255, 255, 0.08);
        }

        .instatrack-btn-close {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: none;
          background: rgba(0, 0, 0, 0.04);
          color: #8C827A;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.15s ease;
        }
        .instatrack-btn-close:hover {
          background: rgba(224, 90, 71, 0.12);
          color: #E05A47;
        }
        .dark .instatrack-btn-close {
          background: rgba(255, 255, 255, 0.08);
          color: #A8A199;
        }
        .dark .instatrack-btn-close:hover {
          background: rgba(224, 90, 71, 0.2);
          color: #E05A47;
        }

        /* Well Card Containers */
        .instatrack-well {
          border-radius: 18px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        }
        .dark .instatrack-well {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(20, 19, 18, 0.85);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .instatrack-well-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .instatrack-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #8C827A;
        }
        .dark .instatrack-tag {
          color: #A8A199;
        }

        .instatrack-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .dark .instatrack-status-pill {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .instatrack-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          animation: instatrackPulse 1.6s infinite;
        }

        @keyframes instatrackPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        /* Metrics grid */
        .instatrack-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .instatrack-metric-box {
          border-radius: 12px;
          padding: 8px;
          text-align: center;
          background: rgba(250, 248, 245, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .dark .instatrack-metric-box {
          background: rgba(15, 14, 13, 0.8);
          border-color: rgba(255, 255, 255, 0.04);
        }

        .instatrack-metric-label {
          font-size: 10px;
          font-weight: 500;
          color: #8C827A;
          margin-bottom: 2px;
        }
        .dark .instatrack-metric-label {
          color: #A8A199;
        }

        .instatrack-metric-val {
          font-family: 'Fredoka One', cursive, sans-serif;
          font-size: 18px;
          color: #292522;
        }
        .dark .instatrack-metric-val {
          color: #F7F4EF;
        }

        /* Action Buttons */
        .instatrack-primary-btn {
          width: 100%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          background: #E05A47;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(224, 90, 71, 0.28);
          transition: all 0.15s ease;
        }
        .instatrack-primary-btn:hover {
          background: #D94E34;
          box-shadow: 0 6px 16px rgba(224, 90, 71, 0.38);
        }
        .instatrack-primary-btn:active {
          transform: scale(0.98);
        }

        .instatrack-secondary-btn {
          width: 100%;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #292522;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .dark .instatrack-secondary-btn {
          color: #F7F4EF;
          background: #1B1918;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .instatrack-secondary-btn:hover {
          background: rgba(0, 0, 0, 0.02);
        }
        .dark .instatrack-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .instatrack-secondary-btn:active {
          transform: scale(0.98);
        }

        /* Live scan trigger button */
        .instatrack-scan-btn {
          width: 100%;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          color: #059669;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .dark .instatrack-scan-btn {
          color: #34D399;
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
        }
        .instatrack-scan-btn:hover {
          background: rgba(16, 185, 129, 0.18);
        }
        .instatrack-scan-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Progress indicator */
        .instatrack-progress-box {
          font-size: 11px;
          color: #E05A47;
          font-weight: 600;
          text-align: center;
          padding: 4px;
        }

        /* Footer Guarantee */
        .instatrack-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          color: #8C827A;
          padding-top: 4px;
        }
        .dark .instatrack-footer {
          color: #A8A199;
        }
      `;

      // Build DOM elements
      const backdrop = document.createElement('div');
      backdrop.className = 'instatrack-backdrop';
      backdrop.onclick = closeOverlay;

      const card = document.createElement('div');
      card.className = `instatrack-card ${isDark ? 'dark' : 'light'}`;

      const activeUser = activeSnapshot?.accountUsername || pageUser || 'Instagram User';
      const followersCount = activeSnapshot ? activeSnapshot.followerCount.toLocaleString() : '0';
      const followingCount = activeSnapshot ? activeSnapshot.followingCount.toLocaleString() : '0';
      const notFollowingCount = activeSnapshot?.notFollowingBackCount ?? 0;
      const timeStr = activeSnapshot ? getRelativeTime(activeSnapshot.timestamp) : 'No snapshot';

      card.innerHTML = `
        <!-- Header -->
        <div class="instatrack-header">
          <div class="instatrack-brand">
            <div class="instatrack-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <div>
              <div class="instatrack-title">InstaTrack</div>
            </div>
          </div>
          <div class="instatrack-header-actions">
            <button class="instatrack-btn-dash" id="btn-open-dash">
              Dashboard ↗
            </button>
            <button class="instatrack-btn-close" id="btn-close-overlay" title="Close (Esc)">✕</button>
          </div>
        </div>

        <!-- 1. Live Session Card -->
        <div class="instatrack-well">
          <div class="instatrack-well-header">
            <span class="instatrack-tag">Live Session</span>
            <span class="instatrack-status-pill">
              <span class="instatrack-dot"></span>
              Active
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 600;">
            ${
              pageUser
                ? `Browsing profile: <strong style="color: #E05A47;">@${pageUser}</strong>`
                : 'Instagram tab is connected'
            }
          </div>
          <button class="instatrack-scan-btn" id="btn-scan-current">
            ⚡ Quick Scan Followers
          </button>
          <div class="instatrack-progress-box" id="scan-progress" style="display: none;"></div>
        </div>

        <!-- 2. Active Snapshot Card -->
        <div class="instatrack-well">
          <div class="instatrack-well-header">
            <span class="instatrack-tag">Active Snapshot</span>
            <span style="font-size: 10px; color: #8C827A;">${timeStr}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-family: 'Fredoka One', cursive, sans-serif; font-size: 14px;">
              @${activeUser}
            </span>
            ${
              notFollowingCount > 0
                ? `<span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: rgba(244,63,94,0.1); color: #F43F5E;">${notFollowingCount} don't follow back</span>`
                : ''
            }
          </div>
          <div class="instatrack-metrics">
            <div class="instatrack-metric-box">
              <div class="instatrack-metric-label">Followers</div>
              <div class="instatrack-metric-val">${followersCount}</div>
            </div>
            <div class="instatrack-metric-box">
              <div class="instatrack-metric-label">Following</div>
              <div class="instatrack-metric-val">${followingCount}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="instatrack-primary-btn" id="btn-main-dashboard">
            Open Dashboard
          </button>
        </div>
      `;

      // Assemble Shadow DOM
      shadow.appendChild(style);
      shadow.appendChild(backdrop);
      shadow.appendChild(card);

      document.documentElement.appendChild(overlayHost);

      // Event handlers
      const btnClose = shadow.getElementById('btn-close-overlay');
      if (btnClose) btnClose.onclick = closeOverlay;

      const btnOpenDash = shadow.getElementById('btn-open-dash');
      if (btnOpenDash) {
        btnOpenDash.onclick = () => {
          chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD', category: 'overview' });
          closeOverlay();
        };
      }

      const btnMainDash = shadow.getElementById('btn-main-dashboard');
      if (btnMainDash) {
        btnMainDash.onclick = () => {
          chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD', category: 'overview' });
          closeOverlay();
        };
      }

      // Quick Scan button handler
      const btnScan = shadow.getElementById('btn-scan-current');
      const progressBox = shadow.getElementById('scan-progress');

      if (btnScan) {
        btnScan.onclick = async () => {
          btnScan.setAttribute('disabled', 'true');
          if (progressBox) {
            progressBox.style.display = 'block';
            progressBox.textContent = 'Initiating live scan...';
          }

          // Listen for progress events from background
          const progressListener = (msg: any) => {
            if (msg?.type === 'LIVE_SCAN_PROGRESS' && progressBox) {
              progressBox.textContent = `${msg.percent}% - ${msg.message}`;
            }
          };
          chrome.runtime.onMessage.addListener(progressListener);

          try {
            // Trigger background scan
            chrome.runtime.sendMessage(
              { type: 'EXECUTE_LIVE_BROWSER_SCAN' },
              (response) => {
                chrome.runtime.onMessage.removeListener(progressListener);
                if (response?.success) {
                  if (progressBox) {
                    progressBox.textContent = 'Scan complete! Reloading data...';
                  }
                  setTimeout(() => {
                    closeOverlay();
                    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD', category: 'live_mode' });
                  }, 800);
                } else {
                  if (progressBox) {
                    progressBox.textContent = response?.error || 'Scan error occurred.';
                  }
                  btnScan.removeAttribute('disabled');
                }
              }
            );
          } catch (err) {
            chrome.runtime.onMessage.removeListener(progressListener);
            if (progressBox) {
              progressBox.textContent = (err as Error).message;
            }
            btnScan.removeAttribute('disabled');
          }
        };
      }

      // Dismiss on Escape key
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          window.removeEventListener('keydown', keyHandler);
          closeOverlay();
        }
      };
      window.addEventListener('keydown', keyHandler);
    };

    // Toggle helper
    const toggleOverlay = () => {
      if (overlayHost) {
        closeOverlay();
      } else {
        openOverlay();
      }
    };

    // Helper: read cookies
    const getCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    };

    // Instagram Session & Unfollow Bridge Listener
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'CHECK_INSTAGRAM_AUTH') {
        const csrf = getCookie('csrftoken');
        const dsUserId = getCookie('ds_user_id');
        sendResponse({ authenticated: !!csrf, dsUserId, ready: true });
        return true;
      }

      if (message?.type === 'GET_VIEWER_DATA') {
        (async () => {
          try {
            const res = await fetch('/data/shared_data/', { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              sendResponse({ success: true, data: data?.config?.viewer });
            } else {
              sendResponse({ success: false, error: 'Could not load viewer data' });
            }
          } catch (e: any) {
            sendResponse({ success: false, error: e.message });
          }
        })();
        return true;
      }

      if (message?.type === 'UNFOLLOW_USER') {
        (async () => {
          const targetId = message.userId;
          const csrf = getCookie('csrftoken') || '';
          try {
            const res = await fetch(`https://www.instagram.com/api/v1/friendships/destroy/${targetId}/`, {
              method: 'POST',
              headers: {
                'x-ig-app-id': '936619743392459',
                'x-csrftoken': csrf,
                'x-requested-with': 'XMLHttpRequest',
                'x-instagram-ajax': '1',
                'content-type': 'application/x-www-form-urlencoded',
              },
              credentials: 'include',
            });
            const data = await res.json();
            sendResponse({ success: data?.status === 'ok', data });
          } catch (e: any) {
            sendResponse({ success: false, error: e.message });
          }
        })();
        return true;
      }

      if (message?.type === 'TOGGLE_INJECTED_POPUP') {
        toggleOverlay();
        sendResponse({ status: 'toggled' });
        return true;
      }

      return false;
    });
  },
});
