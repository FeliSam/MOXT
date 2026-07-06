import { Pressable, PressableProps, StyleSheet, Text, TextProps, View, ViewProps, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

type AccessibleButtonProps = Omit<PressableProps, 'style'> & {
  accessibilityLabel: string;
  accessibilityHint?: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function AccessibleButton({ accessibilityLabel, accessibilityHint, children, style, ...props }: AccessibleButtonProps) {
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[styles.minTarget, style]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

type AccessibleHeadingProps = TextProps & {
  level?: 1 | 2 | 3;
  children: ReactNode;
};

export function AccessibleHeading({ level = 1, children, ...props }: AccessibleHeadingProps) {
  return (
    <Text
      accessible
      accessibilityRole="header"
      aria-level={level}
      {...props}
    >
      {children}
    </Text>
  );
}

type AccessibleCardProps = ViewProps & {
  accessibilityLabel: string;
  children: ReactNode;
};

export function AccessibleCard({ accessibilityLabel, children, ...props }: AccessibleCardProps) {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  minTarget: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
