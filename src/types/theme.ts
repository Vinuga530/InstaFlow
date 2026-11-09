/**
 * InstaFlow Extensible Semantic Theme System Types
 */

export type ThemeId = 'slate_sand' | 'sunset_bloom' | 'quiet_dark' | 'quiet_light';

export interface ThemeTokens {
  bgCanvas: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  bgSurfaceSubtle: string;
  bgSurfaceHover: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accentPrimary: string;
  accentSecondary: string;
  accentHover: string;
  accentSubtle: string;
  statusPositive: string;
  statusPositiveBg: string;
  statusWarning: string;
  statusWarningBg: string;
  statusNegative: string;
  statusNegativeBg: string;
  statusInfo: string;
  statusInfoBg: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  appearance: 'dark' | 'light';
  tagline: string;
  description: string;
  palette: [string, string, string, string]; // 4 primary signature palette hexes
  tokens: ThemeTokens;
  preview: {
    canvas: string;
    surface: string;
    card: string;
    text: string;
    subtext: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  };
}
