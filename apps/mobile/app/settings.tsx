import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Download,
  Eye,
  Globe,
  Info,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@moxt/shared';
import { updateAccountPreferences } from '@moxt/shared/services/accountWrites.js';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@moxt/shared/utils/notificationUtils.js';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import { authService, logout } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { onScroll } = useSmartNavbarScroll();
  const { language, setLanguage, translateLabel } = useLanguage();
  const { isDark, theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const transfers = useAppSelector((state) => state.transfers.items);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [subscriberEnabled, setSubscriberEnabled] = useState(true);
  const [visibility, setVisibility] = useState<'public' | 'contacts' | 'private'>('private');
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [exporting, setExporting] = useState(false);

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
    setExporting(true);
    try {
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
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Export impossible.');
    } finally {
      setExporting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Demander la suppression du compte',
      'Votre compte sera marqué pour suppression. La modération MOXT traitera la demande sous 24 h.',
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}>
        {/* Header Row with droplet back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile' as never))}
            style={[
              {
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              shadows.card,
            ]}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
              {translateLabel('Paramètres')}
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              Préférences et contrôle de vos données
            </AppText>
          </View>
        </View>

        {/* ── Apparence / Thème ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Palette size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">Apparence</AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted">
            Mode visuel de l'application (actif : {isDark ? 'sombre' : 'clair'}).
          </AppText>
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              borderRadius: 14,
              backgroundColor: colors.surfaceMuted,
              padding: 4,
              gap: 4,
            }}>
            {(
              [
                { value: 'light' as const, label: 'Clair', icon: Sun },
                { value: 'dark' as const, label: 'Sombre', icon: Moon },
                { value: 'system' as const, label: 'Système', icon: Smartphone },
              ] as const
            ).map((option) => {
              const active = theme === option.value;
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setTheme(option.value)}
                  style={[
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      borderRadius: 11,
                      paddingVertical: 10,
                    },
                    active && [
                      {
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                      shadows.card,
                    ],
                  ]}>
                  <Icon size={14} color={active ? colors.accent : colors.textMuted} strokeWidth={2.2} />
                  <AppText
                    className={cn(
                      'text-xs font-bold',
                      active ? 'text-app-accent' : 'text-app-text-muted',
                    )}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ── Langue ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Globe size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">{translateLabel('Langue')}</AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted mb-3">
            Choisissez la langue principale de l'interface.
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SUPPORTED_LANGUAGES.map((lang: string) => {
              const info = (LANGUAGE_LABELS as Record<string, { flag?: string; label?: string; code?: string }>)[lang];
              const isActive = lang === language;
              return (
                <Pressable
                  key={lang}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => {
                    setLanguage(lang);
                    void persistPreferences({ language: lang });
                  }}
                  style={[
                    {
                      minWidth: '30%',
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      borderWidth: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      gap: 4,
                      backgroundColor: isActive ? colors.accentSoft : colors.surface,
                      borderColor: isActive ? colors.accent : colors.border,
                    },
                  ]}>
                  <AppText style={{ fontSize: 20 }}>{info?.flag || '🌐'}</AppText>
                  <AppText
                    className={cn(
                      'text-xs font-black',
                      isActive ? 'text-app-accent' : 'text-app-text',
                    )}>
                    {lang.toUpperCase()}
                  </AppText>
                  <AppText className="text-center text-[10px] text-app-text-muted" numberOfLines={1}>
                    {info?.label || lang}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ── Visibilité de l’activité ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Eye size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">Visibilité de l’activité</AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted mb-3">
            Contrôle qui peut voir vos publications sur votre profil public.
          </AppText>
          <View style={{ gap: 8 }}>
            {(
              [
                { value: 'public' as const, label: 'Publique', hint: 'Visible par toute la communauté MOXT' },
                { value: 'contacts' as const, label: 'Mes contacts', hint: 'Uniquement vos interlocuteurs réguliers' },
                { value: 'private' as const, label: 'Privée', hint: 'Visible par vous seul' },
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
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 14,
                    borderWidth: 1,
                    padding: 12,
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                  }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <AppText
                      className={cn(
                        'text-sm font-bold',
                        active ? 'text-app-accent' : 'text-app-text',
                      )}>
                      {option.label}
                    </AppText>
                    <AppText className="text-xs text-app-text-muted mt-0.5">{option.hint}</AppText>
                  </View>
                  <View
                    style={{
                      height: 20,
                      width: 20,
                      borderRadius: 10,
                      borderWidth: active ? 6 : 2,
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: colors.surface,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ── Notifications ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Bell size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">Notifications</AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted mb-3">
            Gérez vos alertes en temps réel et résumés.
          </AppText>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <AppText className="text-sm font-bold text-app-text">Notifications push</AppText>
                <AppText className="text-xs text-app-text-muted mt-0.5">Alertes en temps réel sur cet appareil</AppText>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(value) => {
                  setPushEnabled(value);
                  void persistPreferences({ pushNotifications: value });
                }}
                trackColor={{ true: colors.accent }}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <AppText className="text-sm font-bold text-app-text">Nouveaux abonnés</AppText>
                <AppText className="text-xs text-app-text-muted mt-0.5">Alerte quand un membre s'abonne à vos annonces</AppText>
              </View>
              <Switch
                value={subscriberEnabled}
                onValueChange={(value) => {
                  setSubscriberEnabled(value);
                  void persistPreferences({ notifNewSubscribers: value });
                }}
                trackColor={{ true: colors.accent }}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <AppText className="text-sm font-bold text-app-text">Notifications e-mail</AppText>
                <AppText className="text-xs text-app-text-muted mt-0.5">Résumés d'activités et messages non lus</AppText>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={(value) => {
                  setEmailEnabled(value);
                  void persistPreferences({ emailNotifications: value });
                }}
                trackColor={{ true: colors.accent }}
              />
            </View>
          </View>
        </Card>

        {/* ── Données personnelles ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Download size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">Mes données</AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted mb-3">
            Exportez une archive JSON complète des données rattachées à votre compte.
          </AppText>
          <Button
            variant="secondary"
            loading={exporting}
            onPress={() => void exportOwnData()}
            style={{ alignSelf: 'flex-start' }}>
            Exporter mes données
          </Button>
        </Card>

        {/* ── Raccourcis Profil et Sécurité ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ShieldCheck size={17} color={colors.accent} strokeWidth={2.2} />
            <AppText className="text-sm font-black text-app-text">Profil & Vérification</AppText>
          </View>

          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => router.push('/profile/edit' as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                padding: 12,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <User size={16} color={colors.text} />
                <AppText className="text-sm font-bold text-app-text">Modifier mon profil</AppText>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/kyc' as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                padding: 12,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={16} color={colors.accent} />
                <AppText className="text-sm font-bold text-app-text">Vérification d’identité (KYC)</AppText>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/security' as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                padding: 12,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Check size={16} color={colors.text} />
                <AppText className="text-sm font-bold text-app-text">Sécurité du compte & mot de passe</AppText>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </Card>

        {/* ── Version ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Info size={16} color={colors.textMuted} />
              <View>
                <AppText className="text-xs font-bold text-app-text">MOXT Mobile</AppText>
                <AppText className="text-[11px] text-app-text-muted">Version 1.0.0 · Production</AppText>
              </View>
            </View>
            <Button variant="ghost" size="sm" onPress={() => router.push('/version' as never)}>
              Journal
            </Button>
          </View>
        </Card>

        {/* ── Zone sensible ── */}
        <View
          style={[
            {
              borderRadius: 18,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca',
              backgroundColor: isDark ? 'rgba(127, 29, 29, 0.15)' : '#fef2f2',
              padding: 16,
              gap: 12,
            },
            shadows.card,
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Trash2 size={16} color="#dc2626" />
            <AppText className="text-sm font-black" style={{ color: '#dc2626' }}>
              Zone sensible
            </AppText>
          </View>
          <AppText className="text-xs leading-5 text-app-text-muted">
            La demande de suppression de compte déclenche un délai de rétractation de 24 h avant suspension définitive.
          </AppText>
          <Button variant="danger" onPress={confirmDelete}>
            Demander la suppression du compte
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              void dispatch(logout());
              router.replace('/(auth)/login' as never);
            }}
            style={{
              borderColor: isDark ? 'rgba(239, 68, 68, 0.5)' : '#fca5a5',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LogOut size={15} color="#dc2626" />
              <AppText className="text-sm font-bold" style={{ color: '#dc2626' }}>
                {translateLabel('Se déconnecter')}
              </AppText>
            </View>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
