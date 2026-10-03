import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { entityFromRemoteRow } from '@moxt/shared/services/rowUtils.js';
import { formatShortDate } from '@moxt/shared/utils/formatters.js';

import { FavoriteButton } from '@/components/account/FavoriteButton';
import { ContactButton } from '@/components/communications/ContactButton';
import { DetailFloatingActions } from '@/components/marketplace/DetailFloatingActions';
import { PublisherBlock } from '@/components/publications/PublisherBlock';
import { usePublisherDetailProfile } from '@/components/publications/usePublisherDetailProfile';
import { imageList } from '@/components/publications/publisherCatalog';
import { Button, Card, Input, PageHeader } from '@/components/ui';
import { DetailFacts, DetailMetrics, DetailSection, TrustPanel } from '@/components/ui/DetailBlocks';
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer';
import { ReportSheet } from '@/components/ui/ReportSheet';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, fontFamilies, spacing, typography } from '@/theme/colors';

type JobDetail = {
  id: string;
  title: string;
  description?: string;
  company?: string;
  publisherName?: string;
  city?: string;
  location?: string;
  type?: string;
  contractType?: string;
  sector?: string;
  status?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  requirements?: string;
  benefits?: string;
  ownerId?: string;
  businessId?: string;
  images?: unknown;
  createdAt?: string;
  expiresAt?: string;
  contactCount?: number;
  shareCount?: number;
  updatedAt?: string;
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const publisherProfile = usePublisherDetailProfile(job as unknown as Record<string, unknown> | null, 'job');

  useEffect(() => {
    if (!supabase || !id) return;
    (async () => {
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
      setJob(data ? (entityFromRemoteRow(data) as JobDetail) : null);
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
    job.salary ||
    (job.salaryMin || job.salaryMax
      ? `${job.salaryMin ?? '?'} – ${job.salaryMax ?? '?'} ${job.salaryCurrency || 'RUB'}`
      : null);
  const place = job.city || job.location;
  const contract = job.contractType || job.type;
  const images = imageList(job.images);
  const isOwner = Boolean(user?.id && job.ownerId === user.id);

  return (
    <SafeAreaView style={[sx.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120, gap: spacing.lg }}>
        {/* ── Web : PageHeader eyebrow = secteur, titre du poste ── */}
        <PageHeader
          eyebrow={job.sector || contract || 'Opportunité'}
          title={job.title}
          description={[job.publisherName || job.company, job.createdAt ? `Publié le ${formatShortDate(job.createdAt)}` : null]
            .filter(Boolean)
            .join(' · ') || undefined}
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {/* ── Web : DetailMetrics ── */}
          <DetailMetrics
            items={[
              { emoji: '💰', label: 'Salaire', value: salary || 'À négocier' },
              { emoji: '📍', label: 'Lieu', value: place || 'Russie' },
              { emoji: '📋', label: 'Contrat', value: contract || '—' },
              { emoji: '⏳', label: 'Expire', value: job.expiresAt ? formatShortDate(job.expiresAt) : '—' },
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

          {images.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {images.map((src, index) => (
                <Pressable key={src} onPress={() => setGalleryIndex(index)}>
                  <Image source={{ uri: src }} style={{ width: index === 0 ? 260 : 140, height: 160, borderRadius: 16 }} />
                </Pressable>
              ))}
            </ScrollView>
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
            {!isOwner ? (
              <Button
                variant="primary"
                size="lg"
                loading={applying}
                disabled={applying}
                onPress={handleApply}>
                Soumettre ma candidature
              </Button>
            ) : (
              <Text style={[sx.body, { color: colors.textMuted }]}>Vous êtes l’auteur de cette offre.</Text>
            )}
            <ContactButton
              ownerId={job.ownerId}
              relatedType="job"
              relatedId={job.id}
              relatedPath={`/jobs/${job.id}`}
              relatedTitle={job.title}
              variant="secondary"
              badge="Job"
            />
            <FavoriteButton relatedId={job.id} relatedType="job" title={job.title} subtitle={job.publisherName || job.company} path={`/jobs/${job.id}`} />
            {!isOwner && user?.id ? (
              <Button variant="danger" onPress={() => setReportOpen(true)}>Signaler</Button>
            ) : null}
            <Text style={[sx.body, { color: colors.textMuted, marginTop: 4 }]}>
              Vous serez recontacté par {job.company || job.businessId ? 'l’entreprise' : 'le recruteur'} après examen de votre candidature.
            </Text>
          </Card>

          {/* ── Web : DetailSection "Informations sur le poste" ── */}
          <DetailSection title="Informations sur le poste">
            <DetailFacts
              items={[
                { label: 'Entreprise', value: job.publisherName || job.company },
                { label: 'Profil', value: job.businessId ? 'Entreprise' : 'Particulier' },
                { label: 'Secteur', value: job.sector },
                { label: 'Type de contrat', value: contract },
                { label: 'Ville', value: place },
                { label: 'Publié le', value: job.createdAt ? formatShortDate(job.createdAt) : null },
                { label: 'Expire le', value: job.expiresAt ? formatShortDate(job.expiresAt) : null },
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

          {job.benefits ? (
            <Card>
              <Text style={[sx.h2, { color: colors.text }]}>Avantages</Text>
              <Text style={[sx.body, { color: colors.textSecondary }]}>{job.benefits}</Text>
            </Card>
          ) : null}

          <PublisherBlock profile={publisherProfile} currentId={job.id} />
        </View>
      </ScrollView>
      <DetailFloatingActions
        relatedId={job.id}
        title={job.title}
        ownerId={job.ownerId}
        isOwner={isOwner}
        relatedType="job"
        relatedPath={`/jobs/${job.id}`}
        editTo={isOwner ? `/publications/edit?id=${job.id}&type=job` : undefined}
      />
      <ImageGalleryViewer
        open={galleryIndex !== null}
        images={images}
        index={galleryIndex ?? 0}
        title={job.title}
        onClose={() => setGalleryIndex(null)}
        onIndex={setGalleryIndex}
      />
      <ReportSheet
        open={reportOpen}
        title="Signaler cette offre"
        target="job"
        targetId={job.id}
        userId={user?.id}
        userName={[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
        onClose={() => setReportOpen(false)}
      />
    </SafeAreaView>
  );
}

const sx = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  h2: { fontSize: 16, fontFamily: fontFamilies.display },
  body: { marginTop: 8, fontSize: 14, lineHeight: 22 },
});
