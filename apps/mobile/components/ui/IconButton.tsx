import { SymbolView } from 'expo-symbols';
import { Pressable, Text, type ViewStyle } from 'react-native';

import { radii } from '@/theme/colors';
import { useThemeColors } from '@/theme/ThemeContext';

type IconButtonProps = {
  accessibilityLabel: string;
  iosName: string;
  fallback: string;
  onPress: () => void;
  active?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  accessibilityLabel,
  iosName,
  fallback,
  onPress,
  active = false,
  style,
}: IconButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [{
        width: 42,
        height: 42,
        borderRadius: radii.md,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: active ? colors.primaryBorder : colors.border,
        backgroundColor: active ? colors.primaryLight : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.72 : 1,
      }, style]}>
      <SymbolView
        name={iosName as never}
        size={19}
        tintColor={active ? colors.primary : colors.textSecondary}
        fallback={<Text style={{ color: colors.textSecondary, fontSize: 17 }}>{fallback}</Text>}
      />
    </Pressable>
  );
}
