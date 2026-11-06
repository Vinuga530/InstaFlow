import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runLiveBrowserScan } from '../services/live/liveBrowserAdapter';

describe('Live Browser Adapter (DOM Harvesting Adapter)', () => {
  const originalChrome = (globalThis as any).chrome;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (globalThis as any).chrome = originalChrome;
  });

  it('throws an error if chrome.scripting is unavailable', async () => {
    (globalThis as any).chrome = {};

    await expect(runLiveBrowserScan(123)).rejects.toThrow(
      /Chrome scripting API is unavailable/
    );
  });

  it('throws an error if executeScript returns no results', async () => {
    (globalThis as any).chrome = {
      scripting: {
        executeScript: vi.fn(async () => []),
      },
    };

    await expect(runLiveBrowserScan(123)).rejects.toThrow(
      /Failed to extract data from Instagram tab/
    );
  });

  it('processes raw data and calculates difference sets correctly', async () => {
    const mockRawResult = {
      username: 'art_designer',
      following: [
        { username: 'curator_one', fullName: 'Art Curator 1' },
        { username: 'gallery_two', fullName: 'Gallery Two' },
        { username: 'solo_artist', fullName: 'Solo Artist' },
      ],
      followers: [
        { username: 'curator_one', fullName: 'Art Curator 1' },
        { username: 'fan_three', fullName: 'Passionate Fan' },
      ],
      timestamp: 1710000000000,
      followingCount: 3,
      followersCount: 2,
    };

    const mockExecute = vi.fn(async () => [{ result: mockRawResult }]);
    (globalThis as any).chrome = {
      scripting: {
        executeScript: mockExecute,
      },
    };

    const progressLogs: Array<{ pct: number; msg: string }> = [];
    const result = await runLiveBrowserScan(42, (pct, msg) => {
      progressLogs.push({ pct, msg });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 42 },
        func: expect.any(Function),
      })
    );

    expect(result.accountUsername).toBe('art_designer');
    expect(result.followingCount).toBe(3);
    expect(result.followersCount).toBe(2);

    // Relationships:
    // curator_one is mutual
    // gallery_two & solo_artist are not following back
    // fan_three is fan
    expect(result.mutuals).toEqual(['curator_one']);
    expect(result.notFollowingBack).toEqual(['gallery_two', 'solo_artist']);
    expect(result.fans).toEqual(['fan_three']);

    // Check NormalizedAccount structures
    expect(result.following).toHaveLength(3);
    expect(result.following[0]).toEqual({
      username: 'curator_one',
      fullName: 'Art Curator 1',
      profileUrl: 'https://www.instagram.com/curator_one/',
      timestamp: 1710000000000,
    });

    // Check progress callbacks
    expect(progressLogs.length).toBeGreaterThanOrEqual(3);
    expect(progressLogs.some((p) => p.pct === 5)).toBe(true);
    expect(progressLogs.some((p) => p.pct === 80)).toBe(true);
    expect(progressLogs.some((p) => p.pct === 90)).toBe(true);
  });

  it('handles plain string arrays gracefully without throwing', async () => {
    const mockRawResult = {
      username: 'simple_user',
      following: ['user_a', 'user_b'],
      followers: ['user_b', 'user_c'],
      timestamp: 1710000000000,
    };

    (globalThis as any).chrome = {
      scripting: {
        executeScript: vi.fn(async () => [{ result: mockRawResult }]),
      },
    };

    const result = await runLiveBrowserScan(99);

    expect(result.accountUsername).toBe('simple_user');
    expect(result.mutuals).toEqual(['user_b']);
    expect(result.notFollowingBack).toEqual(['user_a']);
    expect(result.fans).toEqual(['user_c']);
    expect(result.following[0].fullName).toBeUndefined();
  });
});
