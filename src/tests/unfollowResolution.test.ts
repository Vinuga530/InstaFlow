import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unfollowInstagramUser } from '../services/live/followerExporterService';
import { inPageUnfollow } from '../services/live/instagramBridgeService';

describe('Unfollow & User ID Resolution Engine', () => {
  const originalChrome = (globalThis as any).chrome;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (globalThis as any).chrome = originalChrome;
    globalThis.fetch = originalFetch;
  });

  it('throws early if chrome.scripting API is unavailable', async () => {
    (globalThis as any).chrome = {};

    await expect(
      unfollowInstagramUser({
        tabId: 101,
        targetUsername: 'someuser',
      })
    ).rejects.toThrow(/Chrome scripting API unavailable/);
  });

  it('executes unfollow script with provided targetUserId', async () => {
    const mockExecute = vi.fn(async ({ args }) => {
      const [uid, uname] = args;
      return [
        {
          result: {
            success: true,
            targetUserId: uid,
          },
        },
      ];
    });

    (globalThis as any).chrome = {
      scripting: {
        executeScript: mockExecute,
      },
    };

    const res = await unfollowInstagramUser({
      tabId: 202,
      targetUserId: '987654321',
      targetUsername: 'test_artist',
    });

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 202 },
        func: expect.any(Function),
        args: ['987654321', 'test_artist'],
      })
    );
    expect(res.success).toBe(true);
    expect(res.targetUserId).toBe('987654321');
  });

  it('handles remote execution script failure gracefully with descriptive error', async () => {
    const mockExecute = vi.fn(async () => [
      {
        result: {
          success: false,
          error: 'Instagram rate limit reached.',
        },
      },
    ]);

    (globalThis as any).chrome = {
      scripting: {
        executeScript: mockExecute,
      },
    };

    const res = await unfollowInstagramUser({
      tabId: 303,
      targetUsername: 'rate_limited_user',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Instagram rate limit reached.');
  });

  it('tests inPageUnfollow with targetUserId and fallback endpoints', async () => {
    let attemptedEndpoints: string[] = [];
    let requestBodies: string[] = [];

    // Mock fetch for inPageUnfollow
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const urlStr = String(url);
      attemptedEndpoints.push(urlStr);
      if (init?.body) {
        requestBodies.push(String(init.body));
      }

      // If calling primary destroy endpoint, simulate 404/failure to verify fallback
      if (urlStr.includes('/friendships/destroy/')) {
        return {
          status: 404,
          ok: false,
          json: async () => ({ status: 'fail', message: 'Endpoint not found' }),
        } as any;
      }

      // Fallback unfollow endpoint succeeds
      if (urlStr.includes('/friendships/123456/unfollow/')) {
        return {
          status: 200,
          ok: true,
          json: async () => ({ status: 'ok', friendship_status: { following: false } }),
        } as any;
      }

      return {
        status: 200,
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as any;
    });

    const result = await inPageUnfollow('123456');

    expect(result.success).toBe(true);
    expect(attemptedEndpoints).toContain('https://www.instagram.com/api/v1/friendships/destroy/123456/');
    expect(attemptedEndpoints).toContain('https://www.instagram.com/api/v1/web/friendships/123456/unfollow/');
    expect(requestBodies).toContain('user_id=123456');
  });

  it('tests inPageUnfollow resolves target user ID via profile HTML meta tag', async () => {
    let attemptedEndpoints: string[] = [];

    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const urlStr = String(url);
      attemptedEndpoints.push(urlStr);

      // Profile HTML request
      if (urlStr === 'https://www.instagram.com/target_creator/') {
        return {
          status: 200,
          ok: true,
          text: async () => `
            <!DOCTYPE html>
            <html>
              <head>
                <meta property="instapp:owner_user_id" content="5544332211" />
              </head>
              <body></body>
            </html>
          `,
        } as any;
      }

      // Destroy endpoint
      if (urlStr.includes('/friendships/destroy/5544332211/')) {
        return {
          status: 200,
          ok: true,
          json: async () => ({ status: 'ok', following: false }),
        } as any;
      }

      return {
        status: 200,
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as any;
    });

    // Pass empty targetUserId, but supply targetUsername
    const result = await inPageUnfollow('', 'target_creator');

    expect(result.success).toBe(true);
    expect(attemptedEndpoints).toContain('https://www.instagram.com/target_creator/');
    expect(attemptedEndpoints).toContain('https://www.instagram.com/api/v1/friendships/destroy/5544332211/');
  });

  it('tests inPageUnfollow reports error when user ID cannot be resolved', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr === 'https://www.instagram.com/nonexistent_ghost/') {
        return {
          status: 404,
          ok: false,
          text: async () => '<html><body>Not found</body></html>',
        } as any;
      }
      return { status: 404, ok: false } as any;
    });

    const result = await inPageUnfollow('', 'nonexistent_ghost');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Could not resolve user ID to unfollow/);
  });
});
