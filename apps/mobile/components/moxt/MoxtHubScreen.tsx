import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { FeatherIcon } from '@/components/chrome/icons';
import { BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';
import { AppText } from '@/components/ui/AppText';
import {
  coreServices,
  filterHubLinksByRole,
  moxtHubAdminLinks,
  moxtHubSecondaryGroups,
  quickActions,
  type HubLink,
} from '@/constants/moxtHub';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

import { BentoGrid } from './BentoGrid';

function HubSectionHeading({ title }: { title: string }) {
  return (
    <AppText display className="text-xl text-app-text" style={{ letterSpacing: -0.6 }} accessibilityRole="header">
      {title}
    </AppText>
  );
}

function SecondaryLinkTile({ link }: { link: HubLink }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={link.route ? () => router.push(link.route as never) : undefined}
      style={({ pressed }) => ({
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 16,
        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
        padding: 12,
      })}>
      <View style={{ width: 36, height: 36, borderRadius: 11.2, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <FeatherIcon name={link.icon} size={18} color={isDark ? colors.teal : colors.accent} />
      </View>
      <AppText className="flex-1 text-sm font-semibold text-app-text" style={{ lineHeight: 19.25 }}>
        {t(link.labelKey)}
      </AppText>
      <FeatherIcon name="chevron-right" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

/** Page Moxt (menu « Plus ») — miroir de moxt-react/src/pages/MoxtHubPage.jsx. */
export function MoxtHubScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const role = useAppSelector((s) => (s.auth.user as { role?: string } | null)?.role);
  const adminLinks = useMemo(() => filterHubLinksByRole(moxtHubAdminLinks, role), [role]);
  const groups = useMemo(
    () =>
      moxtHubSecondaryGroups
        .map((group) => ({ ...group, links: filterHubLinksByRole(group.links, role) }))
        .filter((group) => group.links.length > 0),
    [role],
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: BOTTOM_NAV_PADDING, gap: 32 }}>
      <View style={{ gap: 16 }}>
        <HubSectionHeading title={t('moxtHub.primaryServices')} />
        <BentoGrid items={coreServices} />
      </View>

      <View style={{ gap: 16 }}>
        <HubSectionHeading title={t('moxtHub.quickActions')} />
        <BentoGrid items={quickActions} />
      </View>

      {adminLinks.length > 0 ? (
        <View style={{ gap: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 32 }}>
          <HubSectionHeading title={t('moxtHub.admin')} />
          <View style={{ gap: 8 }}>
            {adminLinks.map((link) => (
              <SecondaryLinkTile key={link.id} link={link} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 32 }}>
        <HubSectionHeading title={t('moxtHub.secondary')} />
        {groups.map((group) => (
          <View key={group.id} style={{ gap: 12 }}>
            <AppText display className="text-sm uppercase text-app-text-faint" style={{ letterSpacing: 1.68 }}>
              {t(group.titleKey)}
            </AppText>
            <View style={{ gap: 8 }}>
              {group.links.map((link) => (
                <SecondaryLinkTile key={link.id} link={link} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
