import { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Edit2,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Search,
  Share2,
  Star,
  X,
} from 'lucide-react-native';

import { FeedCommentsSheet } from '@/components/feed/FeedCommentsSheet';
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { FeedVideoPlayer } from '@/components/video/FeedVideoPlayer';
import { useLanguage } from '@/providers/LanguageProvider';
import { toggleEngagementLike } from '@/store/engagement';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_MEDIA_HEIGHT = 384; // +60% vs original 240px

export type FeedCardItem = {
  id: string;
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  authorVerified?: boolean;
  title?: string;
  message?: string;
  imageUrl?: string | null;
  images?: string[];
  videoUrl?: string | null;
  sourceType?: 'post' | 'listing' | 'job' | 'parcel' | 'event' | 'video' | 'business' | string;
  sourceId?: string;
  createdAt?: string;
  likes?: string[];
  commentsCount?: number;
  comments?: unknown[];
  sharesCount?: number;
  pinned?: boolean;
};

const SOURCE_LABELS: Record<string, string> = {
  post: 'Poste',
  free: 'Poste',
  listing: 'Annonce',
  job: 'Emploi',
  parcel: 'Colis',
  event: 'Événement',
  video: 'Vidéo',
  business: 'Entreprise',
};

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  post: { bg: '#fef3c7', text: '#b45309' },
  free: { bg: '#fef3c7', text: '#b45309' },
  listing: { bg: '#ffedd5', text: '#c2410c' },
  job: { bg: '#d1fae5', text: '#047857' },
  parcel: { bg: '#fef3c7', text: '#d97706' },
  event: { bg: '#ede9fe', text: '#6d28d9' },
  video: { bg: '#ffe4e6', text: '#be123c' },
  business: { bg: '#dbeafe', text: '#1d4ed8' },
};

