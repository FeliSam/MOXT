import { createElement, useRef, useState, type ReactNode } from 'react';
import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, Play } from 'lucide-react-native';

import {
  DISCOVERY_CARD_HEIGHT,
  MarketplaceListingCard,
  RailBadge,
} from '@/components/marketplace/MarketplaceListingCard';
import { AppText } from '@/components/ui/AppText';
import { VideoFramePoster } from '@/components/video/FeedVideoPlayer';
import type { FeedVideo } from '@/store/feed';
import type { ListingItem } from '@/store/marketplace';
import { useShadows, useThemeColors } from '@/theme/ThemeContext';

/** marketplaceDiscoveryLayout : w-[clamp(10.5rem,44vw,14.5rem)], gap-[0.225rem]. */
export function railCardWidth(viewport: number) {
  return Math.max(168, Math.min(viewport * 0.44, 232));
}
export const RAIL_GAP = 3.6;

export const RAIL_BADGE_COLORS = {
  forYou: '#08705f',
  trending: '#d97706',
  fresh: '#059669',
} as const;

function EdgeButton({ side, onPress }: { side: 'left' | 'right'; onPress: () => void }) {
  const colors = useThemeColors();
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      accessibilityLabel={side === 'left' ? 'Précédent' : 'Suivant'}
      onPress={onPress}
      className="absolute h-8 w-8 items-center justify-center rounded-full border border-app-border bg-app-surface/95"
      style={{
        [side]: 0,
        top: DISCOVERY_CARD_HEIGHT / 2 - 16,
        zIndex: 2,
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
      }}>
      <Icon size={16} color={colors.text} strokeWidth={2} />
    </Pressable>
  );
}

