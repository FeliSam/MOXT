import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, usePathname, router } from 'expo-router';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, Heart, MapPin, Package, Shield } from 'lucide-react-native';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { FavoriteButton } from '@/components/account/FavoriteButton';
import { ContactButton } from '@/components/communications/ContactButton';
import { DetailFloatingActions } from '@/components/marketplace/DetailFloatingActions';
import { listingCategoryLabel, listingTypeLabel } from '@/components/marketplace/listingMeta';
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import { PublisherBlock } from '@/components/publications/PublisherBlock';
import { usePublisherDetailProfile } from '@/components/publications/usePublisherDetailProfile';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { DetailFacts, DetailMetrics } from '@/components/ui/DetailBlocks';
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer';
import { ReportSheet } from '@/components/ui/ReportSheet';
import { supabase } from '@/services/supabase';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, fontFamilies, radii, spacing, typography } from '@/theme/colors';
import { loadListingById, upsertListing, type ListingItem } from '@/store/marketplace';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { normalizeListingImages } from '@/utils/mediaUrl';
import { showNotice } from '@/utils/notice';
import { idFromPath, routeParam } from '@/utils/routeParam';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = 260;

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  used: 'Occasion',
  refurbished: 'Reconditionné',
};

const DELIVERY_LABELS: Record<string, string> = {
  pickup: 'Retrait sur place',
  local: 'Livraison locale',
  shipping: 'Expédition',
  home: 'Livraison à domicile',
  onSite: 'Sur site client',
  remote: 'À distance',
  workshop: 'En atelier / boutique',
  handDelivery: 'Remise en main propre',
  possible: 'Livraison possible',
  online: 'Téléchargement en ligne',
  visit: 'Visite sur rendez-vous',
};

const DETAIL_TABS = [
  ['description', 'Description'],
  ['details', 'Caractéristiques'],
  ['delivery', 'Livraison et garantie'],
  ['questions', 'Questions'],
  ['history', 'Historique'],
] as const;

