import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { withAlphaColor } from '@/theme/palette';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Conservé pour les appels existants ; le web n’affiche pas de pastille. */
  showDot?: boolean;
  className?: string;
}

/**
 * Miroir de `PageHeader` web (viewport téléphone) : carte surface/80,
 * sourcil brand-700 / brand-300, titre Manrope.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  const { colors } = useTheme();
  const shadows = useShadows();

  return (
    <View
      className={cn('mx-4', className)}
      style={[
        {
          borderRadius: 16,
          backgroundColor: withAlphaColor(colors.surface, 0.8),
          padding: 16,
          gap: 12,
          overflow: 'hidden',
        },
        shadows.card,
      ]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 200, minWidth: 0, gap: 4 }}>
          {eyebrow ? (
            <AppText
              className="text-[11px] font-black uppercase text-brand-700 dark:text-brand-300"
              style={{ letterSpacing: 2.2 }}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText display className="text-xl text-app-text" style={{ letterSpacing: -0.4 }}>
            {title}
          </AppText>
          {description ? (
            <AppText className="text-sm leading-5 text-app-text-muted">{description}</AppText>
          ) : null}
        </View>
        {actions ? <View className="shrink-0 flex-row flex-wrap items-center gap-2" style={{ maxWidth: '100%' }}>{actions}</View> : null}
      </View>
    </View>
  );
}
