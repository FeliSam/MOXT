import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Calendar, Check, Globe, MapPin, Users, Video } from 'lucide-react-native';

import { createEvent } from '@moxt/shared/services/contentWrites.js';

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

const STEPS = ['Bases', 'Programme', 'Lieu & Affiches', 'Confirmation'];

const CATEGORIES = [
  { value: 'networking', label: 'Réseau & Rencontres' },
  { value: 'training', label: 'Formation & Conférence' },
  { value: 'culture', label: 'Culture & Soirée' },
  { value: 'business', label: 'Business & Invest' },
  { value: 'community', label: 'Communauté Moxt' },
];

const FORMATS = [
  { value: 'in_person', label: 'Sur place', icon: MapPin },
  { value: 'online', label: 'En ligne', icon: Video },
  { value: 'hybrid', label: 'Hybride', icon: Globe },
];

export default function PublishEventScreen() {
  const { colors } = useTheme();
  const shadows = useShadows();
  const user = useAppSelector((state) => state.auth.user);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('community');
  const [format, setFormat] = useState('in_person');
  const [startAt, setStartAt] = useState('');
  const [description, setDescription] = useState('');
  const [program, setProgram] = useState('');
  const [city, setCity] = useState(user?.city || 'Moscou');
  const [venue, setVenue] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [photos, setPhotos] = useState<PosterPhoto[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [formula, setFormula] = useState('standard');
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const business = useAppSelector((state) => selectOwnedBusinesses(state.account.businesses, user?.id)[0]);

  function canLeave() {
    if (step === 0) return Boolean(title.trim().length >= 3 && category && startAt.trim());
    if (step === 1) return description.trim().length >= 20;
    return true;
  }

  async function publish() {
    if (!user || !supabase) return;
    setBusy(true);
    try {
      const images = await uploadPhotos(user.id, 'events', photos, setProgress);
      await createEvent(supabase, {
        ownerId: user.id,
        title: title.trim(),
        category,
        format,
        startAt: startAt.trim(),
        description: description.trim(),
        program: program.trim(),
        city: format === 'online' ? '' : city.trim(),
        venue: format === 'online' ? '' : venue.trim(),
        onlineLink: format === 'in_person' ? '' : onlineLink.trim(),
        images,
      });
      setShareOpen(true);
    } catch (error) {
      showNotice('Événement', error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SecurityGate kind="publish" pathname="/publish/event">
      <PublishForm
        title="Créer un événement"
        subtitle={STEPS[step]}
        busy={busy}
        submitLabel={step < 3 ? 'Continuer' : "Publier l'événement"}
        onBack={() => {
          if (step > 0) setStep(step - 1);
          else router.back();
        }}
        onSubmit={() => {
          if (step < 3) {
            if (!canLeave()) {
              if (step === 0) Alert.alert('Champs requis', 'Veuillez saisir le titre et la date/heure de début.');
              else if (step === 1) Alert.alert('Description requise', 'La description doit comporter au moins 20 caractères.');
              return;
            }
            setStep(step + 1);
            return;
          }
          void publish();
        }}>
        <StepBar steps={STEPS} index={step} />

        {/* Step 0: Bases */}
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
                label="Titre de l'événement *"
                placeholder="Ex: Soirée Networking Diaspora, Masterclass E-commerce..."
                value={title}
                onChangeText={setTitle}
              />

              <View style={{ gap: 8 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Catégorie
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map((c) => {
                    const active = category === c.value;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => setCategory(c.value)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primaryLight : colors.surfaceMuted,
                        }}>
                        <AppText className={active ? 'font-bold text-app-primary text-xs' : 'text-app-text text-xs'}>
                          {c.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">
                  Format de l'événement
                </AppText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {FORMATS.map((f) => {
                    const active = format === f.value;
                    const Icon = f.icon;
                    return (
                      <Pressable
                        key={f.value}
                        onPress={() => setFormat(f.value)}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primaryLight : colors.surfaceMuted,
                        }}>
                        <Icon size={14} color={active ? colors.primary : colors.textMuted} />
                        <AppText className={active ? 'font-bold text-app-primary text-xs' : 'text-app-text text-xs'}>
                          {f.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Field
                label="Date et Heure de début *"
                placeholder="Ex: Samedi 28 Octobre à 19h00"
                value={startAt}
                onChangeText={setStartAt}
              />
            </View>
          </View>
        ) : null}

        {/* Step 1: Programme */}
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
                label="Description & Objectifs *"
                placeholder="Présentez l'événement, les thèmes abordés, à qui il s'adresse..."
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Field
                label="Programme & Intervenants"
                placeholder="19h00 Accueil — 19h30 Conférence — 20h30 Échanges & Cocktail..."
                value={program}
                onChangeText={setProgram}
                multiline
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
              {format !== 'online' ? (
                <>
                  <CitySelector label="Ville" value={city} onChange={setCity} />
                  <Field label="Adresse / Salle de réception" placeholder="Ex: Salle Crystal, Rue Arbat 12" value={venue} onChangeText={setVenue} />
                </>
              ) : null}

              {format !== 'in_person' ? (
                <Field label="Lien de la visioconférence (Zoom, Meet, etc.)" placeholder="https://meet.google.com/..." value={onlineLink} onChangeText={setOnlineLink} />
              ) : null}

              <PosterUploader photos={photos} onChange={setPhotos} progress={progress} label="Affiche de l'événement" />
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
              <AppText className="text-base font-black text-app-text">Récapitulatif de l'événement</AppText>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Titre</AppText>
                <AppText numberOfLines={1} style={{ maxWidth: '65%' }} className="text-xs font-bold text-app-text">{title}</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Format</AppText>
                <AppText className="text-xs font-bold text-app-text">
                  {FORMATS.find((f) => f.value === format)?.label || format}
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Début</AppText>
                <AppText className="text-xs font-black text-app-primary">{startAt}</AppText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <AppText className="text-xs text-app-text-muted">Lieu</AppText>
                <AppText className="text-xs font-bold text-app-text">{format === 'online' ? 'En ligne' : `${city} (${venue || 'Adresse à venir'})`}</AppText>
              </View>

              <BusinessPublishNotice business={business as { status?: string; services?: string[] }} contentType="event" />
              <PublishFormulaSheet value={formula} onChange={setFormula} />
            </View>
          </View>
        ) : null}
      </PublishForm>

      <ShareToFeedModal
        visible={shareOpen}
        message={`Événement : ${title}`}
        imageUrl={photos[0]?.url}
        onClose={() => {
          setShareOpen(false);
          router.replace('/events' as never);
        }}
      />
    </SecurityGate>
  );
}
