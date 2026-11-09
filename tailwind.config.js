/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./src/entrypoints/**/*.{html,ts,tsx}",
    "./index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          subtle: 'var(--bg-surface-subtle)',
          hover: 'var(--bg-surface-hover)',
        },
        border: {
          DEFAULT: 'var(--border-subtle)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        content: {
          DEFAULT: 'var(--text-primary)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },
        status: {
          positive: 'var(--status-positive)',
          'positive-bg': 'var(--status-positive-bg)',
          warning: 'var(--status-warning)',
          'warning-bg': 'var(--status-warning-bg)',
          negative: 'var(--status-negative)',
          'negative-bg': 'var(--status-negative-bg)',
          info: 'var(--status-info)',
          'info-bg': 'var(--status-info-bg)',
        },
        // Backwards compatibility mappings for quiet tokens
        quiet: {
          bg: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          subtle: 'var(--bg-surface-subtle)',
          hover: 'var(--bg-surface-hover)',
          border: 'var(--border-subtle)',
          borderStrong: 'var(--border-strong)',
          text: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          accent: 'var(--accent-primary)',
          accentSubtle: 'var(--accent-subtle)',
        },
        cozy: {
          canvas: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          subtle: 'var(--bg-surface-subtle)',
          hover: 'var(--bg-surface-hover)',
          border: 'var(--border-subtle)',
          borderStrong: 'var(--border-strong)',
          text: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          faint: 'var(--text-tertiary)',
        },
      },
      fontFamily: {
        logo: ['"Cassandra"', 'cursive', 'sans-serif'],
        cassandra: ['"Cassandra"', 'cursive', 'sans-serif'],
        fredoka: ['"Fredoka One"', 'cursive', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'sans-serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'Inter',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'Inter',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'cozy': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 14px rgba(0, 0, 0, 0.08)',
        'modal': '0 12px 32px -4px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        'cozy': '18px',
        'cozy-lg': '24px',
        'cozy-pill': '9999px',
        'm3-lg': '28px',
        'm3-xl': '32px',
      },
    },
  },
  plugins: [],
}
