import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ImagePickerButton } from '@/components/ImagePickerButton';
import { updateProfile } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [city, setCity] = useState(user?.city || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(user?.secondaryPhone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const isLoading = status === 'loading';

  const handleSave = async () => {
    const result = await dispatch(
      updateProfile({
        firstName,
        lastName,
        city,
        phone,
        secondaryPhone,
        originCountry: user?.originCountry || 'BJ',
        avatarUrl,
      } as any),
    );
    if (updateProfile.fulfilled.match(result)) {
      Alert.alert('Profil mis à jour', 'Vos modifications ont été enregistrées.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
            <Text style={[styles.backLabel, { color: colors.primary }]}>Accueil</Text>
          </Pressable>

          <PageHeader eyebrow="COMPTE" title="Mon profil" />

          <ImagePickerButton
            label="Photo de profil"
            currentUri={avatarUrl || null}
            onImageSelected={setAvatarUrl}
          />

          <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
          <Input label="Nom" value={lastName} onChangeText={setLastName} />
          <Input label="Ville" value={city} onChangeText={setCity} placeholder="Moscou" />
          <Input label="Téléphone principal" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Téléphone secondaire" value={secondaryPhone} onChangeText={setSecondaryPhone} keyboardType="phone-pad" />

          <Button variant="primary" size="lg" onPress={handleSave} loading={isLoading}>
            Enregistrer
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
});
