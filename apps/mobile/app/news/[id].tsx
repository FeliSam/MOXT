import { Image, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart } from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { EntityAvatar } from '@/components/profile/EntityAvatar';
import { AppText } from '@/components/ui/AppText';
import { toggleEngagementLike } from '@/store/engagement';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

function asImages(post: Record<string, unknown>) {
  const list = Array.isArray(post.images) ? post.images.filter((src): src is string => typeof src === 'string') : [];
  if (list.length) return list;
  return typeof post.imageUrl === 'string' && post.imageUrl ? [post.imageUrl] : [];
}

/** Fiche d'un post (web /news/:postId) : auteur, texte, photos, j'aime. */
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const post = useAppSelector((state) => state.feed.posts.find((item) => item.id === id));

  if (!post) {
    return (
      <AppChrome pathname="/news">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 }}>
          <AppText className="text-base font-black text-app-text">Publication introuvable</AppText>
        </View>
      </AppChrome>
    );
  }

  const likes = Array.isArray(post.likes) ? post.likes.map(String) : [];
  const liked = Boolean(user?.id && likes.includes(user.id));
  const images = asImages(post);
  const text = String(post.text || post.content || post.message || '');
  const when = post.createdAt ? new Date(String(post.createdAt)).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <AppChrome pathname="/news">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}>
        <Pressable
          onPress={() => post.authorId && router.push(`/users/${post.authorId}/publications` as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <EntityAvatar name={String(post.authorName || 'Membre')} src={post.authorAvatarUrl || null} size={44} shape="user" />
          <View style={{ flex: 1 }}>
            <AppText className="text-base font-black text-app-text">{String(post.authorName || 'Membre')}</AppText>
            {when ? <AppText className="text-xs text-app-text-muted">{when}</AppText> : null}
          </View>
        </Pressable>
        {post.title ? <AppText className="text-xl font-black text-app-text">{String(post.title)}</AppText> : null}
        {text ? <AppText className="text-base text-app-text" style={{ lineHeight: 24 }}>{text}</AppText> : null}
        {images.map((src) => (
          <Image key={src} source={{ uri: src }} style={{ width: '100%', height: 240, borderRadius: 16 }} resizeMode="cover" />
        ))}
        <Pressable
          onPress={() => {
            if (!user?.id) {
              router.push('/login' as never);
              return;
            }
            void dispatch(toggleEngagementLike({ kind: 'post', entityId: post.id, userId: user.id }));
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 40 }}>
          <Heart size={18} color={liked ? colors.accent : colors.textMuted} fill={liked ? colors.accent : 'transparent'} />
          <AppText className="text-sm font-bold text-app-text">{likes.length ? String(likes.length) : 'J’aime'}</AppText>
        </Pressable>
      </ScrollView>
    </AppChrome>
  );
}
