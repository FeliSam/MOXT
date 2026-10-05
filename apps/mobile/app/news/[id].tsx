import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';

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
  const [expanded, setExpanded] = useState(false);
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
        {text ? (
          <View>
            <AppText className="text-sm text-app-text" style={{ lineHeight: 22 }} numberOfLines={expanded ? undefined : 6}>
              {text}
            </AppText>
            {text.length > 220 ? (
              <Pressable onPress={() => setExpanded((value) => !value)} style={{ marginTop: 4 }}>
                <AppText className="text-xs font-semibold" style={{ color: colors.accent }}>{expanded ? 'Voir moins' : 'Voir plus'}</AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {images.length ? (
          <View style={{ height: Math.round(imageWidth * 57 / 50), borderRadius: 16, overflow: 'hidden' }}>
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
                <Image key={src} source={{ uri: src }} style={{ width: imageWidth, height: Math.round(imageWidth * 57 / 50) }} resizeMode="cover" />
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
                    style={{ position: 'absolute', left: 8, top: '42%', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <AppText className="text-lg font-black text-white">‹</AppText>
                  </Pressable>
                ) : null}
                {imageIndex < images.length - 1 ? (
                  <Pressable
                    onPress={() => {
                      const next = imageIndex + 1;
                      galleryRef.current?.scrollTo({ x: next * imageWidth, animated: true });
                      setImageIndex(next);
                    }}
                    style={{ position: 'absolute', right: 8, top: '42%', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <AppText className="text-lg font-black text-white">›</AppText>
                  </Pressable>
                ) : null}
                <View style={{ position: 'absolute', bottom: 12, alignSelf: 'center', left: 0, right: 0, alignItems: 'center' }}>
                <View style={{ borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 4 }}>
                  <AppText className="text-xs font-bold" style={{ color: '#fff' }}>{imageIndex + 1}/{images.length}</AppText>
                </View>
                </View>
              </>
            ) : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Pressable
            onPress={() => {
              if (!user?.id) {
                router.push('/login' as never);
                return;
              }
              void dispatch(toggleEngagementLike({ kind: 'post', entityId: post.id, userId: user.id }));
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 }}>
            <Heart size={18} color={liked ? '#ef4444' : colors.textMuted} fill={liked ? '#ef4444' : 'transparent'} />
            <AppText className="text-sm font-bold" style={{ color: colors.textMuted }}>{likes.length}</AppText>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 }}>
            <MessageCircle size={18} color={colors.textMuted} />
            <AppText className="text-sm font-bold" style={{ color: colors.textMuted }}>0</AppText>
          </View>
          <Pressable
            onPress={() => void Share.share({ message: text || String(post.title || 'MOXT') })}
            style={{ minHeight: 40, justifyContent: 'center' }}>
            <Share2 size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </AppChrome>
  );
}
