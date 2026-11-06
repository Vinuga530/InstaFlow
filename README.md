# InstaFlow (InstaTrack) — Privacy-First Instagram Relationship Analytics

InstaTrack / InstaFlow is a consumer-grade Chrome Extension (Manifest V3) for Instagram follower relationship analytics, non-follower detection, and historical unfollower tracking.

Built with an offline-first architecture, InstaTrack operates **100% inside your browser**. It requires no account passwords, accesses no session cookies, communicates with zero external backends, and complies strictly with Instagram's Terms of Service and data protection regulations (GDPR / CCPA).

---

## ✨ Features

- **Dual Data Source Ingestion Modes**:
  - **Import Mode**: High-speed, fault-tolerant ingestion of official Instagram ZIP archives and multi-part JSON export files (`followers_1.json`, `following.json`).
  - **Live Assisted Browser Scan**: Safe client-side virtual DOM harvesting inside your active Instagram tab via `chrome.scripting.executeScript`. Includes an in-tab floating Apple frosted glass capsule HUD, anti-bot pacing ($850\text{ms} - 1250\text{ms}$ jitter), and instant <kbd>Esc</kbd> pause. See [INSTA_NOT_FOLLOWING_BACK_LOGIC.md](INSTA_NOT_FOLLOWING_BACK_LOGIC.md) for full architecture.
- **Analytics Dashboard**: Comprehensive overview displaying total followers, following, mutual followers, non-followers, fans, follow-back percentage, and net growth trends.
- **Not Following Back Detection**: Instantly identify accounts you follow that do not follow your account in return.
- **Fans Detection**: Accounts that follow you, but you don't follow back.
- **Mutual Followers**: View all reciprocal relationships at a glance.
- **Historical Unfollower Detection**: Detect who unfollowed you by comparing dated snapshots over time. *(Unlike risky apps that guess from single snapshots, InstaTrack strictly identifies unfollowers through empirical historical comparison).*
- **New Follower Detection**: Discover accounts that followed you between any two snapshots.
- **Snapshot Comparison Tool**: Side-by-side diff tool to compare any two historical imports with net change metrics.
- **Interactive Visualizations**: Follower growth curves and relationship composition donut charts powered by Recharts.
- **Search, Sort & Filters**: Instant search across usernames and names, sort alphabetically or by follow date, filter by whitelist.
- **Account Notes & Whitelisting**: Star trusted accounts to exclude them from cleanup alerts and add custom tags and notes.
- **Bulk Operations**: Select visible accounts, copy usernames to clipboard with one click, or export to CSV / JSON.
- **Local Data Export & Backup**: Export any category or snapshot to RFC 4180 CSV or structured JSON. Full backup and restore of the local IndexedDB database.
- **Apple HIG & Comfy Minimalist Aesthetic**: Designed with Apple Human Interface Guidelines, warm oat canvas (`#FAF8F5`), warm espresso dark mode (`#121110`), squircle contours (`rounded-2xl`, `rounded-3xl`), and custom local **Fredoka One** display typography.
- **Extension Popup & Dedicated Dashboard**: Fast access via toolbar popup (real-time tab indicator, quick metrics, sync shortcuts) and a full dedicated dashboard page for deep analysis.

---

## 🔒 Privacy & Security Guarantee

1. **Zero External Backend**: All data processing, ZIP decompression, JSON parsing, and analytics calculations execute 100% locally in your browser.
2. **No Passwords or Cookies**: InstaTrack never requests your Instagram password, never accesses your cookies, and never automates account actions (no auto-follow / auto-unfollow).
3. **Zero Risk of Account Ban**: By using Instagram's official "Download Your Information" data export, your account is protected from Instagram's automated bot and third-party login detection.
4. **Persistent Local Storage**: Snapshots and metadata are stored in your browser's IndexedDB via Dexie.js. Data persists across browser restarts and is never uploaded anywhere.
5. **Full User Control**: Delete individual snapshots or clear all stored data with a single click.

---

## 🛠️ Technology Stack

- **Framework**: [WXT](https://wxt.dev/) (Next-gen Web Extension Framework) & Vite
- **Manifest**: Chrome Manifest V3
- **Frontend**: React 18, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom glassmorphism and Apple HIG tokens
- **Icons**: Lucide React
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB) with compound indexing
- **ZIP Extraction**: JSZip
- **Validation**: Zod
- **Visualizations**: Recharts
- **Testing**: Vitest with happy-dom

---

## 📁 Project Structure

