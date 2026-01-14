import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.215f4fbe486f432487f062c3ef13d2bd',
  appName: 'mobilecrmwithsimcalls',
  webDir: 'dist',
  server: {
    url: 'https://215f4fbe-486f-4324-87f0-62c3ef13d2bd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {}
};

export default config;
