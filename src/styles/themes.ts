import { ThemeDefinition, ThemeId } from '../types/theme';

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  slate_sand: {
    id: 'slate_sand',
    name: 'Slate & Sand',
    appearance: 'dark',
    tagline: 'Architectural & Understated',
    description: 'Deep mineral slate charcoal balanced with warm sand accents and high-contrast editorial typography.',
    palette: ['#222831', '#393E46', '#948979', '#DFD0B8'],
    tokens: {
      bgCanvas: '#222831',
      bgSurface: '#2D343E',
      bgSurfaceElevated: '#393E46',
      bgSurfaceSubtle: '#262D36',
      bgSurfaceHover: '#3F4652',
      borderSubtle: '#3E4652',
      borderStrong: '#535D6C',
      textPrimary: '#DFD0B8',
      textSecondary: '#948979',
      textTertiary: '#786F62',
      accentPrimary: '#DFD0B8',
      accentSecondary: '#948979',
      accentHover: '#EBE0CE',
      accentSubtle: 'rgba(223, 208, 184, 0.14)',
      statusPositive: '#88BA7F',
      statusPositiveBg: 'rgba(136, 186, 127, 0.15)',
      statusWarning: '#E0B56A',
      statusWarningBg: 'rgba(224, 181, 106, 0.15)',
      statusNegative: '#DE685A',
      statusNegativeBg: 'rgba(222, 104, 90, 0.15)',
      statusInfo: '#8AAEC8',
      statusInfoBg: 'rgba(138, 174, 200, 0.15)',
    },
    preview: {
      canvas: '#222831',
      surface: '#2D343E',
      card: '#393E46',
      text: '#DFD0B8',
      subtext: '#948979',
      accent: '#DFD0B8',
      badgeBg: 'rgba(223, 208, 184, 0.15)',
      badgeText: '#DFD0B8',
    },
  },

  sunset_bloom: {
    id: 'sunset_bloom',
    name: 'Sunset Bloom',
    appearance: 'light',
    tagline: 'Radiant Dawn & Plum Orchid',
    description: 'Warm ivory canvas enriched with sun-warmed peach and deep plum violet typography.',
    palette: ['#FFF1D3', '#FFB090', '#CA5995', '#5D1C6A'],
    tokens: {
      bgCanvas: '#FFF1D3',
      bgSurface: '#FFE5C5',
      bgSurfaceElevated: '#FFF7E6',
      bgSurfaceSubtle: '#F9D9B4',
      bgSurfaceHover: '#F4CCA3',
      borderSubtle: '#ECC19E',
      borderStrong: '#CA5995',
      textPrimary: '#5D1C6A',
      textSecondary: '#8B3873',
      textTertiary: '#B36A89',
      accentPrimary: '#CA5995',
      accentSecondary: '#FFB090',
      accentHover: '#B54782',
      accentSubtle: 'rgba(202, 89, 149, 0.14)',
      statusPositive: '#368A50',
      statusPositiveBg: 'rgba(54, 138, 80, 0.14)',
      statusWarning: '#C67400',
      statusWarningBg: 'rgba(198, 116, 0, 0.14)',
      statusNegative: '#C83248',
      statusNegativeBg: 'rgba(200, 50, 72, 0.14)',
      statusInfo: '#5D1C6A',
      statusInfoBg: 'rgba(93, 28, 106, 0.12)',
    },
    preview: {
      canvas: '#FFF1D3',
      surface: '#FFE5C5',
      card: '#FFF7E6',
      text: '#5D1C6A',
      subtext: '#8B3873',
      accent: '#CA5995',
      badgeBg: 'rgba(202, 89, 149, 0.15)',
      badgeText: '#5D1C6A',
    },
  },

  quiet_dark: {
    id: 'quiet_dark',
    name: 'Quiet Obsidian',
    appearance: 'dark',
    tagline: 'Quiet Precision Dark',
    description: 'Deep obsidian black with understated sage accents and soft bone typography.',
    palette: ['#151716', '#202421', '#899783', '#F0EEE6'],
    tokens: {
      bgCanvas: '#151716',
      bgSurface: '#202421',
      bgSurfaceElevated: '#2A302C',
      bgSurfaceSubtle: '#272C28',
      bgSurfaceHover: '#2E342F',
      borderSubtle: '#343B35',
      borderStrong: '#444E46',
      textPrimary: '#F0EEE6',
      textSecondary: '#A6AA9D',
      textTertiary: '#72776C',
      accentPrimary: '#899783',
      accentSecondary: '#686E64',
      accentHover: '#98A792',
      accentSubtle: 'rgba(137, 151, 131, 0.15)',
      statusPositive: '#899783',
      statusPositiveBg: 'rgba(137, 151, 131, 0.15)',
      statusWarning: '#C0A268',
      statusWarningBg: 'rgba(192, 162, 104, 0.15)',
      statusNegative: '#C45B4B',
      statusNegativeBg: 'rgba(196, 91, 75, 0.15)',
      statusInfo: '#7B96A8',
      statusInfoBg: 'rgba(123, 150, 168, 0.15)',
    },
    preview: {
      canvas: '#151716',
      surface: '#202421',
      card: '#2A302C',
      text: '#F0EEE6',
      subtext: '#A6AA9D',
      accent: '#899783',
      badgeBg: 'rgba(137, 151, 131, 0.18)',
      badgeText: '#899783',
    },
  },

  quiet_light: {
    id: 'quiet_light',
    name: 'Quiet Parchment',
    appearance: 'light',
    tagline: 'Quiet Precision Light',
    description: 'Warm parchment surface with muted sage highlights and deep charcoal text.',
    palette: ['#F5F3EC', '#EAE8DF', '#71806C', '#242823'],
    tokens: {
      bgCanvas: '#F5F3EC',
      bgSurface: '#EAE8DF',
      bgSurfaceElevated: '#FFFFFF',
      bgSurfaceSubtle: '#E2DFD6',
      bgSurfaceHover: '#DCD9CE',
      borderSubtle: '#D5D2C5',
      borderStrong: '#BCB8A9',
      textPrimary: '#242823',
      textSecondary: '#686E64',
      textTertiary: '#8D9387',
      accentPrimary: '#71806C',
      accentSecondary: '#8D9387',
      accentHover: '#606E5B',
      accentSubtle: 'rgba(113, 128, 108, 0.12)',
      statusPositive: '#71806C',
      statusPositiveBg: 'rgba(113, 128, 108, 0.12)',
      statusWarning: '#9E7E43',
      statusWarningBg: 'rgba(158, 126, 67, 0.12)',
      statusNegative: '#A33F31',
      statusNegativeBg: 'rgba(163, 63, 49, 0.10)',
      statusInfo: '#58748C',
      statusInfoBg: 'rgba(88, 116, 140, 0.12)',
    },
    preview: {
      canvas: '#F5F3EC',
      surface: '#EAE8DF',
      card: '#FFFFFF',
      text: '#242823',
      subtext: '#686E64',
      accent: '#71806C',
      badgeBg: 'rgba(113, 128, 108, 0.15)',
      badgeText: '#71806C',
    },
  },
};

