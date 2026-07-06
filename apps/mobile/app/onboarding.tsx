import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, spacing, typography } from '@/theme/colors';
import { Button } from '@/components/ui/Button';

const SLIDES = [
  { icon: '💸', title: 'Transférez facilement', body: 'Envoyez de l\'argent entre le Bénin et la Russie en quelques taps.' },
  { icon: '📦', title: 'Expédiez vos colis', body: 'Trouvez un voyageur et réservez de l\'espace pour vos envois.' },
  { icon: '🏪', title: 'Marketplace', body: 'Achetez, vendez et trouvez des services dans la communauté.' },
  { icon: '🔔', title: 'Restez informé', body: 'Notifications en temps réel, messagerie, et suivi de vos opérations.' },
];

const ONBOARDING_KEY = 'moxt_onboarding_done';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const handleNext = async () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/' as any);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.skipBtn} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.textMuted }]}>Passer</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{slide.body}</Text>
      </View>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === index ? colors.primary : colors.border }]} />
        ))}
      </View>

      <Button variant="primary" size="lg" onPress={handleNext}>
        {index === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing['2xl'], justifyContent: 'space-between' },
  skipBtn: { alignSelf: 'flex-end', padding: spacing.sm },
  skipText: { fontSize: 15, fontWeight: '600' },
  content: { alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl },
  icon: { fontSize: 72 },
  title: { ...typography.titleLg, textAlign: 'center' },
  body: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: radii.full },
});
