import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight, ChevronRight, type LucideIcon } from 'lucide-react-native';

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
  Icon,
  iconClass,
  iconColor = '#08705f',
  title,
  subtitle,
  onOpen,
}: {
  Icon: LucideIcon;
  iconClass: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  onOpen?: () => void;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className={cn(tw.cardIcon, iconClass)}>
        <Icon size={20} color={iconColor} strokeWidth={2.2} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className={cn(tw.cardTitle, 'text-lg font-display')}>{title}</Text>
        <Text className={tw.cardSubtitle}>{subtitle}</Text>
      </View>
      {onOpen ? (
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-2xl bg-app-surface-muted dark:bg-zinc-800"
          onPress={onOpen}>
          <ArrowUpRight size={16} color="#6b7280" strokeWidth={2.4} />
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
