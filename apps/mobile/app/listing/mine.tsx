import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Eye, Plus, ShoppingBag } from 'lucide-react-native';

import {
  PUBLICATION_TYPE_IDS,
  emptyPublications,
  filterPublicationsByTabs,
  isActiveVideo,
  preferredPublicationArchiveTab,
  publicationTotalCount,
} from '@moxt/shared/domain/publicationRules.js';
import { fetchUserPublications, summarizeUserPublications } from '@moxt/shared/services/publicationsService.js';
import { fetchPublicProfile } from '@moxt/shared/services/profileService.js';
import { fetchReviewsForTargetScope } from '@moxt/shared/services/reviewsService.js';
import {
  REVIEW_TARGET_TYPES,
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
} from '@moxt/shared/utils/reviewUtils.js';
import { selectPublisherSubscriberList } from '@moxt/shared/services/subscriptionsService.js';

import { buildPublicationConfirm } from '@moxt/shared/domain/publicationConfirm.js';
import { archiveStatus, deletePublication, republishStatus, setPublicationStatus } from '@moxt/shared/services/publicationMutations.js';
import { updateAccountPreferences } from '@moxt/shared/services/accountWrites.js';

import { usePublishMenu } from '@/components/chrome/PublishMenuSheet';
import { CoverStyleSheet } from '@/components/profile/CoverStyleSheet';
import { ConfirmSheet, type ConfirmRequest } from '@/components/ui/ConfirmSheet';
import { ChipTabs, UnderlineTabs } from '@/components/profile/CatalogTabs';
import { defaultCoverStyleForPersonal } from '@/components/profile/coverStyles';
import { prune } from '@/components/profile/identity';
import { ProfilePageShell } from '@/components/profile/ProfilePageShell';
import { ProfileQrButton, userProfileShareUrl } from '@/components/profile/ProfileQrButton';
import { MyPublicationCard, PUBLICATION_TYPES, type PublicationItem, type PublicationType } from '@/components/profile/PublicationCard';
import { PublicProfileHero } from '@/components/profile/PublicProfileHero';
import { PublicProfileTabs } from '@/components/profile/PublicProfileTabs';
import { SubscriptionsPanel } from '@/components/profile/SubscriptionsPanel';
import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import { loadSubscriptions, selectMySubscriptions } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type ArchiveTab = 'active' | 'archived';
type Publications = Record<'listings' | 'parcels' | 'jobs' | 'events' | 'videos' | 'posts' | 'others', PublicationItem[]>;

const TYPE_TABS = PUBLICATION_TYPE_IDS as PublicationType[];

/** PUBLISH_LINKS du web : libellé du bouton principal selon le type affiché. */
const PUBLISH_LABELS: Record<PublicationType, string> = {
  listing: 'Publier une annonce',
  parcel: 'Publier un colis',
  job: 'Publier un job',
  event: 'Publier un événement',
  video: 'Publier une vidéo',
  post: 'Publier sur le fil',
  other: 'Proposer une offre',
};

function publicationRoute(type: PublicationType, item: PublicationItem) {
  if (type === 'listing') return `/listing/${item.id}`;
  if (type === 'job') return `/jobs/${item.id}`;
  if (type === 'parcel') return `/parcel/${item.id}`;
  if (type === 'video') return `/(tabs)/feed?type=video&item=${encodeURIComponent(`video:${item.id}`)}`;
  if (type === 'event') return `/events/${item.id}`;
  if (type === 'post') return `/news/${item.id}`;
  return null;
}

const BUSINESS_READY = new Set(['verified', 'approved', 'active']);

const PUBLISH_ROUTES: Partial<Record<PublicationType, string>> = {
  listing: '/listing/create',
  parcel: '/publish/parcel',
  job: '/publish/job',
  event: '/publish/event',
  video: '/publish/video',
  post: '/publish/post',
  other: '/p2p/publish',
};

/**
 * Mes publications — vue perso du web (MyPublicationsPage) : identité prune,
 * hero public avec bannière, onglets Publications / Vidéos / Abonnements,
 * Actives / Archives, tuiles de type et cartes de gestion.
 */
