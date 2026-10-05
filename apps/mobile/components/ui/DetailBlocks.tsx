import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Clock, ShieldCheck } from 'lucide-react-native';

import { useThemeColors, useShadows } from '@/theme/ThemeContext';
import { fontFamilies, radii } from '@/theme/colors';

/* ── DetailMetrics ── */
export type MetricItem = {
  emoji?: string;
  icon?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
};

export function DetailMetrics({ items }: { items: MetricItem[] }) {
  const colors = useThemeColors();
  const shadows = useShadows();
  return (
    <View style={sx.metricsGrid}>
      {items.map(({ emoji, icon: Icon, label, value }) => (
        <View
          key={label}
          style={[sx.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
          <View style={[sx.metricIcon, { backgroundColor: colors.accentSoft }]}>
            {Icon ? (
              <Icon size={18} color={colors.accent} strokeWidth={2.2} />
            ) : (
              <Text style={{ fontSize: 16 }}>{emoji}</Text>
            )}
          </View>
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text style={[sx.metricValue, { color: colors.text }]} numberOfLines={2}>
              {String(value)}
            </Text>
            <Text style={[sx.metricLabel, { color: colors.textFaint }]}>{label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ── DetailSection ── */
export function DetailSection({ title, description, children }: {
  title: string; description?: string; children: ReactNode;
}) {
  const colors = useThemeColors();
  const shadows = useShadows();
  return (
    <View style={[sx.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
      <Text style={[sx.sectionTitle, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[sx.sectionDesc, { color: colors.textMuted }]}>{description}</Text>
      ) : null}
      <View style={{ marginTop: 16 }}>{children}</View>
    </View>
  );
}

/* ── DetailFacts ── */
export type FactItem = { label: string; value?: string | number | null };

export function DetailFacts({ items }: { items: FactItem[] }) {
  const colors = useThemeColors();
  return (
    <View style={sx.factsGrid}>
      {items.map(({ label, value }) => (
        <View key={label} style={[sx.factBox, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[sx.factLabel, { color: colors.textFaint }]}>{label}</Text>
          <Text style={[sx.factValue, { color: colors.text }]}>
            {value != null && value !== '' ? String(value) : 'Non renseigné'}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── TrustPanel ── */
export function TrustPanel({ title = 'Confiance et sécurité', items }: {
  title?: string; items: string[];
}) {
  const colors = useThemeColors();

  return (
    <LinearGradient
      colors={[...colors.heroGradient]}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={sx.trustPanel}>
      <View style={sx.trustIcon}>
        <ShieldCheck size={24} color="#ffffff" strokeWidth={2.2} />
      </View>
      <Text style={sx.trustTitle}>{title}</Text>
      <View style={{ marginTop: 18, gap: 10 }}>
        {items.map((item) => (
          <View key={item} style={sx.trustRow}>
            <Check size={14} color="rgba(255,255,255,0.9)" strokeWidth={2.5} style={{ marginTop: 2 }} />
            <Text style={sx.trustRowText}>{item}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

/* ── DetailTimeline ── */
export type TimelineItem = { label: string; date?: string };

export function DetailTimeline({ items }: { items: TimelineItem[] }) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 18 }}>
      {items.map(({ label, date }, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={`${label}-${index}`} style={sx.timelineRow}>
            {index < items.length - 1 ? (
              <View style={[sx.timelineLine, { backgroundColor: colors.border }]} />
            ) : null}
            <View style={[sx.timelineDot, isLast
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.accentSoft }]}>
              {isLast ? (
                <Clock size={14} color={colors.onPrimary} />
              ) : (
                <Check size={14} color={colors.primary} strokeWidth={2.5} />
              )}
            </View>
            <View style={{ flex: 1, paddingTop: 6 }}>
              <Text style={[sx.timelineLabel, { color: colors.text }]}>{label}</Text>
              {date ? (
                <Text style={[sx.timelineDate, { color: colors.textFaint }]}>{date}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const sx = StyleSheet.create({
  /* metrics */
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontSize: 14, fontFamily: fontFamilies.semibold },
  metricLabel: { marginTop: 2, fontSize: 11, fontFamily: fontFamilies.regular },

  /* section */
  sectionCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: { fontSize: 20, fontFamily: fontFamilies.display, letterSpacing: -0.3 },
  sectionDesc: { marginTop: 4, fontSize: 13, lineHeight: 19 },

  /* facts */
  factsGrid: { gap: 10 },
  factBox: { borderRadius: radii.md, padding: 14 },
  factLabel: { fontSize: 12, fontFamily: fontFamilies.semibold },
  factValue: { marginTop: 8, fontSize: 14, fontFamily: fontFamilies.semibold },

  /* trust */
  trustPanel: { borderRadius: radii.lg, padding: 20, overflow: 'hidden' },
  trustIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: { marginTop: 16, fontSize: 20, fontFamily: fontFamilies.display, color: '#ffffff' },
  trustRow: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 12,
  },
  trustRowText: { flex: 1, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.90)' },

  /* timeline */
  timelineRow: { flexDirection: 'row', gap: 12, position: 'relative' },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -18,
    width: 1,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLabel: { fontSize: 13, fontFamily: fontFamilies.semibold },
  timelineDate: { marginTop: 2, fontSize: 11 },
});
