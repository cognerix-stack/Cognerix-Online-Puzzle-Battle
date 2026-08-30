import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cognerix.puzzlebattle',
  appName: 'Cognerix',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '205247808441-cj93adqm6cb7kbcobi6bblg5tuq45tdj.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
