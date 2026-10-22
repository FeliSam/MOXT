import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Check, Plus, Trash2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import {
  BusinessPublishNotice,
  CitySelector,
  CurrencyChips,
  PublishFormulaSheet,
  SecurityGate,
  ShareToFeedModal,
  UploadProgressBar,
} from '@/components/publish/publishKit';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { pickLibraryFile, uploadLikeWeb, type UploadFile } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { selectOwnedBusinesses } from '@/store/account';
import { loadListings } from '@/store/marketplace';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows, useTheme } from '@/theme/ThemeContext';

type Step = 'type' | 'info' | 'photos' | 'confirm';

const STEPS: { key: Step; label: string }[] = [
  { key: 'type', label: 'Catégorie' },
  { key: 'info', label: 'Détails' },
  { key: 'photos', label: 'Photos' },
  { key: 'confirm', label: 'Confirmation' },
];

const LISTING_TYPES = [
  { key: 'product', label: 'Produit', icon: '🛍️', desc: 'Vêtements, électronique, déco...' },
  { key: 'service', label: 'Service', icon: '💼', desc: 'Prestations, réparations, cours...' },
  { key: 'rental', label: 'Location', icon: '🏠', desc: 'Appartement, matériel, chambre...' },
  { key: 'vehicle', label: 'Véhicule', icon: '🚗', desc: 'Voiture, moto, vélo, pièces...' },
  { key: 'food', label: 'Alimentation', icon: '🍛', desc: 'Plats cuisinés, épicerie, bio...' },
  { key: 'digital', label: 'Numérique', icon: '💻', desc: 'Logiciels, templates, ebooks...' },
  { key: 'real_estate', label: 'Immobilier', icon: '🏢', desc: 'Vente de maison, terrain, bail...' },
  { key: 'other', label: 'Autre', icon: '📦', desc: 'Toute autre catégorie...' },
];

const CONDITIONS = [
  { key: 'new', label: 'Neuf' },
  { key: 'like_new', label: 'Comme neuf' },
  { key: 'good', label: 'Bon état' },
  { key: 'used', label: 'État correct' },
];

