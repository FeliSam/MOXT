import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { PenLine, Plus } from 'lucide-react-native';

import { StatusRail } from '@/components/dashboard/StatusRail';
import { usePublishMenu } from '@/components/chrome/PublishMenuSheet';
import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import type { FeedPost } from '@/store/feed';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

const FILTERS = ['all', 'listing', 'job', 'parcel', 'event', 'business', 'free', 'video'] as const;

/** Liste Actualités (NewsFeedModule) : en-tête, statuts, filtres, cartes. Le fil plein écran reste l’onglet Fil. */
export default function NewsListScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const openPublish = usePublishMenu();
  const user = useAppSelector((state) => state.auth.user);
  const posts = useAppSelector((state) => state.feed.posts);
  const videos = useAppSelector((state) => state.feed.videos);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const visible = useMemo(() => {
    const published = posts.filter((post) => !post.status || post.status === 'published');
    const cards: FeedPost[] = filter === 'video' ? [] : published.filter((post) => filter === 'all' || post.sourceType === filter);
    if (filter === 'all' || filter === 'video') {
      for (const video of videos) {
        if (video.status && video.status !== 'active' && video.status !== 'published') continue;
        cards.push({
          id: video.id,
          authorName: String(video.businessName || video.title || 'Vidéo'),
          title: video.title,
          text: String(video.caption || video.title || ''),
          imageUrl: (video.thumbnailUrl as string) || null,
          sourceType: 'video',
          createdAt: video.createdAt,
        });
      }
    }
    return cards.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [filter, posts, videos]);

  return (
    <AppChrome pathname="/news">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 128, gap: 16 }}>
        <View style={{ borderRadius: 16, backgroundColor: colors.surface, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <AppText display className="flex-1 text-xl text-app-text">
            {t('shared.pages.news.title')}
          </AppText>
          {user ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable accessibilityLabel={t('status.rail.addYours')} onPress={() => openPublish()} style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
                <Plus size={18} color={colors.text} />
              </Pressable>
              <Pressable accessibilityLabel={t('news.writePost')} onPress={() => router.push('/publish/post' as never)} style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
                <PenLine size={18} color={colors.text} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <StatusRail onAdd={() => openPublish()} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {FILTERS.map((key) => {
            const active = filter === key;
            const label = key === 'video' ? 'Vidéos' : t(`news.filters.${key}`);
            return (
              <Pressable key={key} onPress={() => setFilter(key)} style={{ paddingBottom: 12 }}>
                <AppText className="text-sm font-bold" style={{ color: active ? colors.text : colors.textMuted }}>{label}</AppText>
                {active ? <View style={{ marginTop: 8, height: 2, borderRadius: 2, backgroundColor: '#08705f' }} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {visible.length ? (
          visible.map((post) => (
            <Pressable
              key={`${post.sourceType || 'post'}-${post.id}`}
              onPress={() => router.push(post.sourceType === 'video' ? (`/(tabs)/feed?type=video&item=${encodeURIComponent(`video:${post.id}`)}` as never) : (`/news/${post.id}` as never))}
              style={{ gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <AppText className="text-sm font-black text-app-text">{post.authorName || 'MOXT'}</AppText>
              <AppText className="text-base font-bold text-app-text">{post.title || ''}</AppText>
              <AppText className="text-sm text-app-text-muted">{String(post.text || post.content || post.message || '')}</AppText>
              {post.imageUrl ? <Image source={{ uri: String(post.imageUrl) }} style={{ width: '100%', height: 180, borderRadius: 16 }} /> : null}
            </Pressable>
          ))
        ) : (
          <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
            <AppText className="text-base font-black text-app-text">{t('news.empty.title')}</AppText>
            <AppText className="text-center text-sm text-app-text-muted">
              {filter === 'all' ? t('news.empty.description') : t('news.empty.type', { type: filter === 'video' ? 'Vidéos' : t(`news.filters.${filter}`) })}
            </AppText>
          </View>
        )}
      </ScrollView>
    </AppChrome>
  );
}
