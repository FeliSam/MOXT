import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart } from 'lucide-react-native';

import { formatShortDate } from '@moxt/shared/utils/formatters.js';

import { Button, Card, Input, PageHeader } from '@/components/ui';
import { DetailFacts, DetailMetrics, DetailSection, TrustPanel } from '@/components/ui/DetailBlocks';
import { supabase } from '@/services/supabase';
import { addFavorite, removeFavorite } from '@/store/favorites';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, spacing, typography } from '@/theme/colors';

type JobDetail = {
  id: string;
  title: string;
  description?: string;
  company?: string;
  city?: string;
  type?: string;
  sector?: string;
  status?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  contact?: string;
  whatsapp?: string;
  requirements?: string;
  created_at?: string;
  expires_at?: string;
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const liked = useAppSelector((state) =>
    state.favorites.items.some((f) => f.id === id && f.type === 'job'),
  );
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');

  function toggleFavorite() {
    if (!job) return;
    if (liked) {
      dispatch(removeFavorite({ id: job.id, type: 'job' }));
    } else {
      dispatch(addFavorite({ id: job.id, type: 'job', title: job.title, subtitle: job.company }));
    }
  }

  useEffect(() => {
    if (!supabase || !id) return;
    (async () => {
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
      setJob(data as JobDetail | null);
      setLoading(false);
    })();
  }, [id]);

  const handleApply = async () => {
    if (!supabase || !user || !job) return;
    setApplying(true);
    try {
      const { error } = await supabase.from('job_applications').insert({
        id: `APP-${Date.now().toString(36).toUpperCase()}`,
        job_id: job.id,
        user_id: user.id,
        message: message.trim(),
        status: 'submitted',
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      Alert.alert('Candidature envoyée', "L'employeur sera notifié.");
      setMessage('');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Candidature impossible.');
    } finally {
      setApplying(false);
    }
  };

  if (loading)
    return (
      <View style={[sx.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={brand[700]} />
      </View>
    );

  if (!job)
    return (
      <SafeAreaView style={[sx.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ ...typography.sectionTitle, color: colors.text }}>Offre introuvable</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );

  const salary =
    job.salary_min || job.salary_max
      ? `${job.salary_min ?? '?'} – ${job.salary_max ?? '?'} ${job.salary_currency || 'RUB'}`
      : null;

  return (
    <SafeAreaView style={[sx.container, { backgroundColor: colors.background }]}>
      {/* Favori flottant — coin haut droit */}
      <Pressable
        onPress={toggleFavorite}
        hitSlop={10}
        accessibilityLabel={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        style={[sx.favFloat, { backgroundColor: liked ? '#e11d48' : colors.surface }]}>
        <Heart
          size={20}
          color={liked ? '#ffffff' : colors.textMuted}
          fill={liked ? '#ffffff' : 'transparent'}
          strokeWidth={2.2}
        />
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: spacing.lg }}>
        {/* ── Web : PageHeader eyebrow = secteur, titre du poste ── */}
        <PageHeader
          eyebrow={job.sector || job.type || 'Opportunité'}
          title={job.title}
          description={[job.company, job.created_at ? `Publié le ${formatShortDate(job.created_at)}` : null]
            .filter(Boolean)
            .join(' · ') || undefined}
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {/* ── Web : DetailMetrics ── */}
          <DetailMetrics
            items={[
              { emoji: '💰', label: 'Salaire', value: salary || 'À négocier' },
              { emoji: '📍', label: 'Lieu', value: job.city || 'Russie' },
              { emoji: '📋', label: 'Contrat', value: job.type || '—' },
              { emoji: '⏳', label: 'Expire', value: job.expires_at ? formatShortDate(job.expires_at) : '—' },
            ]}
          />

          {/* ── Web : Description + Profil recherché ── */}
          {job.description || job.requirements ? (
            <Card>
              {job.description ? (
                <>
                  <Text style={[sx.h2, { color: colors.text }]}>Description</Text>
                  <Text style={[sx.body, { color: colors.textSecondary }]}>{job.description}</Text>
                </>
              ) : null}
              {job.requirements ? (
                <>
                  <Text style={[sx.h2, { color: colors.text, marginTop: job.description ? 20 : 0 }]}>
                    Profil recherché
                  </Text>
                  <Text style={[sx.body, { color: colors.textSecondary }]}>{job.requirements}</Text>
                </>
              ) : null}
            </Card>
          ) : null}

          {/* ── Web : carte "Candidature" ── */}
          <Card style={{ gap: spacing.md }}>
            <Text style={[sx.h2, { color: colors.text }]}>Candidature</Text>
            <Input
              placeholder="Message de motivation (optionnel)"
              value={message}
              onChangeText={setMessage}
              multiline
              style={{ height: 80, textAlignVertical: 'top' }}
            />
            <Button
              variant="primary"
              size="lg"
              loading={applying}
              disabled={applying}
              onPress={handleApply}>
              Soumettre ma candidature
            </Button>
            <Text style={[sx.body, { color: colors.textMuted, marginTop: 4 }]}>
              Vous serez recontacté par {job.company ? 'l’entreprise' : 'le recruteur'} après examen de votre candidature.
            </Text>

            {job.contact || job.whatsapp ? (
              <>
                <Text style={[sx.contactLabel, { color: colors.textFaint }]}>
                  OU CONTACTER {job.company ? 'L’ENTREPRISE' : 'LE PARTICULIER'} DIRECTEMENT
                </Text>
                <View style={sx.contactRow}>
                  {job.contact ? (
                    <Button variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${job.contact}`)}>
                      📞 Appeler
                    </Button>
                  ) : null}
                  {job.whatsapp ? (
                    <Button variant="teal" style={{ flex: 1 }} onPress={() => Linking.openURL(`https://wa.me/${job.whatsapp}`)}>
                      WhatsApp
                    </Button>
                  ) : null}
                </View>
              </>
            ) : null}
          </Card>

          {/* ── Web : DetailSection "Informations sur le poste" ── */}
          <DetailSection title="Informations sur le poste">
            <DetailFacts
              items={[
                { label: 'Entreprise', value: job.company },
                { label: 'Secteur', value: job.sector },
                { label: 'Type de contrat', value: job.type },
                { label: 'Ville', value: job.city },
                { label: 'Publié le', value: job.created_at ? formatShortDate(job.created_at) : null },
                { label: 'Expire le', value: job.expires_at ? formatShortDate(job.expires_at) : null },
              ]}
            />
          </DetailSection>

          {/* ── Web : TrustPanel "Conseils aux candidats" ── */}
          <TrustPanel
            title="Conseils aux candidats"
            items={[
              'Ne payez jamais pour postuler à une offre.',
              'Vérifiez l’identité de l’employeur avant un entretien.',
              'Gardez vos échanges dans la messagerie MOXT.',
              'Signalez toute offre suspecte à notre équipe.',
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const sx = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  h2: { fontSize: 15, fontWeight: '900' },
  body: { marginTop: 8, fontSize: 14, lineHeight: 22 },
  contactRow: { flexDirection: 'row', gap: spacing.md },
  contactLabel: { marginTop: 6, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  favFloat: {
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
});
