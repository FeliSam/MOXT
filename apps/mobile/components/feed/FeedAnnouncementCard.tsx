import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  ExternalLink,
  MapPin,
  Package,
  Repeat,
} from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import type { FeedItem } from '@/components/feed/feedItems';

const KIND_THEMES: Record<
  string,
  {
    badge: string;
    icon: typeof Package;
    accent: string;
    badgeBg: string;
    badgeText: string;
    cta: string;
  }
> = {
  parcel: {
    badge: 'COLIS & TRAJET',
    icon: Package,
    accent: '#38bdf8', // sky-400
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#bae6fd',
    cta: 'Voir le colis',
  },
  job: {
    badge: "OFFRE D'EMPLOI",
    icon: Briefcase,
    accent: '#34d399', // emerald-400
    badgeBg: 'rgba(52, 211, 153, 0.2)',
    badgeText: '#a7f3d0',
    cta: 'Voir l’offre',
  },
  event: {
    badge: 'ÉVÉNEMENT',
    icon: Calendar,
    accent: '#c084fc', // purple-400
    badgeBg: 'rgba(192, 132, 252, 0.2)',
    badgeText: '#e9d5ff',
    cta: 'Voir l’événement',
  },
  p2p: {
    badge: 'CHANGE P2P',
    icon: Repeat,
    accent: '#fbbf24', // amber-400
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    badgeText: '#fde68a',
    cta: 'Voir l’offre',
  },
};

export function FeedAnnouncementCard({
  item,
  topOffset = 100,
}: {
  item: FeedItem;
  topOffset?: number;
}) {
  const theme = KIND_THEMES[item.kind] || KIND_THEMES.parcel;
  const Icon = theme.icon;

  const isParcel = item.kind === 'parcel';
  const parts = isParcel ? item.title.split(' → ') : [];
  const origin = parts[0] || item.title;
  const destination = parts[1] || '';

  return (
    <View style={[styles.container, { top: topOffset }]} pointerEvents="box-none">
      <View style={styles.card}>
        {/* Category Badge Header */}
        <View style={styles.headerRow}>
          <View style={[styles.badgePill, { backgroundColor: theme.badgeBg }]}>
            <Icon size={12} color={theme.accent} strokeWidth={2.4} />
            <AppText
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: theme.badgeText }}
            >
              {theme.badge}
            </AppText>
          </View>
        </View>

        {/* Card Body */}
        {isParcel && destination ? (
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.dotCircle, { backgroundColor: '#38bdf8' }]} />
              <AppText numberOfLines={1} className="text-sm font-black text-white">
                {origin}
              </AppText>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.dotCircle, { backgroundColor: '#818cf8' }]} />
              <AppText numberOfLines={1} className="text-sm font-black text-white">
                {destination}
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <AppText numberOfLines={2} className="text-base font-black text-white">
              {item.title}
            </AppText>
          </View>
        )}

        {/* Caption Meta Details */}
        {item.caption ? (
          <View style={styles.captionRow}>
            <AppText numberOfLines={1} className="text-xs font-semibold text-white/80">
              {item.caption}
            </AppText>
          </View>
        ) : null}

        {/* CTA Button */}
        <Pressable
          accessibilityLabel={theme.cta}
          onPress={() => router.push(item.route as never)}
          style={styles.ctaButton}
        >
          <AppText className="text-xs font-black text-black">
            {theme.cta}
          </AppText>
          <ExternalLink size={13} color="#000000" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 76, // keep space for right action rail
    zIndex: 10,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  routeContainer: {
    gap: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    marginLeft: 3.5,
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleContainer: {
    minHeight: 24,
  },
  captionRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
