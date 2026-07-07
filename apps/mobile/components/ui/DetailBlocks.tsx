/**
 * Équivalent RN de moxt-react/src/components/ui/DetailBlocks.jsx
 * DetailMetrics — grille 2 col. de tuiles icône + valeur + label
 * DetailSection — Card avec titre xl font-extrabold + description
 * DetailFacts — lignes label uppercase / valeur bold sur fond muted
 * TrustPanel — panneau dégradé teal→cobalt avec liste de garanties
 * DetailTimeline — chronologie verticale avec pastilles
 */
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors, useShadows } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/colors';

/* ── DetailMetrics ── */
export type MetricItem = { emoji: string; label: string; value: string | number };

export function DetailMetrics({ items }: { items: MetricItem[] }) {
  const colors = useThemeColors();
  const shadows = useShadows();
  return (
    <View style={sx.metricsGrid}>
      {items.map(({ emoji, label, value }) => (
        <View
          key={label}
          style={[sx.metricCard, { backgroundColor: colors.surfaceElevated }, shadows.card]}>
          <View style={[sx.metricIcon, { backgroundColor: colors.accentSoft }]}>
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
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
  title: string; description?: string; children: React.ReactNode;
}) {
  const colors = useThemeColors();
  const shadows = useShadows();
  return (
    <View style={[sx.sectionCard, { backgroundColor: colors.surfaceElevated }, shadows.card]}>
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
          <Text style={[sx.factLabel, { color: colors.textFaint }]}>{label.toUpperCase()}</Text>
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
        <Text style={{ fontSize: 22 }}>🛡️</Text>
      </View>
      <Text style={sx.trustTitle}>{title}</Text>
      <View style={{ marginTop: 18, gap: 10 }}>
        {items.map((item) => (
          <View key={item} style={sx.trustRow}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>✓</Text>
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
              <Text style={{ fontSize: 13, color: isLast ? colors.onPrimary : colors.primary }}>
                {isLast ? '🕐' : '✓'}
              </Text>
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
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontSize: 14, fontWeight: '800' },
  metricLabel: { marginTop: 2, fontSize: 11 },

  /* section */
  sectionCard: {
    borderRadius: radii.lg,
    padding: 20,
  },
  sectionTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  sectionDesc: { marginTop: 4, fontSize: 13, lineHeight: 19 },

  /* facts */
  factsGrid: { gap: 10 },
  factBox: { borderRadius: radii.md, padding: 14 },
  factLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  factValue: { marginTop: 6, fontSize: 14, fontWeight: '700' },

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
  trustTitle: { marginTop: 14, fontSize: 19, fontWeight: '900', color: '#ffffff' },
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
  timelineLabel: { fontSize: 13, fontWeight: '800' },
  timelineDate: { marginTop: 2, fontSize: 11 },
});
