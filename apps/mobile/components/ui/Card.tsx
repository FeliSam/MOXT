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

// Séparation par nuances de surface (pas de bordure, ombre quasi nulle).
// Élévation en dark = teinte plus claire ; en light = surface blanche + micro-ombre.
const variantClasses: Record<CardVariant, string> = {
  default: '',
  flat: '',
  finance: '',
  interactive: 'active:opacity-80',
  featured: 'overflow-hidden',
  verified: 'overflow-hidden',
};

export function Card({ children, variant = 'default', className, style }: CardProps) {
  const isFlat = variant === 'flat';
  return (
    <View
      className={cn(
        'rounded-2xl',
        isFlat
          ? 'bg-app-surface-muted dark:bg-[#171d1b] p-4'
          : 'bg-app-surface-elevated dark:bg-[#1b2320] p-5',
        variantClasses[variant],
        className,
      )}
      style={[
        !isFlat && {
          shadowColor: '#0f1714',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 18,
          elevation: 1,
        },
        variant === 'verified' && {
          borderLeftWidth: 3,
          borderLeftColor: '#0b8975',
        },
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