export function FeedPostCard({ post }: { post: FeedCardItem }) {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [localShares, setLocalShares] = useState(post.sharesCount || 0);

  const isOwner = Boolean(user?.id && (post.authorId === user.id || (user as any).username === post.authorName));

  const rawImages = post.images && post.images.length > 0
    ? post.images
    : post.imageUrl
    ? [post.imageUrl]
    : [];
  const imageList = rawImages.filter(Boolean);

  const likesList = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = user?.id ? likesList.includes(user.id) : false;
  const likesCount = likesList.length;

  const commentsCount =
    post.commentsCount ?? (Array.isArray(post.comments) ? post.comments.length : 0);

  const isVideo = post.sourceType === 'video' || Boolean(post.videoUrl);

  const handleLike = () => {
    if (!user?.id) {
      router.push('/login' as never);
      return;
    }
    const kind = post.sourceType === 'video' ? 'video' : 'post';
    dispatch(toggleEngagementLike({ kind, entityId: post.id, userId: user.id }));
  };

  const shareUrl = `https://moxtapp.ru/news/${post.id}`;

  const handleShare = async () => {
    setLocalShares((s) => s + 1);
    try {
      await Share.share({
        title: post.title || post.authorName || 'MOXT',
        message: `${post.authorName ? `${post.authorName} sur MOXT :\n` : ''}${post.message ? `${post.message}\n\n` : ''}${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // share cancelled or unsupported
    }
  };

  const handleCopyLink = () => {
    setMenuOpen(false);
    showNotice('Lien copié', 'Le lien de la publication a été copié.');
  };

  const handleEdit = () => {
    setMenuOpen(false);
    if (post.sourceType === 'listing' && post.sourceId) {
      router.push(`/listing/${post.sourceId}/edit` as never);
    } else if (post.sourceType === 'parcel' && post.sourceId) {
      router.push(`/parcel/${post.sourceId}/edit` as never);
    } else if (post.sourceType === 'job' && post.sourceId) {
      router.push(`/jobs/${post.sourceId}/edit` as never);
    } else if (post.sourceType === 'event' && post.sourceId) {
      router.push(`/events/${post.sourceId}/edit` as never);
    } else if (post.sourceType === 'video' && (post.sourceId || post.id)) {
      router.push(`/videos/${post.sourceId || post.id}/edit` as never);
    } else {
      router.push(`/publications/edit?id=${post.id}&type=post` as never);
    }
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const typeKey = post.sourceType || 'post';
  const typeLabel = SOURCE_LABELS[typeKey] || 'Poste';
  const typeColor = SOURCE_COLORS[typeKey] || SOURCE_COLORS.post;

  const messageText = String(post.message || post.title || '').trim();
  const isLongText = messageText.length > 200 || messageText.split('\n').length > 4;

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      {/* Author Header Row */}
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Profil de ${post.authorName || 'l’auteur'}`}
          onPress={() => {
            if (post.authorId) {
              router.push(`/users/${post.authorId}` as never);
            }
          }}
          style={styles.authorInfo}
        >
          {post.authorAvatarUrl ? (
            <Image
              source={{ uri: post.authorAvatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {(post.authorName || 'F').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.authorMeta}>
            <View style={styles.nameRow}>
              <Text
                numberOfLines={1}
                style={[styles.authorName, { color: colors.text }]}
              >
                {post.authorName || 'Feliciano Fanou'}
              </Text>
              <VerifiedIcon size={14} />
            </View>
            {formattedDate ? (
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {formattedDate}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* Top Right Badges */}
        <View style={styles.topRightActions}>
          <Pressable
            accessibilityLabel="Favoris"
            style={[styles.starBtn, { backgroundColor: isDark ? '#27272a' : '#fef3c7' }]}
            onPress={() => showNotice('Favoris', 'Ajouté à vos favoris.')}
          >
            <Star size={13} color="#d97706" fill="#d97706" />
          </Pressable>

          <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>
              {typeLabel}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Options"
            style={styles.moreBtn}
            onPress={() => setMenuOpen(true)}
          >
            <MoreHorizontal size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Post Message */}
      {messageText ? (
        <View style={styles.messageContainer}>
          <Text
            numberOfLines={expanded ? undefined : 6}
            style={[styles.messageText, { color: colors.text }]}
          >
            {messageText}
          </Text>

          {isLongText && (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              style={styles.expandBtn}
            >
              <Text style={styles.expandText}>
                {expanded ? 'Voir moins' : 'Voir plus'}
              </Text>
              {expanded ? (
                <ChevronUp size={12} color="#0d9488" />
              ) : (
                <ChevronDown size={12} color="#0d9488" />
              )}
            </Pressable>
          )}
        </View>
      ) : null}

      {/* Media Display: Video or Multi-Photos */}
      {isVideo && (post.videoUrl || post.imageUrl) ? (
        <View style={styles.imageWrapper}>
          {post.videoUrl && isVideoPlaying ? (
            <FeedVideoPlayer
              videoUrl={post.videoUrl}
              poster={post.imageUrl || undefined}
              active={true}
              muted={false}
            />
          ) : (
            <Pressable
              style={styles.mediaPressable}
              onPress={() => setIsVideoPlaying(true)}
            >
              {post.imageUrl ? (
                <Image
                  source={{ uri: post.imageUrl }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.mediaImage, { backgroundColor: '#0f172a' }]} />
              )}
              <View style={styles.playOverlay}>
                <View style={styles.playCircle}>
                  <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: 3 }} />
                </View>
              </View>
            </Pressable>
          )}
        </View>
      ) : imageList.length > 0 ? (
        <View style={styles.imageWrapper}>
          {imageList.length === 1 ? (
            <Pressable
              accessibilityLabel="Agrandir la photo"
              onPress={() => {
                setActiveImageIndex(0);
                setGalleryOpen(true);
              }}
              style={styles.mediaPressable}
            >
              <Image
                source={{ uri: imageList[0] }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
              <View style={styles.zoomBadge}>
                <Search size={14} color="#ffffff" />
              </View>
            </Pressable>
          ) : (
            /* Multi-Photos Horizontal Carousel */
            <View style={{ width: '100%', height: POST_MEDIA_HEIGHT }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const w = e.nativeEvent.layoutMeasurement.width || SCREEN_WIDTH - 32;
                  const idx = Math.round(x / w);
                  setActiveImageIndex(idx);
                }}
                style={{ width: '100%', height: POST_MEDIA_HEIGHT }}
              >
                {imageList.map((uri, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setActiveImageIndex(idx);
                      setGalleryOpen(true);
                    }}
                    style={{ width: SCREEN_WIDTH - 32, height: POST_MEDIA_HEIGHT }}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Prev / Next controls */}
              {activeImageIndex > 0 && (
                <Pressable
                  onPress={() => setActiveImageIndex((i) => Math.max(0, i - 1))}
                  style={[styles.carouselArrow, { left: 10 }]}
                >
                  <ChevronLeft size={20} color="#fff" />
                </Pressable>
              )}
              {activeImageIndex < imageList.length - 1 && (
                <Pressable
                  onPress={() => setActiveImageIndex((i) => Math.min(imageList.length - 1, i + 1))}
                  style={[styles.carouselArrow, { right: 10 }]}
                >
                  <ChevronRight size={20} color="#fff" />
                </Pressable>
              )}

              {/* Counter Indicator Badge */}
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {activeImageIndex + 1}/{imageList.length}
                </Text>
              </View>

              <View style={styles.zoomBadge}>
                <Search size={14} color="#ffffff" />
              </View>
            </View>
          )}
        </View>
      ) : null}

      {/* Post Action Footer Bar */}
      <View style={[styles.actionsBar, { borderTopColor: colors.border }]}>
        {/* Like */}
        <Pressable
          accessibilityLabel="Aimer"
          onPress={handleLike}
          style={styles.actionBtn}
        >
          <Heart
            size={19}
            color={isLiked ? '#ef4444' : colors.textMuted}
            fill={isLiked ? '#ef4444' : 'transparent'}
          />
          <Text
            style={[
              styles.actionCount,
              { color: isLiked ? '#ef4444' : colors.textMuted },
            ]}
          >
            {likesCount}
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable
          accessibilityLabel="Commenter"
          onPress={() => setCommentsOpen(true)}
          style={styles.actionBtn}
        >
          <MessageCircle size={19} color={colors.textMuted} />
          <Text style={[styles.actionCount, { color: colors.textMuted }]}>
            {commentsCount}
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable
          accessibilityLabel="Partager"
          onPress={handleShare}
          style={styles.actionBtn}
        >
          <Share2 size={19} color={colors.textMuted} />
          <Text style={[styles.actionCount, { color: colors.textMuted }]}>
            {localShares}
          </Text>
        </Pressable>
      </View>

      {/* Comments Sheet Modal */}
      <FeedCommentsSheet
        kind={post.sourceType === 'video' ? 'video' : 'post'}
        entityId={post.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      {/* Full-screen Photo Lightbox Viewer */}
      <ImageGalleryViewer
        open={galleryOpen}
        images={imageList}
        index={activeImageIndex}
        title={post.title || post.authorName}
        onClose={() => setGalleryOpen(false)}
        onIndex={setActiveImageIndex}
      />

      {/* Action Options Sheet Modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Options de publication
              </Text>
              <Pressable onPress={() => setMenuOpen(false)} hitSlop={10}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Pressable
              style={styles.menuOption}
              onPress={() => {
                setMenuOpen(false);
                handleShare();
              }}
            >
              <Share2 size={18} color={colors.text} />
              <Text style={[styles.menuOptionText, { color: colors.text }]}>
                Partager
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuOption}
              onPress={handleCopyLink}
            >
              <Copy size={18} color={colors.text} />
              <Text style={[styles.menuOptionText, { color: colors.text }]}>
                Copier le lien
              </Text>
            </Pressable>

            {isOwner && (
              <Pressable
                style={styles.menuOption}
                onPress={handleEdit}
              >
                <Edit2 size={18} color={colors.text} />
                <Text style={[styles.menuOptionText, { color: colors.text }]}>
                  Modifier la publication
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.menuOption}
              onPress={() => {
                setMenuOpen(false);
                showNotice('Signalement reçu', 'Merci de votre vigilance.');
              }}
            >
              <Flag size={18} color="#ef4444" />
              <Text style={[styles.menuOptionText, { color: '#ef4444' }]}>
                Signaler cette publication
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  authorMeta: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
    marginTop: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  starBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  moreBtn: {
    padding: 6,
  },
  messageContainer: {
    marginTop: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d9488',
  },
  imageWrapper: {
    marginTop: 14,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
    height: POST_MEDIA_HEIGHT,
    width: '100%',
  },
  mediaPressable: {
    width: '100%',
    height: POST_MEDIA_HEIGHT,
  },
  mediaImage: {
    width: '100%',
    height: POST_MEDIA_HEIGHT,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  carouselArrow: {
    position: 'absolute',
    top: POST_MEDIA_HEIGHT / 2 - 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -24 }],
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    zIndex: 10,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  zoomBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 14,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  menuOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