export const THEME_LIST = [
  THEMES.slate_sand,
  THEMES.sunset_bloom,
  THEMES.quiet_dark,
  THEMES.quiet_light,
];

export const DEFAULT_THEME_ID: ThemeId = 'slate_sand';

/**
 * Apply the selected theme to the document element immediately
 */
export function applyThemeToDocument(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const def = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];

  // Set data-theme attribute
  root.setAttribute('data-theme', def.id);

  // Sync dark class for compatibility with Tailwind dark: utilities
  if (def.appearance === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Inject or update CSS variables directly on root style
  const t = def.tokens;
  root.style.setProperty('--bg-canvas', t.bgCanvas);
  root.style.setProperty('--bg-surface', t.bgSurface);
  root.style.setProperty('--bg-surface-elevated', t.bgSurfaceElevated);
  root.style.setProperty('--bg-surface-subtle', t.bgSurfaceSubtle);
  root.style.setProperty('--bg-surface-hover', t.bgSurfaceHover);
  root.style.setProperty('--border-subtle', t.borderSubtle);
  root.style.setProperty('--border-strong', t.borderStrong);
  root.style.setProperty('--text-primary', t.textPrimary);
  root.style.setProperty('--text-secondary', t.textSecondary);
  root.style.setProperty('--text-tertiary', t.textTertiary);
  root.style.setProperty('--accent-primary', t.accentPrimary);
  root.style.setProperty('--accent-secondary', t.accentSecondary);
  root.style.setProperty('--accent-hover', t.accentHover);
  root.style.setProperty('--accent-subtle', t.accentSubtle);
  root.style.setProperty('--status-positive', t.statusPositive);
  root.style.setProperty('--status-positive-bg', t.statusPositiveBg);
  root.style.setProperty('--status-warning', t.statusWarning);
  root.style.setProperty('--status-warning-bg', t.statusWarningBg);
  root.style.setProperty('--status-negative', t.statusNegative);
  root.style.setProperty('--status-negative-bg', t.statusNegativeBg);
  root.style.setProperty('--status-info', t.statusInfo);
  root.style.setProperty('--status-info-bg', t.statusInfoBg);
}
