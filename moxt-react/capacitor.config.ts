import type { CapacitorConfig } from '@capacitor/cli'

/**
 * PRODUCTION (RuStore / Google Play / APK) :
 *   Pas de `server.url` → la WebView charge les assets locaux (`webDir: dist`).
 *   Produit autonome avec contenu original (pas un wrapper qui redirige vers moxtapp.ru).
 *   Rebuild + resoumission store requis pour chaque mise à jour UI embarquée.
 *
 * DEV (live reload) :
 *   PowerShell: $env:CAPACITOR_SERVER_URL="http://192.168.x.x:5173"; npm run cap:sync
 *   ou: npm run cap:dev:sync
 */
const isDevServer = Boolean(process.env.CAPACITOR_SERVER_URL)
const serverUrl = process.env.CAPACITOR_SERVER_URL || ''

const config: CapacitorConfig = {
  appId: 'com.moxt.app',
  appName: 'MOXT',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'MOXT',
    // Uniquement en live-reload. En prod on omet `url` → assets embarqués.
    ...(isDevServer && serverUrl
      ? {
          url: serverUrl,
          cleartext: true,
        }
      : {}),
  },
  android: {
    allowMixedContent: isDevServer,
    backgroundColor: '#f7f8fa',
    webContentsDebuggingEnabled: isDevServer,
  },
  ios: {
    backgroundColor: '#f7f8fa',
    contentInset: 'never',
    scheme: 'MOXT',
    webContentsDebuggingEnabled: isDevServer,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
    },
    StatusBar: {
      // LIGHT = icônes noires (fond clair). DARK = icônes blanches (fond sombre).
      style: 'LIGHT',
      backgroundColor: '#f7f8fa',
      overlaysWebView: true,
    },
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT',
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
    Badge: {
      persist: true,
      autoClear: false,
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
