import { Pressable, Text, ActivityIndicator, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 rounded-lg',
  md: 'px-5 py-3 rounded-xl',
  lg: 'px-7 py-3.5 rounded-2xl',
};

const textSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-brand-700 dark:bg-brand-400 shadow-sm',
    text: 'text-white dark:text-slate-950',
  },
  secondary: {
    container: 'bg-app-surface dark:bg-zinc-900 border border-app-border-md dark:border-zinc-700',
    text: 'text-app-text dark:text-zinc-50',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-app-text-muted dark:text-zinc-400',
  },
  danger: {
    container: 'bg-app-danger-soft dark:bg-red-950/50 border border-red-200 dark:border-red-900',
    text: 'text-app-danger dark:text-red-300',
  },
  teal: {
    container: 'bg-app-teal shadow-sm',
    text: 'text-white dark:text-slate-900',
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  icon,
  className,
  style,
}: ButtonProps) {
  const vs = variantClasses[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center gap-2 active:opacity-85 active:scale-[0.98]',
        sizeClasses[size],
        vs.container,
        (disabled || loading) && 'opacity-45',
        className,
      )}
      style={style}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#ffffff' : '#08705f'} />
      ) : (
        <>
          {icon}
          <Text className={cn('font-bold', textSizeClasses[size], vs.text)}>{children}</Text>
        </>
      )}
    </Pressable>
  );
}
