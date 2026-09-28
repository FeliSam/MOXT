import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/chrome/AppHeader';
import { AppBottomTabBar } from '@/components/navigation/BottomNavBar';

import { ThemeScope } from './identity';

/**
 * Page hors onglets avec l'en-tête et la barre basse du web (aucun onglet actif),
 * contenu défilant px-4 / pt-3, espacement vertical `gap` entre sections.
 */
export function ProfilePageShell({
  pathname,
  scope = 'base',
  gap = 20,
  children,
}: {
  pathname: string;
  scope?: 'personal' | 'community' | 'base';
  gap?: number;
  children: ReactNode;
}) {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader pathname={pathname} />
      <ThemeScope scope={scope}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 128, gap }}>
          {children}
        </ScrollView>
      </ThemeScope>
      <AppBottomTabBar activeRoute="none" />
    </View>
  );
}
