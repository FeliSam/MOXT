import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';

import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Routes consultables sans compte — alignées sur PublicationShell / FeedAccessShell
 * du web (marketplace, fil, fiches entreprise, publications d'un membre, fiches
 * annonce / colis / emploi) et sur les pages d'authentification.
 */
const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/marketplace$/, // /marketplace
  /^\/listing\/[^/]+$/, // /marketplace/:listingId
  /^\/feed$/, // /feed
  /^\/organization\/[^/]+$/, // /businesses/:businessId
  /^\/users\/[^/]+\/publications$/, // /users/:userId/publications
  /^\/parcel\/[^/]+$/, // /parcels/:parcelId
  /^\/jobs\/[^/]+$/, // /jobs/:jobId
  /^\/events\/[^/]+$/,
  /^\/news\/[^/]+$/,
  /^\/videos\/[^/]+$/,
  /^\/p2p\/(?!publish$)[^/]+$/,
  /^\/status\/[^/]+$/,
  /^\/users\/[^/]+$/,
];

export function isPublicPath(pathname: string) {
  if (pathname === '/listing/create' || pathname === '/listing/mine' || pathname === '/parcel/reserve') return false;
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === ('(auth)' as string);

    if (status === 'anonymous' && !inAuthGroup && !isPublicPath(pathname)) {
      router.replace('/login' as never);
      return;
    }

    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/' as never);
    }
  }, [status, segments, pathname, router]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={isDark ? colors.teal : colors.accent} />
      </View>
    );
  }

  return children;
}
