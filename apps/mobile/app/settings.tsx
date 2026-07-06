import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@moxt/shared';

import { Button } from '@/components/ui/Button';
import { AppScreen, Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { logout } from '@/store/auth';
import { useAppDispatch } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/* ── Web : NOTIF_CATEGORIES + priorités ── */
const NOTIF_CATEGORIES: { key: string; label: string; description: string }[] = [
  { key: 'notifMessages', label: 'Messages', description: 'Nouveaux messages reçus' },
  { key: 'notifTransfers', label: 'Transferts', description: 'Mises à jour de vos opérations' },
  { key: 'notifParcels', label: 'Colis', description: 'Réservations et confirmations' },
  { key: 'notifJobs', label: 'Jobs', description: 'Candidatures et offres' },
  { key: 'notifEvents', label: 'Événements', description: 'Inscriptions et rappels' },
  { key: 'notifActualites', label: 'Actualités', description: 'Posts et nouveautés' },
];
const PRIORITY_OPTIONS = ['Haute', 'Normale', 'Faible', 'Off'];

export default function SettingsScreen() {
  const { language, setLanguage, translateLabel } = useLanguage();
  const { isDark, theme, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [priorities, setPriorities] = useState<Record<string, string>>(() =>
    Object.fromEntries(NOTIF_CATEGORIES.map((c) => [c.key, 'Normale'])),
  );

  function confirmDelete() {
    Alert.alert(
      'Demander la suppression du compte',
      "Cette action crée uniquement une demande locale de démonstration. Aucune donnée n'est supprimée.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Demander', style: 'destructive', onPress: () => Alert.alert('Demande enregistrée', "Aucune donnée réelle n'a été supprimée.") },
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
            Thème actuel : {theme === 'dark' ? 'sombre' : 'clair'}.
          </Text>
          <Button variant="secondary" className="mt-4 self-start" onPress={toggleTheme}>
            {isDark ? '☀️ Changer le thème' : '🌙 Changer le thème'}
          </Button>
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
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#0b8975' }} />
          </View>
          <View className="flex-row items-center gap-3 mt-3">
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-app-text dark:text-zinc-50">Notifications e-mail</Text>
              <Text className="text-xs text-app-text-muted dark:text-zinc-400 mt-0.5">Résumés et alertes par e-mail</Text>
            </View>
            <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: '#0b8975' }} />
          </View>

          <Text className="text-[11px] font-black tracking-widest text-app-text-faint dark:text-zinc-500 mt-5 mb-1">
            PRIORITÉ PAR CATÉGORIE
          </Text>
          {NOTIF_CATEGORIES.map(({ key, label, description }) => (
            <View key={key} className="border border-app-border dark:border-zinc-700 rounded-xl p-3.5 mt-2">
              <Text className="text-sm font-extrabold text-app-text dark:text-zinc-50">{label}</Text>
              <Text className="text-xs text-app-text-muted dark:text-zinc-400 mt-0.5">{description}</Text>
              <View className="flex-row gap-1.5 mt-2.5">
                {PRIORITY_OPTIONS.map((opt) => {
                  const selected = priorities[key] === opt;
                  return (
                    <Pressable
                      key={opt}
                      className={cn(
                        'flex-1 rounded-lg py-1.5 items-center',
                        selected ? 'bg-brand-700' : 'bg-app-surface-muted dark:bg-zinc-800',
                      )}
                      onPress={() => setPriorities((p) => ({ ...p, [key]: opt }))}>
                      <Text className={cn('text-[11px] font-black', selected ? 'text-white' : 'text-app-text-muted dark:text-zinc-400')}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
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
