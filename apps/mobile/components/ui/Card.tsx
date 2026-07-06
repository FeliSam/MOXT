import { View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeContext';

type CardVariant = 'default' | 'flat' | 'finance' | 'interactive' | 'featured' | 'verified';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: ViewStyle;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'shadow-sm',
  flat: '',
  finance: 'shadow-md',
  interactive: 'shadow-sm active:opacity-90 active:border-brand-200 dark:active:border-brand-800',
  featured: 'shadow-md overflow-hidden',
  verified: 'shadow-sm border-l-[3px] border-l-brand-600 dark:border-l-brand-400',
};

export function Card({ children, variant = 'default', className, style }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl',
        variant === 'flat'
          ? 'bg-app-surface-muted dark:bg-zinc-900 p-4'
          : 'bg-app-surface dark:bg-zinc-900 p-5',
        variantClasses[variant],
        className,
      )}
      style={style}>
      {children}
    </View>
  );
}

interface AppScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  className?: string;
  style?: ViewStyle;
  padded?: boolean;
}

/** Conteneur racine aligné sur le fond web (--app-bg) + StatusBar */
export function AppScreen({ children, edges = ['top'], className, style, padded = false }: AppScreenProps) {
  const { isDark } = useTheme();

  return (
    <SafeAreaView
      className={cn('flex-1 bg-app-bg dark:bg-[#0c0c0e]', padded && 'px-5', className)}
      style={style}
      edges={edges}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </SafeAreaView>
  );
}
