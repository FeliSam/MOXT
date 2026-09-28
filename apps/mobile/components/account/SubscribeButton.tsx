import { useState } from 'react';
import { Modal, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, BellOff, Check, Star, UserCheck, UserPlus, VolumeX } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { findPublisherSubscription } from '@/store/account';
import { subscribeToPublisher, unsubscribeFromPublisher } from '@/store/engagement';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { brand, withAlphaColor } from '@/theme/palette';
import { useShadows, useTheme, useThemeCssVars } from '@/theme/ThemeContext';

export type NotifyPref = 'all' | 'important' | 'muted';
type PublisherType = 'user' | 'business';

export const PREFS: { id: NotifyPref; label: string; hint: string; Icon: typeof Bell }[] = [
  { id: 'all', label: 'Toutes les annonces', hint: 'Marketplace, colis, jobs, événements et publications', Icon: Bell },
  { id: 'important', label: 'Importantes seulement', hint: 'Annonces marketplace et publications du fil', Icon: Star },
  { id: 'muted', label: 'Sourdine', hint: 'Priorité dans les listes, sans notification', Icon: VolumeX },
];

export function publisherPathFor(type: PublisherType, id: string) {
  return type === 'business' ? `/businesses/${id}` : `/users/${id}/publications`;
}

/** Abonnement de l'utilisateur connecté à un éditeur, et bascule comme le web. */
export function usePublisherSubscription(publisherType: PublisherType, publisherId: string, publisherName = '') {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const subscription = useAppSelector((s) => findPublisherSubscription(s.account.subscriptions, user?.id, publisherType, publisherId));
  const base = { publisherType, publisherId, publisherName, publisherPath: publisherPathFor(publisherType, publisherId) };

  function subscribe(notifyPref: NotifyPref = 'all') {
    if (!user?.id) {
      router.push('/login' as never);
      return;
    }
    dispatch(subscribeToPublisher({ ...base, userId: user.id, notifyPref, existing: subscription })).catch(() => undefined);
  }
  function unsubscribe() {
    if (!user?.id) return;
    dispatch(unsubscribeFromPublisher({ userId: user.id, publisherType, publisherId, existing: subscription })).catch(() => undefined);
  }
  return { user, subscription, isSubscribed: Boolean(subscription), subscribe, unsubscribe };
}

/** Menu « Notifications reçues » (web SubscriptionNotifyMenu), en feuille basse sur mobile. */
export function NotifySheet({
  open,
  onClose,
  activePref,
  onSelect,
  onUnsubscribe,
}: {
  open: boolean;
  onClose: () => void;
  activePref: NotifyPref;
  onSelect: (pref: NotifyPref) => void;
  onUnsubscribe: () => void;
}) {
  const insets = useSafeAreaInsets();
  const cssVars = useThemeCssVars();
  const shadows = useShadows();
  const { colors, isDark } = useTheme();
  const tones: Record<NotifyPref, { bg: string; fg: string }> = {
    all: isDark ? { bg: brand[50], fg: brand[200] } : { bg: brand[50], fg: brand[700] },
    important: isDark ? { bg: withAlphaColor('#451a03', 0.3), fg: '#fde68a' } : { bg: '#fffbeb', fg: '#b45309' },
    muted: isDark ? { bg: withAlphaColor('#1e293b', 0.6), fg: '#cbd5e1' } : { bg: '#f1f5f9', fg: '#475569' },
  };
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[{ flex: 1 }, cssVars]}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.35)' }} />
        <View
          accessibilityLabel="Préférences de notification d'abonnement"
          style={[
            {
              position: 'absolute',
              left: 8,
              right: 8,
              bottom: Math.max(8, insets.bottom + 8),
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 6,
            },
            shadows.card,
          ]}>
          <AppText className="px-3 py-2 text-[11px] font-bold uppercase text-app-text-faint" style={{ letterSpacing: 0.88 }}>
            Notifications reçues
          </AppText>
          {PREFS.map(({ id, label, hint, Icon }) => {
            const active = activePref === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => onSelect(id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: active ? colors.accentSoft : 'transparent',
                }}>
                <View style={{ marginTop: 2, width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: tones[id].bg }}>
                  <Icon size={14} color={tones[id].fg} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AppText className="text-sm font-bold text-app-text">{label}</AppText>
                    {active ? <Check size={14} color={colors.accent} strokeWidth={2} /> : null}
                  </View>
                  <AppText className="mt-0.5 text-xs leading-5 text-app-text-muted">{hint}</AppText>
                </View>
              </Pressable>
            );
          })}
          <View style={{ marginVertical: 4, height: 1, backgroundColor: colors.border }} />
          <Pressable
            onPress={onUnsubscribe}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <BellOff size={14} color={isDark ? '#fca5a5' : '#dc2626'} strokeWidth={2} />
            <AppText className="text-sm font-bold" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>
              Se désabonner
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Bouton « S'abonner » du web (SubscribeButton, variante secondary) : écrit dans
 * `publisher_subscriptions` ; une fois abonné, « Abonné » + cloche des préférences.
 * Le bouton « Offrir des étoiles » du web n'est pas repris.
 */
