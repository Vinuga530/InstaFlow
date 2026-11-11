import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unfollowInstagramUser } from '../services/live/followerExporterService';
import { inPageUnfollow } from '../services/live/instagramBridgeService';
import { classifyAccount } from '../utils/accountClassifier';

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

  it('executes unfollow script with provided targetUserId and handles passed CSRF', async () => {
    const mockExecute = vi.fn(async ({ args }) => {
      const [uid, uname, passedCsrf] = args;
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
      cookies: {
        get: vi.fn(async () => ({ value: 'valid_csrf_123' })),
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
        args: ['987654321', 'test_artist', 'valid_csrf_123'],
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

  it('gracefully handles non-JSON HTML <!DOCTYPE responses without throwing syntax errors', async () => {
    // Simulating Instagram returning a 403 HTML challenge/login redirect page
    globalThis.fetch = vi.fn(async () => {
      return {
        status: 403,
        ok: false,
        text: async () => `<!DOCTYPE html><html lang="en"><head><title>Login • Instagram</title></head><body>Login required</body></html>`,
      } as any;
    });

    const result = await inPageUnfollow('112233');

    expect(result.success).toBe(false);
    // Verified that it does NOT throw "Unexpected token '<', <!DOCTYPE..."
    expect(result.error).not.toMatch(/Unexpected token/);
    expect(result.error).toMatch(/Instagram session expired/);
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
          text: async () => JSON.stringify({ status: 'fail', message: 'Endpoint not found' }),
        } as any;
      }

      // Fallback unfollow endpoint succeeds
      if (urlStr.includes('/friendships/123456/unfollow/')) {
        return {
          status: 200,
          ok: true,
          text: async () => JSON.stringify({ status: 'ok', friendship_status: { following: false } }),
        } as any;
      }

      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ status: 'ok' }),
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

    globalThis.fetch = vi.fn(async (url: any) => {
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
          text: async () => JSON.stringify({ status: 'ok', following: false }),
        } as any;
      }

      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ status: 'ok' }),
      } as any;
    });

    const result = await inPageUnfollow('', 'target_creator');

    expect(result.success).toBe(true);
    expect(attemptedEndpoints).toContain('https://www.instagram.com/target_creator/');
    expect(attemptedEndpoints).toContain('https://www.instagram.com/api/v1/friendships/destroy/5544332211/');
  });
});

describe('Account Classification Engine (Personal vs Pages & Verified)', () => {
  it('correctly classifies a normal human user with personal name as personal', () => {
    const res = classifyAccount({
      username: 'john.smith94',
      fullName: 'John Smith',
    });

    expect(res.accountType).toBe('personal');
    expect(res.typeLabel).toBe('Personal');
    expect(res.isVerified).toBe(false);
  });

  it('correctly classifies a brand/shop/studio account as page', () => {
    const res1 = classifyAccount({
      username: 'vintage_clothing_shop',
      fullName: 'Vintage Clothing Store',
    });
    expect(res1.accountType).toBe('page');
    expect(res1.typeLabel).toBe('Page / Brand');

    const res2 = classifyAccount({
      username: 'daily.memes.club',
      fullName: 'Daily Memes',
    });
    expect(res2.accountType).toBe('page');

    const res3 = classifyAccount({
      username: 'design_studio_official',
      fullName: 'Modern Studio Co',
    });
    expect(res3.accountType).toBe('page');
  });

  it('identifies private accounts as personal individual users', () => {
    const res = classifyAccount({
      username: 'curator_hub',
      fullName: 'Curator Hub',
      isPrivate: true,
    });

    expect(res.accountType).toBe('personal');
    expect(res.isPrivate).toBe(true);
  });

  it('identifies verified accounts as verified pages / public figures', () => {
    const res = classifyAccount({
      username: 'cristiano',
      fullName: 'Cristiano Ronaldo',
      isVerified: true,
    });

    expect(res.accountType).toBe('page');
    expect(res.isVerified).toBe(true);
    expect(res.typeLabel).toBe('Verified Page');
  });

  it('honors user manual tag overrides', () => {
    // Account that would normally be classified as page, but user tagged as personal
    const res1 = classifyAccount({
      username: 'my_co_friend',
      fullName: 'Company Store',
      tags: ['personal'],
    });
    expect(res1.accountType).toBe('personal');

    // Account that would normally be personal, but user tagged as page
    const res2 = classifyAccount({
      username: 'sarah_jane',
      fullName: 'Sarah Jane',
      tags: ['page'],
    });
    expect(res2.accountType).toBe('page');
  });
});
