import { useMemo } from 'react';
import { Image, Platform, Pressable, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { CORE_SERVICES, cssAngleToPoints, type BentoSize, type CoreService } from '@/constants/dashboardServices';
import { useLanguage } from '@/providers/LanguageProvider';
import { canAccessModule } from '@/store/platform';
import { useAppSelector } from '@/store/store';
import { mixColors, withAlphaColor } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

/** Hauteurs mini du web (DashboardBentoGrid SIZE_CLASS) en px. */
const MIN_H: Record<BentoSize, number> = { hero: 148, featured: 136, medium: 116, compact: 101.6 };
/** Dashboard3DIcon : hero 7.5rem, featured size-28, lg size-24, compact 4.5rem. */
const ICON: Record<BentoSize, number> = { hero: 120, featured: 112, medium: 96, compact: 72 };
const GAP = 12;
const RADIUS = 21.6;

const WEB_ICON_FILTER =
  'drop-shadow(0 2px 1px rgb(15 23 42 / 0.1)) drop-shadow(0 8px 12px rgb(15 23 42 / 0.16)) drop-shadow(0 18px 28px rgb(8 112 95 / 0.14))';
const WEB_ICON_FILTER_DARK =
  'drop-shadow(0 2px 1px rgb(0 0 0 / 0.35)) drop-shadow(0 10px 16px rgb(0 0 0 / 0.4)) drop-shadow(0 20px 32px rgb(85 221 191 / 0.12))';

function Icon3D({ source, size, dark }: { source: CoreService['image']; size: BentoSize; dark: boolean }) {
  const px = ICON[size];
  const imageStyle = {
    width: px,
    height: px,
    transform: [{ perspective: 900 }, { rotateY: '-14deg' }, { rotateX: '10deg' }],
    ...(Platform.OS === 'web' ? { filter: dark ? WEB_ICON_FILTER_DARK : WEB_ICON_FILTER } : null),
  } as unknown as ViewStyle;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', bottom: -12, right: -8, zIndex: 2, width: px, height: px }}>
      {/* .dashboard-icon-3d__shadow : ellipse floue sous l'objet */}
      <View
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '14%',
          width: '72%',
          height: '10%',
          borderRadius: 999,
          backgroundColor: dark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.18)',
          ...(Platform.OS === 'web' ? ({ filter: 'blur(6px)' } as object) : { opacity: 0.6 }),
        }}
      />
      <Image source={source} resizeMode="contain" style={imageStyle as never} />
    </View>
  );
}

function BentoTile({ item, style }: { item: CoreService; style?: ViewStyle }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { start, end } = cssAngleToPoints(item.angle);
  const tint = item.tint === 'teal' ? colors.teal : item.tint;
  const from = isDark ? item.dark : mixColors(tint, colors.surface, item.pct);
  const size = item.size;
  const showDescription = size === 'hero' || size === 'featured';
  const titleClass =
    size === 'hero' ? 'text-lg' : size === 'featured' ? 'text-base' : 'text-sm';

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(item.route as never)}
      style={({ pressed }) => [
        { minHeight: MIN_H[size], borderRadius: RADIUS, transform: [{ scale: pressed ? 0.985 : 1 }] },
        style,
      ]}>
      <LinearGradient
        colors={[from, colors.surfaceMuted]}
        start={start}
        end={end}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: RADIUS }}
      />
      <View style={{ flex: 1, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 17.6, paddingRight: 16 + 56, zIndex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View style={{ minWidth: 0 }}>
            <AppText className={`${titleClass} font-black text-app-text`} style={{ letterSpacing: -0.4 }}>
              {t(item.titleKey)}
            </AppText>
            {showDescription ? (
              <AppText numberOfLines={2} className="mt-1.5 text-xs text-app-text-muted" style={{ lineHeight: 20 }}>
                {t(item.descriptionKey)}
              </AppText>
            ) : null}
          </View>
          <View
            className="mt-3 self-start rounded-lg px-2 py-1"
            style={{ backgroundColor: withAlphaColor(colors.surface, 0.72) }}>
            <AppText className="text-[10px] font-black uppercase text-app-text-muted" style={{ letterSpacing: 0.25 }}>
              {t(item.tagKey)}
            </AppText>
          </View>
        </View>
      </View>
      <Icon3D source={item.image} size={size} dark={isDark} />
    </Pressable>
  );
}

/**
 * Grille bento du web (.dashboard-services-bento, 2 colonnes, gap 0.75rem) :
 * hero pleine largeur, featured sur 2 rangées à gauche, puis tuiles par paires.
 */
export function DashboardBento() {
  const flags = useAppSelector((s) => s.platform.flags);
  const items = useMemo(
    () => CORE_SERVICES.filter((item) => !item.devModule || canAccessModule(flags, item.devModule)),
    [flags],
  );

  const queue = [...items];
  const blocks: React.ReactNode[] = [];
  while (queue.length) {
    const item = queue.shift()!;
    if (item.size === 'hero') {
      blocks.push(<BentoTile key={item.id} item={item} />);
      continue;
    }
    if (item.size === 'featured') {
      // featured : row-span 2 → colonne droite = les deux tuiles suivantes empilées.
      const right = queue.splice(0, 2);
      blocks.push(
        <View key={item.id} style={{ flexDirection: 'row', gap: GAP }}>
          <BentoTile item={item} style={{ flex: 1 }} />
          <View style={{ flex: 1, gap: GAP }}>
            {right.map((r) => (
              <BentoTile key={r.id} item={r} />
            ))}
          </View>
        </View>,
      );
      continue;
    }
    const pair = [item, ...queue.splice(0, 1)];
    blocks.push(
      <View key={item.id} style={{ flexDirection: 'row', gap: GAP }}>
        {pair.map((p) => (
          <BentoTile key={p.id} item={p} style={{ flex: 1 }} />
        ))}
        {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
      </View>,
    );
  }

  return (
    <View accessibilityLabel="Services" style={{ gap: GAP }}>
      {blocks}
    </View>
  );
}
