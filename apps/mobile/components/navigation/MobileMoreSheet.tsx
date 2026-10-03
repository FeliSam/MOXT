import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, UserRound, Settings } from 'lucide-react-native';

import {
  badgeForItem,
  moreServicesExcludedPaths,
  filterNavigationGroups,
  navigationGroups,
  type MoreServiceItem,
} from '@/constants/moreServices';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { useTheme, useThemeCssVars } from '@/theme/ThemeContext';

function GridIcon({ active }: { active?: boolean }) {
  return (
    <View className="h-[18px] w-[18px] flex-row flex-wrap gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          className={cn(
            'h-[6px] w-[6px] rounded-[1px]',
            active ? 'bg-brand-700 dark:bg-brand-400' : 'bg-app-text-muted dark:bg-zinc-500',
          )}
        />
      ))}
    </View>
  );
}

function MoreServiceTile({
  item,
  badge,
  onNavigate,
  translateLabel,
  surface,
  muted,
  border,
  text,
}: {
  item: MoreServiceItem;
  badge: number;
  onNavigate: () => void;
  translateLabel: (label: string) => string;
  surface: string;
  muted: string;
  border: string;
  text: string;
}) {
  return (
    <Pressable
      onPress={() => {
        onNavigate();
        router.push(item.mobileRoute as any);
      }}
      style={{
        position: 'relative',
        minHeight: 84,
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: surface,
        padding: 12,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <View style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: muted }}>
          <item.Icon size={18} color="#08705f" strokeWidth={2.1} />
        </View>
        {badge > 0 ? (
          <View style={{ borderRadius: 999, backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', lineHeight: 11, color: '#fff' }}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={{ fontSize: 12, fontWeight: '600', lineHeight: 16, color: text }}>
        {translateLabel(item.label)}
      </Text>
    </Pressable>
  );
}

export function MobileMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cssVars = useThemeCssVars();
  const { colors, isDark } = useTheme();
  const { translateLabel } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const state = useAppSelector((s) => s);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileWidth = (width - 32 - 8) / 2;

  const role = user?.role;

  const groups = useMemo(
    () => filterNavigationGroups(navigationGroups, role, moreServicesExcludedPaths, query, translateLabel),
    [role, query, translateLabel],
  );

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
      {/* Sur le web la modale sort de ThemeRoot : on repose les variables --app-*. */}
      <View style={[{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.82)' : 'rgba(2,6,23,0.82)' }, cssVars]}>
      <Pressable style={{ flex: 1 }} onPress={handleClose} />

      <View
        style={{
          maxHeight: '88%',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        }}>
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View style={{ height: 4, width: 36, borderRadius: 999, backgroundColor: colors.borderMd }} />
        </View>

        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ minWidth: 0, flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.3, color: colors.text }}>
                {translateLabel('Tous les services')}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
                {translateLabel('Accédez aux modules hors barre de navigation.')}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fermer"
              onPress={handleClose}
              style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
              <X size={18} color={colors.textMuted} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Search size={16} color={colors.textFaint} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={translateLabel('Rechercher un service...')}
              placeholderTextColor={colors.textFaint}
              style={{ minWidth: 0, flex: 1, fontSize: 16, color: colors.text, backgroundColor: 'transparent' }}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="Effacer">
                <X size={15} color="#9ca3af" strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView style={{ maxHeight: '50%', backgroundColor: colors.surface }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 8 }}>
          {!groups.length ? (
            <Text style={{ paddingVertical: 40, textAlign: 'center', fontSize: 14, color: colors.textMuted }}>
              {translateLabel('Aucun service ne correspond à votre recherche.')}
            </Text>
          ) : (
            groups.map((group) => (
              <View key={group.id} style={{ marginBottom: 20 }}>
                <Text style={{ marginBottom: 10, paddingHorizontal: 4, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase', color: colors.textFaint }}>
                  {translateLabel(group.label)}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {group.children.map((item) => (
                    <View key={item.path} style={{ width: tileWidth }}>
                      <MoreServiceTile
                        item={item}
                        badge={badgeForItem(item, state)}
                        onNavigate={handleClose}
                        translateLabel={translateLabel}
                        surface={colors.surface}
                        muted={colors.surfaceMuted}
                        border={colors.border}
                        text={colors.text}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={{ minHeight: 44, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              onPress={() => {
                handleClose();
                router.push('/settings' as any);
              }}>
              <Settings size={16} color={colors.accent} strokeWidth={2.2} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                {translateLabel('Réglages')}
              </Text>
            </Pressable>
            <Pressable
              style={{ minHeight: 44, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              onPress={() => {
                handleClose();
                router.push('/profile' as any);
              }}>
              <UserRound size={16} color={colors.accent} strokeWidth={2.2} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                {translateLabel('Profil')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      </View>
    </Modal>
  );
}

/** Icône grille « Plus » — alignée sur FiGrid du web */
export function PlusTabIcon({ active }: { active?: boolean }) {
  return (
    <View className="h-9 w-9 items-center justify-center rounded-[0.7rem]">
      <GridIcon active={active} />
    </View>
  );
}
