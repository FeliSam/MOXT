import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Eye, Play } from 'lucide-react-native';

import { businessActivityLabel } from '@moxt/shared/config/businessActivityLabels.js';
import { emptyPublications, isActiveVideo, publicationTotalCount } from '@moxt/shared/domain/publicationRules.js';
import { fetchBusinessPublications } from '@moxt/shared/services/publicationsService.js';
import { buildReview, fetchReviewsForTargetScope, syncReview } from '@moxt/shared/services/reviewsService.js';
import { hasReviewEligibility } from '@moxt/shared/utils/reviewEligibility.js';
import { buildReviewPublicationIndex, getReviewPublication } from '@moxt/shared/utils/reviewPublicationResolver.js';
import {
  REVIEW_TARGET_TYPES,
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
} from '@moxt/shared/utils/reviewUtils.js';

import { SubscribeButton } from '@/components/account/SubscribeButton';
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import { ProfilePageShell } from '@/components/profile/ProfilePageShell';
import { ProfileQrButton, businessShareUrl } from '@/components/profile/ProfileQrButton';
import { PublicProfileHero } from '@/components/profile/PublicProfileHero';
import { PublicProfileTabs, type ProfileTab } from '@/components/profile/PublicProfileTabs';
import { ReviewsSection, type Review, type ReviewPublication } from '@/components/reviews/ReviewsSection';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpandableText } from '@/components/ui/ExpandableText';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import { loadBusiness } from '@/store/account';
import type { ListingItem } from '@/store/marketplace';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { brand } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type PublicationRow = Record<string, unknown> & { id?: string; status?: string };
type Publications = Record<'listings' | 'parcels' | 'jobs' | 'events' | 'videos' | 'posts' | 'others', PublicationRow[]>;
type MainTab = 'produits' | 'videos' | 'avis' | 'apercu';

const VERIFIED_STATUSES = ['verified', 'approved', 'active'];
const GRID_GAP = 12;

/** businessCityLabel du web : « Ville · Pays » hors Russie. */
function businessCityLabel(business: { city?: string; country?: string }) {
  if (!business?.city) return '';
  return business.country && business.country !== 'RU' ? `${business.city} · ${business.country}` : business.city;
}

