import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileMoreSheet, PlusTabIcon } from '@/components/navigation/MobileMoreSheet';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { bottomNavigationItems } from '@moxt/shared';

const TAB_ICONS: Record<string, { ios: string; android: string }> = {
  transfers: { ios: 'arrow.left.arrow.right', android: 'swap_horiz' },
  index: { ios: 'house.fill', android: 'home' },
  marketplace: { ios: 'bag.fill', android: 'shopping_bag' },
  parcels: { ios: 'shippingbox.fill', android: 'inventory_2' },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const icons = TAB_ICONS[routeName];
  const color = focused ? '#08705f' : '#6b7280';

  if (!icons) {
    return (
      <Text className={cn('text-lg font-bold', focused ? 'text-brand-700 dark:text-brand-400' : 'text-app-text-muted')}>
        •
      </Text>
    );
  }

  return (
    <SymbolView
      name={icons as any}
      tintColor={focused ? '#08705f' : '#9ca3af'}
      size={Platform.OS === 'ios' ? 20 : 22}
      fallback={<Text style={{ color, fontSize: 18 }}>{routeName[0]?.toUpperCase()}</Text>}
    />
  );
}

/** Barre flottante partagée — tabs principaux + Plus */
export function BottomNavBar({
  activeRoute,
  onTabPress,
}: {
  activeRoute: string;
  onTabPress: (mobileRoute: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { translateLabel } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <View
        className="absolute left-3 right-3 flex-row gap-0.5 rounded-2xl bg-white/95 p-1 shadow-lg dark:bg-zinc-900/95"
        style={{ bottom: Math.max(insets.bottom, 12) }}>
        {bottomNavigationItems.map((item) => {
          const focused = activeRoute === item.mobileRoute;
          const label = translateLabel(item.label);

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={() => onTabPress(item.mobileRoute)}
              className={cn(
                'min-h-[3.75rem] flex-1 items-center justify-center gap-0.5 rounded-xl px-1 py-1.5',
                focused && 'border-t-[3px] border-brand-700 bg-app-surface-muted dark:border-brand-400 dark:bg-zinc-800',
              )}>
              <TabIcon routeName={item.mobileRoute} focused={focused} />
              <Text
                numberOfLines={1}
                className={cn(
                  'w-full text-center text-[11px] font-semibold',
                  focused ? 'text-brand-700 dark:text-brand-400' : 'text-app-text-muted dark:text-zinc-500',
                )}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plus de services"
          onPress={() => setMoreOpen(true)}
          className="min-h-[3.75rem] flex-1 items-center justify-center gap-0.5 rounded-xl px-1 py-1.5">
          <PlusTabIcon />
          <Text className="w-full text-center text-[11px] font-semibold text-app-text-muted dark:text-zinc-500">
            {translateLabel('Plus')}
          </Text>
        </Pressable>
      </View>

      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

/** Barre basse autonome (hors Tabs) — pour les stacks transfer, etc. */
export function AppBottomTabBar({ activeRoute = 'transfers' }: { activeRoute?: string }) {
  return (
    <BottomNavBar
      activeRoute={activeRoute}
      onTabPress={(route) => {
        router.push(`/(tabs)/${route}` as any);
      }}
    />
  );
}

/** Espace réservé sous le contenu scrollable pour ne pas masquer la barre */
export const BOTTOM_NAV_PADDING = 120;
