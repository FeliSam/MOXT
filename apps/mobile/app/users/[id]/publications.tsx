import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Building2 } from 'lucide-react-native';

import {
  emptyPublications,
  filterPublicationsByScope,
  filterPublicationsByTabs,
  isActiveVideo,
  preferredPublicationArchiveTab,
  publicationArchiveCounts,
  publicationTotalCount,
  publicationTypeCounts,
  visiblePublicationCount,
} from '@moxt/shared/domain/publicationRules.js';
import { fetchBusinesses } from '@moxt/shared/services/businessesService.js';
import { fetchBusinessPublications, fetchUserPublications } from '@moxt/shared/services/publicationsService.js';
import { fetchPublicProfile } from '@moxt/shared/services/profileService.js';
import { fetchReviewsForTargetScope } from '@moxt/shared/services/reviewsService.js';
import { openContactConversation } from '@moxt/shared/services/contactService.js';
import {
  REVIEW_TARGET_TYPES,
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
} from '@moxt/shared/utils/reviewUtils.js';

import { SubscribeButton } from '@/components/account/SubscribeButton';
import { ProfilePageShell } from '@/components/profile/ProfilePageShell';
import { ProfileQrButton, userProfileShareUrl } from '@/components/profile/ProfileQrButton';
import { MyPublicationCard, PUBLICATION_TYPES, type PublicationItem, type PublicationType } from '@/components/profile/PublicationCard';
import { PublicProfileHero } from '@/components/profile/PublicProfileHero';
import { PublicProfileTabs } from '@/components/profile/PublicProfileTabs';
import { ChipTabs, UnderlineTabs } from '@/components/profile/CatalogTabs';
import { defaultCoverStyleForPersonal } from '@/components/profile/coverStyles';
import { prune, useBrandScale, useScopeColors } from '@/components/profile/identity';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { mapConversationRow, receiveRemoteConversation } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type Pubs = {
  listings: any[];
  parcels: any[];
  jobs: any[];
  events: any[];
  videos: any[];
  posts: any[];
  others: any[];
};
type Review = { id?: string; authorName?: string; rating?: number; comment?: string; createdAt?: string };

const TYPE_ORDER: PublicationType[] = ['listing', 'parcel', 'job', 'event', 'video', 'post', 'other'];

function openRoute(type: PublicationType, item: PublicationItem) {
  if (type === 'listing') router.push(`/listing/${item.id}` as never);
  else if (type === 'parcel') router.push(`/parcel/${item.id}` as never);
  else if (type === 'job') router.push(`/jobs/${item.id}` as never);
  else if (type === 'event') router.push(`/events/${item.id}` as never);
  else if (type === 'post') router.push(`/news/${item.id}` as never);
  else if (type === 'video') router.push(`/(tabs)/feed?type=video&item=${encodeURIComponent(`video:${item.id}`)}` as never);
  else router.push(`/p2p/${item.id}` as never);
}

function coverFromMedia(publications: Pubs) {
  const videos = (publications.videos || []).filter(isActiveVideo);
  return (
    videos.find((video) => video.thumbnailUrl)?.thumbnailUrl ||
    publications.listings?.find((listing) => listing.images?.[0])?.images?.[0] ||
    publications.posts?.find((post) => post.images?.[0] || post.imageUrl)?.images?.[0] ||
    publications.posts?.find((post) => post.imageUrl)?.imageUrl ||
    ''
  );
}

