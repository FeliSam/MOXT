import { useEffect, useMemo } from 'react';
import { FlatList, Image, ScrollView, View } from 'react-native';

import { FeatherIcon } from '@/components/chrome/icons';
import { BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { loadFeed, selectStatusGroups, type FeedPost } from '@/store/feed';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

function postText(post: FeedPost) {
  return String(post.title || post.text || post.content || '').trim();
}

/**
 * Onglet Fil — données du web (posts, vidéos, statuts via les services partagés).
 * La présentation plein écran façon web arrive en phase 3.
 */
export default function FeedTab() {
  const { translateLabel } = useLanguage();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const posts = useAppSelector((state) => state.feed.posts);
  const videos = useAppSelector((state) => state.feed.videos);
  const statuses = useAppSelector((state) => state.feed.statuses);
  const loading = useAppSelector((state) => state.feed.status === 'loading');
  const groups = useMemo(() => selectStatusGroups(statuses, userId), [statuses, userId]);

  useEffect(() => {
    if (userId) dispatch(loadFeed(userId));
  }, [dispatch, userId]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      refreshing={loading}
      onRefresh={() => userId && dispatch(loadFeed(userId))}
      contentContainerStyle={{ padding: 16, paddingBottom: BOTTOM_NAV_PADDING, gap: 12 }}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <AppText display className="text-xl text-app-text">
            {translateLabel('Fil d’actualité')}
          </AppText>
          <AppText className="text-xs text-app-text-muted">
            {`${posts.length} publication(s) · ${videos.length} vidéo(s) · ${groups.length} statut(s)`}
          </AppText>
          {groups.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {groups.map((group) => (
                <View key={group.key} style={{ alignItems: 'center', width: 64, gap: 4 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: group.unseen ? colors.accent : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: colors.accentSoft,
                    }}>
                    {group.avatarUrl ? (
                      <Image source={{ uri: group.avatarUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} />
                    ) : (
                      <AppText className="text-base text-app-text">{(group.name || '?').charAt(0).toUpperCase()}</AppText>
                    )}
                  </View>
                  <AppText className="text-[10px] text-app-text-muted" numberOfLines={1}>
                    {group.name || 'MOXT'}
                  </AppText>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 14,
            gap: 6,
          }}>
          <AppText className="text-sm font-semibold text-app-text">{item.authorName || 'MOXT'}</AppText>
          {postText(item) ? (
            <AppText className="text-sm text-app-text-muted" numberOfLines={4}>
              {postText(item)}
            </AppText>
          ) : null}
        </View>
      )}
      ListEmptyComponent={
        loading ? null : (
          <View style={{ alignItems: 'center', gap: 12, paddingTop: 40 }}>
            <FeatherIcon name="rss" size={26} color={isDark ? colors.teal : colors.accent} />
            <AppText className="text-sm text-app-text-muted">{translateLabel('Aucune publication pour le moment.')}</AppText>
          </View>
        )
      }
    />
  );
}
