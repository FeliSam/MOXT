import { ScrollView, View } from 'react-native';
import Constants from 'expo-constants';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

const CHANGELOG = [
  { version: '1.2', notes: ['Parcours mobile aligné sur le web', 'P2P, publications et compte'] },
  { version: '1.1', notes: ['Transferts, marketplace et messagerie'] },
  { version: '1.0', notes: ['Première version de l’application'] },
];

/** Version, canal et journal (VersionPage, route web /settings/version). */
export default function VersionScreen() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version || '1.0.0';
  const build = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  return (
    <AppChrome pathname="/settings">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Réglages</AppText>
        <AppText className="text-2xl font-black text-app-text">Version</AppText>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 6 }}>
          <AppText className="text-xs font-black uppercase text-app-text-muted">Application</AppText>
          <AppText className="text-xl font-black text-app-text">MOXT {version}</AppText>
          <AppText className="text-sm text-app-text-muted">Canal mobile · build {String(build)}</AppText>
        </View>
        {CHANGELOG.map((entry) => (
          <View key={entry.version} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 }}>
            <AppText className="font-black text-app-text">Version {entry.version}</AppText>
            {entry.notes.map((note) => (
              <AppText key={note} className="text-sm text-app-text-muted">• {note}</AppText>
            ))}
          </View>
        ))}
      </ScrollView>
    </AppChrome>
  );
}
