import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the built web app (dist/) in a native iOS and Android shell.
 *
 * The web build stays the single source of truth. Nothing inside ios/ or
 * android/ is written by hand: `npx cap sync` copies dist/ into both platforms.
 *
 * Deliberately minimal. Capacitor's defaults are sensible, and every override
 * here is a thing that can quietly break on a device we cannot test from CI.
 * The background colours are set only so the launch screen does not flash white
 * against Comediq's dark background.
 */
const config: CapacitorConfig = {
  appId: 'us.comediq.app',
  appName: 'Comediq',
  webDir: 'dist',

  ios: {
    backgroundColor: '#07111f',
  },

  android: {
    backgroundColor: '#07111f',
  },
};

export default config;
