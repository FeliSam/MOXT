import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { useShadows, useTheme } from '@/theme/ThemeContext';

import type { BrandScale } from './identity';

export type CatalogTab = { key: string; label: string; count?: number; alwaysShow?: boolean; icon?: LucideIcon; colors?: [string, string] };

function visibleTabs(tabs: CatalogTab[]) {
  return tabs.filter(({ count, alwaysShow }) => alwaysShow || count === undefined || count > 0);
}

function useKeepActiveVisible(tabs: CatalogTab[], active: string, onChange: (key: string) => void) {
  const keys = tabs.map((t) => t.key).join(',');
  useEffect(() => {
    if (!keys) return;
    const list = keys.split(',');
    if (!list.includes(active)) onChange(list[0]);
  }, [active, keys, onChange]);
}

/** CatalogArchiveTabs variant="underline" (Actives | Archives) du web. */
export function UnderlineTabs({ tabs, active, onChange, scale }: { tabs: CatalogTab[]; active: string; onChange: (key: string) => void; scale: BrandScale }) {
  const { colors } = useTheme();
  const shown = visibleTabs(tabs);
  useKeepActiveVisible(shown, active, onChange);
  if (!shown.length) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {shown.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 }}>
            <AppText className={WEB_BUTTON_TEXT} style={{ color: isActive ? colors.text : colors.textMuted }}>
              {tab.label}
            </AppText>
            {tab.count !== undefined ? (
              <View style={{ borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: isActive ? scale[600] : colors.surfaceMuted }}>
                <AppText className="text-[11px] font-black" style={{ color: isActive ? '#ffffff' : colors.textMuted, lineHeight: 14 }}>
                  {tab.count}
                </AppText>
              </View>
            ) : null}
            {isActive ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, borderRadius: 999, backgroundColor: scale[600] }} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** CatalogArchiveTabs variant="chips" : tuiles 82×86 icône en dégradé + libellé (compteur). */
export function ChipTabs({ tabs, active, onChange, scale }: { tabs: CatalogTab[]; active: string; onChange: (key: string) => void; scale: BrandScale }) {
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const shown = visibleTabs(tabs);
  useKeepActiveVisible(shown, active, onChange);
  if (!shown.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 4, paddingBottom: 4, paddingTop: 1 }}>
      {shown.map((tab) => {
        const isActive = tab.key === active;
        const Icon = tab.icon;
        const iconEl = Icon ? <Icon size={18} color="#ffffff" strokeWidth={2} /> : null;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={[
              {
                width: 82.4,
                height: 85.6,
                borderRadius: 17.6,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingHorizontal: 6,
                backgroundColor: isActive ? (isDark ? scale[600] : scale[700]) : colors.surface,
              },
              isActive ? shadows.card : [shadows.card, { borderWidth: 1, borderColor: colors.border }],
            ]}>
            {isActive ? (
              <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' }}>{iconEl}</View>
            ) : (
              <LinearGradient
                colors={tab.colors || [scale[500], '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                {iconEl}
              </LinearGradient>
            )}
            <View style={{ height: 27, alignItems: 'center', justifyContent: 'center' }}>
              <AppText numberOfLines={1} className="text-[10px] font-black" style={{ color: isActive ? '#ffffff' : colors.textMuted, letterSpacing: 0.25, lineHeight: 13 }}>
                {tab.label}
              </AppText>
              {tab.count !== undefined ? (
                <AppText className="text-[10px] font-black" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : colors.textFaint, lineHeight: 13 }}>
                  ({tab.count})
                </AppText>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
