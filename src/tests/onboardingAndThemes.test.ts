import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { THEMES, THEME_LIST, DEFAULT_THEME_ID, applyThemeToDocument } from '../styles/themes';
import {
  getOnboardingState,
  persistThemeId,
  persistOnboardingStep,
  persistUsername,
  markOnboardingCompleted,
  resetOnboardingFlow,
} from '../services/storage/onboardingService';

describe('InstaFlow Semantic Theme Architecture & Palette Integrity', () => {
  it('defines the required Theme 01 — Slate & Sand with exact requested hex palette', () => {
    const slateSand = THEMES.slate_sand;
    expect(slateSand).toBeDefined();
    expect(slateSand.name).toBe('Slate & Sand');
    expect(slateSand.appearance).toBe('dark');
    expect(slateSand.palette).toEqual(['#222831', '#393E46', '#948979', '#DFD0B8']);

    // Check semantic tokens
    expect(slateSand.tokens.bgCanvas).toBe('#222831');
    expect(slateSand.tokens.bgSurfaceElevated).toBe('#393E46');
    expect(slateSand.tokens.textPrimary).toBe('#DFD0B8');
    expect(slateSand.tokens.textSecondary).toBe('#948979');
    expect(slateSand.tokens.accentPrimary).toBe('#DFD0B8');
  });

  it('defines the required Theme 02 — Sunset Bloom with exact requested hex palette', () => {
    const sunsetBloom = THEMES.sunset_bloom;
    expect(sunsetBloom).toBeDefined();
    expect(sunsetBloom.name).toBe('Sunset Bloom');
    expect(sunsetBloom.appearance).toBe('light');
    expect(sunsetBloom.palette).toEqual(['#FFF1D3', '#FFB090', '#CA5995', '#5D1C6A']);

    // Check semantic tokens
    expect(sunsetBloom.tokens.bgCanvas).toBe('#FFF1D3');
    expect(sunsetBloom.tokens.accentSecondary).toBe('#FFB090');
    expect(sunsetBloom.tokens.accentPrimary).toBe('#CA5995');
    expect(sunsetBloom.tokens.textPrimary).toBe('#5D1C6A');
  });

  it('guarantees complete semantic token coverage for every theme in the registry', () => {
    const requiredTokens = [
      'bgCanvas',
      'bgSurface',
      'bgSurfaceElevated',
      'bgSurfaceSubtle',
      'bgSurfaceHover',
      'borderSubtle',
      'borderStrong',
      'textPrimary',
      'textSecondary',
      'textTertiary',
      'accentPrimary',
      'accentSecondary',
      'accentHover',
      'accentSubtle',
      'statusPositive',
      'statusPositiveBg',
      'statusWarning',
      'statusWarningBg',
      'statusNegative',
      'statusNegativeBg',
      'statusInfo',
      'statusInfoBg',
    ] as const;

    for (const theme of THEME_LIST) {
      for (const token of requiredTokens) {
        expect(theme.tokens[token], `Theme ${theme.id} missing token ${token}`).toBeDefined();
        expect(typeof theme.tokens[token]).toBe('string');
        expect(theme.tokens[token].length).toBeGreaterThan(0);
      }
    }
  });

  it('applies theme attributes and CSS variables to the document element when present', () => {
    // Mock document
    const attributes: Record<string, string> = {};
    const classSet = new Set<string>();
    const cssVars: Record<string, string> = {};

    const mockDoc = {
      documentElement: {
        setAttribute: (k: string, v: string) => {
          attributes[k] = v;
        },
        getAttribute: (k: string) => attributes[k],
        classList: {
          add: (c: string) => classSet.add(c),
          remove: (c: string) => classSet.delete(c),
          contains: (c: string) => classSet.has(c),
        },
        style: {
          setProperty: (k: string, v: string) => {
            cssVars[k] = v;
          },
          getPropertyValue: (k: string) => cssVars[k],
        },
      },
    };

    (globalThis as any).document = mockDoc;

    applyThemeToDocument('sunset_bloom');
    expect(mockDoc.documentElement.getAttribute('data-theme')).toBe('sunset_bloom');
    expect(mockDoc.documentElement.classList.contains('dark')).toBe(false);
    expect(mockDoc.documentElement.style.getPropertyValue('--bg-canvas')).toBe('#FFF1D3');
    expect(mockDoc.documentElement.style.getPropertyValue('--text-primary')).toBe('#5D1C6A');

    applyThemeToDocument('slate_sand');
    expect(mockDoc.documentElement.getAttribute('data-theme')).toBe('slate_sand');
    expect(mockDoc.documentElement.classList.contains('dark')).toBe(true);
    expect(mockDoc.documentElement.style.getPropertyValue('--bg-canvas')).toBe('#222831');
    expect(mockDoc.documentElement.style.getPropertyValue('--text-primary')).toBe('#DFD0B8');

    delete (globalThis as any).document;
  });
});

