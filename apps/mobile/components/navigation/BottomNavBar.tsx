import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeatherIcon, type FeatherName } from '@/components/chrome/icons';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { withAlphaColor } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { bottomNavigationItems, moreNavigationItem } from '@moxt/shared';
import { layoutTokens } from '@moxt/shared/design/index.js';

const L = layoutTokens as {
  bottomNavInset: number;
  bottomNavPad: number;
  bottomNavSlotMinHeight: number;
  bottomNavIcon: number;
  bottomNavIndicator: number;
  bottomNavInactiveOpacity: number;
};

type NavEntry = { id: string; label: string; labelKey: string | null; mobileRoute: string; icon: string };

/** .bottom-nav-shell { padding: 0.2rem; padding-bottom: var(--bottom-nav-pad) } */
const PAD_X = 3.2;

const ITEMS: NavEntry[] = [...(bottomNavigationItems as NavEntry[]), moreNavigationItem as NavEntry];

/**
 * Barre du bas flottante — miroir de moxt-react BottomNavigation.jsx :
 * Transfert · Moxt · Market · Fil · Plus, indicateur glissant (fond surface-muted
 * + trait intérieur haut 3px accent / teal en sombre).
 */
export function BottomNavBar({
  activeRoute,
  onTabPress,
}: {
  activeRoute: string;
  onTabPress: (mobileRoute: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const activeIndex = ITEMS.findIndex((item) => item.mobileRoute === activeRoute);
  const activeColor = isDark ? colors.teal : colors.accent;
  const inactiveColor = withAlphaColor(colors.text, L.bottomNavInactiveOpacity);

  const [slotWidth, setSlotWidth] = useState(0);
  const translate = useRef(new Animated.Value(0)).current;
  const gap = 2;

  useEffect(() => {
    if (activeIndex < 0 || !slotWidth) return;
    Animated.timing(translate, {
      toValue: activeIndex * (slotWidth + gap),
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [activeIndex, slotWidth, translate]);

  const onLayout = (event: LayoutChangeEvent) => {
    const inner = event.nativeEvent.layout.width - PAD_X * 2 - 2; // bordure 1px × 2
    setSlotWidth((inner - gap * (ITEMS.length - 1)) / ITEMS.length);
  };

  const labelOf = (item: NavEntry) => (item.labelKey ? t(item.labelKey) : item.label);

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('nav.mobileQuickAria')}
      onLayout={onLayout}
      style={[
        {
          position: 'absolute',
          left: L.bottomNavInset,
          right: L.bottomNavInset,
          bottom: Math.max(L.bottomNavInset, insets.bottom),
          borderRadius: 16,
          borderWidth: 1,
          borderColor: withAlphaColor(colors.border, 0.75),
          overflow: 'hidden',
          backgroundColor: withAlphaColor(colors.surface, 0.92),
        },
        shadows.bottomNav,
      ]}>
      {Platform.OS !== 'android' ? (
        <BlurView
          intensity={24}
          tint={isDark ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: withAlphaColor(colors.surface, 0.92) }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap, paddingTop: PAD_X, paddingHorizontal: PAD_X, paddingBottom: L.bottomNavPad }}>
        {activeIndex >= 0 && slotWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: L.bottomNavPad,
              bottom: L.bottomNavPad,
              left: PAD_X,
              width: slotWidth,
              borderRadius: 12,
              backgroundColor: colors.surfaceMuted,
              boxShadow: `inset 0 ${L.bottomNavIndicator}px 0 ${activeColor}`,
              transform: [{ translateX: translate }],
            }}
          />
        ) : null}

        {ITEMS.map((item, index) => {
          const focused = index === activeIndex;
          const color = focused ? activeColor : inactiveColor;
          const label = labelOf(item);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.id === 'more' ? t('nav.moreServicesAria') : label}
              onPress={() => onTabPress(item.mobileRoute)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: L.bottomNavSlotMinHeight,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                borderRadius: 12,
                paddingHorizontal: 4,
                paddingVertical: 6,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}>
              <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <FeatherIcon name={item.icon as FeatherName} size={L.bottomNavIcon} color={color} />
              </View>
              <AppText
                numberOfLines={1}
                style={{ width: '100%', textAlign: 'center', fontSize: 11, lineHeight: 11, fontWeight: '600', color }}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Barre basse autonome (hors Tabs) — pour les piles transfer, etc. */
export function AppBottomTabBar({ activeRoute = 'transfers' }: { activeRoute?: string }) {
  return (
    <BottomNavBar
      activeRoute={activeRoute}
      onTabPress={(route) => {
        if (route === 'transfers') {
          router.push('/transfer/wizard' as never);
          return;
        }
        router.push((route === 'index' ? '/(tabs)' : `/(tabs)/${route}`) as never);
      }}
    />
  );
}

/** Espace réservé sous le contenu défilant (--bottom-nav-clearance-loose : 7.5rem). */
export const BOTTOM_NAV_PADDING = 120;
