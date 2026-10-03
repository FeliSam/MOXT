import { View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { cn } from '@/lib/cn';
import { useShadows, useTheme } from '@/theme/ThemeContext';

type CardVariant = 'default' | 'flat' | 'finance' | 'interactive' | 'featured' | 'verified';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: ViewStyle;
}

// Même carte que le web : surface + bordure + ombre du thème (clair et sombre).
const variantClasses: Record<CardVariant, string> = {
  default: '',
  flat: '',
  finance: '',
  interactive: 'active:opacity-80',
  featured: 'overflow-hidden',
  verified: 'overflow-hidden',
};

export function Card({ children, variant = 'default', className, style }: CardProps) {
  const shadows = useShadows();
  const isFlat = variant === 'flat';
  return (
    <View
      className={cn(
        'rounded-2xl',
        isFlat
          ? 'bg-app-surface-muted p-4'
          : 'border border-app-border bg-app-surface p-4',
        variant === 'verified' && 'border-l-[3px] border-l-brand-600 dark:border-l-brand-400',
        variantClasses[variant],
        className,
      )}
      style={[
        !isFlat && (variant === 'finance' ? shadows.finance : shadows.card),
        style,
      ]}>
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