export default function ListingDetailScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const pathnameId = idFromPath(usePathname());
  const id = routeParam(params.id) || pathnameId;
  const dispatch = useAppDispatch();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [detailTab, setDetailTab] = useState<(typeof DETAIL_TABS)[number][0]>('description');
  const [pending, setPending] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<NonNullable<ListingItem['questions']>>([]);
  const scrollRef = useRef<ScrollView>(null);
  const fetched = useRef(false);

  const listing = useAppSelector((state) =>
    state.marketplace.items.find((l) => l.id === id),
  );
  const user = useAppSelector((state) => state.auth.user);
  const catalog = useAppSelector((state) => state.marketplace.items);
  const publisherProfile = usePublisherDetailProfile(listing as unknown as Record<string, unknown>, 'listing');
  const similar = useMemo(
    () =>
      catalog
        .filter(
          (item) =>
            item.id !== id &&
            item.status === 'active' &&
            (item.category === listing?.category || item.city === listing?.city),
        )
        .slice(0, 3),
    [catalog, id, listing?.category, listing?.city],
  );

  useEffect(() => {
    if (!id) {
      setPending(false);
      return;
    }
    if (listing || fetched.current) {
      setPending(false);
      return;
    }
    fetched.current = true;
    dispatch(loadListingById(id))
      .finally(() => setPending(false))
      .catch(() => undefined);
  }, [dispatch, id, listing]);

  useEffect(() => {
    if (listing?.questions?.length) setQuestions(listing.questions);
  }, [listing?.questions]);

  useEffect(() => {
    if (!supabase || !id) return undefined;
    let alive = true;
    supabase
      .from('listing_questions')
      .select('*')
      .eq('listing_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!alive || !Array.isArray(data) || !data.length) return;
        setQuestions(
          data.map((row) => ({
            id: String(row.id),
            authorName: String(row.author_name || 'Membre'),
            text: String(row.text || ''),
            answer: String(row.answer || ''),
            createdAt: row.created_at ? String(row.created_at) : undefined,
          })),
        );
      })
      .then(undefined, () => undefined);
    return () => {
      alive = false;
    };
  }, [id]);

  const images = useMemo(() => normalizeListingImages(listing?.images), [listing?.images]);
  const isAdminViewer = Boolean(user?.role && ['admin', 'superadmin'].includes(String(user.role)));

  if (!listing) {
    if (pending) {
      return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ ...typography.sectionTitle, color: colors.text }}>Annonce introuvable</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  const typeLabel = listingTypeLabel(listing.type);
  const conditionLabel = CONDITION_LABELS[listing.condition || ''] || '';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_WIDTH);
    setActiveImageIndex(index);
  };

  const goToImage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * IMAGE_WIDTH, animated: true });
    setActiveImageIndex(index);
  };

  const categoryLabel = listingCategoryLabel(listing.type, listing.category) || typeLabel;

  const isOwner = Boolean(user?.id && listing.ownerId === user.id);

  async function publishQuestion() {
    if (!listing) return;
    const text = question.trim();
    if (!user?.id) {
      router.push('/login' as never);
      return;
    }
    if (text.length < 5 || !supabase) {
      showNotice('Question', 'Écrivez au moins 5 caractères.');
      return;
    }
    const row = {
      id: `Q-${Date.now().toString(36).toUpperCase()}`,
      listing_id: listing.id,
      author_id: user.id,
      author_name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Membre',
      text,
      answer: '',
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('listing_questions').insert(row);
    if (error) {
      showNotice('Question', error.message);
      return;
    }
    const next = [...questions, { id: row.id, authorName: row.author_name, text, answer: '' }];
    setQuestions(next);
    dispatch(upsertListing({ ...listing, questions: next }));
    setQuestion('');
  }

  async function publishAnswer(questionId: string) {
    if (!listing) return;
    const answer = (answerDrafts[questionId] || '').trim();
    if (!answer || !supabase || !questionId) return;
    const { error } = await supabase.from('listing_questions').update({ answer, answered_at: new Date().toISOString() }).eq('id', questionId);
    if (error) {
      showNotice('Réponse', error.message);
      return;
    }
    const next = questions.map((item) => (item.id === questionId ? { ...item, answer } : item));
    setQuestions(next);
    dispatch(upsertListing({ ...listing, questions: next }));
  }
  const deliveryModes = (listing.deliveryOptions?.length ? listing.deliveryOptions : ['pickup'])
    .map((value) => DELIVERY_LABELS[value] || value)
    .join(', ');
  const carriers = (listing.shippingCarriers || [])
    .map((carrier) => {
      if (typeof carrier === 'string') return carrier;
      const row = carrier as { id?: string; etaHint?: string };
      return row.etaHint ? `${row.id} (${row.etaHint})` : row.id || '';
    })
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120, gap: spacing.lg }}>
        <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: fontFamilies.regular, color: colors.textMuted }}>
          Marketplace / {categoryLabel} / <Text style={{ color: colors.text, fontFamily: fontFamilies.semibold }}>{listing.title}</Text>
        </Text>
        <PageHeader className="mx-0" title={listing.title} />
        {/* Images Carousel */}
        {images.length > 0 ? (
          <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT + 30, alignSelf: 'center' }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={IMAGE_WIDTH}
              snapToAlignment="start"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: radii.lg, overflow: 'hidden' }}>
              {images.map((uri, idx) => (
                <Pressable key={idx} accessibilityLabel="Ouvrir la galerie" onPress={() => { setActiveImageIndex(idx); setGalleryOpen(true); }} style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>

            {images.length > 1 && (
              <View style={{
                position: 'absolute', top: 12, right: 12,
                backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radii.md,
                paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {activeImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}

            {images.length > 1 && (
              <>
                {activeImageIndex > 0 && (
                  <Pressable
                    style={{ position: 'absolute', top: IMAGE_HEIGHT / 2 - 20, left: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => goToImage(activeImageIndex - 1)}>
                    <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>‹</Text>
                  </Pressable>
                )}
                {activeImageIndex < images.length - 1 && (
                  <Pressable
                    style={{ position: 'absolute', top: IMAGE_HEIGHT / 2 - 20, right: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => goToImage(activeImageIndex + 1)}>
                    <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>›</Text>
                  </Pressable>
                )}
              </>
            )}

            {images.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
                {images.map((uri, idx) => (
                  <Pressable
                    key={`thumb-${idx}`}
                    onPress={() => goToImage(idx)}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      overflow: 'hidden',
                      borderWidth: idx === activeImageIndex ? 2 : 1,
                      borderColor: idx === activeImageIndex ? colors.primary : colors.border,
                    }}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {images.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
                {images.map((_, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => goToImage(idx)}
                    style={{
                      width: idx === activeImageIndex ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: idx === activeImageIndex ? colors.primary : colors.border,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{
            width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: radii.lg,
            backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
          }}>
            <Package size={52} color={brand[700]} />
          </View>
        )}

        {/* Title + price */}
        <Card>
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {typeLabel ? <Badge tone="brand">{typeLabel}</Badge> : null}
              {listing.category ? <Badge tone="neutral">{listing.category}</Badge> : null}
              {conditionLabel ? <Badge tone="success">{conditionLabel}</Badge> : null}
            </View>
            <Text style={{ fontSize: 30, fontFamily: fontFamilies.semibold, color: brand[700] }}>
              {listing.price
                ? formatCurrency(listing.price, listing.currency || 'RUB')
                : 'Sur devis'}
            </Text>
            {listing.city ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} color={colors.textMuted} />
                <Text style={{ ...typography.bodySmall, color: colors.textMuted }}>
                  {listing.city}{listing.address ? `, ${listing.address}` : ''}
                </Text>
              </View>
            ) : null}
            {listing.status ? <StatusBadge status={listing.status} /> : null}
            <DetailMetrics
              items={[
                { icon: Package, label: conditionLabel ? 'État' : 'Type', value: conditionLabel || typeLabel || '—' },
                { icon: MapPin, label: 'Localisation', value: listing.city || '—' },
                { icon: Eye, label: 'Consultations', value: `${listing.views || 0} vues` },
                { icon: Heart, label: 'Intérêt', value: `${listing.favorites?.length || 0} favoris` },
              ]}
            />
            <Text style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: colors.warningBg, color: colors.warning, padding: 12, fontSize: 12, lineHeight: 18 }}>
              Paiement via MOXT. Vérifiez le produit avant toute transaction.
            </Text>
          </View>
        </Card>

        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {DETAIL_TABS.map(([key, label]) => {
              const active = detailTab === key;
              return (
                <Pressable key={key} onPress={() => setDetailTab(key)} style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: active ? colors.primary : 'transparent', paddingHorizontal: 4 }}>
                  <Text style={{ fontWeight: '800', color: active ? colors.text : colors.textMuted }}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ marginTop: 16, gap: 8 }}>
            {detailTab === 'description' ? (
              <>
                <Text style={{ fontSize: 20, fontFamily: fontFamilies.display, letterSpacing: -0.3, color: colors.text }}>À propos de cette annonce</Text>
                <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 22 }}>
                  {listing.description || 'Aucune description.'}
                </Text>
              </>
            ) : null}
            {detailTab === 'details' ? (
              [
                ['Catégorie', categoryLabel || '—'],
                ['Type', typeLabel || '—'],
                ['Marque', listing.brand || '—'],
                ['Modèle', listing.model || '—'],
                ['Couleur', listing.color || '—'],
                ['État', conditionLabel || '—'],
                ['Quartier', listing.district || '—'],
                ['Localisation', [listing.city, listing.address].filter(Boolean).join(', ') || '—'],
              ].map(([label, value]) => (
                <View key={label} style={{ borderRadius: 12, backgroundColor: colors.surfaceMuted, padding: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{label}</Text>
                  <Text style={{ marginTop: 4, fontWeight: '700', color: colors.text }}>{value}</Text>
                </View>
              ))
            ) : null}
            {detailTab === 'delivery' ? (
              [
                ['Modes de remise', deliveryModes],
                ...(carriers ? [['Transporteurs', carriers] as const] : []),
                ['Frais de livraison', listing.deliveryFee ? formatCurrency(listing.deliveryFee, listing.currency || 'RUB', 'fr-FR') : 'Gratuit ou à convenir'],
                ['Délai', listing.deliveryDelay || '—'],
                ['Garantie', listing.warranty || '—'],
                ['Politique de retour', listing.returnPolicy || '—'],
                ['Paiements acceptés', listing.paymentMethods?.length ? listing.paymentMethods.join(', ') : 'À convenir'],
              ].map(([label, value]) => (
                <View key={label} style={{ borderRadius: 12, backgroundColor: colors.surfaceMuted, padding: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{String(label)}</Text>
                  <Text style={{ marginTop: 4, fontWeight: '700', color: colors.text }}>{value}</Text>
                </View>
              ))
            ) : null}
            {detailTab === 'questions' ? (
              <View style={{ gap: 12 }}>
                {questions.length ? (
                  questions.map((item, index) => (
                    <View key={item.id || String(index)} style={{ gap: 4 }}>
                      <Text style={{ fontWeight: '800', color: colors.text }}>{item.authorName || 'Membre'}</Text>
                      <Text style={{ color: colors.textSecondary }}>{item.text}</Text>
                      {item.answer ? <Text style={{ color: colors.textMuted }}>Réponse du vendeur : {item.answer}</Text> : <Text style={{ color: colors.textFaint }}>En attente de réponse du vendeur.</Text>}
                      {isOwner && !item.answer && item.id ? (
                        <View style={{ gap: 8, marginTop: 6 }}>
                          <TextInput
                            value={answerDrafts[item.id] || ''}
                            onChangeText={(value) => setAnswerDrafts((current) => ({ ...current, [item.id!]: value }))}
                            placeholder="Répondre publiquement"
                            placeholderTextColor={colors.textFaint}
                            style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text }}
                          />
                          <Button variant="secondary" onPress={() => void publishAnswer(item.id!)}>Publier la réponse</Button>
                        </View>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.textMuted }}>Aucune question publique.</Text>
                )}
                {!isOwner ? (
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontWeight: '800', color: colors.text }}>Poser une question publique</Text>
                    <TextInput
                      value={question}
                      onChangeText={setQuestion}
                      placeholder="Demandez une précision sur l’état, la livraison ou la disponibilité..."
                      placeholderTextColor={colors.textFaint}
                      multiline
                      style={{ minHeight: 88, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, padding: 12, color: colors.text, textAlignVertical: 'top' }}
                    />
                    <Button variant="primary" onPress={() => void publishQuestion()}>Publier la question</Button>
                  </View>
                ) : null}
              </View>
            ) : null}
            {detailTab === 'history' ? (
              (listing.history || []).length ? (
                listing.history!.map((entry, index) => (
                  <Text key={`${entry.at || index}`} style={{ color: colors.text }}>
                    {entry.status || '—'}{entry.at ? ` · ${entry.at}` : ''}
                  </Text>
                ))
              ) : (
                <Text style={{ color: colors.textMuted }}>Aucun historique.</Text>
              )
            ) : null}
          </View>
        </Card>

        {/* Seller */}
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.sectionTitle, color: colors.text }}>Vendeur</Text>
            {listing.sellerName ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
                <Text style={{ ...typography.body, color: colors.textMuted }}>Nom</Text>
                <Text style={{ ...typography.body, fontWeight: '600', color: colors.text }}>{listing.sellerName}</Text>
              </View>
            ) : null}
            <ContactButton
              ownerId={listing.ownerId}
              relatedType="listing"
              relatedId={listing.id}
              relatedPath={`/marketplace/${listing.id}`}
              relatedTitle={listing.title}
              subtitle={listing.city}
              badge="Annonce"
            />
            <FavoriteButton
              relatedId={listing.id}
              relatedType="listing"
              title={listing.title}
              subtitle={listing.city}
              path={`/marketplace/${listing.id}`}
            />
          </View>
        </Card>

        <PublisherBlock profile={publisherProfile} currentId={listing.id} limit={5} />

        <DetailFacts
          items={[
            { label: 'Catégorie', value: categoryLabel },
            { label: 'Type', value: typeLabel },
            { label: 'Marque', value: listing.brand },
            { label: 'État', value: conditionLabel },
            { label: 'Ville', value: listing.city },
          ]}
        />

        {similar.length ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.sectionTitle, color: colors.text }}>Annonces similaires</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textMuted }}>Même catégorie ou même zone géographique.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {similar.map((item) => (
                <MarketplaceListingCard key={item.id} listing={item} width={220} height={280} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {user?.id && !isOwner ? (
          <Button variant="danger" onPress={() => setReportOpen(true)}>Signaler</Button>
        ) : null}

        {isAdminViewer ? (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Shield size={18} color={brand[700]} />
                <Text style={{ ...typography.sectionTitle, color: colors.text }}>Actions administrateur</Text>
              </View>
              <Text style={{ ...typography.bodySmall, color: colors.textMuted }}>
                Modération directe de l'annonce depuis sa fiche
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(
                  [
                    ['active', 'Publier', 'primary'],
                    ['sold', 'Marquer vendu', 'secondary'],
                    ['archived', 'Archiver', 'danger'],
                  ] as const
                ).map(([status, label, variant]) => (
                  <Button
                    key={status}
                    variant={variant}
                    onPress={async () => {
                      if (!supabase) return;
                      const { error } = await supabase.from('listings').update({ status }).eq('id', listing.id);
                      if (error) {
                        showNotice('Modération', error.message);
                        return;
                      }
                      dispatch(upsertListing({ ...listing, status }));
                      showNotice('Modération', `Statut « ${label} » appliqué.`);
                    }}>
                    {label}
                  </Button>
                ))}
              </View>
            </View>
          </Card>
        ) : null}
      </ScrollView>
      <DetailFloatingActions
        relatedId={listing.id}
        title={listing.title}
        ownerId={listing.ownerId}
        isOwner={isOwner}
        relatedType="listing"
        relatedPath={`/marketplace/${listing.id}`}
        subtitle={listing.city}
        editTo={isOwner ? `/publications/edit?id=${listing.id}&type=listing` : undefined}
      />
      <ImageGalleryViewer
        open={galleryOpen}
        images={images}
        index={activeImageIndex}
        title={listing.title}
        onClose={() => setGalleryOpen(false)}
        onIndex={setActiveImageIndex}
      />
      <ReportSheet
        open={reportOpen}
        title="Signaler cette annonce"
        target="listing"
        targetId={listing.id}
        userId={user?.id}
        userName={[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
        onClose={() => setReportOpen(false)}
      />
    </SafeAreaView>
  );
}
