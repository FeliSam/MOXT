import { ScrollView, View } from 'react-native';

import { FEATURE_MATRIX, FEATURE_STATUS_META, featureMatrixSummary } from '@/components/admin/featureMatrix';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Matrice des capacités (FeatureMatrixPage), lecture seule. */
export default function FeatureMatrixScreen() {
  const { colors } = useTheme();
  const role = useAppSelector((state) => state.auth.user?.role);
  const allowed = role === 'admin' || role === 'superadmin';
  const summary = featureMatrixSummary();

  if (!allowed) {
    return (
      <AppChrome pathname="/feature-matrix">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Réservé à l’administration.</AppText>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/feature-matrix">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Matrice produit</AppText>
        <AppText className="text-sm text-app-text-muted">
          {summary.total} capacités · {summary.complete} complètes · {summary.partial} partielles · {summary.planned} planifiées
        </AppText>
        {FEATURE_MATRIX.map((section: { domain: string; features: { id: string; label: string; status: string; note?: string }[] }) => (
          <View key={section.domain} style={{ gap: 8 }}>
            <AppText className="font-black text-app-text">{section.domain}</AppText>
            {section.features.map((feature) => (
              <View key={feature.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 }}>
                <AppText className="font-bold text-app-text">{feature.label}</AppText>
                <AppText className="text-xs font-bold text-app-accent">{FEATURE_STATUS_META[feature.status as 'complete' | 'partial' | 'planned']?.label || feature.status}</AppText>
                {feature.note ? <AppText className="text-sm text-app-text-muted">{feature.note}</AppText> : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </AppChrome>
  );
}
