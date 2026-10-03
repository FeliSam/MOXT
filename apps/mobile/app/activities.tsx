import { ScrollView } from 'react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/ThemeContext';

/** Cible du lien Profil → Activités. Le détail du journal est complété avec les écrans compte. */
export default function ActivitiesScreen() {
  const colors = useThemeColors();
  return (
    <AppChrome pathname="/activities">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Compte</AppText>
        <AppText className="text-2xl font-black text-app-text">Mes activités</AppText>
        <AppText className="text-sm text-app-text-muted">
          Transferts, publications, candidatures et réservations liés à votre compte.
        </AppText>
      </ScrollView>
    </AppChrome>
  );
}
