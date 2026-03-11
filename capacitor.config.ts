import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sudaistech.netscope',
  appName: 'NetScope',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    AdMob: {
      appIdAndroid: 'ca-app-pub-2693019276790458~1288831514',
      appIdIos: 'ca-app-pub-2693019276790458~1288831514',
      initializeForTesting: false,
    },
  },
};

export default config;
