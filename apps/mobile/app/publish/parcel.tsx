import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

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
import { showNotice } from '@/utils/notice';

const STEPS = ['Trajet', 'Chargement', 'Conditions', 'Confirmation'];
const TYPES = ['Vêtements', 'Nourriture', 'Électronique', 'Documents', 'Autre'];

/** PublishParcelPage : trajet, chargement, preuves, récapitulatif. */
export default function PublishParcelScreen() {
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
  const [contact, setContact] = useState('');
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
    step === 0 ? Boolean(origin.trim() && destination.trim() && departureDate) :
    step === 1 ? Number(capacityKg) > 0 :
    true;

  return (
    <SecurityGate kind="voyage" pathname="/publish/parcel">
    <PublishForm
      pathname="/publish/parcel"
      title="Publier un voyage"
      subtitle={STEPS[step]}
      busy={busy}
      submitLabel={step < 3 ? 'Continuer' : 'Publier'}
      onSubmit={() => {
        if (step < 3) {
          if (!canNext) {
            showNotice('Colis', 'Complétez cette étape.');
            return;
          }
          setStep(step + 1);
          return;
        }
        void publish();
      }}>
      <StepBar steps={STEPS} index={step} />
      {step > 0 ? (
        <Pressable onPress={() => setStep(step - 1)}>
          <AppText className="text-sm font-bold text-app-accent">Retour</AppText>
        </Pressable>
      ) : null}
      {step === 0 ? (
        <>
          <AppText className="text-xs font-bold text-app-text-muted">Pays de départ</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['RU', 'BJ'].map((code) => (
              <Pressable key={code} onPress={() => setOriginCountry(code)}>
                <AppText className={originCountry === code ? 'font-black text-app-accent' : 'font-bold text-app-text'}>{code}</AppText>
              </Pressable>
            ))}
          </View>
          <AirportSelector
            label="Aéroport de départ"
            countryCode={originCountry}
            value={originCode}
            onChange={(airport) => {
              setOriginCode(airport.code);
              setOrigin(`${airport.city} (${airport.code})`);
            }}
          />
          <AppText className="text-xs font-bold text-app-text-muted">Pays d&apos;arrivée</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['BJ', 'RU'].map((code) => (
              <Pressable key={`to-${code}`} onPress={() => setDestinationCountry(code)}>
                <AppText className={destinationCountry === code ? 'font-black text-app-accent' : 'font-bold text-app-text'}>{code}</AppText>
              </Pressable>
            ))}
          </View>
          <AirportSelector
            label="Aéroport d'arrivée"
            countryCode={destinationCountry}
            value={destinationCode}
            onChange={(airport) => {
              setDestinationCode(airport.code);
              setDestination(`${airport.city} (${airport.code})`);
            }}
          />
          <Field label="Date de départ (AAAA-MM-JJ)" value={departureDate} onChangeText={setDepartureDate} />
          <Field label="Limite de dépôt" value={depositDeadline} onChangeText={setDepositDeadline} />
          <Field label="Date de distribution" value={distributionDate} onChangeText={setDistributionDate} />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Field label="Capacité (kg)" value={capacityKg} onChangeText={setCapacityKg} keyboardType="numeric" />
          <Field label="Prix par kg" value={pricePerKg} onChangeText={setPricePerKg} keyboardType="numeric" />
          <CurrencyChips label="Devise" value={currency} onChange={setCurrency} />
          <AppText className="text-xs font-bold uppercase text-app-text-muted">Types acceptés</AppText>
          {TYPES.map((type) => {
            const on = accepted.includes(type);
            return (
              <Pressable key={type} onPress={() => setAccepted((prev) => (on ? prev.filter((item) => item !== type) : [...prev, type]))}>
                <AppText className={on ? 'font-bold text-app-accent' : 'text-app-text'}>{on ? '✓ ' : ''}{type}</AppText>
              </Pressable>
            );
          })}
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Field label="Conditions" value={conditions} onChangeText={setConditions} multiline />
          <Field label="Contact" value={contact} onChangeText={setContact} />
          <Pressable onPress={() => void addProof()}>
            <AppText className="text-sm font-bold text-app-accent">{proof ? 'Preuve de voyage ajoutée' : 'Ajouter une preuve (passeport ou billet)'}</AppText>
          </Pressable>
          <UploadProgressBar progress={progress} />
        </>
      ) : null}
      {step === 3 ? (
        <AppText className="text-sm leading-5 text-app-text">
          {origin} → {destination} · {capacityKg || '0'} kg · {pricePerKg || '0'} {currency} / kg
          {proof ? '\nPreuve jointe.' : '\nSans preuve pour le moment.'}
        </AppText>
      ) : null}
      {step === 3 ? (
        <>
          <BusinessPublishNotice business={business as { status?: string; services?: string[] }} contentType="parcel" />
          <PublishFormulaSheet value={formula} onChange={setFormula} />
        </>
      ) : null}
    </PublishForm>
    <ShareToFeedModal
      visible={shareOpen}
      message={`Voyage ${origin} → ${destination}`}
      onClose={() => {
        setShareOpen(false);
        router.replace('/(tabs)/parcels' as never);
      }}
    />
    </SecurityGate>
  );
}
