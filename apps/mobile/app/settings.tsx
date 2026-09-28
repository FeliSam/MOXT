import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@moxt/shared';
import { updateAccountPreferences } from '@moxt/shared/services/accountWrites.js';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@moxt/shared/utils/notificationUtils.js';

import { Button } from '@/components/ui/Button';
import { AppScreen, Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { authService } from '@/store/auth';
import { logout } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/theme/ThemeContext';
import { BackHeader } from '@/components/chrome/BackHeader';

export default function SettingsScreen() {
  const { language, setLanguage, translateLabel } = useLanguage();
  const { isDark, theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [subscriberEnabled, setSubscriberEnabled] = useState(true);
  const [visibility, setVisibility] = useState<'public' | 'contacts' | 'private'>('private');
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const transfers = useAppSelector((state) => state.transfers.items);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    void (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .maybeSingle();
        const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(data?.preferences || {}) };
        setPreferences(prefs);
        setPushEnabled(prefs.pushNotifications !== false);
        setEmailEnabled(Boolean(prefs.emailNotifications));
        setSubscriberEnabled(prefs.notifNewSubscribers !== false);
        const vis = prefs.activityVisibility;
        setVisibility(vis === 'public' || vis === 'contacts' || vis === 'private' ? vis : 'private');
      } catch {
        // ignore profile preference load errors
      }
    })();
  }, [user?.id]);

  async function persistPreferences(patch: Record<string, unknown>) {
    if (!user?.id || !supabase) return;
    const next = await updateAccountPreferences(supabase, user.id, patch, preferences);
    setPreferences(next);
    setPushEnabled(next.pushNotifications !== false);
    setEmailEnabled(Boolean(next.emailNotifications));
    setSubscriberEnabled(next.notifNewSubscribers !== false);
    const vis = next.activityVisibility;
    if (vis === 'public' || vis === 'contacts' || vis === 'private') setVisibility(vis);
  }

  async function exportOwnData() {
    if (!user) return;
    const data = {
      profile: user,
      preferences,
      transfers: transfers.filter((item) => !item.userId || item.userId === user.id),
    };
    const path = `${FileSystem.cacheDirectory || ''}moxt-donnees.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Exporter mes données' });
    } else {
      Alert.alert('Export prêt', 'Le fichier a été préparé sur cet appareil.');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Demander la suppression du compte',
      'Votre compte sera marqué pour suppression. La modération MOXT traitera la demande.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Demander',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;
              await authService.requestAccountDeletion(user.id);
              Alert.alert('Demande enregistrée', 'Votre demande de suppression a été transmise.');
            } catch (error: any) {
              Alert.alert('Erreur', error?.message || 'Impossible d’enregistrer la demande.');
            }
          },
        },
      ],
    );
  }

  return (
    <AppScreen edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="p-5 gap-4 pb-10">
        <BackHeader inline title="Paramètres" />

        <PageHeader
          eyebrow="Compte"
          title={translateLabel('Paramètres')}
          description="Préférences simples et contrôle de vos données."
          className="px-0"
        />

        <Card>
          <Text className="text-base font-extrabold text-app-text dark:text-zinc-50 mb-2">Apparence</Text>
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400">
            Thème :{' '}
            {theme === 'system' ? 'système' : theme === 'dark' ? 'sombre' : 'clair'}
            {theme === 'system' ? ` (actif : ${isDark ? 'sombre' : 'clair'})` : ''}.
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {(
              [
                { value: 'light' as const, label: 'Clair' },
                { value: 'dark' as const, label: 'Sombre' },
                { value: 'system' as const, label: 'Système' },
              ] as const
            ).map((option) => (
              <Button
                key={option.value}
                variant={theme === option.value ? 'primary' : 'secondary'}
                className="self-start"
                onPress={() => setTheme(option.value)}>
                {option.label}
              </Button>
            ))}
          </View>
        </Card>

        <Card>
          <Text className="text-base font-extrabold text-app-text dark:text-zinc-50 mb-2">
            {translateLabel('Langue')}
          </Text>
          <View className="gap-2">
            {SUPPORTED_LANGUAGES.map((lang: string) => {
              const info = (LANGUAGE_LABELS as Record<string, { flag?: string; label?: string }>)[lang];
              const isActive = lang === language;
              return (
                <Pressable
                  key={lang}
                  className={cn(
                    'flex-row items-center border rounded-xl p-3.5 gap-3',
                    isActive
                      ? 'border-brand-700 dark:border-brand-400 bg-brand-50 dark:bg-brand-950/30'
                      : 'border-app-border dark:border-zinc-700',
                  )}
                  onPress={() => {
              setLanguage(lang);
              void persistPreferences({ language: lang });
            }}>
                  <Text className="text-2xl">{info?.flag}</Text>
                  <Text
                    className={cn(
                      'text-base font-semibold flex-1',
                      isActive
                        ? 'text-brand-700 dark:text-brand-400'
                        : 'text-app-text dark:text-zinc-50',
                    )}>
                    {info?.label || lang}
                  </Text>
                  {isActive ? (
                    <Text className="text-lg font-black text-brand-700 dark:text-brand-400">✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-4 text-xs font-black uppercase tracking-wide text-app-text-muted">Visibilité de l’activité</Text>
          <Text className="mt-1 text-xs leading-5 text-app-text-faint">
            Contrôle qui peut voir vos publications publiques sur votre page membre.
          </Text>
          <View className="mt-2 gap-2">
            {(
              [
                { value: 'public' as const, label: 'Publique', hint: 'Toute la communauté MOXT' },
                { value: 'contacts' as const, label: 'Mes contacts', hint: 'Vos interlocuteurs en messagerie' },
                { value: 'private' as const, label: 'Privée', hint: 'Vous seul' },
              ]
            ).map((option) => {
              const active = visibility === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setVisibility(option.value);
                    void persistPreferences({ activityVisibility: option.value });
                  }}
                  className={cn(
                    'rounded-2xl border p-3',
                    active
                      ? 'border-brand-700 dark:border-brand-400 bg-brand-50 dark:bg-brand-950/30'
                      : 'border-app-border dark:border-zinc-700',
                  )}>
                  <Text className={cn('text-sm font-extrabold', active ? 'text-brand-700 dark:text-brand-400' : 'text-app-text')}>
                    {option.label}
                  </Text>
                  <Text className="text-xs text-app-text-muted mt-0.5">{option.hint}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ── Notifications ── */}
        <Card>
          <Text className="text-base font-extrabold text-app-text dark:text-zinc-50 mb-1">Notifications</Text>
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400">
            Contrôlez ce que vous recevez et à quelle priorité.
          </Text>

          <View className="flex-row items-center gap-3 mt-4">
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-app-text dark:text-zinc-50">Notifications push</Text>
              <Text className="text-xs text-app-text-muted dark:text-zinc-400 mt-0.5">Alertes en temps réel sur l'appareil</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(value) => {
                setPushEnabled(value);
                void persistPreferences({ pushNotifications: value });
              }}
              trackColor={{ true: '#0b8975' }}
            />
          </View>
          <View className="flex-row items-center gap-3 mt-3">
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-app-text dark:text-zinc-50">Nouveaux abonnés</Text>
              <Text className="text-xs text-app-text-muted dark:text-zinc-400 mt-0.5">Quand un membre s'abonne à vos publications</Text>
            </View>
            <Switch
              value={subscriberEnabled}
              onValueChange={(value) => {
                setSubscriberEnabled(value);
                void persistPreferences({ notifNewSubscribers: value });
              }}
              trackColor={{ true: '#0b8975' }}
            />
          </View>
          <View className="flex-row items-center gap-3 mt-3">
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-app-text dark:text-zinc-50">Notifications e-mail</Text>
              <Text className="text-xs text-app-text-muted dark:text-zinc-400 mt-0.5">Résumés et alertes par e-mail</Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={(value) => {
                setEmailEnabled(value);
                void persistPreferences({ emailNotifications: value });
              }}
              trackColor={{ true: '#0b8975' }}
            />
          </View>
        </Card>

        <Card>
          <Text className="text-base font-extrabold text-app-text dark:text-zinc-50 mb-2">Mes données</Text>
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400">
            Exportez uniquement les informations rattachées à votre compte.
          </Text>
          <Button variant="secondary" className="mt-4 self-start" onPress={() => void exportOwnData()}>
            Exporter mes données
          </Button>
        </Card>

        {/* ── Profil et sécurité ── */}
        <Card>
          <Text className="text-base font-extrabold text-app-text dark:text-zinc-50 mb-2">Profil et sécurité</Text>
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400">
            Gérez vos coordonnées et votre niveau de vérification.
          </Text>
          <Button variant="secondary" className="mt-4 self-start" onPress={() => router.push('/profile/edit' as any)}>
            Ouvrir mon profil
          </Button>
          <Button variant="secondary" className="mt-3 self-start" onPress={() => router.push('/kyc' as any)}>
            Vérification d’identité
          </Button>
        </Card>

        {/* ── Version ── */}
        <Card>
          <Text className="text-base font-extrabold text-app-text dark:text-zinc-50 mb-2">Version de l'application</Text>
          <Text className="text-[13px] text-app-text-muted dark:text-zinc-400">MOXT Mobile · 1.0.0</Text>
        </Card>

        {/* ── Zone sensible ── */}
        <Card className="border-red-200 dark:border-red-900">
          <Text className="text-base font-extrabold text-red-700 dark:text-red-300 mb-2">Zone sensible</Text>
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400">
            Demandez la suppression de votre compte. Vous disposez de 24 h pour annuler avant la suspension automatique.
          </Text>
          <Button variant="danger" className="mt-4" onPress={confirmDelete}>
            🗑  Demander la suppression
          </Button>
          <Button variant="danger" className="mt-3" onPress={() => dispatch(logout())}>
            {translateLabel('Se déconnecter')}
          </Button>
        </Card>
      </ScrollView>
    </AppScreen>
  );
}
