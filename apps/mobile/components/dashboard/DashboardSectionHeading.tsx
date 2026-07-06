import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { tw } from '@/constants/dashboardTailwind';
import { cn } from '@/lib/cn';

export function DashboardSectionHeading({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 px-4">
      <View className="min-w-0 flex-1">
        <Text className={tw.sectionHeadingEyebrow}>DÉCOUVRIR MOXT</Text>
        <Text className={tw.sectionHeadingTitle}>{title}</Text>
      </View>
      {linkLabel && onPress ? (
        <Pressable className={tw.sectionHeadingPill} onPress={onPress}>
          <Text className={tw.sectionHeadingPillText}>{linkLabel} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DashboardCardHeader({
  emoji,
  iconClass,
  title,
  subtitle,
  onOpen,
}: {
  emoji: string;
  iconClass: string;
  title: string;
  subtitle: string;
  onOpen?: () => void;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className={cn(tw.cardIcon, iconClass)}>
        <Text className="text-lg">{emoji}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className={cn(tw.cardTitle, 'text-lg font-display')}>{title}</Text>
        <Text className={tw.cardSubtitle}>{subtitle}</Text>
      </View>
      {onOpen ? (
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-2xl bg-app-surface-muted dark:bg-zinc-800"
          onPress={onOpen}>
          <Text className="text-sm text-app-text dark:text-zinc-50">↗</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DashboardArrowLink({ to, label }: { to: string; label: string }) {
  return (
    <Pressable onPress={() => router.push(to as any)}>
      <Text className="text-sm font-black text-brand-700 dark:text-brand-400">{label} →</Text>
    </Pressable>
  );
}
