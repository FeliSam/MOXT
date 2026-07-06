import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  badgeForItem,
  bottomNavigationPaths,
  filterNavigationGroups,
  navigationGroups,
  type MoreServiceItem,
} from '@/constants/moreServices';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { logout } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';

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
}: {
  item: MoreServiceItem;
  badge: number;
  onNavigate: () => void;
  translateLabel: (label: string) => string;
}) {
  return (
    <Pressable
      className="relative min-h-[5.25rem] flex-col justify-between rounded-2xl border border-app-border bg-app-surface p-3 shadow-sm active:border-brand-700 active:bg-brand-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:border-brand-400 dark:active:bg-brand-950/30"
      onPress={() => {
        onNavigate();
        router.push(item.mobileRoute as any);
      }}>
      <View className="flex-row items-start justify-between gap-1">
        <View className="h-9 w-9 items-center justify-center rounded-[0.7rem] bg-app-surface-muted dark:bg-zinc-800">
          <Text className="text-lg">{item.emoji}</Text>
        </View>
        {badge > 0 ? (
          <View className="rounded-full bg-red-500 px-1.5 py-0.5">
            <Text className="text-[9px] font-bold leading-none text-white">{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} className="text-xs font-semibold leading-snug text-app-text dark:text-zinc-50">
        {translateLabel(item.label)}
      </Text>
    </Pressable>
  );
}

export function MobileMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { translateLabel } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const state = useAppSelector((s) => s);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileWidth = (width - 32 - 8) / 2;

  const role = user?.role;

  const groups = useMemo(
    () => filterNavigationGroups(navigationGroups, role, bottomNavigationPaths, query, translateLabel),
    [role, query, translateLabel],
  );

  function handleClose() {
    setQuery('');
    onClose();
  }

  async function handleLogout() {
    handleClose();
    await dispatch(logout());
    router.replace('/login' as any);
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-slate-950/40" onPress={handleClose} />

      <View
        className="max-h-[88%] rounded-t-[1rem] bg-app-bg shadow-2xl dark:bg-[#0c0c0e]"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="items-center pt-2.5">
          <View className="h-1 w-9 rounded-full bg-app-border dark:bg-zinc-700" />
        </View>

        <View className="border-b border-app-border bg-app-surface px-4 pb-4 pt-1 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700 dark:text-brand-400">
                MOXT
              </Text>
              <Text className="text-xl font-extrabold tracking-tight text-app-text dark:text-zinc-50">
                {translateLabel('Tous les services')}
              </Text>
              <Text className="mt-1 text-xs text-app-text-muted dark:text-zinc-400">
                {translateLabel('Accédez aux modules hors barre de navigation.')}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fermer"
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-xl bg-app-surface-muted dark:bg-zinc-800">
              <Text className="text-lg text-app-text-muted dark:text-zinc-400">✕</Text>
            </Pressable>
          </View>

          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-app-surface-muted px-3 py-2.5 dark:bg-zinc-800">
            <Text className="text-base text-app-text-faint dark:text-zinc-500">🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={translateLabel('Rechercher un service...')}
              placeholderTextColor="#9ca3af"
              className="min-w-0 flex-1 bg-transparent text-sm text-app-text dark:text-zinc-50"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="Effacer">
                <Text className="text-sm text-app-text-muted">✕</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView className="max-h-[50%] px-4 py-4" contentContainerClassName="pb-2">
          {!groups.length ? (
            <Text className="py-10 text-center text-sm text-app-text-muted dark:text-zinc-400">
              {translateLabel('Aucun service ne correspond à votre recherche.')}
            </Text>
          ) : (
            groups.map((group) => (
              <View key={group.id} className="mb-5">
                <Text className="mb-2.5 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-app-text-faint dark:text-zinc-500">
                  {translateLabel(group.label)}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {group.children.map((item) => (
                    <View key={item.path} style={{ width: tileWidth }}>
                      <MoreServiceTile
                        item={item}
                        badge={badgeForItem(item, state)}
                        onNavigate={handleClose}
                        translateLabel={translateLabel}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View className="border-t border-app-border bg-app-surface px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="mb-2 flex-row gap-2">
            <Pressable
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-app-surface-muted dark:bg-zinc-800"
              onPress={() => {
                handleClose();
                router.push('/profile/edit' as any);
              }}>
              <Text className="text-base">👤</Text>
              <Text className="text-xs font-semibold text-app-text dark:text-zinc-50">
                {translateLabel('Mon profil')}
              </Text>
            </Pressable>
            <Pressable
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-app-surface-muted dark:bg-zinc-800"
              onPress={() => {
                handleClose();
                router.push('/settings' as any);
              }}>
              <Text className="text-base">⚙️</Text>
              <Text className="text-xs font-semibold text-app-text dark:text-zinc-50">
                {translateLabel('Réglages')}
              </Text>
            </Pressable>
          </View>
          <Pressable
            className="min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/20"
            onPress={handleLogout}>
            <Text className="text-base">🚪</Text>
            <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
              {translateLabel('Déconnexion')}
            </Text>
          </Pressable>
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