export default function CreateListingScreen() {
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { onScroll } = useSmartNavbarScroll();

  const [step, setStep] = useState<Step>('type');
  const [type, setType] = useState('product');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('good');
  const [city, setCity] = useState(user?.city || 'Moscou');
  const [currency, setCurrency] = useState('RUB');
  const [formula, setFormula] = useState('standard');
  const [contact, setContact] = useState(user?.phone || '');
  const [photos, setPhotos] = useState<UploadFile[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedImage, setPublishedImage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const business = useAppSelector((state) => selectOwnedBusinesses(state.account.businesses, user?.id)[0]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const goNext = () => {
    if (step === 'type') {
      setStep('info');
    } else if (step === 'info') {
      if (!title.trim()) {
        Alert.alert('Information requise', 'Veuillez saisir un titre pour votre annonce.');
        return;
      }
      if (!price.trim()) {
        Alert.alert('Information requise', 'Veuillez définir un prix.');
        return;
      }
      setStep('photos');
    } else if (step === 'photos') {
      setStep('confirm');
    }
  };

  const goBack = () => {
    if (step === 'info') setStep('type');
    else if (step === 'photos') setStep('info');
    else if (step === 'confirm') setStep('photos');
    else router.back();
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 8) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter au maximum 8 photos.');
      return;
    }
    try {
      const file = await pickLibraryFile('images');
      if (file) {
        setPhotos((prev) => [...prev, file]);
      }
    } catch (err: any) {
      Alert.alert('Galerie', err.message || 'Impossible de sélectionner la photo.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    setProgress(0.1);
    try {
      const now = new Date().toISOString();
      const listingId = `ANN-${Date.now().toString(36).toUpperCase()}`;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.uri.startsWith('http')) {
          uploadedUrls.push(photo.uri);
        } else {
          setProgress(0.1 + ((i + 1) / (photos.length || 1)) * 0.7);
          const uploaded = await uploadLikeWeb(
            'listings',
            `${user.id}/listings/${listingId}_${i + 1}.jpg`,
            photo,
            'public',
          );
          if (uploaded.url) uploadedUrls.push(uploaded.url);
        }
      }

      setProgress(0.9);

      const { error } = await supabase.from('listings').insert({
        id: listingId,
        title: title.trim(),
        description: description.trim(),
        type,
        status: 'active',
        price: Number(price),
        currency,
        country: 'RU',
        city: city.trim(),
        images: uploadedUrls,
        owner_id: user.id,
        seller_name: `${user.firstName} ${user.lastName}`.trim(),
        payload: {
          title: title.trim(),
          description: description.trim(),
          type,
          condition,
          price: Number(price),
          currency,
          formula,
          city: city.trim(),
          contact,
          sellerName: `${user.firstName} ${user.lastName}`.trim(),
        },
        created_at: now,
        updated_at: now,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw new Error(error.message);

      await dispatch(loadListings());
      setPublishedImage(uploadedUrls[0]);
      setShareOpen(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Publication impossible.');
    } finally {
      setProgress(null);
      setLoading(false);
    }
  };

  const typeMeta = LISTING_TYPES.find((t) => t.key === type) || LISTING_TYPES[0];

  return (
    <SecurityGate kind="publish" pathname="/listing/create">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom + 100, 140),
              gap: 18,
            }}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Pressable
                accessibilityLabel="Retour"
                onPress={goBack}
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
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                  Publier une annonce
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                  Étape {stepIndex + 1} sur 4 : {STEPS[stepIndex].label}
                </Text>
              </View>
            </View>

            {/* Stepper progress */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {STEPS.map((s, idx) => (
                <View key={s.key} style={{ flex: 1, gap: 4 }}>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 99,
                      backgroundColor:
                        idx === stepIndex
                          ? colors.accent
                          : idx < stepIndex
                            ? colors.primary
                            : colors.border,
                    }}
                  />
                </View>
              ))}
            </View>

            {/* Step 1 : Catégorie */}
            {step === 'type' ? (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textMuted }}>
                  Sélectionnez le type d'annonce
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {LISTING_TYPES.map((t) => {
                    const isSelected = type === t.key;
                    return (
                      <Pressable
                        key={t.key}
                        onPress={() => setType(t.key)}
                        style={[
                          {
                            width: '48%',
                            borderRadius: 16,
                            borderWidth: 1.5,
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                            padding: 14,
                            gap: 6,
                          },
                          shadows.card,
                        ]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                          {isSelected ? (
                            <View style={{ height: 18, width: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={11} color="#fff" strokeWidth={3} />
                            </View>
                          ) : null}
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? colors.primary : colors.text }}>
                          {t.label}
                        </Text>
                        <Text numberOfLines={2} style={{ fontSize: 11, color: colors.textMuted, lineHeight: 14 }}>
                          {t.desc}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Step 2 : Détails */}
            {step === 'info' ? (
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
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textMuted }}>
                      Titre de l'annonce *
                    </Text>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Ex: iPhone 15 Pro 128Go débloqué..."
                      placeholderTextColor={colors.textFaint}
                      style={{
                        minHeight: 48,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceMuted,
                        paddingHorizontal: 14,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textMuted }}>
                      Description
                    </Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Décrivez l'article, ses caractéristiques, accessoires inclus..."
                      placeholderTextColor={colors.textFaint}
                      multiline
                      style={{
                        minHeight: 90,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceMuted,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: colors.text,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textMuted }}>
                      Prix de vente *
                    </Text>
                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textFaint}
                      style={{
                        minHeight: 48,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceMuted,
                        paddingHorizontal: 14,
                        fontSize: 16,
                        fontWeight: '700',
                        color: colors.primary,
                      }}
                    />
                  </View>

                  <CurrencyChips label="Devise" value={currency} onChange={setCurrency} />

                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textMuted }}>
                      État de l'objet
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {CONDITIONS.map((c) => {
                        const active = condition === c.key;
                        return (
                          <Pressable
                            key={c.key}
                            onPress={() => setCondition(c.key)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: active ? colors.primary : colors.border,
                              backgroundColor: active ? colors.primaryLight : colors.surfaceMuted,
                            }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: active ? colors.primary : colors.text }}>
                              {c.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <CitySelector value={city} onChange={setCity} />

                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textMuted }}>
                      Téléphone ou WhatsApp
                    </Text>
                    <TextInput
                      value={contact}
                      onChangeText={setContact}
                      placeholder="+7 900 000-00-00"
                      keyboardType="phone-pad"
                      placeholderTextColor={colors.textFaint}
                      style={{
                        minHeight: 48,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceMuted,
                        paddingHorizontal: 14,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {/* Step 3 : Photos */}
            {step === 'photos' ? (
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                      Galerie photos ({photos.length}/8)
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      {photos.length === 0 ? 'Optionnel' : `${photos.length} sélectionnée(s)`}
                    </Text>
                  </View>

                  {/* Add button */}
                  {photos.length < 8 ? (
                    <Pressable
                      onPress={handleAddPhoto}
                      style={{
                        minHeight: 110,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                        borderStyle: 'dashed',
                        backgroundColor: colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}>
                      <View style={{ height: 42, width: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={20} color={colors.primary} />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                        Ajouter des photos
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Photos Grid */}
                  {photos.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {photos.map((photo, index) => (
                        <View
                          key={photo.uri + index}
                          style={{
                            width: '48%',
                            aspectRatio: 1,
                            borderRadius: 14,
                            overflow: 'hidden',
                            position: 'relative',
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}>
                          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          {index === 0 ? (
                            <View style={{ position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>Principale</Text>
                            </View>
                          ) : null}
                          <Pressable
                            accessibilityLabel="Supprimer la photo"
                            onPress={() => handleRemovePhoto(index)}
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              height: 26,
                              width: 26,
                              borderRadius: 13,
                              backgroundColor: 'rgba(0,0,0,0.65)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <X size={14} color="#fff" strokeWidth={2.5} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <UploadProgressBar progress={progress} />
                </View>
              </View>
            ) : null}

            {/* Step 4 : Confirmation */}
            {step === 'confirm' ? (
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
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                    Récapitulatif de votre annonce
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>Type</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{typeMeta.label}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>Titre</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.text, maxWidth: '65%' }}>{title}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>Prix</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>
                      {formatCurrency(Number(price) || 0, currency)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>Ville</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{city}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>Photos</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {photos.length} photo(s)
                    </Text>
                  </View>

                  <BusinessPublishNotice business={business as { status?: string; services?: string[] }} contentType="listing" />
                  <PublishFormulaSheet value={formula} onChange={setFormula} />
                </View>
              </View>
            ) : null}

            {/* Navigation buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <Pressable
                onPress={goBack}
                style={[
                  {
                    flex: 1,
                    minHeight: 50,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                  shadows.card,
                ]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {step === 'type' ? 'Annuler' : 'Précédent'}
                </Text>
              </Pressable>

              <Pressable
                onPress={step === 'confirm' ? handlePublish : goNext}
                disabled={loading}
                style={[
                  {
                    flex: 2,
                    minHeight: 50,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accent,
                    opacity: loading ? 0.7 : 1,
                  },
                  shadows.card,
                ]}>
                {loading ? (
                  <ActivityIndicator color={isDark ? '#020617' : '#fff'} />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#020617' : '#ffffff' }}>
                    {step === 'confirm' ? 'Publier mon annonce' : 'Continuer'}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ShareToFeedModal
        visible={shareOpen}
        message={`${title} — ${city}`}
        imageUrl={publishedImage}
        onClose={() => {
          setShareOpen(false);
          router.replace('/(tabs)/marketplace');
        }}
      />
    </SecurityGate>
  );
}
