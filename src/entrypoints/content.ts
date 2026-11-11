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

        /* Light Theme (Quiet Precision) */
        .instatrack-card.light {
          background: #F5F3EC;
          color: #242823;
          border: 1px solid #D5D2C5;
          box-shadow: 0 16px 40px -8px rgba(36, 40, 35, 0.12);
        }

        /* Dark Theme (Quiet Precision) */
        .instatrack-card.dark {
          background: #151716;
          color: #F0EEE6;
          border: 1px solid #343B35;
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.6);
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
          border-bottom: 1px solid #D5D2C5;
        }
        .dark .instatrack-header {
          border-bottom-color: #343B35;
        }

        .instatrack-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .instatrack-logo {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
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
          color: #686E64;
        }
        .dark .instatrack-subtitle {
          color: #A6AA9D;
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
          color: #686E64;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .instatrack-btn-dash:hover {
          color: #242823;
          background: #E2DFD6;
        }
        .dark .instatrack-btn-dash {
          color: #A6AA9D;
        }
        .dark .instatrack-btn-dash:hover {
          color: #F0EEE6;
          background: #202421;
        }

        .instatrack-btn-close {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: none;
          background: #E2DFD6;
          color: #686E64;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.15s ease;
        }
        .instatrack-btn-close:hover {
          background: rgba(163, 63, 49, 0.12);
          color: #A33F31;
        }
        .dark .instatrack-btn-close {
          background: #202421;
          color: #A6AA9D;
        }
        .dark .instatrack-btn-close:hover {
          background: rgba(196, 91, 75, 0.2);
          color: #C45B4B;
        }

        /* Well Card Containers */
        .instatrack-well {
          border-radius: 18px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #D5D2C5;
          background: #EAE8DF;
        }
        .dark .instatrack-well {
          border-color: #343B35;
          background: #202421;
        }

        .instatrack-well-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .instatrack-tag {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #686E64;
        }
        .dark .instatrack-tag {
          color: #A6AA9D;
        }

        .instatrack-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(113, 128, 108, 0.15);
          color: #71806C;
          border: 1px solid rgba(113, 128, 108, 0.3);
        }
        .dark .instatrack-status-pill {
          background: rgba(137, 151, 131, 0.2);
          color: #899783;
          border-color: rgba(137, 151, 131, 0.3);
        }

        .instatrack-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #71806C;
          animation: instatrackPulse 1.6s infinite;
        }
        .dark .instatrack-dot {
          background: #899783;
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
          background: #F5F3EC;
          border: 1px solid #D5D2C5;
        }
        .dark .instatrack-metric-box {
          background: #151716;
          border-color: #343B35;
        }

        .instatrack-metric-label {
          font-size: 10px;
          font-weight: 500;
          color: #686E64;
          margin-bottom: 2px;
        }
        .dark .instatrack-metric-label {
          color: #A6AA9D;
        }

        .instatrack-metric-val {
          font-size: 18px;
          font-weight: 600;
          color: #242823;
        }
        .dark .instatrack-metric-val {
          color: #F0EEE6;
        }

        /* Action Buttons */
        .instatrack-primary-btn {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #F5F3EC;
          background: #71806C;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .instatrack-primary-btn:hover {
          background: #5d6a59;
        }
        .dark .instatrack-primary-btn {
          background: #899783;
          color: #151716;
        }
        .dark .instatrack-primary-btn:hover {
          background: #71806c;
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
          color: #242823;
          background: #F5F3EC;
          border: 1px solid #D5D2C5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .dark .instatrack-secondary-btn {
          color: #F0EEE6;
          background: #151716;
          border-color: #343B35;
        }
        .instatrack-secondary-btn:hover {
          background: #EAE8DF;
        }
        .dark .instatrack-secondary-btn:hover {
          background: #202421;
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
          font-weight: 600;
          color: #71806C;
          background: rgba(113, 128, 108, 0.15);
          border: 1px solid rgba(113, 128, 108, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .dark .instatrack-scan-btn {
          color: #899783;
          background: rgba(137, 151, 131, 0.2);
          border-color: rgba(137, 151, 131, 0.3);
        }
        .instatrack-scan-btn:hover {
          background: rgba(113, 128, 108, 0.25);
        }
        .dark .instatrack-scan-btn:hover {
          background: rgba(137, 151, 131, 0.3);
        }
        .instatrack-scan-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Progress indicator */
        .instatrack-progress-box {
          font-size: 11px;
          color: #71806C;
          font-weight: 600;
          text-align: center;
          padding: 4px;
        }
        .dark .instatrack-progress-box {
          color: #899783;
        }

        /* Footer */
        .instatrack-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          color: #686E64;
          padding-top: 4px;
        }
        .dark .instatrack-footer {
          color: #A6AA9D;
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
              <svg width="32" height="32" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#100004" d="M0 0C68.5649 0 137.13 0 205.695 0C409.752 0 613.809 0 817.865 0C886.577 0 955.288 0 1024 0C1024 68.3049 1024 136.61 1024 204.915C1024 408.221 1024 611.527 1024 814.834C1024 884.556 1024 954.278 1024 1024C955.59 1024 887.18 1024 818.769 1024C614.424 1024 410.079 1024 205.733 1024C137.156 1024 68.5778 1024 0 1024C0 953.95 0 883.899 0 813.849C0 611.655 0 409.461 0 207.268C0 138.178 0 69.0892 0 0Z"/>
                <path fill="white" d="M0 813.849C0.292242 815.338 0.454036 818.429 0.599514 819.811C0.722828 820.983 0.772379 822.161 0.89445 823.335C1.15103 825.803 1.38107 828.274 1.6778 830.737C4.23933 852.002 10.2947 872.963 19.1985 892.422C30.2081 916.484 42.852 935.66 61.1829 954.83C72.2411 966.394 85.0105 977.636 98.3504 986.516C110.79 994.797 123.301 1002.08 137.34 1007.56C148.013 1011.72 158.833 1015.58 169.98 1018.22C177.16 1019.93 184.416 1021.34 191.735 1022.28C195.72 1022.8 199.726 1023.12 203.719 1023.57C204.402 1023.64 205.068 1023.83 205.733 1024C137.156 1024 68.5778 1024 0 1024C0 953.95 0 883.899 0 813.849Z"/>
                <path fill="white" d="M0 0C68.5649 0 137.13 0 205.695 0C205.274 0.0915206 204.851 0.178064 204.424 0.234471C199.609 0.870526 194.78 1.39171 189.974 2.09607C178.793 3.73477 167.091 6.4303 156.256 9.56629C129.82 17.2175 101.098 32.9815 80.147 50.8793C80.1456 50.8804 79.624 51.3309 79.6227 51.3321C72.7328 57.3206 66.1348 63.636 59.7506 70.1609C43.5883 86.6793 28.1054 111.129 19.2632 131.466C10.3708 151.919 4.93675 170.249 1.93194 192.088C1.28123 196.817 0.834649 201.572 0.192744 206.302C0.1486 206.628 0.0728007 206.948 0 207.268C0 138.178 0 69.0892 0 0Z"/>
                <path fill="white" d="M1024 814.834C1024 884.556 1024 954.278 1024 1024C955.59 1024 887.18 1024 818.769 1024C819.502 1023.83 820.236 1023.64 820.986 1023.57C825.744 1023.09 830.502 1022.61 835.245 1022C857.944 1019.07 882.086 1010.64 902.234 1000.61C904.426 999.521 906.605 998.402 908.737 997.197C930.074 985.142 949.317 970.192 965.773 951.997C986.843 928.7 1001.54 904.819 1012.08 874.689C1017.48 859.259 1020.83 843.16 1022.7 826.922C1023.04 823.95 1023.5 820.907 1023.72 817.931C1023.8 816.896 1023.81 815.855 1024 814.834Z"/>
                <path fill="white" d="M817.865 0C886.577 0 955.288 0 1024 0C1024 68.3049 1024 136.61 1024 204.915C1023.92 204.557 1023.83 204.2 1023.78 203.836C1023.78 203.834 1023.72 203.252 1023.72 203.25C1023.35 199.961 1023.02 196.667 1022.62 193.38C1021.16 181.366 1018.34 169.642 1014.95 158.042C1011.87 147.54 1007.83 137.421 1003.24 127.494C998.044 116.255 991.672 105.775 984.787 95.5041C978.167 85.6298 970.431 76.8025 962.321 68.1374C941.55 45.9436 913.103 26.5536 884.874 15.3921C881.529 14.0695 878.175 12.7688 874.793 11.5438C859.153 5.87873 841.64 2.80102 825.45 0.997345C823.651 0.796935 821.842 0.641445 820.046 0.42164C819.311 0.331668 818.585 0.177072 817.865 0Z"/>
                <path fill="white" d="M423.508 189.629C424.261 189.629 425.013 189.626 425.766 189.629C440.18 189.692 454.585 189.829 469 189.75C469.002 189.75 471.113 189.736 471.115 189.736C480.006 189.662 488.893 189.406 497.784 189.339C514.513 189.213 531.224 189.17 547.95 188.779C547.952 188.779 549.124 188.755 549.125 188.755C554.137 188.662 559.152 188.568 564.163 188.505C601.795 188.032 639.433 187.874 677.067 187.545C688.73 187.443 700.415 187.143 712.077 187.236C713.566 187.248 715.054 187.282 716.542 187.333C742.634 188.217 771.098 200.711 789.511 219.217C802.866 232.639 812.347 247.206 818.319 265.181C825.546 286.932 825.966 310.819 819.475 332.811C814.147 350.863 802.601 369.518 788.932 382.431C773.613 396.905 753.881 407.283 733.113 411.062C724.61 412.61 716.339 412.976 707.613 412.974C639.314 412.961 571.017 413.195 502.719 413.324C488.433 413.351 474.119 413.102 459.836 413.352C453.217 413.467 447 415.92 442.651 421.044C434.734 430.372 435.426 443.894 444.187 452.391C449.393 457.439 454.325 458.798 461.364 458.907C461.366 458.907 462.302 458.917 462.304 458.917C492.57 459.127 522.852 459.005 553.12 458.972C566.038 458.957 578.974 458.702 591.89 458.851C607.947 459.038 625.367 463.674 639.491 471.285C655.846 480.1 668.477 491.922 679.068 507.181C695.058 530.217 700.794 558.155 696.951 585.78C694.388 604.21 685.117 625.169 672.781 639.174C664.69 648.359 657.611 655.399 646.638 662.126C629.715 672.501 611.796 678.06 592.007 678.376C582.105 678.534 572.188 678.415 562.284 678.439C529.308 678.517 496.337 678.406 463.361 678.385C456.994 678.381 450.598 678.559 444.236 678.313C443.034 676.263 441.608 674.358 440.236 672.418C427.963 655.064 411.646 640.137 393.202 629.558C367.665 614.911 341.279 608.183 311.468 610.326C296.765 611.382 281.469 614.954 267.893 620.634C248.424 628.78 232.785 639.103 217.541 653.642C215.317 655.764 213.234 658.031 210.982 660.124C211.051 659.583 211.109 659.048 211.153 658.504C211.662 652.123 212.215 645.743 212.61 639.354C213.165 630.393 213.369 621.414 213.878 612.45C214.473 601.965 214.844 591.461 215.165 580.964C215.165 580.962 215.206 579.438 215.206 579.436C215.402 571.371 215.466 563.302 215.505 555.235C215.505 555.233 215.52 550.184 215.52 550.183C215.555 531.777 215.549 513.37 215.335 494.965C215.335 494.963 215.311 493.087 215.311 493.085C215.266 489.959 215.216 486.833 215.114 483.709C214.819 474.579 214.599 465.438 214.207 456.312C214.207 456.31 214.164 455.374 214.164 455.372C213.842 448.686 213.624 441.955 213.111 435.282C212.413 426.203 211.909 417.104 211.196 408.026C211.195 408.024 211.112 407.07 211.111 407.068C210.945 405.285 210.776 403.501 210.647 401.714C216.056 406.881 221.492 412.033 227.3 416.747C243.363 429.782 263.405 439.386 283.015 444.628C301.747 449.635 320.268 450.387 339.179 448.11C353.649 446.368 373.675 439.931 386.44 432.947C391.608 430.119 396.736 427.047 401.66 423.814C416.483 414.081 432.177 398.726 442.109 384.211C461.993 355.15 471.335 325.111 469.737 289.483C469.737 289.482 469.702 288.78 469.702 288.778C468.723 271.929 464.316 253.631 457.008 238.376C449.762 223.252 440.948 208.763 429.674 196.346C427.631 194.096 425.469 191.952 423.508 189.629Z"/>
                <path fill="white" d="M317.331 647.824C381.642 647.434 434.038 699.357 434.232 763.669C434.426 827.981 382.345 880.219 318.032 880.217C253.996 880.216 202.031 828.406 201.838 764.37C201.645 700.335 253.296 648.212 317.331 647.824Z"/>
                <path fill="#C6F36A" d="M317.796 182.016C381.533 182.126 433.179 233.758 433.308 297.494C433.437 361.231 382.001 413.071 318.265 413.44C254.189 413.811 202.012 362.04 201.882 297.963C201.752 233.887 253.719 181.905 317.796 182.016Z"/>
                <path fill="#101114" d="M1007.9 140.512C1007.99 140.546 1008.02 140.709 1008.02 140.779C1007.99 142.257 1007.98 143.736 1008.02 145.214C1008.02 145.298 1008.08 145.848 1007.9 145.916C1007.72 145.985 1007.67 145.639 1007.67 145.446C1007.66 144.272 1007.68 143.097 1007.67 141.922C1007.67 141.36 1007.59 140.391 1007.9 140.512Z"/>
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
                ? `Browsing profile: <strong style="color: #71806C;">@${pageUser}</strong>`
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
            <span style="font-size: 10px; color: #686E64;">${timeStr}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 600; font-size: 13px;">
              @${activeUser}
            </span>
            ${
              notFollowingCount > 0
                ? `<span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 999px; background: rgba(158, 126, 67, 0.15); color: #9E7E43; border: 1px solid rgba(158, 126, 67, 0.3);">${notFollowingCount} don't follow back</span>`
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
          let targetId = message.userId || '';
          const uname = (message.username || '').trim().replace(/^@/, '');

          let csrf = getCookie('csrftoken') || '';
          if (!csrf) {
            const metaCsrf = document.querySelector('meta[name="csrf-token"]');
            if (metaCsrf) csrf = metaCsrf.getAttribute('content') || '';
          }
          if (!csrf) {
            const scripts = document.querySelectorAll('script');
            for (const s of scripts) {
              const text = s.textContent || '';
              const m = text.match(/"csrf_token"\s*:\s*"([^"]+)"/);
              if (m && m[1]) {
                csrf = m[1];
                break;
              }
            }
          }
          if (!csrf && (window as any)._sharedData?.config?.csrf_token) {
            csrf = (window as any)._sharedData.config.csrf_token;
          }
          if (!csrf) {
            try {
              const sRes = await fetch('/data/shared_data/', { credentials: 'include' });
              if (sRes.ok) {
                const sData = await sRes.json();
                csrf = sData?.config?.csrf_token || '';
              }
            } catch {}
          }

          // If targetId is not provided, resolve via username
          if (!targetId && uname) {
            try {
              const metaOwner = document.querySelector('meta[property="instapp:owner_user_id"]');
              const ownerId = metaOwner?.getAttribute('content');
              if (ownerId && /^\d+$/.test(ownerId)) {
                targetId = ownerId;
              }
            } catch {}

            if (!targetId) {
              try {
                const htmlRes = await fetch(`https://www.instagram.com/${encodeURIComponent(uname)}/`, { credentials: 'include' });
                if (htmlRes.ok) {
                  const html = await htmlRes.text();
                  const mMatch = html.match(/<meta[^>]+property=["']instapp:owner_user_id["'][^>]+content=["'](\d+)["']/i) ||
                    html.match(/<meta[^>]+content=["'](\d+)["'][^>]+property=["']instapp:owner_user_id["']/i);
                  if (mMatch && mMatch[1]) targetId = mMatch[1];
                }
              } catch {}
            }
          }

          if (!targetId) {
            sendResponse({ success: false, error: 'Could not resolve user ID to unfollow.' });
            return;
          }

          const defaultHeaders: Record<string, string> = {
            'x-ig-app-id': '936619743392459',
            'x-asbd-id': '129477',
            'x-requested-with': 'XMLHttpRequest',
            'x-instagram-ajax': '1',
            'content-type': 'application/x-www-form-urlencoded',
          };
          if (csrf) {
            defaultHeaders['x-csrftoken'] = csrf;
          }

          const postBody = `user_id=${encodeURIComponent(targetId)}`;
          const endpoints = [
            `https://www.instagram.com/api/v1/friendships/destroy/${targetId}/`,
            `https://www.instagram.com/api/v1/web/friendships/${targetId}/unfollow/`,
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
                sendResponse({ success: true, targetUserId: targetId, data });
                return;
              }
              if (isJson && (data?.feedback_message || data?.message)) {
                lastError = data.feedback_message || data.message;
              } else if (!isJson) {
                if (res.status === 401 || res.status === 403 || text.includes('login')) {
                  lastError = 'Instagram session expired. Please log into Instagram in your open tab.';
                } else if (res.status === 429 || text.includes('checkpoint') || text.includes('feedback_required')) {
                  lastError = 'Instagram action limit reached. Please wait before unfollowing.';
                } else {
                  lastError = `Instagram rejected request (HTTP ${res.status}).`;
                }
              }
            } catch (e: any) {
              lastError = e.message;
            }
          }

          sendResponse({ success: false, error: lastError || 'Unfollow failed.' });
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