/** Profil public (web /users/:id/publications) : couverture, QR, avis, suivi, onglets. */
export default function PublicPublicationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const personal = useScopeColors('personal');
  const scale = useBrandScale('personal');
  const me = useAppSelector((state) => state.auth.user);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchPublicProfile>>>(null);
  const [personalPubs, setPersonalPubs] = useState<Pubs>(emptyPublications());
  const [businessPubs, setBusinessPubs] = useState<Pubs>(emptyPublications());
  const [business, setBusiness] = useState<{ id: string; name?: string; bannerUrl?: string; logoUrl?: string; sector?: string } | null>(null);
  const [scope, setScope] = useState<'personal' | 'business'>('personal');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mainTab, setMainTab] = useState('publications');
  const [archiveTab, setArchiveTab] = useState<'active' | 'archived'>('active');
  const [typeTab, setTypeTab] = useState('post');
  const typePicked = useRef(false);

  useEffect(() => {
    if (!supabase || !id) return undefined;
    let cancelled = false;
    const client = supabase;
    fetchPublicProfile(client, id)
      .then((next) => {
        if (!cancelled) setProfile(next);
      })
      .catch(() => undefined);
    fetchUserPublications(client, id)
      .then((result) => {
        if (!cancelled) setPersonalPubs(filterPublicationsByScope(result.publications, 'personal'));
      })
      .catch(() => undefined);
    fetchBusinesses(client, id)
      .then(async (rows) => {
        const owned = (rows as { id: string; ownerId?: string; name?: string; bannerUrl?: string; logoUrl?: string; sector?: string; deletedByUserAt?: string | null }[])
          .find((item) => item.ownerId === id && !item.deletedByUserAt);
        if (cancelled) return;
        setBusiness(owned || null);
        if (!owned) return;
        const content = await fetchBusinessPublications(client, owned.id);
        if (!cancelled) setBusinessPubs(content.publications);
      })
      .then(() => undefined, () => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const publications = scope === 'business' ? businessPubs : personalPubs;

  useEffect(() => {
    if (!supabase || !id) return undefined;
    let cancelled = false;
    const targetId = (scope === 'business' ? business?.id : id) || '';
    fetchReviewsForTargetScope(supabase, {
      profileTargetType: scope === 'business' ? REVIEW_TARGET_TYPES.BUSINESS : REVIEW_TARGET_TYPES.USER_PROFILE,
      profileTargetId: targetId,
      publicationIds: collectPublicationTargetIds(publications),
      ownerProfileId: scope === 'business' ? id : null,
    })
      .then((rows) => {
        if (!cancelled) setReviews(filterAggregateReviews(rows, {
          profileTargetType: scope === 'business' ? REVIEW_TARGET_TYPES.BUSINESS : REVIEW_TARGET_TYPES.USER_PROFILE,
          profileTargetId: targetId,
          publicationIds: collectPublicationTargetIds(publications),
          ownerProfileId: scope === 'business' ? id : null,
        }) as Review[]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [business?.id, id, publications, scope]);

  const archiveCounts = useMemo(() => publicationArchiveCounts(publications), [publications]);
  const preferredArchive = preferredPublicationArchiveTab(publications, archiveTab) as 'active' | 'archived';
  const typeCounts = useMemo(() => publicationTypeCounts(publications, preferredArchive), [preferredArchive, publications]);
  const typeTabs = TYPE_ORDER.filter((key) => (scope === 'business' ? key !== 'post' : true) && (typeCounts[key] || 0) > 0).map((key) => ({
    key,
    label: PUBLICATION_TYPES[key].label,
    count: typeCounts[key] || 0,
    icon: PUBLICATION_TYPES[key].icon,
    colors: PUBLICATION_TYPES[key].chip,
  }));
  useEffect(() => {
    if (typePicked.current || !typeTabs.length) return;
    if (typeTabs.some((tab) => tab.key === 'post')) {
      if (typeTab !== 'post') setTypeTab('post');
      return;
    }
    if (!typeTabs.some((tab) => tab.key === typeTab)) setTypeTab(typeTabs[0].key);
  }, [typeTab, typeTabs]);

  const visible = useMemo(
    () => filterPublicationsByTabs(publications, { archiveTab: preferredArchive, typeTab }),
    [preferredArchive, publications, typeTab],
  );
  const activeVideos = (publications.videos || []).filter(isActiveVideo);
  const rating = calculateAggregateRating(reviews);
  const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Profil';
  const isOwner = Boolean(me?.id && me.id === id);
  const isBusiness = scope === 'business' && Boolean(business);
  const total = publicationTotalCount(publications);

  const publicTabs = [
    ...(activeVideos.length > 0
      ? [
          { key: 'videos', label: 'Vidéos', count: activeVideos.length, alwaysShow: true },
          { key: 'publications', label: isBusiness ? 'Produits' : 'Publications', count: total, alwaysShow: true },
        ]
      : [
          { key: 'publications', label: isBusiness ? 'Produits' : 'Publications', count: total, alwaysShow: true },
          { key: 'videos', label: 'Vidéos', count: activeVideos.length, alwaysShow: true },
        ]),
    { key: 'avis', label: 'Avis', count: rating.count, alwaysShow: true },
    { key: 'apercu', label: 'Aperçu', alwaysShow: true },
  ];

  async function contact() {
    if (!me?.id || !id || !supabase) {
      router.push('/login' as never);
      return;
    }
    try {
      const result = await openContactConversation(supabase, {
        createdBy: me.id,
        ownerId: id,
        relatedType: 'profile',
        relatedId: id,
        relatedPath: `/users/${id}/publications`,
        relatedTitle: name,
        relatedSnapshot: { type: 'profile', id, title: name, path: `/users/${id}/publications`, subtitle: profile?.city || '', badge: 'Profil', details: [] },
      });
      dispatch(receiveRemoteConversation(mapConversationRow(result.conversation as unknown as Record<string, unknown>)));
      router.push(`/messages/${result.id}` as never);
    } catch (error) {
      showNotice('Contacter', error instanceof Error ? error.message : 'Conversation impossible.');
    }
  }

  const memberSince = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  return (
    <ProfilePageShell pathname="/users/publications" scope="personal">
      <PublicProfileHero
        name={isBusiness ? business?.name || name : name}
        verified={Boolean(profile?.verified)}
        city={profile?.city}
        category={isBusiness ? business?.sector : undefined}
        avatarUrl={isBusiness && business?.logoUrl ? business.logoUrl : profile?.avatarUrl}
        coverUrl={isBusiness && business?.bannerUrl ? business.bannerUrl : coverFromMedia(publications)}
        profileKind={isBusiness ? 'business' : 'personal'}
        kindLabel={isBusiness ? 'Entreprise' : 'Particulier'}
        coverCategory={isBusiness ? 'business' : 'personal'}
        coverStyle={profile?.coverStyle || defaultCoverStyleForPersonal(profile?.gender)}
        gender={profile?.gender}
        rating={rating}
        reviewsLabel="avis"
        onOpenReviews={() => setMainTab('avis')}
        shareSlot={
          id ? (
            <ProfileQrButton
              type="user"
              shareUrl={userProfileShareUrl(id)}
              title={name}
              subtitle="Profil MOXT"
              verified={Boolean(profile?.verified)}
              city={profile?.city || undefined}
              accent={personal.accent}
            />
          ) : null
        }
        actions={
          !isOwner && id ? (
            <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <SubscribeButton
                  publisherType="user"
                  publisherId={id}
                  publisherName={name}
                  size="md"
                  showIcon={false}
                  subscribeLabel="Suivre"
                  subscribedLabel="Suivi"
                  accentScale={prune}
                />
              </View>
              <Pressable
                onPress={() => void contact()}
                style={{ flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: personal.accent }}>
                <AppText className="font-bold" style={{ color: '#fff' }}>Contacter</AppText>
              </Pressable>
            </View>
          ) : null
        }
      />

      {business ? (
        <Pressable
          onPress={() => (isOwner ? setScope(scope === 'business' ? 'personal' : 'business') : router.push(`/organization/${business.id}` as never))}
          style={{ minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Building2 size={16} color={colors.text} />
          <AppText className="font-bold text-app-text">{scope === 'business' && isOwner ? 'Profil personnel' : 'Entreprise'}</AppText>
        </Pressable>
      ) : null}

      <PublicProfileTabs active={mainTab} onChange={setMainTab} tabs={publicTabs} kind="personal" />

      {mainTab === 'apercu' ? (
        <View style={{ gap: 8 }}>
          {profile?.city || profile?.country ? (
            <AppText className="text-sm text-app-text-muted">{[profile?.city, profile?.country].filter(Boolean).join(' · ')}</AppText>
          ) : null}
          {memberSince ? <AppText className="text-xs text-app-text-muted">Membre depuis {memberSince}</AppText> : null}
          {!profile?.city && !profile?.country && !memberSince ? (
            <AppText className="text-sm text-app-text-muted">Aucune information publique.</AppText>
          ) : null}
        </View>
      ) : null}

      {mainTab === 'avis' ? (
        <View style={{ gap: 10 }}>
          {reviews.length ? reviews.map((review) => (
            <View key={review.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 4 }}>
              <AppText className="font-black text-app-text">{review.authorName || 'Membre'}</AppText>
              <AppText className="text-sm text-app-text-muted">{'★'.repeat(Math.max(1, Math.min(5, Number(review.rating) || 0)))}</AppText>
              {review.comment ? <AppText className="text-sm text-app-text">{review.comment}</AppText> : null}
            </View>
          )) : (
            <AppText className="text-sm text-app-text-muted">Aucun avis publié.</AppText>
          )}
        </View>
      ) : null}

      {mainTab === 'videos' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {activeVideos.length ? activeVideos.map((video) => (
            <View key={video.id} style={{ width: '48%' }}>
              <MyPublicationCard type="video" item={video} readonly onOpen={() => openRoute('video', video)} />
            </View>
          )) : (
            <AppText className="text-sm text-app-text-muted">Aucune vidéo publique.</AppText>
          )}
        </View>
      ) : null}

      {mainTab === 'publications' ? (
        <View style={{ gap: 16 }}>
          <UnderlineTabs
            scale={scale}
            active={preferredArchive}
            onChange={(key) => setArchiveTab(key as 'active' | 'archived')}
            tabs={[
              { key: 'active', label: 'Actives', count: archiveCounts.active, alwaysShow: true },
              { key: 'archived', label: 'Archives', count: archiveCounts.archived, alwaysShow: archiveCounts.archived > 0 },
            ]}
          />
          {typeTabs.length ? (
            <ChipTabs
              scale={scale}
              tabs={typeTabs}
              active={typeTab}
              pinActive={false}
              onChange={(key) => {
                typePicked.current = true;
                setTypeTab(key);
              }}
            />
          ) : null}
          {visiblePublicationCount(visible) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {TYPE_ORDER.flatMap((type) => (visible[type] || []).map((item: PublicationItem) => (
                <View key={`${type}-${item.id}`} style={{ width: '48%' }}>
                  <MyPublicationCard type={type} item={item} readonly onOpen={() => openRoute(type, item)} />
                </View>
              )))}
            </View>
          ) : (
            <View className="items-center rounded-card-lg border border-app-border bg-app-surface p-6">
              <AppText className="text-base font-black text-app-text">Aucune publication</AppText>
              <AppText className="text-center text-sm text-app-text-muted">Les publications de cet onglet apparaîtront ici.</AppText>
            </View>
          )}
        </View>
      ) : null}
    </ProfilePageShell>
  );
}