export function SubscribeButton({
  publisherType,
  publisherId,
  publisherName = '',
  size = 'sm',
  className = '',
  style,
  showIcon = true,
  subscribeLabel = "S'abonner",
  subscribedLabel = 'Abonné',
}: {
  publisherType: PublisherType;
  publisherId: string;
  publisherName?: string;
  size?: 'sm' | 'md';
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Comme le web : la fiche entreprise affiche « Suivre / Abonné » sans icône. */
  showIcon?: boolean;
  subscribeLabel?: string;
  subscribedLabel?: string;
}) {
  const { colors, isDark } = useTheme();
  const { user, subscription, isSubscribed, subscribe, unsubscribe } = usePublisherSubscription(publisherType, publisherId, publisherName);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user?.id || (publisherType === 'user' && user.id === publisherId)) return null;

  const height = size === 'sm' ? 36 : 44;
  const radius = size === 'sm' ? 11.2 : 12;
  // Web : Button md = min-h-11, rounded-xl, text-sm font-semibold.
  const textClass = size === 'sm' ? 'text-sm' : 'text-sm font-semibold';

  if (!isSubscribed) {
    return (
      <Pressable
        accessibilityLabel={subscribeLabel}
        onPress={() => subscribe('all')}
        className={`flex-row items-center justify-center gap-2 border border-app-border-md bg-app-surface ${className}`}
        style={[{ minHeight: height, borderRadius: radius, paddingHorizontal: 14 }, style]}>
        {showIcon ? <UserPlus size={14} color={colors.text} strokeWidth={2} /> : null}
        <AppText className={`${textClass} text-app-text`}>{subscribeLabel}</AppText>
      </Pressable>
    );
  }

  const pref = (subscription?.notifyPref as NotifyPref) || 'all';
  const PrefIcon = PREFS.find((p) => p.id === pref)?.Icon || Bell;
  return (
    <View className={`flex-row items-center gap-1.5 ${className}`} style={style}>
      <View
        accessibilityState={{ selected: true }}
        className="flex-1 flex-row items-center justify-center gap-2"
        style={{
          minHeight: height,
          borderRadius: radius,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: isDark ? brand[800] : brand[200],
          // brand-950 n'existe pas dans la palette web : dark:bg-brand-950/40 n'est pas généré, le fond reste brand-50.
          backgroundColor: brand[50],
        }}>
        {showIcon ? <UserCheck size={14} color={isDark ? brand[200] : brand[800]} strokeWidth={2} /> : null}
        <AppText className={textClass} style={{ color: isDark ? brand[200] : brand[800] }}>
          {subscribedLabel}
        </AppText>
      </View>
      <Pressable
        accessibilityLabel={`Notifications : ${PREFS.find((p) => p.id === pref)?.label}`}
        onPress={() => setMenuOpen(true)}
        style={{
          width: height,
          height,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}>
        <PrefIcon size={16} color={colors.textMuted} strokeWidth={2} />
      </Pressable>
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
