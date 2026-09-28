import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Building2, ExternalLink, Star, User, Users, VolumeX } from 'lucide-react-native';
import { fetchPublicProfile } from '@moxt/shared/services/profileService.js';

import { NotifySheet, PREFS, type NotifyPref, usePublisherSubscription } from '@/components/account/SubscribeButton';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { supabase } from '@/services/supabase';
import { loadBusinessesByIds, type PublisherSubscription } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { avatarDisplayUrl } from '@/utils/avatarDisplayUrl';
import { useShadows, useTheme } from '@/theme/ThemeContext';

import type { BrandScale } from './identity';
import { profileInitials } from './PublicProfileHero';

type MemberProfile = { name: string; avatarUrl: string | null; verified: boolean };

/** Profils publics des membres suivis (useProfileAvatarMap du web). */
function useMemberProfiles(ids: string[]) {
  const [map, setMap] = useState<Record<string, MemberProfile>>({});
  const key = ids.slice().sort().join(',');
  useEffect(() => {
    if (!supabase || !key) return undefined;
    let cancelled = false;
    Promise.all(
      key.split(',').map(async (id) => {
        const profile = await fetchPublicProfile(supabase, id).catch(() => null);
        return [id, profile] as const;
      }),
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, MemberProfile> = {};
      for (const [id, profile] of rows) {
        if (!profile) continue;
        next[id] = {
          name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          avatarUrl: profile.avatarUrl,
          verified: Boolean(profile.verified),
        };
      }
      setMap(next);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return map;
}

function EntityAvatar({ name, src, size, shape, ring }: { name: string; src?: string | null; size: number; shape: 'user' | 'business'; ring?: string }) {
  const { colors } = useTheme();
  const radius = shape === 'business' ? 16 : size / 2;
  const uri = src ? avatarDisplayUrl(src, size * 2) : null;
  const style = { width: size, height: size, borderRadius: radius, ...(ring ? { boxShadow: `0 0 0 2px ${ring}` } : null) };
  if (uri) return <Image source={{ uri }} style={style} contentFit="cover" />;
  return (
    <LinearGradient colors={['#8a3f75', colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
      <AppText className="font-black text-white" style={{ fontSize: size > 40 ? 12 : 11 }}>
        {profileInitials(name)}
      </AppText>
    </LinearGradient>
  );
}

function FollowingRow({
  item,
  kind,
  name,
  avatar,
  verified,
}: {
  item: PublisherSubscription;
  kind: 'user' | 'business';
  name: string;
  avatar?: string | null;
  verified?: boolean;
}) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { subscription, subscribe, unsubscribe } = usePublisherSubscription(kind, item.publisherId, name);
  const pref = ((subscription?.notifyPref || item.notifyPref) as NotifyPref) || 'all';
  const prefLabel = PREFS.find((p) => p.id === pref)?.label || pref;
  const PrefIcon = pref === 'muted' ? VolumeX : pref === 'important' ? Star : Bell;
  const open = () => router.push((kind === 'business' ? `/organization/${item.publisherId}` : '/listing/mine') as never);
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={open} accessibilityLabel={`Voir ${name}`}>
          <EntityAvatar name={name} src={avatar} size={44} shape={kind} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
              <AppText numberOfLines={1} className="font-semibold text-app-text" style={{ fontSize: 15, lineHeight: 20, flexShrink: 1 }}>
                {name}
              </AppText>
              {kind === 'user' && verified ? <VerifiedIcon size={14} /> : null}
            </View>
            <View className="rounded-full bg-app-surface-muted" style={{ paddingHorizontal: 10, paddingVertical: 3 }}>
              <AppText className="text-[11px] font-bold text-app-text-muted">{prefLabel}</AppText>
            </View>
          </View>
          <AppText className="text-xs text-app-text-muted" style={{ marginTop: 2, lineHeight: 16 }}>
            {kind === 'business' ? 'Annonces et publications priorisées dans vos listes.' : 'Priorité marketplace, colis, jobs, événements et fil.'}
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 56 }}>
        <Pressable
          onPress={open}
          className="flex-row items-center border border-app-border-md bg-app-surface"
          style={{ minHeight: 36, borderRadius: 11.2, paddingHorizontal: 14, gap: 6 }}>
          <ExternalLink size={14} color={colors.text} strokeWidth={2} />
          <AppText className="text-xs font-semibold text-app-text">Voir</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel={`Notifications : ${prefLabel}`}
          onPress={() => setMenuOpen(true)}
          className="items-center justify-center border border-app-border bg-app-surface"
          style={{ width: 36, height: 36, borderRadius: 11.2 }}>
          <PrefIcon size={16} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      </View>
      <NotifySheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activePref={pref}
        onSelect={(next) => {
          setMenuOpen(false);
          if (next !== pref) subscribe(next);
        }}
        onUnsubscribe={() => {
          setMenuOpen(false);
          unsubscribe();
        }}
      />
    </View>
  );
}

function Group({ title, icon: Icon, count, scale, children }: { title: string; icon: typeof User; count: number; scale: BrandScale; children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  if (!count) return null;
  return (
    <View className="overflow-hidden rounded-card-lg border border-app-border bg-app-surface" style={shadows.card}>
      <LinearGradient
        colors={[isDark ? 'rgba(42,20,36,0.25)' : `${scale[50]}66`, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Icon size={16} color={isDark ? scale[300] : scale[700]} strokeWidth={2} />
        <AppText className="text-sm font-black uppercase text-app-text-muted" style={{ letterSpacing: 1.1 }}>
          {title}
        </AppText>
        <View className="ml-auto rounded-full bg-app-surface-muted" style={{ paddingHorizontal: 10, paddingVertical: 2 }}>
          <AppText className="text-xs font-bold text-app-text">{count}</AppText>
        </View>
      </LinearGradient>
      {children}
    </View>
  );
}

/** Onglet « Abonnements » de Mes publications : Mes abonnements | Mes abonnés. */
export function SubscriptionsPanel({
  subscriptions,
  subscribers,
  scale,
}: {
  subscriptions: PublisherSubscription[];
  subscribers: PublisherSubscription[];
  scale: BrandScale;
}) {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [sub, setSub] = useState<'following' | 'subscribers'>('following');
  const users = subscriptions.filter((item) => item.publisherType === 'user');
  const businesses = subscriptions.filter((item) => item.publisherType === 'business');
  const members = useMemberProfiles([...users.map((item) => item.publisherId), ...subscribers.map((item) => item.userId)]);
  const businessById = useAppSelector((s) => s.account.businessById);
  const businessKey = businesses.map((b) => b.publisherId).join(',');
  useEffect(() => {
    const missing = businessKey.split(',').filter((id) => id && !businessById[id]);
    if (missing.length) dispatch(loadBusinessesByIds(missing));
  }, [businessKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const stack = useMemo(
    () => [
      ...users.map((item) => ({ id: item.id, name: members[item.publisherId]?.name || item.publisherName || 'Membre', src: members[item.publisherId]?.avatarUrl, shape: 'user' as const })),
      ...businesses.map((item) => ({ id: item.id, name: item.publisherName || businessById[item.publisherId]?.name || 'Entreprise', src: businessById[item.publisherId]?.logoUrl, shape: 'business' as const })),
    ],
    [users, businesses, members, businessById],
  );

  return (
    <View style={{ gap: 16 }}>
      <View className="flex-row rounded-2xl bg-app-surface-muted" style={{ padding: 4, gap: 4 }}>
        {([
          ['following', 'Mes abonnements'],
          ['subscribers', 'Mes abonnés'],
        ] as const).map(([key, label]) => {
          const active = sub === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setSub(key)}
              className={active ? 'rounded-xl bg-app-surface' : 'rounded-xl'}
              style={[{ paddingHorizontal: 16, paddingVertical: 10 }, active ? { boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } : null]}>
              <AppText className="text-sm font-bold" style={{ color: active ? scale[700] : colors.textMuted }}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {sub === 'subscribers' ? (
        subscribers.length ? (
          <Group title="Mes abonnés" icon={Users} count={subscribers.length} scale={scale}>
            {subscribers.map((item, index) => {
              const member = members[item.userId];
              const name = member?.name || 'Membre MOXT';
              return (
                <View key={item.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }, index ? { borderTopWidth: 1, borderTopColor: colors.border } : null]}>
                  <EntityAvatar name={name} src={member?.avatarUrl} size={44} shape="user" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppText numberOfLines={1} className="font-semibold text-app-text" style={{ fontSize: 15, flexShrink: 1 }}>{name}</AppText>
                      {member?.verified ? <VerifiedIcon size={14} /> : null}
                    </View>
                    {item.createdAt ? (
                      <AppText className="text-xs text-app-text-muted">
                        Depuis {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Group>
        ) : (
          <View className="items-center rounded-card-lg border border-app-border bg-app-surface p-6" style={{ gap: 8 }}>
            <Users size={28} color={colors.textFaint} />
            <AppText className="text-base font-black text-app-text">Aucun abonné pour le moment</AppText>
            <AppText className="text-center text-sm text-app-text-muted">Les membres qui suivent votre profil apparaîtront ici.</AppText>
          </View>
        )
      ) : !subscriptions.length ? (
        <View className="items-center rounded-card-lg border border-app-border bg-app-surface p-6" style={{ gap: 8 }}>
          <Users size={28} color={colors.warm} />
          <AppText className="text-base font-black text-app-text">Aucun abonnement</AppText>
          <Pressable onPress={() => router.push('/organization' as never)} className="rounded-xl border border-app-border-md bg-app-surface px-4 py-2.5">
            <AppText className="text-sm font-semibold text-app-text">Explorer l&apos;annuaire</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 20 }}>
          <View className="flex-row items-center rounded-2xl border border-app-border bg-app-surface/80" style={{ gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {stack.slice(0, 5).map((item, index) => (
                <View key={item.id} style={{ marginLeft: index ? -10 : 0 }}>
                  <EntityAvatar name={item.name} src={item.src} size={36} shape={item.shape === 'business' ? 'business' : 'user'} ring={colors.surface} />
                </View>
              ))}
            </View>
            <AppText className="flex-1 text-xs text-app-text-muted">Votre cercle d&apos;abonnements</AppText>
          </View>
          <Group title="Membres" icon={User} count={users.length} scale={scale}>
            {users.map((item, index) => (
              <View key={item.id} style={index ? { borderTopWidth: 1, borderTopColor: colors.border } : null}>
                <FollowingRow
                  item={item}
                  kind="user"
                  name={members[item.publisherId]?.name || item.publisherName || 'Membre MOXT'}
                  avatar={members[item.publisherId]?.avatarUrl}
                  verified={members[item.publisherId]?.verified}
                />
              </View>
            ))}
          </Group>
          <Group title="Entreprises" icon={Building2} count={businesses.length} scale={scale}>
            {businesses.map((item, index) => (
              <View key={item.id} style={index ? { borderTopWidth: 1, borderTopColor: colors.border } : null}>
                <FollowingRow
                  item={item}
                  kind="business"
                  name={item.publisherName || businessById[item.publisherId]?.name || 'Entreprise'}
                  avatar={businessById[item.publisherId]?.logoUrl}
                />
              </View>
            ))}
          </Group>
        </View>
      )}
    </View>
  );
}
