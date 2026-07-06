import { useState } from 'react';
import { ActivityIndicator, Image, ImageProps, ImageStyle, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/theme/ThemeContext';

type LazyImageProps = Omit<ImageProps, 'style'> & {
  style?: ImageStyle;
  fallbackIcon?: string;
};

export function LazyImage({ style, fallbackIcon, ...props }: LazyImageProps) {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.surfaceBorder }, style]}>
        <ActivityIndicator color="transparent" />
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loader, { backgroundColor: colors.surfaceBorder }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        {...props}
        style={[{ width: '100%', height: '100%' }, style]}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  loader: { justifyContent: 'center', alignItems: 'center' },
});
