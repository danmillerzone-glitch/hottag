import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.hottag.www',
  appName: 'Hot Tag',
  webDir: 'out',
  server: {
    // Use the live site URL — the app loads your deployed site
    // This avoids static export limitations with server components
    url: 'https://www.hottag.app',
    cleartext: false,
  },
  ios: {
    backgroundColor: '#14181c',
    contentInset: 'automatic',
    scheme: 'Hot Tag',
  },
  android: {
    backgroundColor: '#14181c',
  },
};

export default config;