```
InstaFlow/
├── package.json                   # Dependencies, build scripts & metadata
├── tsconfig.json                  # Strict TypeScript configuration
├── wxt.config.ts                  # WXT Chrome extension configuration
├── vite.config.ts                 # Vite bundler configuration
├── vitest.config.ts               # Unit test configuration
├── tailwind.config.js             # Tailwind design tokens & themes
├── postcss.config.js              # PostCSS plugins
├── index.html                     # Root dashboard entry
├── public/                        # Extension icons & static assets
│   └── icons/
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── icon.svg
└── src/
    ├── entrypoints/
    │   ├── background.ts          # Manifest V3 service worker
    │   ├── popup/                 # Compact extension toolbar popup
    │   │   ├── index.html
    │   │   ├── main.tsx
    │   │   └── Popup.tsx
    │   └── dashboard/             # Dedicated full-page analytics dashboard
    │       ├── index.html
    │       ├── main.tsx
    │       └── App.tsx
    ├── types/                     # Strict TypeScript definitions
    │   ├── instagram.ts           # Instagram export schemas & models
    │   ├── database.ts            # Dexie table schemas
    │   ├── analytics.ts           # Metrics, comparisons, trends
    │   └── store.ts               # Zustand store types
    ├── db/
    │   └── index.ts               # Dexie.js database & helper queries
    ├── services/
    │   ├── ingestion/             # Data extraction & normalization
    │   │   ├── schemas.ts         # Zod validation schemas
    │   │   ├── normalizer.ts      # Username sanitization & deduplication
    │   │   ├── jsonParser.ts      # Multi-format Instagram JSON parser
    │   │   └── zipParser.ts       # ZIP archive unpacker & file locator
    │   ├── live/                  # Live Mode synchronization & browser integration
    │   │   ├── liveTypes.ts       # Connection status, tab info & diagnostic types
    │   │   └── liveIntegrationService.ts # Session detection, API sync & live snapshots
    │   ├── analytics/             # Relationship calculation engine
    │   │   ├── engine.ts          # Followers, Following, Mutuals, Fans
    │   │   ├── comparisons.ts     # Historical snapshot diff engine
    │   │   └── trends.ts          # Timeline data builder for charts
    │   ├── browser-adapter/       # Instagram integration & guided DYI
    │   │   └── instagramAdapter.ts
    │   └── export/                # Client-side data exporters
    │       ├── csvExporter.ts     # RFC 4180 CSV generator
    │       └── jsonExporter.ts    # JSON snapshot report exporter
    ├── store/
    │   └── useAppStore.ts         # Central Zustand application store
    ├── components/
    │   ├── layout/                # Sidebar, Header, Toasts
    │   ├── views/                 # Overview, LiveMode, AccountList, History, Settings
    │   │   ├── OverviewView.tsx
    │   │   ├── LiveModeView.tsx
    │   │   ├── AccountListView.tsx
    │   │   ├── HistoryView.tsx
    │   │   └── SettingsView.tsx
    │   ├── modals/                # Import, Download Guide, Compare, Notes
    │   ├── common/                # StatCard, Avatar, Badge, Button, EmptyState
    │   └── charts/                # FollowerGrowthChart, RelationshipDonutChart
    ├── utils/
    │   ├── sampleData.ts          # Realistic demo dataset generator
    │   ├── formatters.ts          # Number, date, avatar color formatters
    │   └── cn.ts                  # Classname merging utility
    └── tests/                     # Unit & integration test suites
        ├── analytics.test.ts
        ├── normalizer.test.ts
        ├── jsonParser.test.ts
        ├── historical.test.ts
        └── liveIntegration.test.ts
```

---

## 🚀 Installation & Build Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
Execute the unit and integration tests:
```bash
npm test
```

### 3. Build Extension for Chrome
```bash
npm run build
```
This compiles the production extension into the `.output/chrome-mv3` directory.

### 4. Load the Extension into Google Chrome
1. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
2. Enable **Developer mode** in the top right corner.
3. Click the **Load unpacked** button in the top left.
4. Select the `.output/chrome-mv3` folder inside this project directory.
5. InstaTrack is now installed! Pin it to your toolbar for quick access.

---

## 📖 How to Use InstaTrack

### Step 1: Request Your Instagram Data
1. Open [Meta Accounts Center - Download Your Information](https://accountscenter.instagram.com/info_and_permissions/dyi/) (or click **How to Download** inside InstaTrack).
2. Choose **Download or transfer information** -> Select your Instagram account.
3. Choose **Some of your information**.
4. Scroll down and check **Followers and following**.
5. Select **Download to device**, set Format: **JSON**, Date range: **All time**.
6. Submit the request. Meta will email you when the download is ready (usually 5–15 minutes).

### Step 2: Import Your Export File
1. In InstaTrack, click **Import Data**.
2. Drag and drop the downloaded `.zip` file (or individual `followers_1.json` / `following.json` files).
3. InstaTrack automatically parses, deduplicates, and previews your follower counts.
4. Click **Confirm & Save Snapshot**.

### Step 3: Analyze Relationships & Track Unfollowers
- **Overview**: Check your follower count, following count, mutuals, and follow-back percentage.
- **Not Following Back**: See who you follow who doesn't follow you back.
- **Tracking Unfollowers**: After a few weeks, download another export from Instagram and import it as a second snapshot. InstaTrack compares the snapshots and shows you exactly who unfollowed you!
- **Snapshot Comparison**: Use the **Compare** tool to diff any two imports side-by-side.

---

## 🧪 Edge Cases Handled

- Numbered follower files (`followers_1.json`, `followers_2.json`, etc.) from large accounts.
- Diverse export directory structures across modern Meta Accounts Center and legacy Instagram exports.
- Username normalization: handles leading `@`, trailing slashes, full URLs (`https://instagram.com/username`), case differences, and whitespace.
- Duplicate entries within or across export files.
- Empty followers or following lists.
- Completely lost or brand new follower turnover.
- Database recovery and safe schema migrations.

---

## 📄 License & Compliance

InstaTrack is an independent privacy analytics tool designed for personal account management. It is not affiliated with, endorsed by, or sponsored by Instagram or Meta Platforms, Inc.
