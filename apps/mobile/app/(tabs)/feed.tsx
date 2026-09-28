import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Platform, Pressable, ScrollView, Share, View, useWindowDimensions, type ViewToken } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ExternalLink,
  Eye,
  Heart,
  House,
  MessageCircle,
  MoreHorizontal,
  Package,
  Plus,
  Repeat,
  Share2,
  TrendingUp,
  UserPlus,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

import { usePublisherSubscription } from '@/components/account/SubscribeButton';
import { StarsGiftButton } from '@/components/feed/StarsGiftButton';
import { usePublishMenu } from '@/components/chrome/PublishMenuSheet';
import { FeedCommentsSheet } from '@/components/feed/FeedCommentsSheet';
import { FeedMedia } from '@/components/feed/FeedMedia';
import { buildFeedItems, FEED_TYPE_FILTERS, type FeedItem, type FeedKind } from '@/components/feed/feedItems';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { brand } from '@/theme/palette';
import { shareVideo, toggleEngagementLike, type EngagementKind } from '@/store/engagement';
import { recordVideoView } from '@/store/feed';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';

const TEXT_SHADOW = { textShadowColor: 'rgba(0,0,0,0.95)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 };

/** FEED_ACTION_ICON_WRAP_CLASS : size-10, bg-black/62, ring-1 white/35. */
function RailButton({
  label,
  onPress,
  count,
  pressed,
  children,
}: {
  label: string;
  onPress?: () => void;
  count?: number;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={pressed === undefined ? undefined : { selected: pressed }}
      onPress={onPress}
      style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.62)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.35)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
        }}>
        {children}
      </View>
      {count && count > 0 ? (
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            minWidth: 18.4,
            borderRadius: 999,
            paddingHorizontal: 4,
            paddingVertical: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.25)',
          }}>
          <AppText className="text-center text-[10px] font-black text-white" style={{ lineHeight: 12 }}>
            {count > 999 ? '999+' : count}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Rail du web (railKeysForKind) : j'aime + commentaires pour vidéos, posts et annonces ; « ouvrir » sinon. */
const SOCIAL_KINDS: EngagementKind[] = ['video', 'post', 'listing'];
const OPEN_ICON: Partial<Record<FeedKind, typeof ExternalLink>> = { parcel: Package, job: Briefcase, event: Calendar, p2p: Repeat };
const OPEN_LABEL: Partial<Record<FeedKind, string>> = {
  parcel: 'Voir le colis',
  job: 'Voir le job',
  event: 'Voir l’événement',
  p2p: 'Voir l’offre',
};

/**
 * Garde l'ordre des slides déjà vues quand les données changent (un j'aime ne doit pas
 * reclasser le Fil sous le doigt) ; les nouveaux éléments s'ajoutent à la fin.
 */
function useStableOrder(items: FeedItem[]) {
  const orderRef = useRef<string[]>([]);
  return useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    const kept = orderRef.current.filter((id) => byId.has(id));
    const keptSet = new Set(kept);
    const next = [...kept, ...items.filter((item) => !keptSet.has(item.id)).map((item) => item.id)];
    orderRef.current = next;
    return next.map((id) => byId.get(id) as FeedItem);
  }, [items]);
}

