import { Alert, Platform } from 'react-native';

/** Message simple (Alert natif ; `alert` du navigateur sur Expo web, où Alert ne s'affiche pas). */
export function showNotice(title: string, message: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    globalThis.alert?.(`${title} — ${message}`);
    return;
  }
  Alert.alert(title, message);
}
