# Changelog

All notable changes to the **InstaFlow (InstaTrack)** extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-11-08

### Added
- **Defensive CSV Formula Injection Prevention (CWE-1236)**: Implemented prefix neutralization in `csvExporter.ts` and `downloadService.ts` for characters (`=`, `+`, `-`, `@`, `\t`, `\r`) to protect users opening exported data in Microsoft Excel or Google Sheets.
- **Modern Instagram CSRF Resolution Bridge**: Added `/data/shared_data/` fallback and `'x-asbd-id': '129477'` header support to `content.ts` and `instagramBridgeService.ts` for environments where cookies are partitioned or HttpOnly.
- **Historical Snapshot Diffing in File Ingestion**: In `ImportModal.tsx`, new followers and unfollowers are now automatically calculated against the previous chronological snapshot during manual file imports.
- **Defensive Formatting Utilities**: Protected `formatDate`, `formatDateTime`, `formatRelativeTime`, and `formatNumber` against `NaN`, `0`, and invalid date crashes.
- **Comprehensive Quality Assurance Suite**: Added `src/tests/securityAndIntegrity.test.ts` covering CWE-1236 escaping, date/number formatting fallbacks, and zero-following math edge cases (totaling 9 test suites and 58 passing unit tests).
- **Architecture & Quality Documentation**: Created `CODEBASE_AUDIT.md`, `ARCHITECTURE.md`, and `TEST_REPORT.md`.

### Fixed
- **Font Stack Hierarchy**: Removed `"Fredoka One"` as the primary font in `tailwind.config.js` `fontFamily.sans` to restore native system typography (`-apple-system`, `BlinkMacSystemFont`, `"SF Pro Text"`) across all dashboard views, reserving the Cassandra font strictly for the `InstaTrack` logo.
- **Dexie Relationship Mutation Bug**: Fixed logic in `removeFollowingRelationship` where unfollowing a mutual account incorrectly decremented `notFollowingBackCount`. Mutual unfollow now decrements `mutualCount`, decrements `followingCount`, and increments `fansCount`.
- **Zustand Mutual Transition State**: Updated `unfollowAccount` in `useAppStore.ts` to transition unfollowed mutual accounts to the `fans` collection in active memory with `isFollowing: false`, `isFollower: true`, and `isMutual: false`.
- **Store Key Normalization**: Lowercased and trimmed account usernames in `toggleWhitelist` and `saveAccountNotes` to ensure strict key consistency between Zustand and IndexedDB.
- **Account List Pagination Desync**: Added a reactive `useEffect` hook in `AccountListView.tsx` to automatically reset the current page to 1 whenever the active category, search query, or whitelist filter changes.

### Removed
- **Marketing Clutter**: Removed the redundant "100% Local Browser Sandbox" card from `SettingsView.tsx`.
- **Redundant Root Entrypoint**: Removed unused `index.html` from the repository root to maintain clean WXT entrypoint organization in `src/entrypoints/`.

### Optimized
- **Single-Pass Relationship Categorization**: Optimized `selectSnapshot` in `useAppStore.ts` to construct `followerSet` and `followingSet` in a single pass during relationship iteration, eliminating redundant O(N) array mapping.

---

## [1.0.0] - 2026-11-05

### Added
- Initial release of InstaFlow (InstaTrack) Chrome extension.
- Manifest V3 architecture with WXT framework.
- Dual-mode data ingestion: Official Instagram Export (ZIP / JSON) and Assisted In-Tab Live Scan.
- Dexie.js (IndexedDB) local persistence for snapshots, relationships, and user account metadata.
- Interactive analytics dashboard with Recharts visualizations, search, sorting, and whitelisting.
- Toolbar popup with live tab connection indicator and quick metrics.
