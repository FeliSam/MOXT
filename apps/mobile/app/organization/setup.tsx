import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { CitySelector, SecurityGate } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { upsertStrippingUnknown } from '@/services/rowWrite';
import { loadBusinesses } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const ACTIVITIES = ['commerce', 'services', 'transport', 'finance', 'food', 'education', 'health', 'other'];
const SERVICE_OPTIONS = ['Marketplace', 'Colis', 'Jobs', 'Events', 'P2P', 'Transfert'];

/** Création d’entreprise en 4 étapes (BusinessSetupPage). */
export default function BusinessSetupScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
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

  const field = { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, backgroundColor: colors.surface };

  function toggle(service: string) {
    setServices((current) => (current.includes(service) ? current.filter((item) => item !== service) : [...current, service]));
  }

  async function submit() {
    if (!user) return;
    if (name.trim().length < 2 || !city.trim()) {
      showNotice('Entreprise', 'Nom et ville sont requis.');
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
      <AppChrome pathname="/professional">
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
          <AppText className="text-xs font-black uppercase text-app-accent">Étape {step + 1} / 4</AppText>
          <AppText className="text-2xl font-black text-app-text">
            {['Identité', 'Contact', 'Services', 'Récapitulatif'][step]}
          </AppText>
          {step === 0 ? (
            <>
              <TextInput value={name} onChangeText={setName} placeholder="Nom de l’entreprise" placeholderTextColor={colors.textFaint} style={field} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ACTIVITIES.map((item) => (
                  <Pressable key={item} onPress={() => setActivity(item)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: activity === item ? colors.accent : colors.surfaceMuted }}>
                    <AppText className="text-xs font-bold" style={{ color: activity === item ? (isDark ? '#020617' : '#fff') : colors.text }}>{item}</AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          {step === 1 ? (
            <>
              <CitySelector value={city} onChange={setCity} />
              <TextInput value={address} onChangeText={setAddress} placeholder="Adresse" placeholderTextColor={colors.textFaint} style={field} />
              <TextInput value={phone} onChangeText={setPhone} placeholder="Téléphone" placeholderTextColor={colors.textFaint} style={field} />
              <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={colors.textFaint} style={field} />
              <TextInput value={description} onChangeText={setDescription} placeholder="Présentation" placeholderTextColor={colors.textFaint} style={[field, { minHeight: 88 }]} multiline />
            </>
          ) : null}
          {step === 2 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SERVICE_OPTIONS.map((item) => (
                <Pressable key={item} onPress={() => toggle(item)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: services.includes(item) ? colors.accent : colors.surfaceMuted }}>
                  <AppText className="text-xs font-bold" style={{ color: services.includes(item) ? (isDark ? '#020617' : '#fff') : colors.text }}>{item}</AppText>
                </Pressable>
              ))}
            </View>
          ) : null}
          {step === 3 ? (
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
              <AppText className="font-black text-app-text">{name || 'Sans nom'}</AppText>
              <AppText className="text-sm text-app-text-muted">{activity} · {city || 'Ville'} · {services.join(', ')}</AppText>
              <AppText className="text-sm text-app-text">{description || 'Pas de présentation.'}</AppText>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((value) => value - 1)} style={{ flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <AppText className="font-bold text-app-text">Retour</AppText>
              </Pressable>
            ) : null}
            <Pressable
              disabled={busy}
              onPress={() => (step < 3 ? setStep((value) => value + 1) : void submit())}
              style={{ flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}>
              <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>{step < 3 ? 'Continuer' : 'Créer'}</AppText>
            </Pressable>
          </View>
        </ScrollView>
      </AppChrome>
    </SecurityGate>
  );
}
