import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaleidar.app',
  appName: 'Kaleidar',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
