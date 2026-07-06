import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Live reload (dev) :
 *   PowerShell: $env:CAPACITOR_SERVER_URL="http://192.168.x.x:5173"; npm run cap:sync
 *   Puis lancer `npm run dev` et ouvrir Android Studio / Xcode.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.moxt.app',
  appName: 'MOXT',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'MOXT',
    ...(serverUrl
      ? {
          url: serverUrl,
          cleartext: true,
        }
      : {}),
  },
  android: {
    allowMixedContent: Boolean(serverUrl),
    backgroundColor: '#f7f8fa',
    webContentsDebuggingEnabled: Boolean(serverUrl),
  },
  ios: {
    backgroundColor: '#f7f8fa',
    contentInset: 'automatic',
    scheme: 'MOXT',
    webContentsDebuggingEnabled: Boolean(serverUrl),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#08705f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#08705f',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
