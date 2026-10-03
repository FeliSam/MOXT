import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';

import { FeatherIcon, type FeatherName } from '@/components/chrome/icons';
import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeContext';

/** Miroir de moxt-react/src/components/ui/Button.jsx (variants + tailles). */
export type DsButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal';
export type DsButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE: Record<DsButtonSize, { minHeight: number; gap: number; radius: number; px: number; text: string; icon: number }> = {
  xs: { minHeight: 32, gap: 6, radius: 9.6, px: 12, text: 'text-xs', icon: 14 },
  sm: { minHeight: 36, gap: 6, radius: 11.2, px: 14, text: 'text-xs', icon: 14 },
  md: { minHeight: 44, gap: 8, radius: 12, px: 20, text: 'text-sm', icon: 16 },
  lg: { minHeight: 52, gap: 10, radius: 14, px: 28, text: 'text-base', icon: 18 },
};

const CONTAINER: Record<DsButtonVariant, string> = {
  primary: 'bg-brand-700 dark:bg-brand-400',
  secondary: 'border border-app-border-md bg-app-surface',
  ghost: 'bg-transparent',
  danger: 'bg-app-danger-soft dark:bg-[#450a0a]/50',
  teal: 'bg-app-teal',
};

const TEXT: Record<DsButtonVariant, string> = {
  primary: 'text-white dark:text-slate-950',
  secondary: 'text-app-text',
  ghost: 'text-app-text-muted',
  danger: 'text-app-danger dark:text-red-300',
  teal: 'text-white dark:text-slate-900',
};

const SHADOW: Partial<Record<DsButtonVariant, ViewStyle>> = {
  primary: { boxShadow: '0 4px 14px rgba(8,112,95,0.25)' },
  teal: { boxShadow: '0 4px 14px rgba(18,191,163,0.3)' },
};

function textColor(variant: DsButtonVariant, isDark: boolean, colors: ReturnType<typeof useTheme>['colors']) {
  switch (variant) {
    case 'primary':
      return isDark ? '#020617' : '#ffffff';
    case 'secondary':
      return colors.text;
    case 'ghost':
      return colors.textMuted;
    case 'danger':
      return isDark ? '#fca5a5' : colors.danger;
    case 'teal':
      return isDark ? '#0f172a' : '#ffffff';
  }
}

export function DsButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onPress,
  className,
  style,
  accessibilityLabel,
}: {
  children?: ReactNode;
  variant?: DsButtonVariant;
  size?: DsButtonSize;
  icon?: FeatherName;
  iconRight?: FeatherName;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const { isDark, colors } = useTheme();
  const s = SIZE[size];
  const color = textColor(variant, isDark, colors);
  const isDisabled = disabled || loading;
  // Style statique (pas de fonction) : NativeWind web ignore un style-fonction combiné à className.
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={cn('flex-row items-center justify-center', CONTAINER[variant], className)}
      style={[
        {
          minHeight: s.minHeight,
          gap: s.gap,
          borderRadius: s.radius,
          paddingHorizontal: s.px,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: isDisabled ? 0.5 : 1,
        },
        !isDisabled && SHADOW[variant],
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={color} /> : null}
      {!loading && icon ? <FeatherIcon name={icon} size={s.icon} color={color} /> : null}
      {children != null ? (
        <AppText numberOfLines={1} className={cn(s.text, 'font-semibold', TEXT[variant])}>
          {children}
        </AppText>
      ) : null}
      {iconRight ? (
        <View>
          <FeatherIcon name={iconRight} size={s.icon} color={color} />
        </View>
      ) : null}
    </Pressable>
  );
}
