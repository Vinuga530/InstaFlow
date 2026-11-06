import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isInstagramUrl,
  extractUsernameFromUrl,
  queryCurrentInstagramTabs,
  INSTAGRAM_MATCH_PATTERNS,
} from '../services/live/tabDetectionService';

describe('Centralized Instagram Tab Detection Service', () => {
  describe('URL Matching', () => {
    it('accurately identifies valid Instagram URLs across all subdomains and protocols', () => {
      expect(isInstagramUrl('https://www.instagram.com/')).toBe(true);
      expect(isInstagramUrl('https://instagram.com/')).toBe(true);
      expect(isInstagramUrl('http://www.instagram.com/alex')).toBe(true);
      expect(isInstagramUrl('https://m.instagram.com/explore/')).toBe(true);
      expect(isInstagramUrl('https://accountscenter.instagram.com/info_and_permissions/dyi/')).toBe(true);
      expect(isInstagramUrl('https://about.instagram.com/')).toBe(true);
      expect(isInstagramUrl('https://help.instagram.com/')).toBe(true);
      expect(isInstagramUrl('https://business.instagram.com/')).toBe(true);
    });

    it('rejects non-Instagram domains and spoofed hostnames', () => {
      expect(isInstagramUrl('https://not-instagram.com/')).toBe(false);
      expect(isInstagramUrl('https://instagram.fake.com/')).toBe(false);
      expect(isInstagramUrl('https://google.com/')).toBe(false);
      expect(isInstagramUrl('https://myinstagram.com/')).toBe(false);
      expect(isInstagramUrl('')).toBe(false);
      expect(isInstagramUrl(undefined)).toBe(false);
    });
  });

  describe('Username Extraction from Tab URLs', () => {
    it('extracts canonical usernames from profile URLs', () => {
      expect(extractUsernameFromUrl('https://www.instagram.com/alex.creator/')).toBe('alex.creator');
      expect(extractUsernameFromUrl('https://instagram.com/sarah_design/?hl=en#feed')).toBe('sarah_design');
      expect(extractUsernameFromUrl('http://www.instagram.com/@marcus_dev/')).toBe('marcus_dev');
      expect(extractUsernameFromUrl('https://instagram.com/john.doe')).toBe('john.doe');
    });

    it('ignores reserved non-profile Instagram pathways', () => {
      expect(extractUsernameFromUrl('https://www.instagram.com/explore/')).toBeUndefined();
      expect(extractUsernameFromUrl('https://www.instagram.com/reels/')).toBeUndefined();
      expect(extractUsernameFromUrl('https://www.instagram.com/stories/highlights/')).toBeUndefined();
      expect(extractUsernameFromUrl('https://www.instagram.com/direct/inbox/')).toBeUndefined();
      expect(extractUsernameFromUrl('https://www.instagram.com/accounts/login/')).toBeUndefined();
      expect(extractUsernameFromUrl('https://www.instagram.com/p/C6XYZ123/')).toBeUndefined();
      expect(extractUsernameFromUrl('https://www.instagram.com/about/')).toBeUndefined();
    });
  });

  describe('Tab Querying Logic', () => {
    const originalChrome = (globalThis as any).chrome;

    afterEach(() => {
      (globalThis as any).chrome = originalChrome;
    });

    it('detects Instagram tabs when present in the browser', async () => {
      (globalThis as any).chrome = {
        tabs: {
          query: vi.fn().mockResolvedValue([
            { id: 1, url: 'https://www.google.com', active: false },
            { id: 2, url: 'https://www.instagram.com/cristiano/', active: true, title: 'Cristiano Ronaldo (@cristiano)' },
          ]),
        },
        storage: {
          local: {
            set: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({}),
          },
        },
      };

      const state = await queryCurrentInstagramTabs();
      expect(state.isTabOpen).toBe(true);
      expect(state.tabCount).toBe(1);
      expect(state.activeTab).not.toBeNull();
      expect(state.activeTab?.detectedUsername).toBe('cristiano');
      expect(state.activeTab?.active).toBe(true);
    });

    it('handles multiple Instagram tabs and prioritizes the active tab', async () => {
      (globalThis as any).chrome = {
        tabs: {
          query: vi.fn().mockResolvedValue([
            { id: 10, url: 'https://www.instagram.com/explore/', active: false },
            { id: 11, url: 'https://www.instagram.com/leomessi/', active: true },
            { id: 12, url: 'https://www.instagram.com/direct/inbox/', active: false },
          ]),
        },
        storage: {
          local: {
            set: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({}),
          },
        },
      };

      const state = await queryCurrentInstagramTabs();
      expect(state.isTabOpen).toBe(true);
      expect(state.tabCount).toBe(3);
      expect(state.activeTab?.id).toBe(11);
      expect(state.activeTab?.detectedUsername).toBe('leomessi');
    });

    it('correctly reports when zero Instagram tabs are open', async () => {
      (globalThis as any).chrome = {
        tabs: {
          query: vi.fn().mockResolvedValue([
            { id: 1, url: 'https://github.com', active: true },
            { id: 2, url: 'https://stackoverflow.com', active: false },
          ]),
        },
        storage: {
          local: {
            set: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({}),
          },
        },
      };

      const state = await queryCurrentInstagramTabs();
      expect(state.isTabOpen).toBe(false);
      expect(state.tabCount).toBe(0);
      expect(state.activeTab).toBeNull();
    });

    it('inspects pendingUrl for loading or navigated tabs', async () => {
      (globalThis as any).chrome = {
        tabs: {
          query: vi.fn().mockResolvedValue([
            { id: 5, url: '', pendingUrl: 'https://www.instagram.com/design/', active: true },
          ]),
        },
        storage: {
          local: {
            set: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({}),
          },
        },
      };

      const state = await queryCurrentInstagramTabs();
      expect(state.isTabOpen).toBe(true);
      expect(state.tabCount).toBe(1);
      expect(state.activeTab?.detectedUsername).toBe('design');
    });
  });
});
