import { Pressable, ScrollView, Text, View } from 'react-native';
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

export function DashboardServiceSection() {
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={tw.carouselTrack}>
        {CORE_SERVICES.map((service) => (
          <Pressable key={service.title} onPress={() => router.push(service.route as any)}>
            <View
              style={{ width: dashboardWidths.service }}
              className={cn(tw.serviceCard, 'bg-white shadow-sm dark:bg-zinc-900')}>
              <View className="mx-auto -mb-1 h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950/45">
                <Text className="text-[2rem]">{service.emoji}</Text>
              </View>
              <Text className={tw.serviceTitle}>{service.title}</Text>
              <Text className={tw.serviceDesc} numberOfLines={3}>
                {service.description}
              </Text>
              <View className="mt-4">
                <DashboardToneBadge tone={service.tone}>{service.tag}</DashboardToneBadge>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
