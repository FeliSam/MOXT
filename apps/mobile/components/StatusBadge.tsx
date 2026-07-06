import { StyleSheet, Text, View } from 'react-native';

import { statusMeta } from '@moxt/shared/config/statuses.js';

const toneStyles = {
  success: { backgroundColor: '#dcfce7', color: '#166534' },
  warning: { backgroundColor: '#fef9c3', color: '#854d0e' },
  danger: { backgroundColor: '#fee2e2', color: '#991b1b' },
  info: { backgroundColor: '#e0f2fe', color: '#075985' },
  brand: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
};

type StatusBadgeProps = {
  status?: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = statusMeta(status || 'pending');
  const palette = toneStyles[meta.tone as keyof typeof toneStyles] || toneStyles.brand;

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
