import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { tw } from '@/constants/dashboardTailwind';

export function DashboardSearchSection() {
  return (
    <View className="px-4">
      <View className={tw.searchCard}>
        <Text className={tw.searchTitle}>Recherche rapide</Text>
        <Text className={tw.searchSubtitle}>
          Trouvez un colis, une entreprise, une offre, un job, un événement, une page de
          paramètres ou de votre profil.
        </Text>
        <Pressable
          className="relative mt-3 min-h-14 flex-row items-center rounded-2xl bg-app-surface-muted pl-11 pr-4 dark:bg-zinc-800"
          onPress={() => router.push('/search' as any)}>
          <Text className="absolute left-4 text-brand-700">🔍</Text>
          <Text className="flex-1 text-sm text-app-text-faint dark:text-zinc-500" numberOfLines={1}>
            Rechercher : Cotonou, colis, job, paramètres, sécurité, profil...
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
