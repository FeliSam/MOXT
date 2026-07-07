import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftRight, Home, ShoppingBag, Package, type LucideIcon } from 'lucide-react-native';

import { MobileMoreSheet, PlusTabIcon } from '@/components/navigation/MobileMoreSheet';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { bottomNavigationItems } from '@moxt/shared';

const TAB_ICONS: Record<string, LucideIcon> = {
  transfers: ArrowLeftRight,
  index: Home,
  marketplace: ShoppingBag,
  parcels: Package,
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const Icon = TAB_ICONS[routeName];
  const color = focused ? '#08705f' : '#9ca3af';
  if (!Icon) {
    return <Text style={{ color, fontSize: 18, fontWeight: '700' }}>•</Text>;
  }
  return <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />;
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
