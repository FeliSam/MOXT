import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { useShadows } from '@/theme/ThemeContext';

/** Miroir de moxt-react/src/components/ui/Card.jsx — variant default / compact / flat. */
export function DsCard({
  children,
  variant = 'default',
  className,
  style,
}: {
  children: ReactNode;
  variant?: 'default' | 'compact' | 'flat';
  className?: string;
  style?: ViewStyle;
}) {
  const shadows = useShadows();
  if (variant === 'flat') {
    return (
      <View className={cn('rounded-card bg-app-surface-muted p-4', className)} style={style}>
        {children}
      </View>
    );
  }
  return (
    <View
      className={cn('min-w-0 rounded-card-lg border border-app-border bg-app-surface p-4', className)}
      style={[shadows.card, style]}>
      {children}
    </View>
  );
}
