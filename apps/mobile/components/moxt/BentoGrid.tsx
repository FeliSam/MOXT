import { Image, Platform, Pressable, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/ui/AppText';
import type { BentoItem, BentoSize, BentoSurface } from '@/constants/moxtHub';
import { useLanguage } from '@/providers/LanguageProvider';
import { mixColors, withAlphaColor } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

/** Grille bento (DashboardBentoGrid du web) : 2 colonnes, gap 0.75rem, tuiles rayon 1.35rem. */
const GAP = 12;
const MIN_HEIGHT: Record<BentoSize, number> = { hero: 148, featured: 136, medium: 116, compact: 101.6 };
const ICON: Record<BentoSize, number> = { hero: 120, featured: 112, medium: 96, compact: 72 };
const TITLE: Record<BentoSize, string> = { hero: 'text-lg', featured: 'text-base', medium: 'text-sm', compact: 'text-sm' };

/** Angle CSS → points start / end de LinearGradient. */
function gradientPoints(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.sin(rad);
  const y = -Math.cos(rad);
  const k = Math.max(Math.abs(x), Math.abs(y));
  return {
    start: { x: 0.5 - x / (2 * k), y: 0.5 - y / (2 * k) },
    end: { x: 0.5 + x / (2 * k), y: 0.5 + y / (2 * k) },
  };
}

function BentoTile({ item, style }: { item: BentoItem; style?: ViewStyle }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const surface: BentoSurface = item.surface;
  const tint = surface.tint === 'var(--app-teal)' ? colors.teal : surface.tint;
  const from = isDark ? surface.darkTint : mixColors(tint, colors.surface, surface.ratio);
  const { start, end } = gradientPoints(surface.angle);
  const showDescription = (item.size === 'hero' || item.size === 'featured') && Boolean(item.descriptionKey);
  const icon = ICON[item.size];

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t(item.titleKey)}
      onPress={item.route ? () => router.push(item.route as never) : undefined}
      style={({ pressed }) => [
        { minHeight: MIN_HEIGHT[item.size], borderRadius: 21.6, transform: [{ scale: pressed ? 0.985 : 1 }] },
        style,
      ]}>
      <LinearGradient
        colors={[from, colors.surfaceMuted]}
        start={start}
        end={end}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 21.6 }}
      />
      <View style={{ flex: 1, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 17.6, paddingRight: item.size === 'hero' ? 16 + 56 : 16, justifyContent: 'space-between', zIndex: 1 }}>
        <View style={{ minWidth: 0 }}>
          <AppText display className={`${TITLE[item.size]} text-app-text`} style={{ letterSpacing: item.size === 'hero' ? -0.45 : item.size === 'featured' ? -0.4 : -0.35 }}>
            {t(item.titleKey)}
          </AppText>
          {showDescription && item.descriptionKey ? (
            <AppText numberOfLines={2} className="text-xs text-app-text-muted" style={{ marginTop: 6, lineHeight: 20 }}>
              {t(item.descriptionKey)}
            </AppText>
          ) : null}
        </View>
        {item.tagKey ? (
          <View style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: withAlphaColor(colors.surface, 0.72), paddingHorizontal: 8, paddingVertical: 4 }}>
            <AppText className="text-[10px] font-black uppercase text-app-text-muted" style={{ letterSpacing: 0.25, lineHeight: 15 }}>
              {t(item.tagKey)}
            </AppText>
          </View>
        ) : null}
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -12, right: -8, zIndex: 2 }}>
        <Image
          source={item.image}
          resizeMode="contain"
          style={{
            width: icon,
            height: icon,
            transform: [{ perspective: 900 }, { rotateY: '-14deg' }, { rotateX: '10deg' }],
            ...(Platform.OS === 'ios'
              ? {}
              : {
                  filter: isDark
                    ? 'drop-shadow(0px 2px 1px rgba(0,0,0,0.35)) drop-shadow(0px 10px 16px rgba(0,0,0,0.4))'
                    : 'drop-shadow(0px 2px 1px rgba(15,23,42,0.1)) drop-shadow(0px 8px 12px rgba(15,23,42,0.16))',
                }),
          }}
        />
      </View>
    </Pressable>
  );
}

/**
 * Disposition : hero pleine largeur ; featured sur 2 rangées à gauche avec les
 * deux medium empilés à droite ; compacts par paires.
 */
export function BentoGrid({ items }: { items: BentoItem[] }) {
  const hero = items.filter((i) => i.size === 'hero');
  const featured = items.find((i) => i.size === 'featured');
  const mediums = items.filter((i) => i.size === 'medium');
  const compacts = items.filter((i) => i.size === 'compact');
  const pairs: BentoItem[][] = [];
  for (let i = 0; i < compacts.length; i += 2) pairs.push(compacts.slice(i, i + 2));

  return (
    <View style={{ gap: GAP }}>
      {hero.map((item) => (
        <BentoTile key={item.id} item={item} />
      ))}
      {featured || mediums.length ? (
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {featured ? <BentoTile item={featured} style={{ flex: 1 }} /> : null}
          <View style={{ flex: 1, gap: GAP }}>
            {mediums.map((item) => (
              <BentoTile key={item.id} item={item} style={{ flex: 1 }} />
            ))}
          </View>
        </View>
      ) : null}
      {pairs.map((pair) => (
        <View key={pair.map((p) => p.id).join('-')} style={{ flexDirection: 'row', gap: GAP }}>
          {pair.map((item) => (
            <BentoTile key={item.id} item={item} style={{ flex: 1 }} />
          ))}
          {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
