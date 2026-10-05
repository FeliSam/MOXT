import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

/**
 * ExpandableLinkifiedText du web : texte limité à `maxLines` lignes, lien « Voir plus / Voir moins »
 * seulement si le texte dépasse (hauteur du texte complet mesurée hors écran).
 */
export function ExpandableText({
  text,
  maxLines = 4,
  className = '',
  moreLabel = 'Voir plus',
  lessLabel = 'Voir moins',
}: {
  text: string;
  maxLines?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const [clampedHeight, setClampedHeight] = useState(0);
  const canToggle = fullHeight > clampedHeight + 1 && clampedHeight > 0;
  if (!String(text || '').trim()) return null;

  return (
    <View style={{ minWidth: 0 }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <AppText className={className} onLayout={(e) => setFullHeight(e.nativeEvent.layout.height)}>
          {text}
        </AppText>
      </View>
      <AppText
        className={className}
        numberOfLines={expanded ? undefined : maxLines}
        onLayout={(e) => {
          if (!expanded) setClampedHeight(e.nativeEvent.layout.height);
        }}>
        {text}
      </AppText>
      {canToggle || expanded ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
          <AppText className="text-sm font-semibold" style={{ color: colors.accent }}>
            {expanded ? lessLabel : moreLabel}
          </AppText>
          <ChevronDown size={16} color={colors.accent} strokeWidth={2} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
        </Pressable>
      ) : null}
    </View>
  );
}
