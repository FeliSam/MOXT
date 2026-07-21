import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';

import { QUICK_ACTIONS } from '@/constants/dashboardTailwind';
import { cn } from '@/lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BentoSize = 'hero' | 'featured' | 'medium' | 'compact';

const SURFACE: Record<string, string> = {
  'qa-transfer': 'bg-emerald-100 dark:bg-emerald-950/40',
  'qa-listing': 'bg-cyan-100 dark:bg-cyan-950/35',
  'qa-parcel': 'bg-blue-50 dark:bg-blue-950/30',
  'qa-job': 'bg-amber-100/90 dark:bg-amber-950/30',
  'qa-event': 'bg-violet-50 dark:bg-violet-950/30',
};

function BentoTile({
  action,
  size,
  half,
}: {
  action: (typeof QUICK_ACTIONS)[number];
  size: BentoSize;
  half?: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const minH =
    size === 'hero' ? 148 : size === 'featured' ? 168 : size === 'medium' ? 124 : 108;
  const iconBox =
    size === 'hero' ? 'h-20 w-20' : size === 'featured' ? 'h-16 w-16' : 'h-12 w-12';
  const iconSize = size === 'hero' ? 36 : size === 'featured' ? 30 : 22;
  const titleClass =
    size === 'hero'
      ? 'text-lg font-black text-app-text dark:text-zinc-50'
      : 'text-sm font-black text-app-text dark:text-zinc-50';

  return (
    <AnimatedPressable
      onPress={() => router.push(action.route as any)}
      onPressIn={() => {
        scale.value = withSpring(0.975, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      style={[{ minHeight: minH }, half ? { width: '48.5%' } : { width: '100%' }, animatedStyle]}
      className={cn(
        'relative overflow-visible rounded-[1.35rem] p-4',
        SURFACE[action.id] || 'bg-white dark:bg-zinc-900',
      )}
      accessibilityRole="button"
      accessibilityLabel={action.label}>
      <View className="z-[1] max-w-[72%] gap-1.5">
        <Text className={titleClass}>{action.label}</Text>
        {(size === 'hero' || size === 'featured') && (
          <Text className="text-xs leading-5 text-app-text-muted dark:text-zinc-400" numberOfLines={2}>
            {action.description}
          </Text>
        )}
      </View>
      <View
        className={cn(
          'absolute items-center justify-center rounded-2xl bg-brand-100/80 dark:bg-brand-950/50',
          iconBox,
          action.iconPos === 'tr' && '-right-1 -top-1',
          action.iconPos === 'bl' && '-bottom-1 -left-1',
          (action.iconPos === 'br' || !action.iconPos) && '-bottom-1 -right-1',
        )}
        pointerEvents="none">
        <action.Icon size={iconSize} color={action.tint} strokeWidth={2.1} />
      </View>
    </AnimatedPressable>
  );
}

export function DashboardQuickActionsSection() {
  const hero = QUICK_ACTIONS.find((a) => a.size === 'hero');
  const featured = QUICK_ACTIONS.find((a) => a.size === 'featured');
  const mediums = QUICK_ACTIONS.filter((a) => a.size === 'medium');
  const compacts = QUICK_ACTIONS.filter((a) => a.size === 'compact');

  return (
    <View className="gap-3 overflow-visible px-4">
      <Text className="text-2xl font-black tracking-[-0.035em] text-app-text dark:text-zinc-50">
        Actions rapides
      </Text>

      {hero ? <BentoTile action={hero} size="hero" /> : null}

      <View className="flex-row flex-wrap justify-between gap-y-3 overflow-visible">
        {featured ? <BentoTile action={featured} size="featured" half /> : null}
        {mediums[0] ? <BentoTile action={mediums[0]} size="medium" half /> : null}
        {mediums[1] ? <BentoTile action={mediums[1]} size="medium" half /> : null}
        {compacts.map((action) => (
          <BentoTile key={action.id} action={action} size="compact" half />
        ))}
      </View>
    </View>
  );
}
