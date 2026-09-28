import { ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/chrome/AppHeader';
import { FeatherIcon } from '@/components/chrome/icons';
import { DsBadge, DsButton, DsCard, DsInput, DsPageHeader } from '@/components/ds';
import { AppBottomTabBar, BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

function CardTitle({ children }: { children: string }) {
  return (
    <AppText display className="text-base text-app-text" style={{ letterSpacing: -0.16 }} accessibilityRole="header">
      {children}
    </AppText>
  );
}

/** Référence visuelle — miroir de moxt-react/src/pages/DesignSystemPage.jsx. */
export default function DesignSystemScreen() {
  const { isDark } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <AppHeader pathname="/design-system" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: BOTTOM_NAV_PADDING, gap: 28 }}>
        <DsPageHeader eyebrow="Fondations UI" title="Design system MOXT" />
        <View style={{ gap: 20 }}>
          <DsCard>
            <CardTitle>Boutons</CardTitle>
            <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <DsButton icon="plus">Action principale</DsButton>
              <DsButton icon="download" variant="secondary">
                Secondaire
              </DsButton>
              <DsButton icon="trash-2" variant="danger">
                Supprimer
              </DsButton>
              <DsButton variant="ghost">Discret</DsButton>
            </View>
          </DsCard>

          <DsCard>
            <CardTitle>Badges et statuts</CardTitle>
            <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <DsBadge>MOXT</DsBadge>
              <DsBadge tone="success">Valide</DsBadge>
              <DsBadge tone="warning">En attente</DsBadge>
              <DsBadge tone="info">Information</DsBadge>
            </View>
          </DsCard>

          <DsCard>
            <CardTitle>Champs de formulaire</CardTitle>
            <View style={{ marginTop: 20, gap: 16 }}>
              <DsInput label="Adresse email" placeholder="vous@email.com" hint="Nous ne partagerons pas cette adresse." />
              <DsInput label="Téléphone" value="+229" editable={false} error="Le numero est incomplet." />
            </View>
          </DsCard>

          <DsCard>
            <CardTitle>Retour utilisateur</CardTitle>
            <View className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <FeatherIcon name="check" size={20} color={isDark ? '#a7f3d0' : '#065f46'} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <AppText className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Operation terminee</AppText>
                  <AppText className="mt-1 text-sm text-emerald-800 dark:text-emerald-200" style={{ lineHeight: 20, opacity: 0.8 }}>
                    Les composants respectent les themes clair et sombre.
                  </AppText>
                </View>
              </View>
            </View>
          </DsCard>
        </View>
      </ScrollView>
      <AppBottomTabBar activeRoute="" />
    </View>
  );
}
