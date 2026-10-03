import { useRef } from 'react';
import { PanResponder, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

const KNOB = 44;

/** Glissière d’acceptation (SwipeToAccept du web). */
export function SwipeToAccept({ label, onComplete, disabled = false }: { label: string; onComplete: () => void; disabled?: boolean }) {
  const { colors, isDark } = useTheme();
  const width = useRef(280);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onPanResponderRelease: (_, gesture) => {
        const max = Math.max(0, width.current - KNOB - 8);
        if (gesture.dx >= max * 0.86) onCompleteRef.current();
      },
    }),
  ).current;

  return (
    <View
      onLayout={(event) => {
        width.current = event.nativeEvent.layout.width;
      }}
      {...responder.panHandlers}
      style={{ minHeight: 52, borderRadius: 999, backgroundColor: colors.surfaceMuted, justifyContent: 'center', paddingHorizontal: 16, opacity: disabled ? 0.5 : 1 }}>
      <AppText className="text-center text-sm font-black" style={{ color: isDark ? colors.text : colors.text }}>
        {label}
      </AppText>
    </View>
  );
}
