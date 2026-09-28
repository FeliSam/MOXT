import type { ReactNode } from 'react';
import { View } from 'react-native';

import { FeatherIcon, type FeatherName } from '@/components/chrome/icons';
import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeContext';

/** Miroir de moxt-react/src/components/ui/Alert.jsx. */
const VARIANTS: Record<'error' | 'info' | 'success' | 'warning', { box: string; text: string; icon: FeatherName; light: string; dark: string }> = {
  error: { box: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40', text: 'text-red-800 dark:text-red-200', icon: 'alert-circle', light: '#991b1b', dark: '#fecaca' },
  info: { box: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-200', icon: 'info', light: '#1e40af', dark: '#bfdbfe' },
  success: { box: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-200', icon: 'check-circle', light: '#065f46', dark: '#a7f3d0' },
  warning: { box: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40', text: 'text-amber-900 dark:text-amber-200', icon: 'alert-circle', light: '#78350f', dark: '#fde68a' },
};

export function DsAlert({
  title,
  children,
  variant = 'info',
  icon,
}: {
  title?: string;
  children?: ReactNode;
  variant?: keyof typeof VARIANTS;
  icon?: FeatherName;
}) {
  const { isDark } = useTheme();
  const v = VARIANTS[variant];
  return (
    <View className={cn('flex-row gap-3 rounded-xl border p-3.5', v.box)} accessibilityRole="alert">
      <FeatherIcon name={icon ?? v.icon} size={18} color={isDark ? v.dark : v.light} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? <AppText className={cn('text-sm font-bold', v.text)}>{title}</AppText> : null}
        {typeof children === 'string' ? (
          <AppText className={cn('text-sm', v.text)} style={{ marginTop: title ? 4 : 0, lineHeight: 20, opacity: title ? 0.9 : 1 }}>
            {children}
          </AppText>
        ) : (
          <View style={{ marginTop: title ? 4 : 0 }}>{children}</View>
        )}
      </View>
    </View>
  );
}