export default function MyPublicationsScreen() {
  const params = useLocalSearchParams<{ panel?: string; status?: string; type?: string }>();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const openPublish = usePublishMenu();
  const user = useAppSelector((state) => state.auth.user);
  const businesses = useAppSelector((state) => state.account.businesses);
  const allSubscriptions = useAppSelector((state) => state.account.subscriptions);
  const [publications, setPublications] = useState<Publications>(emptyPublications() as Publications);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<{ coverStyle?: string | null; gender?: string | null; preferences?: Record<string, unknown> } | null>(null);
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null);
  const [confirmRun, setConfirmRun] = useState<(() => Promise<void>) | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [requestedArchiveTab, setArchiveTab] = useState<string>(params.status === 'archived' ? 'archived' : 'active');
  const [requestedTypeTab, setTypeTab] = useState<string>(TYPE_TABS.includes(params.type as PublicationType) ? String(params.type) : 'listing');
  const [mainView, setMainView] = useState<string>(params.panel === 'subscriptions' || params.panel === 'subscribers' ? 'subscriptions' : '');

  useEffect(() => {
    if (!allSubscriptions.length) dispatch(loadSubscriptions());
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let cancelled = false;
    fetchUserPublications(supabase, user.id)
      .then((result) => {
        if (!cancelled) setPublications(result.publications as Publications);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoaded(true));
    fetchPublicProfile(supabase, user.id)
      .then((row) => !cancelled && setProfile(row as typeof profile))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const summary = useMemo(() => summarizeUserPublications(publications), [publications]);
  const publicationIds = useMemo(() => collectPublicationTargetIds(summary.scoped), [summary.scoped]);
  const publicationKey = JSON.stringify(publicationIds);

  // Note agrégée du profil + publications liées (useScopedProfileReviews du web).
  useEffect(() => {
    if (!supabase || !user?.id || !loaded) return undefined;
    let cancelled = false;
    fetchReviewsForTargetScope(supabase, {
      profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
      profileTargetId: user.id,
      publicationIds,
    })
      .then((rows) => !cancelled && setReviews(rows as Record<string, unknown>[]))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user?.id, loaded, publicationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const rating = useMemo(() => {
    if (!user?.id) return { average: 0, count: 0 };
    const scoped = filterAggregateReviews(reviews, { profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE, profileTargetId: user.id, publicationIds });
    return calculateAggregateRating(scoped) as { average: number; count: number };
  }, [reviews, user?.id, publicationIds]);

  const archiveCounts = summary.archiveCounts as { active: number; archived: number };
  const archiveTab = preferredPublicationArchiveTab(summary.scoped, requestedArchiveTab, { includePending: true }) as ArchiveTab;
  const typeCounts = (archiveTab === 'active' ? summary.activeTypeCounts : summary.archivedTypeCounts) as Record<PublicationType, number>;
  const visibleTypeTabs = TYPE_TABS.filter((id) => (typeCounts[id] ?? 0) > 0);
  const typeTab: PublicationType = (visibleTypeTabs.includes(requestedTypeTab as PublicationType) || !visibleTypeTabs.length
    ? requestedTypeTab
    : visibleTypeTabs[0]) as PublicationType;
  const visible = useMemo(
    () => filterPublicationsByTabs(summary.scoped, { archiveTab, typeTab, includePending: true }) as Record<PublicationType, PublicationItem[]>,
    [archiveTab, summary.scoped, typeTab],
  );
  const hasAnyPublication = publicationTotalCount(summary.scoped) > 0;
  const activeVideos = (summary.scoped.videos || []).filter(isActiveVideo);

  const mySubscriptions = useMemo(() => selectMySubscriptions(allSubscriptions, user?.id), [allSubscriptions, user?.id]);
  const subscribers = useMemo(
    () => (user?.id ? (selectPublisherSubscriberList(allSubscriptions, 'user', user.id) as typeof allSubscriptions) : []),
    [allSubscriptions, user?.id],
  );
  const defaultMainTab = activeVideos.length > 0 ? 'videos' : 'publications';
  const activeMain = mainView || defaultMainTab;
  const onMainChange = useCallback((key: string) => setMainView(key), []);
  const onArchiveChange = useCallback((key: string) => setArchiveTab(key), []);
  const onTypeChange = useCallback((key: string) => setTypeTab(key), []);

  const reloadPublications = useCallback(() => {
    if (!supabase || !user?.id) return;
    fetchUserPublications(supabase, user.id)
      .then((result) => setPublications(result.publications as Publications))
      .catch(() => undefined);
  }, [user?.id]);

  function askConfirm(action: 'delete' | 'archive' | 'republish', type: PublicationType, item: PublicationItem, run: () => Promise<void>) {
    if (action === 'republish' && type !== 'post' && item.businessId) {
      const business = businesses.find((entry) => entry.id === item.businessId);
      if (!business || !BUSINESS_READY.has(String(business.status || ''))) {
        showNotice('Republier', "L'entreprise doit être vérifiée pour republier cette publication.");
        return;
      }
    }
    setConfirming(buildPublicationConfirm(t, action, { type, item, scope: 'personal' }) as ConfirmRequest);
    setConfirmRun(() => run);
  }

  async function runConfirmed() {
    if (!confirmRun) return;
    setBusy(true);
    try {
      await confirmRun();
      setConfirming(null);
      reloadPublications();
    } catch (error) {
      showNotice(t('confirmDialog.error') === 'confirmDialog.error' ? 'Action impossible' : t('confirmDialog.error'), error instanceof Error ? error.message : '');
    } finally {
      setBusy(false);
    }
  }

  function changeStatus(type: PublicationType, item: PublicationItem, status: string) {
    return askConfirm(status === 'archived' ? 'archive' : 'republish', type, item, async () => {
      await setPublicationStatus(supabase, type, item.id, status);
    });
  }

  function removePublication(type: PublicationType, item: PublicationItem) {
    return askConfirm('delete', type, item, async () => {
      await deletePublication(supabase, type, item.id);
    });
  }

  async function saveCover(styleId: string) {
    if (!supabase || !user?.id) return;
    setCoverOpen(false);
    try {
      const { data } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle();
      await updateAccountPreferences(supabase, user.id, { coverStyle: styleId }, (data?.preferences || {}) as Record<string, unknown>);
      setProfile((prev) => ({ ...(prev || {}), coverStyle: styleId }));
    } catch (error) {
      showNotice('Bannière', error instanceof Error ? error.message : 'Enregistrement impossible.');
    }
  }

  if (!user) return null;
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Mon profil';
  const coverStyle = profile?.coverStyle || defaultCoverStyleForPersonal(profile?.gender);
  const publishLabel = PUBLISH_LABELS[typeTab] || PUBLISH_LABELS.listing;
  const accent = isDark ? prune[400] : prune[700];

  return (
    <>
    <ProfilePageShell pathname="/publications/mine" scope="personal">
      <PublicProfileHero
        name={displayName}
        verified={Boolean(user.verified)}
        city={user.city}
        avatarUrl={user.avatarUrl}
        profileKind="personal"
        kindLabel={t('publications.profile.personalBadge')}
        coverCategory="personal"
        coverStyle={coverStyle}
        gender={profile?.gender}
        rating={rating}
        reviewsLabel="avis"
        showCoverEdit
        onEditCover={() => setCoverOpen(true)}
        editCoverLabel={t('profile.personal.editBanner')}
        shareSlot={
          <ProfileQrButton type="user" shareUrl={userProfileShareUrl(user.id)} title={displayName} subtitle={t('share.profileSubtitle')} verified={Boolean(user.verified)} city={user.city} accent={accent} />
        }
        actions={
          <>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(`/users/${user.id}/publications` as never)}
              className="flex-row items-center justify-center border border-app-border-md bg-app-surface"
              style={{ minHeight: 44, borderRadius: 12, paddingHorizontal: 20, gap: 8, width: '48.5%' }}>
              <Eye size={18} color={colors.text} strokeWidth={2} />
              <AppText className={`${WEB_BUTTON_TEXT} text-app-text`}>{t('publications.mine.publicView') || 'Vue publique'}</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const route = PUBLISH_ROUTES[typeTab];
                if (route) router.push(route as never);
                else openPublish();
              }}
              style={{
                width: '100%',
                minHeight: 44,
                borderRadius: 12,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: isDark ? prune[400] : prune[700],
                boxShadow: isDark ? '0 4px 14px rgba(199,125,179,0.22)' : '0 4px 14px rgba(107,45,92,0.28)',
              }}>
              <Plus size={18} color={isDark ? '#020617' : '#ffffff'} strokeWidth={2} />
              <AppText className={WEB_BUTTON_TEXT} style={{ color: isDark ? '#020617' : '#ffffff' }}>
                {publishLabel}
              </AppText>
            </Pressable>
          </>
        }
      />

      <PublicProfileTabs
        kind="personal"
        active={activeMain}
        onChange={onMainChange}
        tabs={[
          { key: 'publications', label: 'Publications', count: archiveCounts.active + archiveCounts.archived, alwaysShow: true },
          { key: 'videos', label: 'Vidéos', count: activeVideos.length, alwaysShow: true },
          { key: 'subscriptions', label: 'Abonnements', count: mySubscriptions.length + subscribers.length, alwaysShow: true },
        ]}
      />

      {activeMain === 'subscriptions' ? (
        <SubscriptionsPanel subscriptions={mySubscriptions} subscribers={subscribers} scale={prune} />
      ) : activeMain === 'videos' ? (
        activeVideos.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {activeVideos.map((video: PublicationItem) => (
              <View key={video.id} style={{ width: '48%' }}>
                <MyPublicationCard
                  type="video"
                  item={video}
                  onOpen={() => router.push(`/(tabs)/feed?type=video&item=${encodeURIComponent(`video:${video.id}`)}` as never)}
                  onEdit={() => router.push(`/publications/edit?type=video&id=${video.id}` as never)}
                  onArchive={() => changeStatus('video', video, archiveStatus())}
                  onDelete={() => removePublication('video', video)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center rounded-card-lg border border-app-border bg-app-surface p-6" style={[{ gap: 6 }, shadows.card]}>
            <AppText className="text-base font-black text-app-text">Aucune vidéo</AppText>
            <AppText className="text-center text-sm text-app-text-muted">Vos vidéos publiées apparaîtront ici.</AppText>
          </View>
        )
      ) : (
        <View style={{ gap: 16 }}>
          {archiveCounts.archived > 0 ? (
            <UnderlineTabs
              scale={prune}
              active={archiveTab}
              onChange={onArchiveChange}
              tabs={[
                { key: 'active', label: 'Actives', count: archiveCounts.active, alwaysShow: true },
                { key: 'archived', label: 'Archives', count: archiveCounts.archived },
              ]}
            />
          ) : null}
          <ChipTabs
            scale={prune}
            active={typeTab}
            onChange={onTypeChange}
            tabs={visibleTypeTabs.map((id) => ({ key: id, label: PUBLICATION_TYPES[id].label, count: typeCounts[id], icon: PUBLICATION_TYPES[id].icon, colors: PUBLICATION_TYPES[id].chip }))}
          />
          {loaded && !hasAnyPublication ? (
            <View className="items-center rounded-card-lg border border-app-border bg-app-surface p-6" style={[{ gap: 8 }, shadows.card]}>
              <ShoppingBag size={28} color={colors.textFaint} />
              <AppText className="text-base font-black text-app-text">Aucune publication</AppText>
              <AppText className="text-center text-sm text-app-text-muted">Vos annonces, colis, jobs et offres apparaîtront ici.</AppText>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {(visible[typeTab] || []).map((item) => {
                const route = publicationRoute(typeTab, item);
                return (
                  <View key={item.id} style={{ width: '48%' }}>
                    <MyPublicationCard
                      type={typeTab}
                      item={item}
                      onOpen={() => (route ? router.push(route as never) : router.push(`/publications/edit?type=${typeTab}&id=${item.id}` as never))}
                      onEdit={() => router.push(`/publications/edit?type=${typeTab}&id=${item.id}` as never)}
                      onArchive={() => changeStatus(typeTab, item, archiveStatus())}
                      onReactivate={() => changeStatus(typeTab, item, republishStatus(typeTab))}
                      onDelete={() => removePublication(typeTab, item)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ProfilePageShell>
    <ConfirmSheet
      request={confirming}
      busy={busy}
      onCancel={() => {
        if (!busy) setConfirming(null);
      }}
      onConfirm={() => void runConfirmed()}
    />
    <CoverStyleSheet
      visible={coverOpen}
      gender={profile?.gender}
      selected={coverStyle}
      onClose={() => setCoverOpen(false)}
      onSelect={(styleId) => void saveCover(styleId)}
    />
    </>
  );
}