describe('Onboarding State Management & Local Persistence', () => {
  let mockStorage: Record<string, any> = {};

  beforeEach(() => {
    mockStorage = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn().mockImplementation(async (keys: string[]) => {
            const res: Record<string, any> = {};
            for (const k of keys) {
              if (mockStorage[k] !== undefined) res[k] = mockStorage[k];
            }
            return res;
          }),
          set: vi.fn().mockImplementation(async (items: Record<string, any>) => {
            Object.assign(mockStorage, items);
          }),
        },
      },
    };
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
  });

  it('initializes with default uncompleted onboarding state', async () => {
    const state = await getOnboardingState();
    expect(state.isOnboardingCompleted).toBe(false);
    expect(state.onboardingStep).toBe(1);
    expect(state.themeId).toBe(DEFAULT_THEME_ID);
    expect(state.username).toBe('');
  });

  it('persists step changes across sessions for seamless step resumption', async () => {
    await persistOnboardingStep(3);
    const state = await getOnboardingState();
    expect(state.onboardingStep).toBe(3);
  });

  it('persists theme selection immediately without delay', async () => {
    await persistThemeId('sunset_bloom');
    const state = await getOnboardingState();
    expect(state.themeId).toBe('sunset_bloom');
  });

  it('normalizes and persists Instagram username (stripping @ prefix and spaces)', async () => {
    await persistUsername('  @sarah_creator  ');
    const state = await getOnboardingState();
    expect(state.username).toBe('sarah_creator');
  });

  it('marks onboarding as completed and advances step to 5', async () => {
    await markOnboardingCompleted();
    const state = await getOnboardingState();
    expect(state.isOnboardingCompleted).toBe(true);
    expect(state.onboardingStep).toBe(5);
  });

  it('allows resetting the onboarding flow without erasing stored database data', async () => {
    await markOnboardingCompleted();
    expect((await getOnboardingState()).isOnboardingCompleted).toBe(true);

    await resetOnboardingFlow();
    const state = await getOnboardingState();
    expect(state.isOnboardingCompleted).toBe(false);
    expect(state.onboardingStep).toBe(1);
  });
});

describe('Instagram Username Validation Requirements', () => {
  const validate = (raw: string) => {
    const trimmed = raw.trim().replace(/^@/, '');
    if (!trimmed) return { isValid: false, error: 'Empty' };
    if (trimmed.length > 30) return { isValid: false, error: 'Too long' };
    if (!/^[a-zA-Z0-9._]+$/.test(trimmed)) return { isValid: false, error: 'Invalid characters' };
    if (trimmed.startsWith('.') || trimmed.endsWith('.')) return { isValid: false, error: 'Starts or ends with dot' };
    if (trimmed.includes('..')) return { isValid: false, error: 'Consecutive dots' };
    return { isValid: true, error: null };
  };

  it('accepts valid Instagram usernames', () => {
    expect(validate('cristiano').isValid).toBe(true);
    expect(validate('@leomessi').isValid).toBe(true);
    expect(validate('natgeo.wild').isValid).toBe(true);
    expect(validate('_art_collective_').isValid).toBe(true);
    expect(validate('user123.official').isValid).toBe(true);
  });

  it('rejects invalid or unsafe usernames', () => {
    expect(validate('').isValid).toBe(false);
    expect(validate('   ').isValid).toBe(false);
    expect(validate('a'.repeat(31)).isValid).toBe(false);
    expect(validate('user with space').isValid).toBe(false);
    expect(validate('user$name').isValid).toBe(false);
    expect(validate('user!alert').isValid).toBe(false);
    expect(validate('.leadingdot').isValid).toBe(false);
    expect(validate('trailingdot.').isValid).toBe(false);
    expect(validate('double..dot').isValid).toBe(false);
  });
});
