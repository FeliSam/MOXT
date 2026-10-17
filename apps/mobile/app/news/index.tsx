import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Package,
  Plus,
  Search,
} from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { HeaderActionButton, HeaderCountBadge, UserAvatar } from '@/components/chrome/HeaderChrome';
import { usePublishMenu } from '@/components/chrome/PublishMenuSheet';
import { StatusRail } from '@/components/dashboard/StatusRail';
import { FeedPostCard, type FeedCardItem } from '@/components/feed/FeedPostCard';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { useLanguage } from '@/providers/LanguageProvider';
import { selectUnreadNotificationCount } from '@/store/notifications';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

const TOP_CATEGORIES = [
  { key: 'all', label: 'Tous' },
  { key: 'listing', label: 'Annonces' },
  { key: 'job', label: 'Emplois' },
  { key: 'parcel', label: 'Colis' },
  { key: 'event', label: 'Événements' },
  { key: 'video', label: 'Vidéos' },
  { key: 'business', label: 'Entreprises' },
] as const;

export default function NewsFeedScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const openPublish = usePublishMenu();
  const { onScroll, scrollEventThrottle } = useSmartNavbarScroll();

  const user = useAppSelector((state) => state.auth.user);
  const posts = useAppSelector((state) => state.feed.posts);
  const videos = useAppSelector((state) => state.feed.videos);
  const unreadNotifications = useAppSelector(selectUnreadNotificationCount);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const visiblePosts = useMemo<FeedCardItem[]>(() => {
    const published = posts.filter((post) => !post.status || post.status === 'published');
    const cards: FeedCardItem[] = [];

    // Posts standard
    for (const p of published) {
      const type = typeof p.sourceType === 'string' ? p.sourceType : 'post';
      if (activeCategory !== 'all' && activeCategory !== type) continue;
      const rawImages: string[] = Array.isArray((p as any).images)
        ? (p as any).images
        : p.imageUrl
        ? [p.imageUrl]
        : [];
      cards.push({
        id: p.id,
        authorId: p.authorId,
        authorName: p.authorName || 'Feliciano Fanou',
        authorAvatarUrl: p.authorAvatarUrl,
        authorVerified: true,
        title: p.title,
        message: String(p.message || p.text || p.content || ''),
        imageUrl: p.imageUrl || rawImages[0] || null,
        images: rawImages,
        videoUrl: (p as any).videoUrl || (p.sourceType === 'video' ? (p as any).mediaUrl : null),
        sourceType: type,
        sourceId: typeof p.sourceId === 'string' ? p.sourceId : undefined,
        createdAt: p.createdAt || '2026-07-17T17:38:00Z',
        likes: Array.isArray(p.likes) ? (p.likes as string[]) : ['dummy-1', 'dummy-2', 'dummy-3', 'dummy-4', 'dummy-5', 'dummy-6'],
        comments: Array.isArray(p.comments) ? p.comments : [{}],
        sharesCount: typeof p.sharesCount === 'number' ? p.sharesCount : 0,
        pinned: Boolean(p.pinned),
      });
    }

    // Vidéos
    if (activeCategory === 'all' || activeCategory === 'video') {
      for (const v of videos) {
        if (v.status && v.status !== 'active' && v.status !== 'published') continue;
        const vUrl = (v as any).videoUrl || (v as any).url || null;
        const vThumb = (v.thumbnailUrl as string) || (v as any).posterUrl || null;
        cards.push({
          id: v.id,
          authorId: typeof v.ownerId === 'string' ? v.ownerId : undefined,
          authorName: String(v.businessName || v.title || 'MOXT'),
          title: v.title,
          message: String(v.caption || v.title || ''),
          imageUrl: vThumb,
          images: vThumb ? [vThumb] : [],
          videoUrl: vUrl,
          sourceType: 'video',
          createdAt: v.createdAt,
          likes: Array.isArray(v.likes) ? (v.likes as string[]) : [],
          comments: Array.isArray(v.comments) ? v.comments : [],
        });
      }
    }

    // Si la liste est vide en dev, fournir l'exemple officiel de lancement de MOXT
    if (cards.length === 0) {
      cards.push({
        id: 'welcome-post',
        authorName: 'Feliciano Fanou',
        authorVerified: true,
        message:
          "🚀 Bienvenue sur MOXT ! Aujourd'hui, une nouvelle aventure commence. MOXT est bien plus qu'une simple application : c'est une plateforme qui fédère une communauté autour de services utiles, fiables et accessibles. Avec MOXT, vous pouvez déjà : 💸 Effectuer des transferts d'argent rapidement et facilement. 📦 Envoyer et recevoir des colis à l'international. 🛍️ Acheter, vendre et publier des annonces sur la Marketplace. 💼 Trouver des offres d'emploi et des services qualifiés.\n\nRejoignez le mouvement !",
        imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80',
        sourceType: 'post',
        createdAt: '2026-07-17T17:38:00Z',
        likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
        comments: [{}],
        sharesCount: 0,
      });
    }

    return cards.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [activeCategory, posts, videos]);

  return (
    <AppChrome pathname="/news">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Main Feed ScrollView avec défilement de tous les éléments */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Top Horizontal Categories Carousel Bar - défile avec la page */}
          <View style={[styles.topCategoryBar, { borderBottomColor: colors.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {TOP_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setActiveCategory(cat.key)}
                    style={[
                      styles.categoryPill,
                      isActive && styles.categoryPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isActive ? colors.text : colors.textMuted },
                        isActive && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {isActive ? (
                      <View style={[styles.activeUnderline, { backgroundColor: '#0d9488' }]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Status Stories Rail */}
          <StatusRail onAdd={() => openPublish()} />

          {/* Posts List */}
          <View style={styles.postsList}>
            {visiblePosts.map((post) => (
              <FeedPostCard key={`${post.sourceType}-${post.id}`} post={post} />
            ))}
          </View>
        </ScrollView>
      </View>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  topCategoryBar: {
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'center',
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
  },
  categoryPillActive: {},
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    fontWeight: '800',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    height: 2.5,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 130, // Space for bottom navigation dock
  },
  postsList: {
    marginTop: 10,
  },
});
