import { ScrollView } from 'react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { PhoneVerificationCard } from '@/components/security/PhoneVerificationCard';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/ThemeContext';

/** Cible du lien Profil → Sécurité, avec la confirmation du numéro. */
export default function SecurityScreen() {
  const colors = useThemeColors();
  return (
    <AppChrome pathname="/security">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Compte</AppText>
        <AppText className="text-2xl font-black text-app-text">Sécurité</AppText>
        <PhoneVerificationCard />
      </ScrollView>
    </AppChrome>
  );
}
