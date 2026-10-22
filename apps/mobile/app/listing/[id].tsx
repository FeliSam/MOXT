import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, usePathname, router } from 'expo-router';
import {
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, Heart, MapPin, Package, Shield, Star, X } from 'lucide-react-native';

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
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { idFromPath, routeParam } from '@/utils/routeParam';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH;
const IMAGE_HEIGHT = 416; // +60% (260 * 1.6 = 416)

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
  const insets = useSafeAreaInsets();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [detailTab, setDetailTab] = useState<(typeof DETAIL_TABS)[number][0]>('description');
  const [pending, setPending] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<NonNullable<ListingItem['questions']>>([]);
  const scrollRef = useRef<any>(null);
  const fetchedId = useRef<string | null>(null);
  const { onScroll: onSmartScroll, scrollEventThrottle } = useSmartNavbarScroll();

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
        .slice(0, 4),
    [catalog, id, listing?.category, listing?.city],
  );
  const discoverListings = useMemo(
    () =>
      catalog
        .filter((item) => item.id !== id && item.status === 'active')
        .slice(0, 6),
    [catalog, id],
  );

  useEffect(() => {
    if (!id) {
      setPending(false);
      return;
    }
    if (listing) {
      setPending(false);
      return;
    }
    if (fetchedId.current === id) return;
    fetchedId.current = id;
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
      return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    }
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ ...typography.sectionTitle, color: colors.text }}>Annonce introuvable</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </View>
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Bouton retour en « goutte » flottant */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/marketplace' as never))}
        style={{
          position: 'absolute',
          top: Math.max(14, insets.top + 6),
          left: 16,
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: 'rgba(0,0,0,0.52)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <ArrowLeft size={22} color="#ffffff" strokeWidth={2.5} />
      </Pressable>

      <ScrollView
        onScroll={onSmartScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* Full-width 100% Image (+60% height: 416px) */}
        {images.length > 0 ? (
          <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT, position: 'relative', backgroundColor: '#000000' }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH}
              snapToAlignment="start"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
            >
              {images.map((uri, idx) => (
                <Pressable
                  key={idx}
                  accessibilityLabel="Ouvrir la photo"
                  onPress={() => {
                    setActiveImageIndex(idx);
                    setGalleryOpen(true);
                  }}
                  style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#000000' }}
                >
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </Pressable>
              ))}
            </ScrollView>

            {images.length > 1 && (
              <View
                style={{
                  position: 'absolute',
                  top: Math.max(16, insets.top + 10),
                  right: 16,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  borderRadius: radii.md,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  zIndex: 10,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                  {activeImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}

            {images.length > 1 && (
              <>
                {activeImageIndex > 0 && (
                  <Pressable
                    style={{
                      position: 'absolute',
                      top: IMAGE_HEIGHT / 2 - 20,
                      left: 12,
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                    onPress={() => goToImage(activeImageIndex - 1)}
                  >
                    <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>‹</Text>
                  </Pressable>
                )}
                {activeImageIndex < images.length - 1 && (
                  <Pressable
                    style={{
                      position: 'absolute',
                      top: IMAGE_HEIGHT / 2 - 20,
                      right: 12,
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                    onPress={() => goToImage(activeImageIndex + 1)}
                  >
                    <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>›</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        ) : (
          <View
            style={{
              width: SCREEN_WIDTH,
              height: IMAGE_HEIGHT,
              backgroundColor: colors.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={64} color={brand[700]} />
          </View>
        )}

        {/* Miniatures des photos restantes : ouvre le bodysheet au clic */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 10 }}
          >
            {images.map((uri, idx) => (
              <Pressable
                key={`thumb-${idx}`}
                onPress={() => {
                  goToImage(idx);
                }}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 12,
                  overflow: 'hidden',
                  borderWidth: idx === activeImageIndex ? 2.5 : 1,
                  borderColor: idx === activeImageIndex ? brand[600] : colors.border,
                }}
              >
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Corps du contenu */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
          {/* Titre & Prix (épuré sans puces superflues) */}
          <Card>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 }}>
                {listing.title}
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: brand[700] }}>
                {listing.price
                  ? formatCurrency(listing.price, listing.currency || 'RUB')
                  : 'Sur devis'}
              </Text>
              {listing.city ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>
                    {listing.city}{listing.address ? `, ${listing.address}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          {/* Description limitée à 4 lignes avec bouton « Voir plus » */}
          <Card>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                Description
              </Text>
              <Text
                numberOfLines={descExpanded ? undefined : 4}
                style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}
              >
                {listing.description || 'Aucune description fournie.'}
              </Text>
              {listing.description && listing.description.length > 110 ? (
                <Pressable
                  onPress={() => setDescExpanded((v) => !v)}
                  style={{ alignSelf: 'flex-start', paddingTop: 2 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: brand[700] }}>
                    {descExpanded ? 'Voir moins' : 'Voir plus'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </Card>

          {/* Bloc Vendeur compact (logo, nom cliquable, note étoile, nb annonces, s'abonner) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => router.push((publisherProfile?.businessProfilePath || (listing.ownerId ? `/users/${listing.ownerId}` : '/organization')) as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}
            >
              {publisherProfile?.business?.logoUrl ? (
                <Image
                  source={{ uri: publisherProfile.business.logoUrl }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: brand[700],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                    {((publisherProfile?.publisherName || listing.sellerName || 'M')[0] || 'M').toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                  {publisherProfile?.publisherName || listing.sellerName || 'Vendeur'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                      {(publisherProfile?.rating?.average || 5).toFixed(1)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    · {publisherProfile?.publicationCount || 1} annonce{(publisherProfile?.publicationCount || 1) > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setIsSubscribed((v) => !v)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isSubscribed ? colors.surfaceMuted : brand[700],
                borderWidth: isSubscribed ? 1 : 0,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: isSubscribed ? colors.text : '#ffffff',
                }}
              >
                {isSubscribed ? 'Abonné' : "S'abonner"}
              </Text>
            </Pressable>
          </View>

          {/* Livraison & Modalités */}
          <Card>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Livraison & Retrait</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                Modes : {deliveryModes || 'Remise en main propre'}
              </Text>
              {listing.deliveryFee ? (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Frais : {formatCurrency(listing.deliveryFee, listing.currency || 'RUB')}
                </Text>
              ) : null}
            </View>
          </Card>

          {/* Annonces similaires */}
          {similar.length ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Annonces similaires</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {similar.map((item) => (
                  <MarketplaceListingCard key={item.id} listing={item} width={190} height={250} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Découvrir d'autres annonces */}
          {discoverListings.length ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Découvrir</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {discoverListings.map((item) => (
                  <MarketplaceListingCard
                    key={item.id}
                    listing={item}
                    width={(SCREEN_WIDTH - 42) / 2}
                    height={250}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {user?.id && !isOwner ? (
            <Button variant="danger" onPress={() => setReportOpen(true)}>Signaler cette annonce</Button>
          ) : null}
        </View>
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
    </View>
  );
}
