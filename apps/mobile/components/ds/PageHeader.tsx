import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { withAlphaColor } from '@/theme/palette';

/** Miroir de PageHeader (moxt-react) en viewport mobile : description masquée (< sm). */
export function DsPageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  const { colors } = useTheme();
  const shadows = useShadows();
  return (
    <View
      style={[
        {
          borderRadius: 16,
          backgroundColor: withAlphaColor(colors.surface, 0.8),
          padding: 16,
          gap: 16,
          overflow: 'hidden',
        },
        shadows.card,
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? (
            <AppText
              className="mb-1 text-[11px] font-black uppercase text-brand-700 dark:text-brand-300"
              style={{ letterSpacing: 2.2 }}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText
            display
            numberOfLines={1}
            className="text-xl text-app-text"
            style={{ letterSpacing: -0.4 }}>
            {title}
          </AppText>
        </View>
        {actions}
      </View>
    </View>
  );
}
