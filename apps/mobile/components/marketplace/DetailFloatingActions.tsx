import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Heart, MessageCircle, Plus, Share2, X } from 'lucide-react-native';

import { openContactConversation } from '@moxt/shared/services/contactService.js';

import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { mapConversationRow, receiveRemoteConversation } from '@/store/messages';
import { toggleFavorite } from '@/store/favorites';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { platformShadow } from '@/theme/platformShadow';

/**
 * Menu flottant du web (DetailFloatingActions) : partager, favori, message.
 * Le « + » ouvre les pastilles, comme sur la fiche annonce.
 */
export function DetailFloatingActions({
  relatedId,
  title,
  ownerId,
  isOwner,
}: {
  relatedId: string;
  title: string;
  ownerId?: string;
  isOwner: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const favorite = useAppSelector((state) =>
    state.favorites.items.some((item) => item.id === relatedId && item.type === 'listing'),
  );
  const [open, setOpen] = useState(false);
  const path = `/marketplace/${relatedId}`;

  async function onShare() {
    await Share.share({ message: `${title} — MOXT`, url: path }).catch(() => undefined);
  }

  function onFavorite() {
    if (!user?.id) {
      router.push('/login' as never);
      return;
    }
    dispatch(toggleFavorite({ userId: user.id, id: relatedId, type: 'listing', title, path })).catch(() => undefined);
  }

  async function onMessage() {
    if (!user?.id || !ownerId || !supabase || isOwner) {
      if (!user?.id) router.push('/login' as never);
      return;
    }
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    const result = await openContactConversation(supabase, {
      createdBy: user.id,
      ownerId,
      senderName: name,
      relatedType: 'listing',
      relatedId,
      relatedPath: path,
      relatedSnapshot: { type: 'listing', id: relatedId, title, path },
    });
    dispatch(receiveRemoteConversation(mapConversationRow(result.conversation as unknown as Record<string, unknown>)));
    router.push(`/messages/${result.id}` as never);
  }

  const actions = [
    { key: 'share', label: 'Partager', icon: Share2, onPress: () => void onShare() },
    { key: 'favorite', label: favorite ? 'Favori' : 'Favori', icon: Heart, onPress: onFavorite, active: favorite },
    ...(!isOwner ? [{ key: 'contact', label: 'Contacter', icon: MessageCircle, onPress: () => void onMessage() }] : []),
  ];

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 24, alignItems: 'flex-end', gap: 8, zIndex: 30 }}>
      {open
        ? actions.map((action) => {
            const Icon = action.icon;
            return (
              <View key={action.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppText className="text-xs font-bold text-app-text">{action.label}</AppText>
                <Pressable
                  accessibilityLabel={action.label}
                  onPress={action.onPress}
                  style={[{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, platformShadow('0 8px 24px rgba(15,23,20,0.16)')]}>
                  <Icon size={18} color={action.active ? '#ef4444' : '#0f1714'} fill={action.active ? '#ef4444' : 'none'} />
                </Pressable>
              </View>
            );
          })
        : null}
      <Pressable
        accessibilityLabel={open ? 'Fermer le menu actions' : 'Ouvrir le menu actions'}
        onPress={() => setOpen((value) => !value)}
        style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f766e', ...platformShadow('0 12px 28px rgba(8,112,95,0.35)') }}>
        {open ? <X size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
      </Pressable>
    </View>
  );
}
