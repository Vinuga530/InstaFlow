import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  srcDir: '.',
  entrypointsDir: 'src/entrypoints',
  publicDir: 'public',
  manifest: {
    name: 'InstaTrack - Instagram Relationship Analytics',
    description: 'Privacy-first follower analytics, unfollower detection, and relationship tracking for Instagram.',
    version: '1.0.0',
    permissions: ['storage', 'unlimitedStorage', 'tabs', 'scripting', 'activeTab', 'cookies'],
    host_permissions: [
      '*://*.instagram.com/*',
      '*://instagram.com/*',
    ],
    action: {
      default_title: 'InstaTrack',
    },
    icons: {
      16: '/icons/icon-16.png',
      32: '/icons/icon-32.png',
      48: '/icons/icon-48.png',
      128: '/icons/icon-128.png',
    },
  },
  vite: () => ({
    plugins: [react()] as any,
  }),
});
