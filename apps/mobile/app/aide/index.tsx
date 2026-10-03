import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { PRODUCT_HELP } from '@/components/help/productHelp';
import { useTheme } from '@/theme/ThemeContext';

/** Sessions « Comment utiliser MOXT » (ProductHelpPage). */
export default function ProductHelpScreen() {
  const { colors } = useTheme();
  return (
    <AppChrome pathname="/aide">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Aide produit</AppText>
        <AppText className="text-sm text-app-text-muted">{PRODUCT_HELP.length} sessions pour prendre en main l’application.</AppText>
        {PRODUCT_HELP.map((session, index) => (
          <Pressable key={session.id} onPress={() => router.push(`/aide/${session.id}` as never)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 4 }}>
            <AppText className="text-xs font-black uppercase text-app-accent">{index + 1}. {session.category}</AppText>
            <AppText className="font-black text-app-text">{session.title}</AppText>
            <AppText className="text-sm text-app-text-muted">{session.summary}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </AppChrome>
  );
}
