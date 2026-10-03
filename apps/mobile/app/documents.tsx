import { ScrollView } from 'react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/ThemeContext';

/** Cible du lien Profil → Documents. */
export default function DocumentsScreen() {
  const colors = useThemeColors();
  return (
    <AppChrome pathname="/documents">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Compte</AppText>
        <AppText className="text-2xl font-black text-app-text">Mes documents</AppText>
        <AppText className="text-sm text-app-text-muted">
          Pièces, reçus et justificatifs associés à votre compte.
        </AppText>
      </ScrollView>
    </AppChrome>
  );
}
