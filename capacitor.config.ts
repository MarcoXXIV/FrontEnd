import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'SpecBattle',
  webDir: 'dist/FrontEnd/browser',

  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
