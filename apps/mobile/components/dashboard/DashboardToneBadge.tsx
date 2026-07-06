import { Text, View } from 'react-native';

import { badgeTones } from '@/constants/dashboardTailwind';
import { cn } from '@/lib/cn';

/** Miroir de moxt-react Badge (text-[10px] font-black uppercase) */
export function DashboardToneBadge({ tone, children }: { tone: string; children: string }) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', badgeTones[tone] ?? badgeTones.success)}>
      <Text className="text-[10px] font-black uppercase tracking-[0.06em]">{children.toUpperCase()}</Text>
    </View>
  );
}
