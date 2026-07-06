import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

import { useThemeColors } from '@/theme/ThemeContext';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonLoader({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceBorder,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const colors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <SkeletonLoader width={48} height={48} borderRadius={24} />
      <View style={styles.cardBody}>
        <SkeletonLoader width="70%" height={14} />
        <SkeletonLoader width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1 },
  cardBody: { flex: 1, gap: 8 },
  list: { gap: 10, padding: 20 },
});
