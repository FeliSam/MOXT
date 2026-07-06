import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand } from '@/theme/colors';

type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = 'brand' }: BadgeProps) {
  const colors = useThemeColors();

  const toneStyles: Record<BadgeTone, { bg: string; text: string; border: string }> = {
    brand: { bg: colors.primaryLight, text: colors.primary, border: colors.primaryBorder },
    success: { bg: colors.successBg, text: colors.success, border: colors.successBorder },
    warning: { bg: colors.warningBg, text: colors.warning, border: colors.warningBorder },
    danger: { bg: colors.dangerBg, text: colors.danger, border: colors.dangerBorder },
    info: { bg: colors.accentSoft, text: colors.teal, border: colors.primaryBorder },
    neutral: { bg: colors.surfaceMuted, text: colors.textMuted, border: colors.border },
  };

  const ts = toneStyles[tone];

  return (
    <View style={[styles.container, { backgroundColor: ts.bg, borderColor: ts.border }]}>
      <Text style={[styles.text, { color: ts.text }]}>{children}</Text>
    </View>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const toneMap: Record<string, BadgeTone> = {
    pending: 'warning',
    declared: 'info',
    confirmed: 'brand',
    completed: 'success',
    cancelled: 'danger',
    expired: 'neutral',
    active: 'success',
    draft: 'neutral',
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={toneMap[status] || 'neutral'}>{displayLabel}</Badge>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
