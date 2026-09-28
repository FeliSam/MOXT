import { useMemo } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { selectStatusGroups, type StatusGroup } from '@/store/feed';
import { useAppSelector } from '@/store/store';
import { brand } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

/** Emprise des bulles du web : 3.75rem (anneau inclus), visage 3rem, colonne 4.25rem. */
const OUTER = 60;
const FACE = 48;

function Face({ uri, initial, muted }: { uri?: string | null; initial?: string; muted?: boolean }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: FACE, height: FACE, borderRadius: FACE / 2 }} />;
  }
  return (
    <View
      className={muted ? 'bg-app-surface-muted' : 'bg-brand-600'}
      style={{ width: FACE, height: FACE, borderRadius: FACE / 2, alignItems: 'center', justifyContent: 'center' }}>
      <AppText className={muted ? 'text-sm font-black text-app-text-muted' : 'text-sm font-black text-white'}>
        {initial || '?'}
      </AppText>
    </View>
  );
}

/** StatusRing du web : dégradé brand-500 → brand-600 → cobalt si non vu, gris sinon. */
function Ring({ unseen, children }: { unseen: boolean; children: React.ReactNode }) {
  const { colors } = useTheme();
  const inner = (
    <View
      style={{
        flex: 1,
        margin: 2,
        borderRadius: 999,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </View>
  );
  if (!unseen) {
    return <View style={{ width: OUTER, height: OUTER, borderRadius: 999, backgroundColor: colors.border }}>{inner}</View>;
  }
  return (
    <LinearGradient
      colors={[brand[500], brand[600], colors.cobalt]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ width: OUTER, height: OUTER, borderRadius: 999 }}>
      {inner}
    </LinearGradient>
  );
}

/** Miniature = dernière image du statut le plus récent (web pickStatusThumb). */
function thumbOf(group: StatusGroup | undefined) {
  if (!group) return null;
  const latest = [...group.items].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  )[0];
  const images = latest?.images || [];
  return images.length ? images[images.length - 1] : null;
}

function Bubble({
  label,
  group,
  avatarUrl,
  initial,
  onAdd,
  mutedAvatar,
}: {
  label: string;
  group?: StatusGroup;
  avatarUrl?: string | null;
  initial?: string;
  onAdd?: () => void;
  mutedAvatar?: boolean;
}) {
  const { colors } = useTheme();
  const thumb = thumbOf(group);
  return (
    <View style={{ width: 68, alignItems: 'center', gap: 6 }}>
      <View style={{ width: OUTER, height: OUTER, alignItems: 'center', justifyContent: 'center' }}>
        {group ? (
          <Ring unseen={group.unseen}>
            <Face uri={thumb || avatarUrl} initial={initial} />
          </Ring>
        ) : (
          <Face uri={avatarUrl} initial={initial} muted={mutedAvatar} />
        )}
        {onAdd ? (
          <Pressable
            accessibilityLabel="Ajouter votre statut"
            onPress={onAdd}
            className="bg-brand-700 dark:bg-brand-600"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 20,
              height: 20,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.background,
            }}>
            <Plus size={11} color="#ffffff" strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>
      <AppText numberOfLines={1} className="w-full text-center text-[11px] font-semibold text-app-text-muted" style={{ lineHeight: 14 }}>
        {label}
      </AppText>
    </View>
  );
}

/**
 * Bandeau des statuts de l'accueil (moxt-react StatusRail, hideWhenNoCommunity).
 * Ordre du web : Vous, officiels, non vus, déjà vus (plus récents d'abord).
 */
export function StatusRail({ onAdd }: { onAdd?: () => void }) {
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const statuses = useAppSelector((s) => s.feed.statuses);

  const groups = useMemo(() => {
    const list = selectStatusGroups(statuses, user?.id);
    const latest = (g: StatusGroup) => Math.max(...g.items.map((i) => new Date(i.createdAt || 0).getTime()));
    return [...list].sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
      if (a.unseen !== b.unseen) return a.unseen ? -1 : 1;
      return latest(b) - latest(a);
    });
  }, [statuses, user?.id]);

  if (!user || groups.length === 0) return null;
  const mine = groups.find((g) => g.authorId === user.id && !g.businessId);
  const others = groups.filter((g) => g !== mine);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID="status-rail"
      style={{ marginHorizontal: -16 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6, gap: 12, alignItems: 'flex-start' }}>
      <Bubble
        label={t('status.rail.you')}
        group={mine}
        avatarUrl={(user as { avatarUrl?: string | null }).avatarUrl}
        initial={user.firstName?.charAt(0)}
        mutedAvatar={!mine}
        onAdd={onAdd ?? (() => undefined)}
      />
      {others.map((group) => (
        <Bubble key={group.key} label={group.name} group={group} avatarUrl={group.avatarUrl} initial={group.name?.charAt(0)} />
      ))}
    </ScrollView>
  );
}
