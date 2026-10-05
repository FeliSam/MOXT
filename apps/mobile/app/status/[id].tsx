import { useEffect, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { openContactConversation } from '@moxt/shared/services/contactService.js';
import { STATUS_COLUMNS } from '@moxt/shared/services/feedService.js';
import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { statusUpserted, type StatusItem } from '@/store/feed';
import { mapConversationRow, receiveRemoteConversation, sendMessage } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { idFromPath, routeParam } from '@/utils/routeParam';

const REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

/** Lecteur de statut (StatusViewer du web) : photo, légende, réactions, réponse. */
export default function StatusDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeParam(params.id) || idFromPath(usePathname());
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.feed.statuses.find((item) => item.id === id));
  const [missing, setMissing] = useState(false);
  const [page, setPage] = useState(0);
  const [reply, setReply] = useState('');
  const [reaction, setReaction] = useState<string | null>(null);

  useEffect(() => {
    if (!id || status || !supabase) return undefined;
    let alive = true;
    supabase
      .from('statuses')
      .select(STATUS_COLUMNS)
      .eq('id', id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (!alive) return;
          const mapped = data ? (fromRow(data) as StatusItem) : null;
          if (!mapped?.id) {
            setMissing(true);
            return;
          }
          dispatch(statusUpserted({
            ...mapped,
            images: Array.isArray(mapped.images) ? mapped.images : [],
            viewedBy: Array.isArray(mapped.viewedBy) ? mapped.viewedBy : [],
          }));
        },
        () => {
          if (alive) setMissing(true);
        },
      );
    return () => {
      alive = false;
    };
  }, [dispatch, id, status]);

  useEffect(() => {
    if (!supabase || !status || !user?.id || user.id === status.authorId) return;
    void supabase.rpc('moxt_status_mark_viewed', {
      p_status_id: status.id,
      p_user_name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
      p_user_avatar_url: user.avatarUrl || null,
    });
  }, [status, user?.avatarUrl, user?.firstName, user?.id, user?.lastName]);

  if (!status) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <AppText className="text-base font-black text-white">{missing ? 'Statut introuvable' : 'Chargement…'}</AppText>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <AppText className="font-bold text-white">Fermer</AppText>
        </Pressable>
      </View>
    );
  }

  const item = status;
  const images = item.images?.length ? item.images : [];
  const photo = images[page] || null;

  async function react(emoji: string) {
    if (!user?.id || !supabase) {
      router.push('/login' as never);
      return;
    }
    const next = reaction === emoji ? null : emoji;
    setReaction(next);
    await supabase.rpc('moxt_status_react', {
      p_status_id: item.id,
      p_image_key: `${item.id}:${page}`,
      p_emoji: next,
    });
  }

  async function sendReply() {
    const text = reply.trim();
    if (!text || !user?.id || !supabase || !item.authorId || item.authorId === user.id) return;
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    const result = await openContactConversation(supabase, {
      createdBy: user.id,
      ownerId: item.authorId,
      senderName: name,
      relatedType: 'profile',
      relatedId: item.authorId,
    });
    dispatch(receiveRemoteConversation(mapConversationRow(result.conversation as unknown as Record<string, unknown>)));
    await dispatch(sendMessage({
      conversationId: result.id,
      senderId: user.id,
      senderName: name || 'Membre',
      text,
    }));
    router.replace(`/messages/${result.id}` as never);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <Pressable
        style={{ flex: 1 }}
        onPress={(event) => {
          if (!images.length) return;
          const x = event.nativeEvent.locationX;
          setPage((currentPage) => (x < 180 ? Math.max(0, currentPage - 1) : Math.min(images.length - 1, currentPage + 1)));
        }}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ flex: 1 }} resizeMode="contain" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <AppText className="text-center text-lg font-black text-white">{item.caption || ''}</AppText>
          </View>
        )}
      </Pressable>
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {(images.length ? images : [null]).map((src, index) => (
            <View key={src || index} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: index <= page ? '#fff' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText className="text-sm font-black text-white">{item.authorName || 'Membre'}</AppText>
          <Pressable accessibilityLabel="Fermer" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <X size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
      <View style={{ paddingHorizontal: 12, paddingBottom: Math.max(12, insets.bottom), gap: 8, backgroundColor: 'rgba(2,6,23,0.92)' }}>
        {photo && item.caption ? <AppText className="text-sm text-white">{item.caption}</AppText> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {REACTIONS.map((emoji) => (
            <Pressable key={emoji} onPress={() => void react(emoji)} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: reaction === emoji ? 'rgba(255,255,255,0.2)' : 'transparent' }}>
              <AppText>{emoji}</AppText>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="Répondre…"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={{ flex: 1, minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', color: '#fff', paddingHorizontal: 14 }}
          />
          <Pressable onPress={() => void sendReply()}>
            <AppText className="font-bold text-white">Envoyer</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
