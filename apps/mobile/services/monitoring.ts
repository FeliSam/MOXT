import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

type EventProperties = Record<string, string | number | boolean>;

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

let initialized = false;

export function initMonitoring() {
  if (initialized) return;
  initialized = true;

  if (!SENTRY_DSN) {
    if (__DEV__) console.log('[Monitoring] No DSN configured, skipping Sentry init');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version || '0.1.0',
    dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    profilesSampleRate: __DEV__ ? 0 : 0.1,
    enableAutoSessionTracking: true,
    attachStacktrace: true,
    debug: __DEV__,
    beforeSend(event) {
      if (__DEV__) {
        console.log('[Sentry] Would send event:', event.event_id);
        return null;
      }
      return event;
    },
  });
}

export function trackEvent(name: string, properties?: EventProperties) {
  Sentry.addBreadcrumb({
    category: 'analytics',
    message: name,
    data: properties,
    level: 'info',
  });
  if (__DEV__) {
    console.log(`[Analytics] ${name}`, properties);
  }
}

export function trackScreen(screenName: string) {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: screenName,
    level: 'info',
  });
  if (__DEV__) {
    console.log(`[Screen] ${screenName}`);
  }
}

export function reportError(error: Error, context?: Record<string, string>) {
  Sentry.captureException(error, { extra: context });
  if (__DEV__) {
    console.error('[Monitoring] Error:', error.message, context);
  }
}

export function setUser(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email });
  if (__DEV__) {
    console.log(`[Monitoring] setUser: ${userId}`);
  }
}

export function clearUser() {
  Sentry.setUser(null);
}

export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

export function wrapWithSentry<T extends (...args: any[]) => any>(fn: T, name: string): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        reportError(error, { function: name });
      }
      throw error;
    }
  }) as T;
}
