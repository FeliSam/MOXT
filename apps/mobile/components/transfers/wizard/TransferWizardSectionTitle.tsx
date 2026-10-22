import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

import { twTransfer } from '@/constants/transferTailwind';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeContext';
import { brand } from '@/theme/colors';

export function TransferWizardSectionTitle({
  icon: Icon,
  emoji,
  label,
  iconClass,
}: {
  icon?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  emoji?: string;
  label: string;
  iconClass?: string;
}) {
  const { isDark } = useTheme();
  const iconColor = isDark ? brand[400] : brand[700];

  return (
    <View className={twTransfer.sectionTitle}>
      <View className={cn(twTransfer.sectionIcon, iconClass)}>
        {Icon ? (
          <Icon size={18} color={iconColor} strokeWidth={2.2} />
        ) : (
          <Text className="text-base">{emoji}</Text>
        )}
      </View>
      <Text className={twTransfer.sectionLabel}>{label}</Text>
    </View>
  );
}