function FeedSlide({
  item,
  height,
  active,
  muted,
  onToggleMute,
  chromeTop,
  bottomInset,
}: {
  item: FeedItem;
  height: number;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  chromeTop: number;
  bottomInset: number;
}) {
  const colors = useThemeColors();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const starsEnabled = useAppSelector((s) => Boolean(s.platform.flags.stars));
  const isOwner = Boolean(userId && (item.publisher.ownerId === userId || (item.publisher.type === 'user' && item.publisher.id === userId)));
  const dispatch = useAppDispatch();
  const icon = { size: 19.7, color: '#ffffff', strokeWidth: 2 } as const;
  const iconSm = { size: 18.4, color: '#ffffff', strokeWidth: 2 } as const;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const social = SOCIAL_KINDS.includes(item.kind as EngagementKind) ? (item.kind as EngagementKind) : null;
  const { isSubscribed, subscribe } = usePublisherSubscription(item.publisher.type, item.publisher.id, item.publisher.name);
  const OpenIcon = OPEN_ICON[item.kind] || ExternalLink;

  function requireUser() {
    if (userId) return userId;
    router.push('/login' as never);
    return null;
  }

  function onLike() {
    const uid = requireUser();
    if (!uid || !social) return;
    dispatch(toggleEngagementLike({ kind: social, entityId: item.entityId, userId: uid })).catch(() => undefined);
  }

  function onShare() {
    Share.share({ message: `${item.title} — MOXT` })
      .then((result) => {
        if (item.kind === 'video' && result.action === Share.sharedAction) dispatch(shareVideo(item.entityId)).catch(() => undefined);
      })
      .catch(() => undefined);
  }

  return (
    <View style={{ height, width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
      {item.image || item.videoUrl ? (
        <FeedMedia image={item.image} videoUrl={item.videoUrl} active={active} muted={muted} />
      ) : (
        // FeedNeutralPanel : fond dégradé de marque pour les contenus sans visuel.
        <LinearGradient
          colors={[brand[800], brand[600], colors.cobalt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AppText className="text-center text-2xl font-black text-white">{item.title}</AppText>
        </LinearGradient>
      )}

      {item.kind === 'video' ? (
        <Pressable
          accessibilityLabel={muted ? 'Activer le son' : 'Couper le son'}
          onPress={onToggleMute}
          style={{
            position: 'absolute',
            left: 12,
            top: chromeTop,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: muted ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.35)',
            zIndex: 10,
          }}>
          {muted ? <VolumeX size={16} color="#fff" strokeWidth={2} /> : <Volume2 size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />}
        </Pressable>
      ) : null}

      {item.isTrending ? (
        <View style={{ position: 'absolute', right: 12, top: chromeTop, zIndex: 2 }} pointerEvents="none">
          <View className="flex-row items-center gap-1 rounded-full px-2.5 py-0.5" style={{ backgroundColor: 'rgba(56,189,248,0.9)' }}>
            <TrendingUp size={11} color="#082f49" strokeWidth={2.4} />
            <AppText className="text-[10px] font-black uppercase" style={{ color: '#082f49', letterSpacing: 0.25 }}>
              Tendance
            </AppText>
          </View>
        </View>
      ) : null}

      {/* FEED_META_OVERLAY_CLASS : dégradé noir bas, p-4 pt-16 pr-16. */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.5, 1]}
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 64, paddingLeft: 16, paddingRight: 64, paddingBottom: bottomInset + 12, zIndex: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {item.publisher.avatarUrl ? (
            <Image
              source={{ uri: item.publisher.avatarUrl }}
              style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' }}
            />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: brand[600], alignItems: 'center', justifyContent: 'center' }}>
              <AppText className="text-xs font-black text-white">{item.publisher.name.charAt(0)}</AppText>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 136 }}>
            <AppText numberOfLines={1} className="shrink text-sm font-black text-white" style={[TEXT_SHADOW, { letterSpacing: -0.35 }]}>
              {item.publisher.name}
            </AppText>
            {item.publisher.verified ? <VerifiedIcon size={14} color="#34d399" /> : null}
          </View>
          {starsEnabled && isSubscribed && item.publisher.id && !(item.publisher.type === 'user' && item.publisher.id === userId) ? (
            <StarsGiftButton publisherType={item.publisher.type} publisherId={item.publisher.id} publisherName={item.publisher.name} />
          ) : null}
          {!isOwner && item.publisher.id && !isSubscribed ? (
            <Pressable
              accessibilityLabel="S'abonner"
              onPress={() => requireUser() && subscribe('all')}
              style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, boxShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>
              <UserPlus size={14} color="#fff" strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
        {item.title ? (
          <AppText numberOfLines={1} className="mt-2 font-black text-white" style={[TEXT_SHADOW, { fontSize: 16.8, lineHeight: 23 }]}>
            {item.title}
          </AppText>
        ) : null}
        {item.caption && item.kind !== 'video' ? (
          <AppText numberOfLines={1} className="mt-1 text-sm text-white/85" style={TEXT_SHADOW}>
            {item.caption}
          </AppText>
        ) : null}
        {item.kind === 'video' ? (
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Eye size={14} color="rgba(255,255,255,0.55)" strokeWidth={2} />
            <AppText className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {item.stats.views} vues
            </AppText>
          </View>
        ) : null}
      </LinearGradient>

      {/* FEED_ACTION_RAIL_CLASS : bas droite, gap-3, pilule « Accueil » en dernier. */}
      <View style={{ position: 'absolute', right: 12, bottom: bottomInset + 12, alignItems: 'flex-end', gap: 12, zIndex: 30 }}>
        {social ? (
          <>
            <RailButton label="J’aime" count={item.stats.likes} pressed={Boolean(item.liked)} onPress={onLike}>
              <Heart {...icon} color={item.liked ? '#ef4444' : '#ffffff'} fill={item.liked ? '#ef4444' : 'none'} />
            </RailButton>
            <RailButton label="Commenter" count={item.stats.comments} onPress={() => setCommentsOpen(true)}>
              <MessageCircle {...icon} />
            </RailButton>
          </>
        ) : (
          <RailButton label={OPEN_LABEL[item.kind] || 'Ouvrir la fiche'} onPress={() => router.push(item.route as never)}>
            <OpenIcon {...icon} />
          </RailButton>
        )}
        <RailButton label="Partager" count={item.kind === 'video' ? item.stats.shares : undefined} onPress={onShare}>
          <Share2 {...iconSm} />
        </RailButton>
        <RailButton label="Plus d’options">
          <MoreHorizontal {...iconSm} />
        </RailButton>
        <Pressable
          accessibilityLabel="Accueil"
          onPress={() => router.navigate('/(tabs)' as never)}
          style={{
            height: 40,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderRadius: 999,
            backgroundColor: '#ffffff',
            paddingLeft: 6,
            paddingRight: 12,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
          }}>
          <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <House size={18} color="#000" strokeWidth={2} />
          </View>
          <AppText className="text-[11px] font-black text-black">Accueil</AppText>
        </Pressable>
      </View>
      {social && commentsOpen ? (
        <FeedCommentsSheet kind={social} entityId={item.entityId} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
      ) : null}
    </View>
  );
}

/**
 * Onglet Fil — plein écran comme moxt-react FeedPage (ni en-tête ni barre du bas) :
 * slides verticales aimantées, pastilles de type, bouton +, rail d'actions et méta en bas.
 */
export default function FeedTab() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const openPublish = usePublishMenu();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const videos = useAppSelector((s) => s.feed.videos);
  const posts = useAppSelector((s) => s.feed.posts);
  const listings = useAppSelector((s) => s.marketplace.items);
  const parcels = useAppSelector((s) => s.parcels.items);
  const events = useAppSelector((s) => s.dashboard.events);
  const p2pOffers = useAppSelector((s) => s.dashboard.p2pOffers);
  const businesses = useAppSelector((s) => s.account.businesses);
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType = FEED_TYPE_FILTERS.some((f) => f.id === params.type) ? (params.type as FeedKind) : 'all';
  const [type, setType] = useState<'all' | FeedKind>(initialType);
  const [activeIndex, setActiveIndex] = useState(0);
  // videoFeedAudio du web : son activé par défaut ; les navigateurs bloquent l'autoplay avec son,
  // donc sur Expo web on démarre en muet jusqu'au premier geste (policyMuted du web).
  const [mutedPref, setMutedPref] = useState(false);
  const [policyMuted, setPolicyMuted] = useState(Platform.OS === 'web');
  const muted = mutedPref || policyMuted;

  const all = useMemo(
    () =>
      buildFeedItems({
        videos: videos as never[],
        listings: listings as never[],
        parcels: parcels as never[],
        events: events as never[],
        posts: posts as never[],
        p2pOffers: p2pOffers as never[],
        businesses: businesses as never[],
        userId,
      }),
    [videos, listings, parcels, events, posts, p2pOffers, businesses, userId],
  );
  const counts = useMemo(() => {
    const c: Partial<Record<FeedKind, number>> = {};
    for (const item of all) c[item.kind] = (c[item.kind] || 0) + 1;
    return c;
  }, [all]);
  const filters = FEED_TYPE_FILTERS.filter((f) => f.id === 'all' || (counts[f.id as FeedKind] || 0) > 0);
  const showFilters = all.length > 0 && filters.length > 2;
  const ordered = useStableOrder(all);
  const items = type === 'all' ? ordered : ordered.filter((i) => i.kind === type);
  const viewed = useRef(new Set<string>());

  // Même déclencheur que VideoFeedSlide : slide active, pas l'auteur, une fois, après 350 ms.
  useEffect(() => {
    const item = items[activeIndex];
    if (!item || item.kind !== 'video') return undefined;
    if (userId && (item.publisher.ownerId === userId || (item.publisher.type === 'user' && item.publisher.id === userId))) return undefined;
    if (viewed.current.has(item.entityId)) return undefined;
    viewed.current.add(item.entityId);
    const timer = setTimeout(() => {
      dispatch(recordVideoView(item.entityId));
    }, 350);
    return () => clearTimeout(timer);
  }, [activeIndex, dispatch, items, userId]);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null) setActiveIndex(first.index);
  }, []);

  const chromeTop = insets.top + 53.6; // --feed-chrome-top : safe-area + 3.35rem

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }} testID="feed-screen">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        windowSize={3}
        renderItem={({ item, index }) => (
          <FeedSlide
            item={item}
            height={height}
            active={index === activeIndex}
            muted={muted}
            onToggleMute={() => {
              setPolicyMuted(false);
              setMutedPref(!muted);
            }}
            chromeTop={chromeTop}
            bottomInset={insets.bottom}
          />
        )}
      />

      {/* FeedTypeChips : retour, pastilles, bouton + blanc. */}
      <View
        pointerEvents="box-none"
        testID="feed-type-chips"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 8, paddingTop: Math.max(8, insets.top) }}>
        <Pressable
          accessibilityLabel="Retour"
          onPress={() => router.navigate('/(tabs)' as never)}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
          <ArrowLeft size={18} color="rgba(255,255,255,0.9)" strokeWidth={2} />
        </Pressable>
        {showFilters ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
            {filters.map((f) => {
              const active = type === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    setType(f.id);
                    setActiveIndex(0);
                  }}
                  style={{
                    height: 36,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? '#ffffff' : 'rgba(0,0,0,0.4)',
                    borderWidth: active ? 0 : 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}>
                  <AppText className="text-[11px] font-bold" style={{ color: active ? '#000' : 'rgba(255,255,255,0.9)', lineHeight: 12 }}>
                    {f.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Pressable
          testID="feed-publish-menu"
          accessibilityLabel="Publier"
          onPress={openPublish}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <Plus size={18} color="#000" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
