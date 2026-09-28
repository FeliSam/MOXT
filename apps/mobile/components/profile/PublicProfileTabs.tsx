import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

import { useBrandScale, type ProfileKind } from './identity';

export type ProfileTab = { key: string; label: string; count?: number; alwaysShow?: boolean };

/** Onglets du profil public (PublicProfileTabs du web) : texte brand actif + soulignement. */
export function PublicProfileTabs({
  active,
  onChange,
  tabs,
  kind,
}: {
  active: string;
  onChange: (key: string) => void;
  tabs: ProfileTab[];
  kind?: ProfileKind;
}) {
  const { colors, isDark } = useTheme();
  const scale = useBrandScale(kind);
  const visible = tabs.filter(({ alwaysShow, count }) => alwaysShow || count === undefined || count > 0);
  const keys = visible.map((tab) => tab.key).join(',');

  useEffect(() => {
    if (!keys) return;
    const list = keys.split(',');
    if (!list.includes(active)) onChange(list[0]);
  }, [active, keys, onChange]);

  if (!visible.length) return null;
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -4 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingHorizontal: 4 }}>
        {visible.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(tab.key)}
              style={{ paddingBottom: 12, flexDirection: 'row', alignItems: 'baseline' }}>
              <AppText className="text-sm font-bold" style={{ color: isActive ? (isDark ? scale[300] : scale[700]) : colors.textMuted }}>
                {tab.label}
              </AppText>
              {tab.count !== undefined && tab.count > 0 ? (
                <AppText
                  className="text-xs font-black"
                  style={{ marginLeft: 6, color: isActive ? `${scale[600]}cc` : colors.textFaint, fontVariant: ['tabular-nums'] }}>
                  {tab.count}
                </AppText>
              ) : null}
              {isActive ? (
                <View
                  style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 999, backgroundColor: isDark ? scale[400] : scale[700] }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