/** Rail horizontal du web (MarketplaceDiscoveryRail / MarketplaceVideoRail) : titre, « Voir tout », flèches. */
function RailShell({
  title,
  viewAllLabel = 'Voir tout',
  onViewAll,
  itemWidth,
  count,
  children,
}: {
  title: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  itemWidth: number;
  count: number;
  children: ReactNode;
}) {
  const ref = useRef<ScrollView>(null);
  const [offset, setOffset] = useState(0);
  const [size, setSize] = useState({ content: 0, view: 0 });
  const max = size.content - size.view;
  const left = offset > 8;
  const right = max > 8 && offset < max - 8;
  if (!count) return null;

  function scrollBy(direction: number) {
    ref.current?.scrollTo({ x: Math.max(0, offset + direction * (itemWidth + 12)), animated: true });
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        {/* Web : h2 → police display (index.css) ; le bouton hérite de `font: inherit` → 16px normal. */}
        <AppText className="font-display text-sm text-app-text" style={{ letterSpacing: -0.35 }}>
          {title}
        </AppText>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={6}>
            <AppText className="text-base font-normal text-brand-700 dark:text-brand-400">{viewAllLabel}</AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={{ position: 'relative' }}>
        {left ? <EdgeButton side="left" onPress={() => scrollBy(-1)} /> : null}
        {right ? <EdgeButton side="right" onPress={() => scrollBy(1)} /> : null}
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth + RAIL_GAP}
          decelerationRate="fast"
          onScroll={(e) => setOffset(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={32}
          onContentSizeChange={(w) => setSize((s) => ({ ...s, content: w }))}
          onLayout={(e) => setSize((s) => ({ ...s, view: e.nativeEvent.layout.width }))}
          style={{ marginHorizontal: -4 }}
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 4, gap: RAIL_GAP }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

export function MarketplaceDiscoveryRail({
  title,
  badge,
  listings,
  itemWidth,
  onViewAll,
}: {
  title: string;
  badge: { label: string; color: string };
  listings: ListingItem[];
  itemWidth: number;
  onViewAll?: () => void;
}) {
  return (
    <RailShell title={title} onViewAll={onViewAll} itemWidth={itemWidth} count={listings.length}>
      {listings.map((listing) => (
        <MarketplaceListingCard key={listing.id} listing={listing} width={itemWidth} badge={badge} />
      ))}
    </RailShell>
  );
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(Number(ms || 0) / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Affiche de la vidéo : le web capture l'image à 5 s (captureVideoFrameAtSeconds).
 * Sur Expo web on fait pareil avec un <video> figé à 5 s ; sur natif, la miniature stockée,
 * ou à défaut la frame à 5 s via expo-video.
 */
function VideoPoster({ video, width, height }: { video: FeedVideo; width: number; height: number }) {
  const src = String(video.videoUrl || '');
  const thumb = String(video.thumbnailUrl || '');
  if (Platform.OS === 'web' && src) {
    return createElement('video', {
      src: `${src}#t=5`,
      muted: true,
      playsInline: true,
      preload: 'metadata',
      poster: thumb || undefined,
      style: { width, height, objectFit: 'cover', display: 'block', pointerEvents: 'none' },
    });
  }
  if (thumb) return <Image source={{ uri: thumb }} style={{ width, height }} resizeMode="cover" />;
  if (src) return <VideoFramePoster videoUrl={src} width={width} height={height} />;
  return (
    <View className="flex-1 items-center justify-center">
      <Play size={36} color="rgba(255,255,255,0.8)" strokeWidth={2} />
    </View>
  );
}

function VideoRailCard({ video, width, badgeLabel }: { video: FeedVideo; width: number; badgeLabel: string }) {
  const shadows = useShadows();
  const height = DISCOVERY_CARD_HEIGHT;
  const views = Number(video.viewCount) || 0;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/feed', params: { type: 'video' } } as never)}
      style={[{ width, height, borderRadius: 22.4, overflow: 'hidden' }, shadows.card]}>
      <LinearGradient colors={['#1e293b', '#020617']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width, height }}>
        <VideoPoster video={video} width={width} height={height} />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.3)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: (height * 2) / 3, zIndex: 1 }}
        />
        <View pointerEvents="none" className="absolute left-2.5 top-2.5" style={{ zIndex: 2 }}>
          <RailBadge label={badgeLabel} color={RAIL_BADGE_COLORS.forYou} />
        </View>
        <View
          pointerEvents="none"
          className="absolute right-2.5 top-2.5 h-9 w-9 items-center justify-center rounded-full bg-black/50"
          style={{ zIndex: 2 }}>
          <Play size={16} color="#fff" strokeWidth={2} style={{ marginLeft: 2 }} />
        </View>
        <View pointerEvents="none" className="absolute inset-x-0 bottom-0 px-3 pb-1.5 pt-10" style={{ zIndex: 2 }}>
          <View className="h-5 flex-row items-center gap-1">
            <View className="rounded-full bg-white/20 px-2 py-0.5">
              <AppText className="text-[9px] font-black text-white" style={{ lineHeight: 11 }}>
                Vidéo
              </AppText>
            </View>
            <View className="rounded-full bg-white/15 px-2 py-0.5">
              <AppText className="text-[9px] font-black text-white/80" style={{ lineHeight: 11 }}>
                {video.durationMs ? formatDuration(Number(video.durationMs)) : '0:00'}
              </AppText>
            </View>
          </View>
          <AppText numberOfLines={1} className="mt-1 text-sm font-black text-white" style={{ lineHeight: 20 }}>
            {String(video.title || video.caption || '')}
          </AppText>
          <View className="mt-1 h-4 flex-row items-center justify-between gap-2">
            <AppText numberOfLines={1} className="min-w-0 shrink text-[11px] font-black text-white">
              {String(video.businessName || '\u00a0')}
            </AppText>
            <View className="shrink-0 flex-row items-center gap-1">
              <Eye size={12} color="rgba(255,255,255,0.75)" strokeWidth={2} />
              <AppText className="text-[11px] text-white/75" style={{ fontVariant: ['tabular-nums'] }}>
                {views}
              </AppText>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function MarketplaceVideoRail({
  videos,
  itemWidth,
  onViewAll,
}: {
  videos: FeedVideo[];
  itemWidth: number;
  onViewAll?: () => void;
}) {
  return (
    <RailShell title="Vidéos" onViewAll={onViewAll} itemWidth={itemWidth} count={videos.length}>
      {videos.map((video) => (
        <VideoRailCard key={video.id} video={video} width={itemWidth} badgeLabel="Vidéo" />
      ))}
    </RailShell>
  );
}
