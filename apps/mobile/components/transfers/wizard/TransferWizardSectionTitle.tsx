import { Text, View } from 'react-native';

import { twTransfer } from '@/constants/transferTailwind';
import { cn } from '@/lib/cn';

export function TransferWizardSectionTitle({
  emoji,
  label,
  iconClass,
}: {
  emoji: string;
  label: string;
  iconClass?: string;
}) {
  return (
    <View className={twTransfer.sectionTitle}>
      <View className={cn(twTransfer.sectionIcon, iconClass)}>
        <Text className="text-base">{emoji}</Text>
      </View>
      <Text className={twTransfer.sectionLabel}>{label}</Text>
    </View>
  );
}
