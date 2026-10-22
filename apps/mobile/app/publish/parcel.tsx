import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Calendar, Check, FileCheck, Plane, Upload, User } from 'lucide-react-native';

import { createParcel } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm, StepBar } from '@/components/publish/PublishForm';
import {
  AirportSelector,
  BusinessPublishNotice,
  CurrencyChips,
  PublishFormulaSheet,
  SecurityGate,
  ShareToFeedModal,
  UploadProgressBar,
} from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { pickLibraryFile, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { selectOwnedBusinesses } from '@/store/account';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const STEPS = ['Trajet', 'Chargement', 'Conditions', 'Confirmation'];
const TYPES = ['Vêtements', 'Nourriture', 'Électronique', 'Documents', 'Médicaments', 'Autre'];

export default function PublishParcelScreen() {
  const { colors } = useTheme();
  const shadows = useShadows();
  const user = useAppSelector((state) => state.auth.user);

  const [step, setStep] = useState(0);
  const [originCountry, setOriginCountry] = useState('RU');
  const [destinationCountry, setDestinationCountry] = useState('BJ');
  const [originCode, setOriginCode] = useState('');
  const [destinationCode, setDestinationCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [formula, setFormula] = useState('standard');
  const [progress, setProgress] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const business = useAppSelector((state) => selectOwnedBusinesses(state.account.businesses, user?.id)[0]);
  const [departureDate, setDepartureDate] = useState('');
  const [depositDeadline, setDepositDeadline] = useState('');
  const [distributionDate, setDistributionDate] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [accepted, setAccepted] = useState<string[]>(['Vêtements']);
  const [conditions, setConditions] = useState('');
  const [contact, setContact] = useState(user?.phone || '');
  const [proof, setProof] = useState('');
  const [busy, setBusy] = useState(false);

  async function addProof() {
    if (!user) return;
    try {
      const file = await pickLibraryFile('images');
      if (!file) return;
      setProgress(0.4);
      const uploaded = await uploadLikeWeb('parcels', `${user.id}/draft/proof-${Date.now()}.jpg`, file, 'private');
      setProof(uploaded.path);
      setProgress(1);
    } catch (error) {
      showNotice('Preuve', error instanceof Error ? error.message : 'Envoi impossible.');
    }
  }

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      await createParcel(supabase, {
        ownerId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        departureDate,
        depositDeadline,
        distributionDate,
        capacityKg,
        pricePerKg,
        currency,
        acceptedTypes: accepted,
        conditions,
        contact,
        proofPath: proof,
        proofStatus: proof ? 'pending_review' : 'missing',
      });
      setShareOpen(true);
    } catch (error) {
      showNotice('Colis', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  const canNext =
    step === 0 ? Boolean(origin.trim() && destination.trim() && departureDate.trim()) :
    step === 1 ? Number(capacityKg) > 0 :
    true;

  return (
    <SecurityGate kind="voyage" pathname="/publish/parcel">
      <PublishForm
        title="Publier un voyage"
        subtitle={STEPS[step]}
        busy={busy}
        submitLabel={step < 3 ? 'Continuer' : 'Publier mon voyage'}
        onBack={() => {
          if (step > 0) setStep(step - 1);
          else router.back();
        }}
        onSubmit={() => {
          if (step < 3) {
            if (!canNext) {
              Alert.alert('Champs requis', 'Veuillez renseigner les informations obligatoires de cette étape.');
              return;
            }
            setStep(step + 1);
            return;
          }
          void publish();
        }}>
        <StepBar steps={STEPS} index={step} />

        {/* Step 0: Trajet */}
        {step === 0 ? (
          <View style={{ gap: 14 }}>
            <View
              style={[
                {
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 16,
                  gap: 14,
                },
                shadows.card,
              ]}>
              <View style={{ gap: 8 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Pays de départ
                </AppText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['RU', 'BJ', 'FR', 'TG', 'CI'].map((code) => {
                    const active = originCountry === code;
                    return (
                      <Pressable
                        key={code}
                        onPress={() => setOriginCountry(code)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primaryLight : colors.surfaceMuted,
                        }}>
                        <AppText className={active ? 'font-black text-app-primary' : 'font-bold text-app-text'}>
                          {code}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                <AirportSelector
                  label="Aéroport ou ville de départ *"
                  countryCode={originCountry}
                  value={originCode}
                  onChange={(airport) => {
                    setOriginCode(airport.code);
                    setOrigin(`${airport.city} (${airport.code})`);
                  }}
                />
              </View>

              <View style={{ alignItems: 'center', marginVertical: -4 }}>
                <View style={{ height: 32, width: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={16} color={colors.textMuted} />
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Pays d'arrivée
                </AppText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['BJ', 'RU', 'FR', 'TG', 'CI'].map((code) => {
                    const active = destinationCountry === code;
                    return (
                      <Pressable
                        key={`to-${code}`}
                        onPress={() => setDestinationCountry(code)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primaryLight : colors.surfaceMuted,
                        }}>
                        <AppText className={active ? 'font-black text-app-primary' : 'font-bold text-app-text'}>
                          {code}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                <AirportSelector
                  label="Aéroport ou ville d'arrivée *"
                  countryCode={destinationCountry}
                  value={destinationCode}
                  onChange={(airport) => {
                    setDestinationCode(airport.code);
                    setDestination(`${airport.city} (${airport.code})`);
                  }}
                />
              </View>

              <Field label="Date de départ (AAAA-MM-JJ) *" placeholder="2026-10-25" value={departureDate} onChangeText={setDepartureDate} />
              <Field label="Date limite de dépôt des colis" placeholder="2026-10-23" value={depositDeadline} onChangeText={setDepositDeadline} />
              <Field label="Date estimée de distribution" placeholder="2026-10-26" value={distributionDate} onChangeText={setDistributionDate} />
            </View>
          </View>
        ) : null}

        {/* Step 1: Chargement */}
        {step === 1 ? (
          <View style={{ gap: 14 }}>
            <View
              style={[
                {
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 16,
                  gap: 14,
                },
                shadows.card,
              ]}>
              <Field label="Kilos disponibles (kg) *" placeholder="Ex: 23" value={capacityKg} onChangeText={setCapacityKg} keyboardType="numeric" />
              <Field label="Prix par kilo *" placeholder="Ex: 800" value={pricePerKg} onChangeText={setPricePerKg} keyboardType="numeric" />
              <CurrencyChips label="Devise" value={currency} onChange={setCurrency} />

              <View style={{ gap: 8 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Types de colis acceptés
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {TYPES.map((t) => {
                    const on = accepted.includes(t);
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setAccepted((prev) => (on ? prev.filter((item) => item !== t) : [...prev, t]))}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: on ? colors.primary : colors.border,
                          backgroundColor: on ? colors.primaryLight : colors.surfaceMuted,
                        }}>
                        {on ? <Check size={14} color={colors.primary} strokeWidth={2.5} /> : null}
                        <AppText className={on ? 'font-bold text-app-primary' : 'text-app-text'}>
                          {t}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Step 2: Conditions & Preuve */}
        {step === 2 ? (
          <View style={{ gap: 14 }}>
            <View
              style={[
                {
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 16,
                  gap: 14,
                },
                shadows.card,
              ]}>
              <Field
                label="Conditions & Consignes particulières"
                placeholder="Ex: Pas de liquides, remise en main propre à l'aéroport ou quartier X..."
                value={conditions}
                onChangeText={setConditions}
                multiline
              />
              <Field label="Téléphone ou WhatsApp de contact *" placeholder="+7 900 000-00-00" value={contact} onChangeText={setContact} />

              <View style={{ gap: 8, marginTop: 4 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Preuve de voyage (Recommandé)
                </AppText>
                <Pressable
                  onPress={() => void addProof()}
                  style={{
                    minHeight: 52,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: proof ? 'solid' : 'dashed',
                    borderColor: proof ? colors.primary : colors.borderMd,
                    backgroundColor: proof ? colors.primaryLight : colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    paddingHorizontal: 14,
                  }}>
                  {proof ? (
                    <>
                      <FileCheck size={18} color={colors.primary} />
                      <AppText className="font-bold text-app-primary text-xs">
                        Billet ou passeport joint avec succès
                      </AppText>
                    </>
                  ) : (
                    <>
                      <Upload size={18} color={colors.textMuted} />
                      <AppText className="font-semibold text-app-text-muted text-xs">
                        Joindre billet d'avion ou passeport (gage de confiance)
                      </AppText>
                    </>
                  )}
                </Pressable>
                <UploadProgressBar progress={progress} />
              </View>
            </View>
          </View>
        ) : null}

        {/* Step 3: Confirmation */}
        {step === 3 ? (
          <View style={{ gap: 14 }}>
            <View
              style={[
                {
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 16,
                  gap: 12,
                },
                shadows.card,
              ]}>
              <AppText className="text-base font-black text-app-text">Récapitulatif de votre trajet</AppText>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Itinéraire</AppText>
                <AppText className="text-xs font-bold text-app-text">{origin} → {destination}</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Départ</AppText>
                <AppText className="text-xs font-bold text-app-text">{departureDate}</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Capacité</AppText>
                <AppText className="text-xs font-black text-app-primary">{capacityKg} kg disponibles</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Tarif au kilo</AppText>
                <AppText className="text-xs font-black text-app-primary">{pricePerKg} {currency} / kg</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Preuve</AppText>
                <AppText className="text-xs font-bold text-app-text">{proof ? 'Vérifiée' : 'Non fournie'}</AppText>
              </View>

              <BusinessPublishNotice business={business as { status?: string; services?: string[] }} contentType="parcel" />
              <PublishFormulaSheet value={formula} onChange={setFormula} />
            </View>
          </View>
        ) : null}
      </PublishForm>

      <ShareToFeedModal
        visible={shareOpen}
        message={`Voyage ${origin} → ${destination} (${capacityKg} kg)`}
        onClose={() => {
          setShareOpen(false);
          router.replace('/(tabs)/parcels' as never);
        }}
      />
    </SecurityGate>
  );
}
