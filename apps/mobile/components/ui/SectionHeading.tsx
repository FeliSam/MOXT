import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/theme/ThemeContext';
import { typography } from '@/theme/colors';

interface SectionHeadingProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeading({ title, actionLabel, onAction }: SectionHeadingProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    ...typography.sectionTitle,
  },
  action: {
    fontSize: 13,
    fontWeight: '700',
  },
});
