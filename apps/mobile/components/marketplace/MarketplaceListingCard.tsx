import { memo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Heart, MapPin, ShoppingBag } from 'lucide-react-native';

import { formatMoney } from '@moxt/shared/utils/transfers.js';

import { listingCategoryLabel, listingTypeLabel } from '@/components/marketplace/listingMeta';
import { normalizeListingImages } from '@/utils/mediaUrl';
import { AppText } from '@/components/ui/AppText';
import { toggleFavorite } from '@/store/favorites';
import type { ListingItem } from '@/store/marketplace';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows } from '@/theme/ThemeContext';

export const DISCOVERY_CARD_HEIGHT = 320;
const RADIUS = 22.4;

/** Badge de rail du web (bg-brand-700 / amber-600 / emerald-600, 10px font-black majuscules). */
export function RailBadge({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: color, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>
      <AppText className="text-[10px] font-black uppercase text-white" style={{ letterSpacing: 0.6, lineHeight: 15 }}>
        {label}
      </AppText>
    </View>
  );
}

/** FavoriteButton du web, variante overlay (size-9, bg-black/35 ou bg-rose-600). */
export function FavoriteOverlayButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      onPress={(event) => {
        event.stopPropagation?.();
        onToggle();
      }}
      hitSlop={6}
      className="absolute right-2.5 top-2.5 z-30 h-9 w-9 items-center justify-center rounded-full"
      style={{
        backgroundColor: active ? '#e11d48' : 'rgba(0,0,0,0.35)',
        borderWidth: active ? 2 : 1,
        borderColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)',
      }}>
      <Heart size={16} color="#fff" strokeWidth={2} fill={active ? '#fff' : 'transparent'} />
    </Pressable>
  );
}

/**
 * MarketplaceListingCard du web en disposition « rail » : image plein cadre (carrousel),
 * dégradé noir en bas, pastilles type / catégorie, titre, prix et ville, cœur en haut à droite.
 */
function MarketplaceListingCardComponent({
  listing,
  width,
  height = DISCOVERY_CARD_HEIGHT,
  badge,
}: {
  listing: ListingItem;
  width: number;
  height?: number;
  badge?: { label: string; color: string } | null;
}) {
  const dispatch = useAppDispatch();
  const shadows = useShadows();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const liked = useAppSelector((s) => s.favorites.items.some((f) => f.type === 'listing' && f.id === listing.id));
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [slide, setSlide] = useState(0);
  const images = normalizeListingImages(listing.images).filter((src) => src && !failed.has(src));
  const multi = images.length > 1;
  const detailPath = `/listing/${listing.id}`;

  function open() {
    router.push(detailPath as never);
  }

  function toggleLike() {
    if (!userId) {
      router.push('/login' as never);
      return;
    }
    dispatch(
      toggleFavorite({
        userId,
        id: listing.id,
        type: 'listing',
        title: listing.title,
        subtitle: listing.city,
        path: `/marketplace/${listing.id}`,
      }),
    );
  }

  return (
    <View style={[{ width, height, borderRadius: RADIUS, overflow: 'hidden' }, shadows.card]}>
      <LinearGradient
        colors={['#0e7490', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: '100%', height: '100%' }}>
        {images.length ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={multi}
            onScroll={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / width);
              if (next !== slide) setSlide(next);
            }}
            scrollEventThrottle={32}
            style={{ width, height }}>
            {images.map((src, index) => (
              <Pressable key={`${src}-${index}`} onPress={open} style={{ width, height }}>
                <Image
                  source={{ uri: src }}
                  style={{ width, height }}
                  resizeMode="cover"
                  onError={() => setFailed((cur) => new Set(cur).add(src))}
                  {...(Platform.OS === 'web' ? { draggable: false } : {})}
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable onPress={open} className="flex-1 items-center justify-center">
            <ShoppingBag size={36} color="rgba(255,255,255,0.9)" strokeWidth={2} />
          </Pressable>
        )}

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.3)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: (height * 2) / 3, zIndex: 1 }}
        />

        {badge ? (
          <View pointerEvents="none" className="absolute left-2.5 top-2.5" style={{ zIndex: 2 }}>
            <RailBadge label={badge.label} color={badge.color} />
          </View>
        ) : null}

        <View pointerEvents="none" className="absolute inset-x-0 bottom-0 p-3" style={{ zIndex: 2 }}>
          <View className="mb-1.5 flex-row flex-wrap gap-1">
            <View className="rounded-full bg-white/20 px-2 py-0.5">
              <AppText className="text-[9px] font-black text-white">{listingTypeLabel(listing.type)}</AppText>
            </View>
            {listing.category ? (
              <View className="rounded-full bg-white/15 px-2 py-0.5">
                <AppText className="text-[9px] font-black text-white/80">
                  {listingCategoryLabel(listing.type, listing.category)}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText
            numberOfLines={3}
            className="font-display text-sm text-white"
            style={{ lineHeight: 19.25, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } }}>
            {listing.title}
          </AppText>
          <View className="mt-1.5 flex-row items-end justify-between gap-2">
            <AppText
              className="shrink text-sm font-black text-white"
              style={{ fontVariant: ['tabular-nums'], textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2 }}>
              {listing.price ? formatMoney(listing.price, listing.currency || 'RUB') : 'Sur devis'}
            </AppText>
            {listing.city ? (
              <View className="shrink-0 flex-row items-center gap-1" style={{ maxWidth: 128 }}>
                <MapPin size={11} color="rgba(255,255,255,0.75)" strokeWidth={2} />
                <AppText numberOfLines={1} className="text-[11px] text-white/75">
                  {listing.city}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {multi ? (
          <View pointerEvents="none" className="absolute inset-x-0 top-2.5 flex-row justify-center gap-1" style={{ zIndex: 2 }}>
            {images.map((src, index) => (
              <View
                key={`${src}-${index}`}
                className="h-1 rounded-full"
                style={{ width: index === slide ? 16 : 6, backgroundColor: index === slide ? '#fff' : 'rgba(255,255,255,0.5)' }}
              />
            ))}
          </View>
        ) : null}

        <FavoriteOverlayButton active={liked} onToggle={toggleLike} />
      </LinearGradient>
    </View>
  );
}

export const MarketplaceListingCard = memo(MarketplaceListingCardComponent);
