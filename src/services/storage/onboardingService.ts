/**
 * InstaFlow Onboarding & Theme Persistence Service
 *
 * Persists onboarding progress, selected theme, and configured username
 * via chrome.storage.local with automatic fallback to localStorage.
 */

import { ThemeId } from '../../types/theme';
import { DEFAULT_THEME_ID } from '../../styles/themes';

export interface OnboardingState {
  isOnboardingCompleted: boolean;
  onboardingStep: number;
  themeId: ThemeId;
  username: string;
}

const STORAGE_KEYS = {
  COMPLETED: 'instaflow_onboarding_completed',
  STEP: 'instaflow_onboarding_step',
  THEME: 'instaflow_theme_id',
  USERNAME: 'instaflow_username',
};

/**
 * Retrieve the current onboarding state
 */
export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.COMPLETED,
        STORAGE_KEYS.STEP,
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.USERNAME,
      ]);

      return {
        isOnboardingCompleted: result[STORAGE_KEYS.COMPLETED] === true,
        onboardingStep: typeof result[STORAGE_KEYS.STEP] === 'number' ? result[STORAGE_KEYS.STEP] : 1,
        themeId: (result[STORAGE_KEYS.THEME] as ThemeId) || DEFAULT_THEME_ID,
        username: typeof result[STORAGE_KEYS.USERNAME] === 'string' ? result[STORAGE_KEYS.USERNAME] : '',
      };
    }
  } catch {
    // Fall back to localStorage below
  }

  if (typeof localStorage !== 'undefined') {
    const isCompleted = localStorage.getItem(STORAGE_KEYS.COMPLETED) === 'true';
    const stepVal = parseInt(localStorage.getItem(STORAGE_KEYS.STEP) || '1', 10);
    const themeVal = (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeId) || DEFAULT_THEME_ID;
    const userVal = localStorage.getItem(STORAGE_KEYS.USERNAME) || '';

    return {
      isOnboardingCompleted: isCompleted,
      onboardingStep: isNaN(stepVal) ? 1 : stepVal,
      themeId: themeVal,
      username: userVal,
    };
  }

  return {
    isOnboardingCompleted: false,
    onboardingStep: 1,
    themeId: DEFAULT_THEME_ID,
    username: '',
  };
}

/**
 * Persist the active theme selection immediately
 */
export async function persistThemeId(themeId: ThemeId): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: themeId });
    }
  } catch {
    // Ignore error
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.THEME, themeId);
  }
}

/**
 * Persist the current onboarding step (for resume on refresh/reopen)
 */
export async function persistOnboardingStep(step: number): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.STEP]: step });
    }
  } catch {
    // Ignore error
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.STEP, step.toString());
  }
}

/**
 * Persist the Instagram username entered by the user
 */
export async function persistUsername(username: string): Promise<void> {
  const cleanUsername = username.trim().replace(/^@/, '');
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.USERNAME]: cleanUsername });
    }
  } catch {
    // Ignore error
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USERNAME, cleanUsername);
  }
}

/**
 * Mark onboarding as completed
 */
export async function markOnboardingCompleted(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.COMPLETED]: true,
        [STORAGE_KEYS.STEP]: 5,
      });
    }
  } catch {
    // Ignore error
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.COMPLETED, 'true');
    localStorage.setItem(STORAGE_KEYS.STEP, '5');
  }
}

/**
 * Reset onboarding state for revisiting the setup flow without touching user data
 */
export async function resetOnboardingFlow(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.COMPLETED]: false,
        [STORAGE_KEYS.STEP]: 1,
      });
    }
  } catch {
    // Ignore error
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.COMPLETED, 'false');
    localStorage.setItem(STORAGE_KEYS.STEP, '1');
  }
}
