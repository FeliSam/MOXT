import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart } from 'lucide-react-native';

import { collectPostImages, withPostImages } from '@moxt/shared/domain/postMedia.js';
import { entityFromRemoteRow } from '@moxt/shared/services/rowUtils.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { EntityAvatar } from '@/components/profile/EntityAvatar';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { toggleEngagementLike } from '@/store/engagement';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Fiche d'un post (web /news/:postId) : auteur, texte, photos, j'aime. */
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(280, width - 32);
  const galleryRef = useRef<ScrollView>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const user = useAppSelector((state) => state.auth.user);
  const cached = useAppSelector((state) => state.feed.posts.find((item) => item.id === id));
  const [remote, setRemote] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (cached || !id || !supabase) return undefined;
    let alive = true;
    supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (alive && data) setRemote(withPostImages(entityFromRemoteRow(data)) as Record<string, unknown>);
        },
        () => undefined,
      );
    return () => {
      alive = false;
    };
  }, [cached, id]);

  const post = (cached ? withPostImages(cached) : remote) as {
    id: string;
    authorId?: string;
    authorName?: string;
    authorAvatarUrl?: string | null;
    title?: string;
    text?: string;
    content?: string;
    message?: string;
    createdAt?: string;
    likes?: unknown;
    images?: unknown;
    imageUrl?: unknown;
    payload?: unknown;
  } | null;

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
  const images = collectPostImages(post);
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
        {images.length ? (
          <View style={{ height: 280 }}>
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const next = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
                setImageIndex(Math.min(images.length - 1, Math.max(0, next)));
              }}>
              {images.map((src) => (
                <Image key={src} source={{ uri: src }} style={{ width: imageWidth, height: 280, borderRadius: 16 }} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 ? (
              <>
                {imageIndex > 0 ? (
                  <Pressable
                    onPress={() => {
                      const next = imageIndex - 1;
                      galleryRef.current?.scrollTo({ x: next * imageWidth, animated: true });
                      setImageIndex(next);
                    }}
                    style={{ position: 'absolute', left: 8, top: 120, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)' }}>
                    <AppText className="text-lg font-black">‹</AppText>
                  </Pressable>
                ) : null}
                {imageIndex < images.length - 1 ? (
                  <Pressable
                    onPress={() => {
                      const next = imageIndex + 1;
                      galleryRef.current?.scrollTo({ x: next * imageWidth, animated: true });
                      setImageIndex(next);
                    }}
                    style={{ position: 'absolute', right: 8, top: 120, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)' }}>
                    <AppText className="text-lg font-black">›</AppText>
                  </Pressable>
                ) : null}
                <View style={{ position: 'absolute', right: 12, bottom: 12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4 }}>
                  <AppText className="text-xs font-bold" style={{ color: '#fff' }}>{imageIndex + 1}/{images.length}</AppText>
                </View>
              </>
            ) : null}
          </View>
        ) : null}
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
