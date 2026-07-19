import type { CapacitorConfig } from '@capacitor/cli'

/**
 * L'app native pointe TOUJOURS vers le site live (production ou live-reload dev) :
 * la WebView charge https://moxtapp.ru par défaut, ce qui permet aux déploiements
 * web (npm run cpd) de s'appliquer instantanément sur les appareils installés,
 * sans nouvelle build native ni resoumission RuStore/store.
 *
 * Live reload (dev) :
 *   PowerShell: $env:CAPACITOR_SERVER_URL="http://192.168.x.x:5173"; npm run cap:sync
 *   Puis lancer `npm run dev` et ouvrir Android Studio / Xcode.
 */
const PRODUCTION_SERVER_URL = 'https://moxtapp.ru'
const isDevServer = Boolean(process.env.CAPACITOR_SERVER_URL)
const serverUrl = process.env.CAPACITOR_SERVER_URL || PRODUCTION_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.moxt.app',
  appName: 'MOXT',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'MOXT',
    url: serverUrl,
    cleartext: isDevServer,
  },
  android: {
    allowMixedContent: isDevServer,
    backgroundColor: '#f7f8fa',
    webContentsDebuggingEnabled: isDevServer,
  },
  ios: {
    backgroundColor: '#f7f8fa',
    contentInset: 'automatic',
    scheme: 'MOXT',
    webContentsDebuggingEnabled: isDevServer,
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
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      permissions: ['camera'],
    },
  },
}

export default config
