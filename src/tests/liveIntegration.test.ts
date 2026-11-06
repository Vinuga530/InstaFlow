import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NormalizedAccount } from '../types/instagram';
import { Snapshot } from '../types/database';

const mockSnapshots = new Map<string, Snapshot>();
const mockSettings = new Map<string, { key: string; value: unknown }>();

vi.mock('../db', () => ({
  db: {
    settings: {
      get: vi.fn(async (key: string) => mockSettings.get(key)),
      put: vi.fn(async (item: { key: string; value: unknown }) => {
        mockSettings.set(item.key, item);
      }),
      delete: vi.fn(async (key: string) => {
        mockSettings.delete(key);
      }),
      clear: vi.fn(async () => {
        mockSettings.clear();
      }),
    },
    snapshots: {
      get: vi.fn(async (id: string) => mockSnapshots.get(id)),
      put: vi.fn(async (snap: Snapshot) => {
        mockSnapshots.set(snap.id, snap);
      }),
      toArray: vi.fn(async () => Array.from(mockSnapshots.values())),
      clear: vi.fn(async () => {
        mockSnapshots.clear();
      }),
    },
    snapshot_relationships: {
      clear: vi.fn(async () => {}),
    },
  },
  saveSnapshot: vi.fn(async (snapshot: Snapshot) => {
    mockSnapshots.set(snapshot.id, snapshot);
  }),
  getSnapshots: vi.fn(async () => Array.from(mockSnapshots.values())),
}));

// Import service after mock setup
import { LiveIntegrationService } from '../services/live/liveIntegrationService';

describe('Live Integration Service & Live Mode Data Pipeline', () => {
  let liveService: LiveIntegrationService;

  beforeEach(() => {
    liveService = new LiveIntegrationService();
    mockSnapshots.clear();
    mockSettings.clear();
    vi.clearAllMocks();
  });

  it('runs diagnostic checks and verifies compliance policies', async () => {
    const diagnostics = await liveService.getDiagnostics();
    expect(diagnostics).toBeInstanceOf(Array);
    expect(diagnostics.length).toBeGreaterThanOrEqual(3);

    const complianceCheck = diagnostics.find((d) => d.id === 'auth_compliance');
    expect(complianceCheck).toBeDefined();
    expect(complianceCheck?.status).toBe('pass');
    expect(complianceCheck?.detail).toContain('zero scraping');
  });

  it('stores and retrieves Meta Graph API tokens locally', async () => {
    expect(await liveService.getApiToken()).toBeNull();

    await liveService.saveApiToken('EAA_TEST_TOKEN_12345');
    expect(await liveService.getApiToken()).toBe('EAA_TEST_TOKEN_12345');

    await liveService.saveApiToken(null);
    expect(await liveService.getApiToken()).toBeNull();
  });

  it('honestly rejects unauthorized unauthenticated live scraping without fabricating fake data', async () => {
    const result = await liveService.synchronize({
      sourceType: 'browser_assisted',
    });

    expect(result.success).toBe(false);
    expect(result.followerCount).toBe(0);
    expect(result.followingCount).toBe(0);
    expect(result.unsupportedReason).toBeDefined();
    expect(result.error).toBeDefined();
  });

  it('ingests and normalizes live records into historical snapshots without overwriting existing ones', async () => {
    const liveFollowers: NormalizedAccount[] = [
      { username: '  @alice_live  ', profileUrl: '', timestamp: 1000 },
      { username: 'BOB.LIVE', profileUrl: '', timestamp: 1000 },
      { username: 'alice_live', profileUrl: '', timestamp: 1200 }, // Duplicate to test deduplication
    ];

    const liveFollowing: NormalizedAccount[] = [
      { username: 'BOB.LIVE', profileUrl: '', timestamp: 1000 }, // Mutual
      { username: 'charlie_live', profileUrl: '', timestamp: 1000 }, // Not following back
    ];

    const snapshot = await liveService.commitLiveSnapshot(
      liveFollowers,
      liveFollowing,
      'my_live_account',
      'live_browser',
      'Live Browser Scan'
    );

    expect(snapshot.id).toContain('snap_live_');
    expect(snapshot.sourceType).toBe('live_browser');
    expect(snapshot.accountUsername).toBe('my_live_account');

    // Alice deduplicated -> 2 followers total (alice_live, bob.live)
    expect(snapshot.followerCount).toBe(2);
    // 2 following total (bob.live, charlie_live)
    expect(snapshot.followingCount).toBe(2);
    // bob.live is mutual
    expect(snapshot.mutualCount).toBe(1);
    // charlie_live is not following back
    expect(snapshot.notFollowingBackCount).toBe(1);
    // alice_live is fan
    expect(snapshot.fansCount).toBe(1);

    // Verify snapshot was stored
    expect(mockSnapshots.has(snapshot.id)).toBe(true);

    // Verify a second snapshot creates a separate entry rather than overwriting
    const secondSnapshot = await liveService.commitLiveSnapshot(
      liveFollowers,
      liveFollowing,
      'my_live_account',
      'live_api',
      'Live API Scan 2'
    );

    expect(mockSnapshots.size).toBe(2);
    expect(mockSnapshots.has(snapshot.id)).toBe(true);
    expect(mockSnapshots.has(secondSnapshot.id)).toBe(true);
  });

  it('runs browser-assisted scanning and creates a snapshot when chrome.scripting is available', async () => {
    // Mock chrome.scripting.executeScript
    const mockExecuteScript = vi.fn(async () => [
      {
        result: {
          username: 'demo_user',
          following: ['friend1', 'celebrity_non_follower'],
          followers: ['friend1', 'fan_account'],
          timestamp: 1700000000000,
        },
      },
    ]);

    // Mock tab detection to return an active tab
    const mockActiveTab = {
      id: 42,
      url: 'https://www.instagram.com/demo_user/',
      detectedUsername: 'demo_user',
      title: 'demo_user on Instagram',
      active: true,
    };
    vi.spyOn(liveService, 'detectInstagramTab').mockResolvedValueOnce({
      isTabOpen: true,
      tabCount: 1,
      activeTab: mockActiveTab,
      tabs: [mockActiveTab],
      lastChecked: Date.now(),
    });

    (globalThis as any).chrome = {
      ...(globalThis as any).chrome,
      scripting: {
        executeScript: mockExecuteScript,
      },
    };

    const progressUpdates: string[] = [];
    const result = await liveService.synchronize({
      sourceType: 'browser_assisted',
      customLabel: 'My Live Test Scan',
      onProgress: (_pct, msg) => progressUpdates.push(msg),
    });

    expect(result.success).toBe(true);
    expect(result.followerCount).toBe(2);
    expect(result.followingCount).toBe(2);
    expect(result.snapshotId).toBeDefined();
    expect(mockSnapshots.has(result.snapshotId!)).toBe(true);

    const createdSnap = mockSnapshots.get(result.snapshotId!)!;
    expect(createdSnap.accountUsername).toBe('demo_user');
    expect(createdSnap.sourceType).toBe('live_browser');
    expect(createdSnap.label).toBe('My Live Test Scan');
    expect(createdSnap.mutualCount).toBe(1); // friend1
    expect(createdSnap.notFollowingBackCount).toBe(1); // celebrity_non_follower
    expect(createdSnap.fansCount).toBe(1); // fan_account

    // Clean up mock
    delete (globalThis as any).chrome.scripting;
  });
});
