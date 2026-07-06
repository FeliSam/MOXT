import type { RealtimeChannel } from '@supabase/supabase-js';

import { addNotification } from '@/store/notifications';
import { setTransfers } from '@/store/transfers';
import { setParcels } from '@/store/parcels';
import { receiveMessage } from '@/store/messages';
import { supabase } from './supabase';

type Dispatch = (action: any) => void;

let channels: RealtimeChannel[] = [];

export function subscribeRealtime(userId: string, dispatch: Dispatch) {
  unsubscribeRealtime();
  if (!supabase) return;

  const transfersChannel = supabase
    .channel('transfers-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transfers', filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as Record<string, any> | undefined;
        dispatch(
          addNotification({
            title: 'Transfert mis à jour',
            body: `Le transfert ${row?.id || ''} a changé de statut.`,
            type: 'transfer',
            relatedId: row?.id,
          }),
        );
      },
    )
    .subscribe();

  const parcelsChannel = supabase
    .channel('parcels-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'parcels', filter: `owner_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as Record<string, any> | undefined;
        dispatch(
          addNotification({
            title: 'Colis mis à jour',
            body: `Votre colis ${row?.id || ''} a été modifié.`,
            type: 'parcel',
            relatedId: row?.id,
          }),
        );
      },
    )
    .subscribe();

  const messagesChannel = supabase
    .channel('messages-live')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations' },
      (payload) => {
        const row = payload.new as any;
        if (!row?.participant_ids?.includes(userId)) return;
        const msgs = row.messages || [];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.senderId !== userId) {
          dispatch(
            receiveMessage({
              conversationId: row.id,
              message: lastMsg,
            }),
          );
          dispatch(
            addNotification({
              title: 'Nouveau message',
              body: `${lastMsg.senderName}: ${lastMsg.text?.slice(0, 60)}`,
              type: 'message',
              relatedId: row.id,
            }),
          );
        }
      },
    )
    .subscribe();

  const listingsChannel = supabase
    .channel('listings-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'listings' },
      () => {
        dispatch(
          addNotification({
            title: 'Nouvelle annonce',
            body: 'Une nouvelle annonce vient d\'être publiée.',
            type: 'marketplace',
          }),
        );
      },
    )
    .subscribe();

  channels = [transfersChannel, parcelsChannel, messagesChannel, listingsChannel];
}

export function unsubscribeRealtime() {
  channels.forEach((ch) => {
    try { supabase?.removeChannel(ch); } catch {}
  });
  channels = [];
}
