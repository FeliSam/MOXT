import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { selectUnreadMessageCount } from '@/store/messages';
import { useAppSelector } from '@/store/store';

function UserAvatar({ size = 36 }: { size?: number }) {
  const user = useAppSelector((s) => s.auth.user);
  const first = user?.firstName?.[0] ?? '';
  const last = user?.lastName?.[0] ?? '';
  const initials = (first + last).toUpperCase() || '?';

  return (
    <View
      className="items-center justify-center rounded-full bg-brand-700 dark:bg-brand-600"
      style={{ width: size, height: size }}>
      <Text className="text-xs font-black text-white dark:text-slate-950">{initials}</Text>
    </View>
  );
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View className="absolute -right-0.5 -top-0.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-0.5">
      <Text className="text-[9px] font-bold text-white">{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

/** En-tête mobile — aligné sur moxt-react Header (avatar + MOXT + titre + cloche + messages) */
export function MobileDashboardHeader({
  eyebrow = 'MOXT',
  title = 'Accueil',
}: {
  eyebrow?: string;
  title?: string;
}) {
  const { translateLabel } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const unreadNotifications = useAppSelector((s) => s.notifications.items.filter((n) => !n.read).length);
  const unreadMessages = useAppSelector((s) =>
    selectUnreadMessageCount(s.messages.conversations, user?.id),
  );

  return (
    <View className="px-3 pt-3">
      <View className="flex-row items-center gap-3 rounded-[1.4rem] bg-white/95 px-3 py-3 shadow-sm dark:bg-zinc-900/95">
        <Pressable onPress={() => router.push('/profile/edit' as any)} accessibilityLabel="Ouvrir mon profil">
          <UserAvatar size={36} />
        </Pressable>

        <View className="min-w-0 flex-1">
          <Text className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-brand-700 dark:text-brand-400">
            {translateLabel(eyebrow)}
          </Text>
          <Text className="truncate text-sm font-black text-app-text dark:text-zinc-50">
            {translateLabel(title)}
          </Text>
        </View>

        <Pressable
          className="relative h-10 w-10 items-center justify-center rounded-2xl active:bg-app-surface-muted dark:active:bg-zinc-800"
          onPress={() => router.push('/notifications' as any)}
          accessibilityLabel="Notifications">
          <Text className="text-lg text-app-text-muted dark:text-zinc-400">🔔</Text>
          <Badge count={unreadNotifications} />
        </Pressable>

        <Pressable
          className="relative h-10 w-10 items-center justify-center rounded-2xl active:bg-app-surface-muted dark:active:bg-zinc-800"
          onPress={() => router.push('/messages' as any)}
          accessibilityLabel="Messagerie">
          <Text className="text-lg text-app-text-muted dark:text-zinc-400">💬</Text>
          <Badge count={unreadMessages} />
        </Pressable>
      </View>
    </View>
  );
}
