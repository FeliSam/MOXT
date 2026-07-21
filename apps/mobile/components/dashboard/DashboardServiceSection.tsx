import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';

import {
  CORE_SERVICES,
  TRUST_HIGHLIGHTS,
  dashboardWidths,
  tw,
} from '@/constants/dashboardTailwind';
import { DashboardSectionHeading } from '@/components/dashboard/DashboardSectionHeading';
import { DashboardToneBadge } from '@/components/dashboard/DashboardToneBadge';
import { cn } from '@/lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BentoSize = 'hero' | 'featured' | 'medium' | 'compact';

const SURFACE: Record<string, string> = {
  transfers: 'bg-emerald-50 dark:bg-emerald-950/35',
  p2p: 'bg-cyan-50 dark:bg-cyan-950/30',
  marketplace: 'bg-zinc-100 dark:bg-zinc-900',
  parcels: 'bg-amber-50/80 dark:bg-amber-950/25',
  jobs: 'bg-white dark:bg-zinc-900',
  exchangers: 'bg-white dark:bg-zinc-900',
  businesses: 'bg-white dark:bg-zinc-900',
  events: 'bg-zinc-100 dark:bg-zinc-900',
  news: 'bg-zinc-100 dark:bg-zinc-900',
};

function BentoTile({
  service,
  size,
  half,
}: {
  service: (typeof CORE_SERVICES)[number];
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
      onPress={() => router.push(service.route as any)}
      onPressIn={() => {
        scale.value = withSpring(0.975, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      style={[{ minHeight: minH }, half ? { width: '48.5%' } : { width: '100%' }, animatedStyle]}
      className={cn(
        'relative overflow-visible rounded-[1.35rem] p-4',
        SURFACE[service.id] || 'bg-white dark:bg-zinc-900',
      )}
      accessibilityRole="button"
      accessibilityLabel={service.title}>
      <View className="z-[1] max-w-[72%] gap-1.5">
        <Text className={titleClass}>{service.title}</Text>
        {(size === 'hero' || size === 'featured') && (
          <Text className="text-xs leading-5 text-app-text-muted dark:text-zinc-400" numberOfLines={2}>
            {service.description}
          </Text>
        )}
        <View className="mt-2 self-start">
          <DashboardToneBadge tone={service.tone}>{service.tag}</DashboardToneBadge>
        </View>
      </View>
      <View
        className={cn(
          'absolute items-center justify-center rounded-2xl bg-brand-100/80 dark:bg-brand-950/50',
          iconBox,
          service.iconPos === 'tr' && '-right-1 -top-1',
          service.iconPos === 'bl' && '-bottom-1 -left-1',
          (service.iconPos === 'br' || !service.iconPos) && '-bottom-1 -right-1',
        )}
        pointerEvents="none">
        <service.Icon size={iconSize} color="#08705f" strokeWidth={2.1} />
      </View>
    </AnimatedPressable>
  );
}

export function DashboardServiceSection() {
  const hero = CORE_SERVICES.find((s) => s.size === 'hero');
  const featured = CORE_SERVICES.find((s) => s.size === 'featured');
  const mediums = CORE_SERVICES.filter((s) => s.size === 'medium');
  const compacts = CORE_SERVICES.filter((s) => s.size === 'compact');

  return (
    <View className="gap-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={tw.carouselTrack}>
        {TRUST_HIGHLIGHTS.map(([title, description], index) => (
          <View key={title} style={{ width: dashboardWidths.fourUp }} className={tw.trustCardOuter}>
            <Text className={tw.trustNumber}>0{index + 1}</Text>
            <Text className={tw.trustTitle}>{title}</Text>
            <Text className={tw.trustDesc}>{description}</Text>
          </View>
        ))}
      </ScrollView>

      <DashboardSectionHeading
        title="Services essentiels"
        linkLabel="Tout explorer"
        onPress={() => router.push('/organization' as any)}
      />

      <View className="gap-3 overflow-visible">
        {hero ? <BentoTile service={hero} size="hero" /> : null}

        <View className="flex-row flex-wrap justify-between gap-y-3 overflow-visible">
          {featured ? <BentoTile service={featured} size="featured" half /> : null}
          {mediums[0] ? <BentoTile service={mediums[0]} size="medium" half /> : null}
          {mediums[1] ? <BentoTile service={mediums[1]} size="medium" half /> : null}
          {compacts.map((service) => (
            <BentoTile key={service.id} service={service} size="compact" half />
          ))}
        </View>
      </View>
    </View>
  );
}
