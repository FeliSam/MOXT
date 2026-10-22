import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { PRODUCT_HELP } from '@/components/help/productHelp';
import { useTheme } from '@/theme/ThemeContext';

/** Détail d’une session d’aide, avec précédent / suivant et lien support. */
export default function ProductHelpSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { colors } = useTheme();
  const index = PRODUCT_HELP.findIndex((item) => item.id === sessionId);
  const session = PRODUCT_HELP[index];
  const prev = index > 0 ? PRODUCT_HELP[index - 1] : null;
  const next = index >= 0 && index < PRODUCT_HELP.length - 1 ? PRODUCT_HELP[index + 1] : null;

  if (!session) {
    return (
      <AppChrome pathname="/aide">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Session introuvable.</AppText>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/aide">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Session {index + 1}</AppText>
        <AppText className="text-2xl font-black text-app-text">{session.title}</AppText>
        <AppText className="text-sm text-app-text-muted">{session.summary}</AppText>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          <AppText className="text-sm text-app-text">{session.content}</AppText>
        </View>
        <Pressable onPress={() => router.push('/support' as never)}><AppText className="font-bold text-app-accent">Toujours bloqué ? Contacter le support</AppText></Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {prev ? <Pressable onPress={() => router.replace(`/aide/${prev.id}` as never)}><AppText className="font-bold text-app-text">← {prev.title}</AppText></Pressable> : <View />}
          {next ? <Pressable onPress={() => router.replace(`/aide/${next.id}` as never)}><AppText className="font-bold text-app-text">{next.title} →</AppText></Pressable> : null}
        </View>
      </ScrollView>
    </AppChrome>
  );
}
