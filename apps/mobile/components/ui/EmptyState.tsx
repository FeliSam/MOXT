import type { ComponentType, ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/**
 * EmptyState du web (taille md, ton par défaut) : cadre pointillé min-h-52 p-7,
 * (couleurs par classes : suivent la portée ThemeScope) icône facultative dans un carré muted, titre font-black, description muted.
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: IconType;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      className="border border-dashed border-app-border bg-app-surface"
      style={{ minHeight: 208, padding: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
      {Icon ? (
        <View className="bg-app-surface-muted" style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} color={colors.textFaint} strokeWidth={2} />
        </View>
      ) : null}
      {title ? (
        <AppText className="text-base font-black text-app-text" style={{ marginTop: Icon ? 12 : 0, textAlign: 'center' }}>
          {title}
        </AppText>
      ) : null}
      {description ? (
        <AppText className="mt-2 text-sm text-app-text-muted" style={{ maxWidth: 320, textAlign: 'center' }}>
          {description}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}
