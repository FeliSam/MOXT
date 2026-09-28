import { configureStore } from '@reduxjs/toolkit';

import { accountReducer, selectMySubscriptions, selectOwnedBusinesses } from '../../store/account';
import { favoritesReducer, loadFavorites } from '../../store/favorites';
import {
  getConversationPeer,
  mapConversationRow,
  selectInboxList,
  type Conversation,
} from '../../store/messages';

const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';

describe('messagerie (règles partagées web)', () => {
  it('mappe une ligne RPC avec les profils des participants', () => {
    const conv = mapConversationRow({
      id: 'c1',
      title: 'Annonce vélo',
      participant_ids: [me, other],
      participant_profiles: { [other]: { firstName: 'Awa', lastName: 'Koné', avatarUrl: 'a.png' } },
      message_count: 2,
      last_message_at: '2026-09-01T10:00:00Z',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    });
    expect(getConversationPeer(conv, me)).toMatchObject({ name: 'Awa Koné', avatarUrl: 'a.png' });
  });

  it('liste sans dédoublonnage, vides et archivées masquées', () => {
    const base = { title: '', messages: [], createdAt: '', updatedAt: '', messageCount: 1 };
    const list = selectInboxList(
      [
        { ...base, id: 'a', participantIds: [me, other], lastMessageAt: '2026-09-01' },
        { ...base, id: 'b', participantIds: [me, other], lastMessageAt: '2026-09-02' },
        { ...base, id: 'c', participantIds: [me, other], archivedBy: [me] },
        { ...base, id: 'd', participantIds: [me, other], messageCount: 0 },
      ] as Conversation[],
      me,
    );
    expect(list.map((item) => item.id)).toEqual(['b', 'a']);
  });
});

describe('compte', () => {
  it('sélecteurs abonnements et entreprises possédées', () => {
    expect(
      selectMySubscriptions(
        [
          { id: 's1', userId: me, subscriberId: me, publisherType: 'business', publisherId: 'b1' },
          { id: 's2', userId: other, subscriberId: other, publisherType: 'user', publisherId: me },
        ],
        me,
      ).map((item) => item.id),
    ).toEqual(['s1']);
    expect(
      selectOwnedBusinesses(
        [
          { id: 'b1', ownerId: me, name: 'A' },
          { id: 'b2', ownerId: me, name: 'B', deletedByUserAt: '2026-01-01' },
          { id: 'b3', ownerId: other, name: 'C' },
        ],
        me,
      ).map((item) => item.id),
    ).toEqual(['b1']);
    expect(accountReducer(undefined, { type: 'noop' }).subscriptions).toEqual([]);
  });

  it('favoris : sans client Supabase, liste vide', async () => {
    const store = configureStore({ reducer: { favorites: favoritesReducer } });
    await store.dispatch(loadFavorites(me));
    expect(store.getState().favorites.items).toEqual([]);
    expect(store.getState().favorites.status).toBe('ready');
  });
});
