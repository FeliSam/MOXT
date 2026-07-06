import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ImagePickerButton } from '@/components/ImagePickerButton';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { supabase } from '@/services/supabase';
import { loadListings } from '@/store/marketplace';
import { useAppDispatch, useAppSelector } from '@/store/store';

type Step = 'type' | 'info' | 'photos' | 'confirm';

const LISTING_TYPES = [
  { key: 'product', label: 'Produit', icon: '🛍️' },
  { key: 'service', label: 'Service', icon: '💼' },
  { key: 'rental', label: 'Location', icon: '🏠' },
  { key: 'vehicle', label: 'Véhicule', icon: '🚗' },
  { key: 'food', label: 'Alimentation', icon: '🍛' },
  { key: 'digital', label: 'Numérique', icon: '💻' },
  { key: 'real_estate', label: 'Immobilier', icon: '🏢' },
  { key: 'other', label: 'Autre', icon: '📦' },
];

export default function CreateListingScreen() {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [step, setStep] = useState<Step>('type');
  const [type, setType] = useState('product');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('Moscou');
  const [contact, setContact] = useState(user?.phone || '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => {
    if (step === 'type') setStep('info');
    else if (step === 'info') {
      if (!title.trim()) { Alert.alert('Titre requis'); return; }
      if (!price) { Alert.alert('Prix requis'); return; }
      setStep('photos');
    } else if (step === 'photos') setStep('confirm');
  };

  const goBack = () => {
    if (step === 'info') setStep('type');
    else if (step === 'photos') setStep('info');
    else if (step === 'confirm') setStep('photos');
    else router.back();
  };

  const handlePublish = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const listingId = `ANN-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('listings').insert({
        id: listingId,
        title: title.trim(),
        description: description.trim(),
        type,
        status: 'active',
        price: Number(price),
        currency: 'RUB',
        country: 'RU',
        city: city.trim(),
        images: imageUri ? [imageUri] : [],
        owner_id: user?.id,
        seller_name: `${user?.firstName} ${user?.lastName}`,
        payload: {
          title: title.trim(),
          description: description.trim(),
          type,
          price: Number(price),
          currency: 'RUB',
          city: city.trim(),
          contact,
          sellerName: `${user?.firstName} ${user?.lastName}`,
        },
        created_at: now,
        updated_at: now,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw new Error(error.message);
      await dispatch(loadListings());
      Alert.alert('Annonce publiée !', `Réf: ${listingId}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Publication impossible.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = ['type', 'info', 'photos', 'confirm'].indexOf(step);
  const typeLabel = LISTING_TYPES.find((t) => t.key === type)?.label || type;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
          {/* Progress */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {['Type', 'Infos', 'Photos', 'Publier'].map((label, idx) => (
              <View key={label} style={{ alignItems: 'center', gap: spacing.xs, flex: 1 }}>
                <View style={{
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: idx <= stepIndex ? colors.primary : colors.border,
                }} />
                <Text style={{
                  fontSize: 10,
                  color: idx <= stepIndex ? colors.primary : colors.textFaint,
                  fontWeight: idx <= stepIndex ? '700' : '400',
                }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Step: Type */}
          {step === 'type' ? (
            <Card>
              <View style={{ gap: spacing.md }}>
                <Text style={{ ...typography.sectionTitle, color: colors.text }}>Type d'annonce</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {LISTING_TYPES.map((t) => (
                    <Pressable
                      key={t.key}
                      style={{
                        width: '47%',
                        borderWidth: 1,
                        borderColor: type === t.key ? colors.primary : colors.borderMd,
                        borderRadius: radii.md,
                        padding: 14,
                        alignItems: 'center',
                        gap: spacing.xs,
                        backgroundColor: type === t.key ? colors.primaryLight : colors.surface,
                      }}
                      onPress={() => setType(t.key)}>
                      <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                      <Text style={{
                        fontSize: 12, fontWeight: '700',
                        color: type === t.key ? colors.primary : colors.textMuted,
                      }}>{t.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Card>
          ) : null}

          {/* Step: Info */}
          {step === 'info' ? (
            <Card>
              <View style={{ gap: spacing.md }}>
                <Text style={{ ...typography.sectionTitle, color: colors.text }}>Informations</Text>
                <Input placeholder="Titre de l'annonce *" value={title} onChangeText={setTitle} autoFocus />
                <Input placeholder="Description" value={description} onChangeText={setDescription} multiline style={{ height: 80, textAlignVertical: 'top' }} />
                <Input placeholder="Prix (RUB) *" value={price} onChangeText={setPrice} keyboardType="numeric" />
                <Input placeholder="Ville" value={city} onChangeText={setCity} />
                <Input placeholder="Téléphone de contact" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
              </View>
            </Card>
          ) : null}

          {/* Step: Photos */}
          {step === 'photos' ? (
            <Card>
              <View style={{ gap: spacing.md }}>
                <Text style={{ ...typography.sectionTitle, color: colors.text }}>Photo (optionnel)</Text>
                <ImagePickerButton label="Ajouter une photo" currentUri={imageUri} onImageSelected={setImageUri} />
              </View>
            </Card>
          ) : null}

          {/* Step: Confirm */}
          {step === 'confirm' ? (
            <Card>
              <View style={{ gap: spacing.sm }}>
                <Text style={{ ...typography.sectionTitle, color: colors.text }}>Résumé</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ ...typography.body, color: colors.textMuted }}>Type</Text>
                  <Text style={{ ...typography.body, fontWeight: '600', color: colors.text }}>{typeLabel}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ ...typography.body, color: colors.textMuted }}>Titre</Text>
                  <Text style={{ ...typography.body, fontWeight: '600', color: colors.text, maxWidth: '60%', textAlign: 'right' }}>{title}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ ...typography.body, color: colors.textMuted }}>Prix</Text>
                  <Text style={{ ...typography.body, fontWeight: '600', color: colors.primary }}>{formatCurrency(Number(price), 'RUB')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ ...typography.body, color: colors.textMuted }}>Ville</Text>
                  <Text style={{ ...typography.body, fontWeight: '600', color: colors.text }}>{city}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ ...typography.body, color: colors.textMuted }}>Contact</Text>
                  <Text style={{ ...typography.body, fontWeight: '600', color: colors.text }}>{contact}</Text>
                </View>
                {imageUri ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>Photo</Text>
                    <Text style={{ ...typography.body, fontWeight: '600', color: colors.text }}>1 image jointe</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          ) : null}

          {/* Nav */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" size="lg" onPress={goBack}>← Retour</Button>
            </View>
            <View style={{ flex: 1 }}>
              {step === 'confirm' ? (
                <Button variant="primary" size="lg" loading={loading} onPress={handlePublish}>Publier</Button>
              ) : (
                <Button variant="primary" size="lg" onPress={goNext}>Suivant →</Button>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
