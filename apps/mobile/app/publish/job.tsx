import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Briefcase, Building, Check, DollarSign, MapPin } from 'lucide-react-native';

import { createJob } from '@moxt/shared/services/contentWrites.js';

import { Field, PublishForm, StepBar } from '@/components/publish/PublishForm';
import {
  BusinessPublishNotice,
  CitySelector,
  PosterUploader,
  PublishFormulaSheet,
  SecurityGate,
  ShareToFeedModal,
  uploadPhotos,
  type PosterPhoto,
} from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { selectOwnedBusinesses } from '@/store/account';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const STEPS = ['Poste', 'Détails', 'Lieu & Affiches', 'Confirmation'];

const CONTRACT_TYPES = [
  { key: 'cdi', label: 'CDI' },
  { key: 'cdd', label: 'CDD' },
  { key: 'freelance', label: 'Freelance' },
  { key: 'internship', label: 'Stage' },
  { key: 'part_time', label: 'Temps partiel' },
];

const SECTORS = [
  'Technologie & Informatique',
  'Commerce & Vente',
  'Logistique & Transport',
  'Restauration & Hôtellerie',
  'Services & Artisanat',
  'Enseignement & Traduction',
  'Autre',
];

export default function PublishJobScreen() {
  const { colors } = useTheme();
  const shadows = useShadows();
  const user = useAppSelector((state) => state.auth.user);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState(SECTORS[0]);
  const [contractType, setContractType] = useState('cdi');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState(user?.city || 'Moscou');
  const [photos, setPhotos] = useState<PosterPhoto[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [formula, setFormula] = useState('standard');
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const business = useAppSelector((state) => selectOwnedBusinesses(state.account.businesses, user?.id)[0]);

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      const images = await uploadPhotos(user.id, 'jobs', photos, setProgress);
      await createJob(supabase, {
        ownerId: user.id,
        title: title.trim(),
        sector: sector.trim(),
        description: description.trim(),
        salary: salary.trim(),
        location: location.trim(),
        images,
      });
      setShareOpen(true);
    } catch (error) {
      showNotice('Job', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  const canNext =
    step === 0 ? Boolean(title.trim().length >= 3 && sector) :
    step === 1 ? Boolean(description.trim().length >= 20) :
    true;

  return (
    <SecurityGate kind="publish" pathname="/publish/job">
      <PublishForm
        title="Publier une offre d'emploi"
        subtitle={STEPS[step]}
        busy={busy}
        submitLabel={step < 3 ? 'Continuer' : "Publier l'offre"}
        onBack={() => {
          if (step > 0) setStep(step - 1);
          else router.back();
        }}
        onSubmit={() => {
          if (step < 3) {
            if (!canNext) {
              if (step === 0) Alert.alert('Titre requis', 'Veuillez saisir un intitulé de poste valide.');
              else if (step === 1) Alert.alert('Description requise', 'La description du poste doit comporter au moins 20 caractères.');
              return;
            }
            setStep(step + 1);
            return;
          }
          void publish();
        }}>
        <StepBar steps={STEPS} index={step} />

        {/* Step 0: Poste */}
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
              <Field
                label="Intitulé du poste *"
                placeholder="Ex: Développeur React / Mobile, Cuisinier, Chauffeur..."
                value={title}
                onChangeText={setTitle}
              />

              <View style={{ gap: 8 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Type de contrat
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CONTRACT_TYPES.map((ct) => {
                    const active = contractType === ct.key;
                    return (
                      <Pressable
                        key={ct.key}
                        onPress={() => setContractType(ct.key)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primaryLight : colors.surfaceMuted,
                        }}>
                        <AppText className={active ? 'font-bold text-app-primary text-xs' : 'text-app-text text-xs'}>
                          {ct.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Secteur d'activité
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {SECTORS.map((s) => {
                    const active = sector === s;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setSector(s)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primaryLight : colors.surfaceMuted,
                        }}>
                        <AppText className={active ? 'font-bold text-app-primary text-xs' : 'text-app-text text-xs'}>
                          {s}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Step 1: Détails */}
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
              <Field
                label="Description du poste & Missions *"
                placeholder="Décrivez les responsabilités, compétences recherchées, horaires..."
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Field
                label="Rémunération / Salaire"
                placeholder="Ex: 80 000 RUB / mois, Selon profil, Négociable..."
                value={salary}
                onChangeText={setSalary}
              />
            </View>
          </View>
        ) : null}

        {/* Step 2: Lieu & Affiches */}
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
              <CitySelector label="Ville / Localisation" value={location} onChange={setLocation} />
              <PosterUploader photos={photos} onChange={setPhotos} progress={progress} label="Affiches ou visuels (Optionnel)" />
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
              <AppText className="text-base font-black text-app-text">Récapitulatif de l'offre</AppText>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Poste</AppText>
                <AppText className="text-xs font-bold text-app-text">{title}</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Secteur</AppText>
                <AppText className="text-xs font-bold text-app-text">{sector}</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Contrat</AppText>
                <AppText className="text-xs font-black text-app-primary">
                  {CONTRACT_TYPES.find((c) => c.key === contractType)?.label || contractType}
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Lieu</AppText>
                <AppText className="text-xs font-bold text-app-text">{location || 'Non précisé'}</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Rémunération</AppText>
                <AppText className="text-xs font-black text-app-primary">{salary || 'Selon profil'}</AppText>
              </View>

              <BusinessPublishNotice business={business as { status?: string; services?: string[] }} contentType="job" />
              <PublishFormulaSheet value={formula} onChange={setFormula} />
            </View>
          </View>
        ) : null}
      </PublishForm>

      <ShareToFeedModal
        visible={shareOpen}
        message={`Offre : ${title} à ${location}`}
        imageUrl={photos[0]?.url}
        onClose={() => {
          setShareOpen(false);
          router.replace('/jobs' as never);
        }}
      />
    </SecurityGate>
  );
}