/** formatMemberSince du web (« juillet 2026 »). */
function formatMemberSince(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Chemins mobiles des publications liées aux avis (le web renvoie vers ses propres routes). */
const MOBILE_PUBLICATION_PATHS: Record<string, (id: string) => string> = {
  listing: (id) => `/listing/${id}`,
  parcel: (id) => `/parcel/${id}`,
  business: (id) => `/organization/${id}`,
};

/** DetailFacts du web : tuiles fond surface-muted (chaud en portée communauté), libellé xs faint, valeur bold. */
function DetailFacts({ items }: { items: { label: string; value?: string | null }[] }) {
  return (
    <View style={{ gap: 12 }}>
      {items.map(({ label, value }) => (
        <View key={label} className="rounded-card bg-app-surface-muted" style={{ padding: 16 }}>
          <AppText className="text-xs font-semibold text-app-text-faint">{label}</AppText>
          <AppText className="mt-2 text-base font-bold text-app-text" style={{ fontVariant: ['tabular-nums'] }}>
            {value || 'Non renseigné'}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Vignette vidéo de la grille publique (PublicVideoThumbGrid du web). */
function VideoThumb({ video, width }: { video: Record<string, unknown>; width: number }) {
  const thumb = String(video.thumbnailUrl || video.posterUrl || '');
  const views = Number(video.views || 0);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push('/feed?type=video' as never)}
      style={{ width, aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0f1714' }}>
      {thumb ? <Image source={{ uri: thumb }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" /> : null}
      <View style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <Play size={14} color="#ffffff" fill="#ffffff" strokeWidth={2} />
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, gap: 4, backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <AppText numberOfLines={2} className="text-sm font-black text-white">
          {String(video.title || video.caption || 'Vidéo')}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Eye size={12} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          <AppText className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {views} vue{views > 1 ? 's' : ''}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

/** Fiche entreprise (BusinessDetailPage du web, /businesses/:id). */
export default function BusinessProfileScreen() {
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const user = useAppSelector((state) => state.auth.user);
  const business = useAppSelector((state) => (id ? state.account.businessById[id] : undefined));
  const loading = useAppSelector((state) => Boolean(state.account.loading.business));
  const conversations = useAppSelector((state) => state.messages.conversations);
  const transfers = useAppSelector((state) => state.transfers.items);
  const [publications, setPublications] = useState<Publications>(emptyPublications() as Publications);
  const [remoteReviews, setRemoteReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (id) dispatch(loadBusiness(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!supabase || !id) return undefined;
    let cancelled = false;
    fetchBusinessPublications(supabase, id)
      .then(({ publications: next }) => {
        if (!cancelled) setPublications(next as Publications);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const publicationIds = useMemo(() => collectPublicationTargetIds(publications), [publications]);
  const ownerId = business?.ownerId;
  const scope = useMemo(
    () => ({ profileTargetType: REVIEW_TARGET_TYPES.BUSINESS, profileTargetId: id || '', publicationIds, ownerProfileId: ownerId || null }),
    [id, publicationIds, ownerId],
  );

  const refreshReviews = useCallback(async () => {
    if (!supabase || !id) return;
    const rows = await fetchReviewsForTargetScope(supabase, scope);
    setRemoteReviews(rows as Review[]);
  }, [id, scope]);

  useEffect(() => {
    refreshReviews().catch(() => undefined);
  }, [refreshReviews]);

  const reviews = useMemo(() => filterAggregateReviews(remoteReviews, scope) as Review[], [remoteReviews, scope]);
  const rating = useMemo(() => calculateAggregateRating(reviews), [reviews]);

  // hasReviewEligibility du web, alimenté par les données chargées sur mobile.
  const eligibility = useMemo(
    () =>
      hasReviewEligibility(
        { businesses: { items: business ? [business] : [] }, transfers: { items: transfers }, communications: { conversations } },
        user?.id,
        REVIEW_TARGET_TYPES.BUSINESS,
        id,
      ) as { allowed: boolean; reasonKey?: string },
    [business, transfers, conversations, user?.id, id],
  );
  const existingReview = useMemo(
    () => remoteReviews.find((r) => r.authorId === user?.id && r.targetType === REVIEW_TARGET_TYPES.BUSINESS && r.targetId === id) || null,
    [remoteReviews, user?.id, id],
  );

  const publicationIndex = useMemo(
    () =>
      buildReviewPublicationIndex({
        marketplace: { items: publications.listings },
        parcels: { items: publications.parcels },
        jobs: { items: publications.jobs },
        events: { items: publications.events },
        businesses: { items: business ? [business] : [] },
      }),
    [publications, business],
  );
  const resolvePublication = useCallback(
    (review: Review): ReviewPublication | null => {
      const found = getReviewPublication(publicationIndex, review) as ReviewPublication | null;
      if (!found) return null;
      const toPath = MOBILE_PUBLICATION_PATHS[review.targetType];
      return { ...found, path: toPath ? toPath(review.targetId) : undefined };
    },
    [publicationIndex],
  );

  const activeVideos = useMemo(() => (publications.videos || []).filter(isActiveVideo), [publications]);
  const activeListings = useMemo(
    () => (publications.listings || []).filter((item) => !item?.status || item.status === 'active'),
    [publications],
  );
  const publicationCount = publicationTotalCount(publications);
  const defaultTab: MainTab = activeVideos.length > 0 ? 'videos' : 'produits';
  const requested = typeof view === 'string' ? view : '';
  const mainTab: MainTab = (['produits', 'videos', 'avis', 'apercu'] as const).includes(requested as MainTab) ? (requested as MainTab) : defaultTab;

  const setMainTab = useCallback(
    (next: string) => {
      router.setParams({ view: next === defaultTab ? undefined : next });
    },
    [defaultTab],
  );

  const submitReview = useCallback(
    async ({ rating: value, comment }: { rating: number; comment: string }) => {
      if (!supabase || !user?.id || !id) return;
      const review = buildReview({
        id: existingReview?.id,
        targetType: REVIEW_TARGET_TYPES.BUSINESS,
        targetId: id,
        authorId: user.id,
        authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || t('reviews.memberFallback'),
        rating: value,
        comment,
        createdAt: existingReview?.createdAt,
      });
      try {
        await syncReview(supabase, review);
        await refreshReviews();
      } catch {
        showNotice('Avis non publié', "L'avis n'a pas pu être enregistré. Réessayez.");
      }
    },
    [existingReview, id, refreshReviews, t, user],
  );

  if (!business) {
    return (
      <ProfilePageShell pathname="/businesses/detail" scope="community">
        <EmptyState title={loading ? 'Chargement…' : "Cette entreprise n'existe pas ou est en attente de validation."} />
      </ProfilePageShell>
    );
  }

  const isOwner = business.ownerId === user?.id;
  const verified = VERIFIED_STATUSES.includes(String(business.status || ''));
  const activityLabel = businessActivityLabel(business.primaryActivity) || String(business.sector || '');
  const cityLabel = businessCityLabel(business) || business.city || '';
  const memberSince = formatMemberSince(business.createdAt);
  const services = (Array.isArray(business.services) ? business.services : []) as string[];
  const accent = isDark ? brand[400] : brand[700];
  const gridItemWidth = (width - 32 - GRID_GAP) / 2;

  const videosTab: ProfileTab = { key: 'videos', label: 'Vidéos', count: activeVideos.length, alwaysShow: true };
  const produitsTab: ProfileTab = { key: 'produits', label: 'Produits', count: activeListings.length || publicationCount, alwaysShow: true };
  // ≥1 vidéo : Vidéos, Produits, Avis, À propos — sinon Produits, Vidéos, Avis, À propos (comme le web).
  const tabs: ProfileTab[] = [
    ...(activeVideos.length > 0 ? [videosTab, produitsTab] : [produitsTab, videosTab]),
    { key: 'avis', label: 'Avis', count: rating.count, alwaysShow: true },
    { key: 'apercu', label: 'À propos', alwaysShow: true },
  ];

  function contact() {
    const existing = conversations.find(
      (c) => c.participantIds?.includes(String(business?.ownerId)) && c.participantIds?.includes(String(user?.id)),
    );
    if (existing) {
      router.push(`/messages/${existing.id}` as never);
      return;
    }
    showNotice('Contacter', "La prise de contact avec une entreprise se fait pour l'instant depuis moxtapp.ru.");
  }

  return (
    <ProfilePageShell pathname="/businesses/detail" scope="community" gap={20}>
      <PublicProfileHero
        name={business.name}
        verified={verified}
        category={activityLabel}
        city={cityLabel}
        coverUrl={business.bannerUrl}
        avatarUrl={business.logoUrl}
        coverCategory="business"
        coverStyle={business.coverStyle as string | undefined}
        profileKind="business"
        kindLabel={t('publications.profile.businessBadge') || 'Entreprise'}
        rating={rating}
        reviewsLabel="avis"
        onOpenReviews={() => setMainTab('avis')}
        shareSlot={
          <ProfileQrButton
            type="business"
            shareUrl={businessShareUrl(business.id)}
            title={business.name}
            subtitle={activityLabel}
            verified={verified}
            city={cityLabel}
            accent={accent}
          />
        }
        actions={
          !isOwner ? (
            <>
              <SubscribeButton
                publisherType="business"
                publisherId={business.id}
                publisherName={business.name}
                size="md"
                showIcon={false}
                subscribeLabel="Suivre"
                subscribedLabel="Suivi"
                style={{ width: '48.5%' }}
              />
              <Pressable
                accessibilityRole="button"
                onPress={contact}
                style={{
                  width: '48.5%',
                  minHeight: 44,
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: accent,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}>
                <AppText className="text-sm font-semibold" style={{ color: isDark ? '#020617' : '#ffffff' }}>
                  Contacter
                </AppText>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/publications/mine?scope=business' as never)}
              style={{ width: '100%', minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: accent }}>
              <AppText className="text-sm font-semibold" style={{ color: isDark ? '#020617' : '#ffffff' }}>
                Gérer mes publications
              </AppText>
            </Pressable>
          )
        }
      />

      <PublicProfileTabs active={mainTab} onChange={setMainTab} tabs={tabs} kind="business" />

      {mainTab === 'apercu' ? (
        <View style={{ gap: 20 }}>
          {business.description ? (
            <View style={{ gap: 8 }}>
              <AppText className="text-base font-black text-app-text">À propos</AppText>
              <ExpandableText text={String(business.description)} maxLines={6} className="text-base leading-7 text-app-text-muted" />
            </View>
          ) : null}
          <DetailFacts
            items={[
              { label: 'Secteur', value: activityLabel },
              { label: 'Ville', value: cityLabel || business.city },
              { label: 'Pays', value: business.country },
              ...(business.phone ? [{ label: 'Téléphone', value: business.phone }] : []),
            ].filter((item) => item.value)}
          />
          {services.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {services.map((service) => (
                <View key={service} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: isDark ? brand[900] : brand[100] }}>
                  <AppText className="text-[10px] font-black uppercase" style={{ letterSpacing: 0.6, color: isDark ? brand[100] : brand[800] }}>
                    {service}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
          {memberSince ? <AppText className="text-xs text-app-text-faint">Membre depuis : {memberSince}</AppText> : null}
        </View>
      ) : mainTab === 'videos' ? (
        <View style={{ gap: 16 }}>
          <AppText className="text-base font-black text-app-text">Vidéos</AppText>
          {activeVideos.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
              {activeVideos.map((video, index) => (
                <VideoThumb key={String(video.id || index)} video={video} width={gridItemWidth} />
              ))}
            </View>
          ) : (
            <EmptyState title="Aucune vidéo" description="Les vidéos publiées apparaîtront ici." />
          )}
        </View>
      ) : mainTab === 'produits' ? (
        activeListings.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
            {activeListings.map((listing) => (
              <MarketplaceListingCard key={String(listing.id)} listing={listing as unknown as ListingItem} width={gridItemWidth} />
            ))}
          </View>
        ) : (
          <EmptyState title="Aucune publication entreprise" description="Les annonces publiées au nom de cette entreprise apparaîtront ici." />
        )
      ) : (
        <ReviewsSection
          reviews={reviews}
          ownerId={business.ownerId}
          ownerName={business.name}
          currentUserId={user?.id}
          eligibility={eligibility}
          existingReview={existingReview}
          resolvePublication={resolvePublication}
          onSubmit={submitReview}
        />
      )}
    </ProfilePageShell>
  );
}
