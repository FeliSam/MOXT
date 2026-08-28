import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@moxt/shared';
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

export default function SettingsScreen() {
  const { language, setLanguage, translateLabel } = useLanguage();
  const { isDark, theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);

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
      } catch {
        // ignore profile preference load errors
      }
    })();
  }, [user?.id]);

  async function persistPreferences(overrides: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
  } = {}) {
    if (!user?.id || !supabase) return;
    const next = {
      ...preferences,
      pushNotifications: overrides.pushNotifications ?? pushEnabled,
      emailNotifications: overrides.emailNotifications ?? emailEnabled,
    };
    setPreferences(next);
    await supabase
      .from('profiles')
      .update({
        preferences: next,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
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
        <Pressable className="flex-row items-center gap-2 mb-1" onPress={() => router.back()}>
          <Text className="text-xl text-brand-700 dark:text-brand-400">←</Text>
          <Text className="text-base font-semibold text-brand-700 dark:text-brand-400">
            {translateLabel('Retour')}
          </Text>
        </Pressable>

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
                  onPress={() => setLanguage(lang)}>
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

        {/* ── Profil et sécurité ── */}
        <Card>
          <Text className="text-base font-extrabold text-app-text dark:text-zinc-50 mb-2">Profil et sécurité</Text>
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400">
            Gérez vos coordonnées et votre niveau de vérification.
          </Text>
          <Button variant="secondary" className="mt-4 self-start" onPress={() => router.push('/profile/edit' as any)}>
            Ouvrir mon profil  →
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
            La demande est seulement enregistrée localement et reste réversible.
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
