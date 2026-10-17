import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Building2, Check, Mail, MapPin, Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CitySelector, SecurityGate } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { upsertStrippingUnknown } from '@/services/rowWrite';
import { loadBusinesses } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { brand } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const ACTIVITIES = [
  'commerce',
  'services',
  'transport',
  'finance',
  'food',
  'education',
  'health',
  'other',
];

const SERVICE_OPTIONS = ['Marketplace', 'Colis', 'Jobs', 'Events', 'P2P', 'Transfert'];

const STEPS = [
  { key: 'identity', label: 'Identité' },
  { key: 'contact', label: 'Contact' },
  { key: 'services', label: 'Services' },
  { key: 'summary', label: 'Récapitulatif' },
];

/** Création d'entreprise en 4 étapes (BusinessSetupPage). */
export default function BusinessSetupScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const shadows = useShadows();
  const { onScroll } = useSmartNavbarScroll();

  const user = useAppSelector((state) => state.auth.user);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [activity, setActivity] = useState('services');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState<string[]>(['Marketplace']);
  const [busy, setBusy] = useState(false);

  const inputStyle = {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  };

  function toggleService(service: string) {
    setServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );
  }

  function handleBack() {
    if (step > 0) {
      setStep((prev) => prev - 1);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/organization' as never);
    }
  }

  async function submit() {
    if (!user) return;
    if (name.trim().length < 2 || !city.trim()) {
      showNotice('Entreprise', 'Le nom et la ville sont requis pour créer votre entreprise.');
      return;
    }
    setBusy(true);
    const now = new Date().toISOString();
    const id = `BIZ-${Date.now().toString(36).toUpperCase()}`;
    try {
      await upsertStrippingUnknown('businesses', {
        id,
        owner_id: user.id,
        name: name.trim(),
        status: 'pending_review',
        primary_activity: activity,
        sector: activity,
        country: 'RU',
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        description: description.trim(),
        services,
        created_at: now,
        updated_at: now,
      });
      await dispatch(loadBusinesses(user.id));
      router.replace('/professional' as never);
    } catch (error) {
      showNotice('Entreprise', error instanceof Error ? error.message : 'Création impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SecurityGate kind="publish" pathname="/organization/setup">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom + 100, 140),
            gap: 16,
          }}
        >
          {/* Header Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Pressable
              accessibilityLabel="Retour"
              onPress={handleBack}
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
              ]}
            >
              <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
            </Pressable>

            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
                Créer une entreprise
              </AppText>
              <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
                Étape {step + 1} sur 4 : {STEPS[step].label}
              </AppText>
            </View>
          </View>

          {/* Stepper Progress Bar */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {STEPS.map((s, idx) => (
              <View key={s.key} style={{ flex: 1 }}>
                <View
                  style={{
                    height: 4,
                    borderRadius: 99,
                    backgroundColor:
                      idx === step
                        ? colors.accent
                        : idx < step
                          ? colors.primary
                          : colors.border,
                  }}
                />
              </View>
            ))}
          </View>

          {/* Step 0: Identité */}
          {step === 0 ? (
            <View style={{ gap: 14 }}>
              <View style={{ gap: 4 }}>
                <AppText className="text-sm font-bold text-app-text">Nom commercial</AppText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Sahel Express, Afro Delices..."
                  placeholderTextColor={colors.textFaint}
                  style={inputStyle}
                />
              </View>

              <View style={{ gap: 8 }}>
                <AppText className="text-sm font-bold text-app-text">Secteur d'activité</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ACTIVITIES.map((item) => {
                    const active = activity === item;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => setActivity(item)}
                        style={[
                          {
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: active ? colors.accent : colors.border,
                            backgroundColor: active ? colors.accent : colors.surface,
                          },
                          shadows.card,
                        ]}
                      >
                        <AppText
                          className="text-xs font-bold capitalize"
                          style={{ color: active ? (isDark ? '#020617' : '#ffffff') : colors.text }}
                        >
                          {item}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}

          {/* Step 1: Contact */}
          {step === 1 ? (
            <View style={{ gap: 14 }}>
              <View style={{ gap: 4 }}>
                <AppText className="text-sm font-bold text-app-text">Ville principale</AppText>
                <CitySelector value={city} onChange={setCity} />
              </View>

              <View style={{ gap: 4 }}>
                <AppText className="text-sm font-bold text-app-text">Adresse ou repère</AppText>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ex: 14 rue Tverskaya, Moscou"
                  placeholderTextColor={colors.textFaint}
                  style={inputStyle}
                />
              </View>

              <View style={{ gap: 4 }}>
                <AppText className="text-sm font-bold text-app-text">Numéro de téléphone</AppText>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+7 / +229..."
                  placeholderTextColor={colors.textFaint}
                  keyboardType="phone-pad"
                  style={inputStyle}
                />
              </View>

              <View style={{ gap: 4 }}>
                <AppText className="text-sm font-bold text-app-text">Adresse e-mail</AppText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="contact@entreprise.com"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={inputStyle}
                />
              </View>

              <View style={{ gap: 4 }}>
                <AppText className="text-sm font-bold text-app-text">Présentation de l'activité</AppText>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Décrivez vos services, vos spécialités et votre valeur ajoutée..."
                  placeholderTextColor={colors.textFaint}
                  style={[inputStyle, { minHeight: 96, paddingTop: 12 }]}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          ) : null}

          {/* Step 2: Services */}
          {step === 2 ? (
            <View style={{ gap: 12 }}>
              <AppText className="text-sm text-app-text-muted">
                Sélectionnez les services que vous proposez sur Moxt :
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {SERVICE_OPTIONS.map((item) => {
                  const selected = services.includes(item);
                  return (
                    <Pressable
                      key={item}
                      onPress={() => toggleService(item)}
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: selected ? colors.accent : colors.border,
                          backgroundColor: selected ? colors.accent : colors.surface,
                        },
                        shadows.card,
                      ]}
                    >
                      {selected ? <Check size={14} color={isDark ? '#020617' : '#ffffff'} strokeWidth={2.4} /> : null}
                      <AppText
                        className="text-xs font-bold"
                        style={{ color: selected ? (isDark ? '#020617' : '#ffffff') : colors.text }}
                      >
                        {item}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Step 3: Récapitulatif */}
          {step === 3 ? (
            <Card variant="flat" className="p-4 gap-3.5 rounded-2xl" style={shadows.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText className="text-base font-black text-app-text">{name || 'Sans nom'}</AppText>
                  <AppText className="text-xs text-app-text-muted capitalize">
                    {activity} · {city || 'Ville non définie'}
                  </AppText>
                </View>
              </View>

              <View style={{ gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                <AppText className="text-xs font-bold text-app-text-muted">Services activés</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {services.map((s) => (
                    <View
                      key={s}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: colors.surfaceMuted,
                      }}
                    >
                      <AppText className="text-xs font-semibold text-app-text">{s}</AppText>
                    </View>
                  ))}
                </View>
              </View>

              {phone || email ? (
                <View style={{ gap: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                  {phone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color={colors.textMuted} />
                      <AppText className="text-xs text-app-text">{phone}</AppText>
                    </View>
                  ) : null}
                  {email ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Mail size={13} color={colors.textMuted} />
                      <AppText className="text-xs text-app-text">{email}</AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {description ? (
                <View style={{ paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <AppText className="text-xs text-app-text-muted leading-relaxed">{description}</AppText>
                </View>
              ) : null}
            </Card>
          ) : null}

          {/* Bottom Actions */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            {step > 0 ? (
              <Pressable
                onPress={() => setStep((prev) => prev - 1)}
                style={[
                  {
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                  shadows.card,
                ]}
              >
                <AppText className="font-bold text-app-text">Précédent</AppText>
              </Pressable>
            ) : null}

            <Pressable
              disabled={busy}
              onPress={() => (step < 3 ? setStep((prev) => prev + 1) : void submit())}
              style={[
                {
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                  opacity: busy ? 0.6 : 1,
                },
                shadows.card,
              ]}
            >
              <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#ffffff' }}>
                {busy ? 'Création en cours...' : step < 3 ? 'Continuer' : 'Créer l’entreprise'}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SecurityGate>
  );
}
