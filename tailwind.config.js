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
        brand: {
          50: '#FFF1F3',
          100: '#FFE4E8',
          200: '#FECDD6',
          500: '#E1306C',
          600: '#CF225E',
          700: '#A81347',
        },
        coral: {
          50: '#FFF5F4',
          100: '#FFE8E5',
          500: '#FF6363',
          600: '#F04848',
        },
        honey: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        mint: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#10B981',
          600: '#059669',
        },
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
          600: '#7C3AED',
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
        'subtle': '0 1px 3px rgba(42, 39, 35, 0.04), 0 1px 2px rgba(42, 39, 35, 0.02)',
        'cozy': '0 2px 8px -1px rgba(42, 39, 35, 0.06), 0 1px 3px rgba(42, 39, 35, 0.03)',
        'elevated': '0 8px 24px -4px rgba(42, 39, 35, 0.08), 0 2px 8px -2px rgba(42, 39, 35, 0.04)',
        'modal': '0 20px 48px -8px rgba(20, 18, 16, 0.3), 0 4px 16px -2px rgba(20, 18, 16, 0.1)',
      },
      borderRadius: {
        'cozy': '18px',
        'cozy-lg': '24px',
        'cozy-pill': '9999px',
      },
    },
  },
  plugins: [],
}
