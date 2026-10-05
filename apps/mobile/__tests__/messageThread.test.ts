import { configureStore } from '@reduxjs/toolkit';

import {
  createLocalConversation,
  markConversationRead,
  messagesReducer,
  receiveMessage,
  type Conversation,
} from '../store/messages';
import { bubbleRadii, messageReadStatus, mobileContentPath } from '../utils/messageThread';

const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';

describe('fiche liée et bulles', () => {
  it('ouvre un colis web sur la route mobile', () => {
    expect(mobileContentPath('/parcels/abc')).toBe('/parcel/abc');
    expect(mobileContentPath('/listing/x')).toBe('/listing/x');
  });

  it('arrondit la bulle envoyée comme le web', () => {
    expect(bubbleRadii(true, false, false).borderBottomRightRadius).toBe(6);
    expect(bubbleRadii(true, false, false).borderBottomLeftRadius).toBe(16);
    expect(bubbleRadii(false, true, true).borderRadius).toBe(6);
  });
});

describe('accusés de lecture', () => {
  it('affiche Lu seulement quand l’autre a lu', () => {
    expect(messageReadStatus({ senderId: me, readBy: [me] }, me)).toBe('sent');
    expect(messageReadStatus({ senderId: me, deliveredTo: [other], readBy: [me] }, me)).toBe('delivered');
    expect(messageReadStatus({ senderId: me, readBy: [me, other] }, me)).toBe('read');
    expect(messageReadStatus({ senderId: other, readBy: [me] }, me)).toBeNull();
  });

  it('marque les messages reçus comme lus à l’ouverture', async () => {
    const store = configureStore({ reducer: { messages: messagesReducer } });
    const conversation: Conversation = {
      id: 'c1',
      title: 'Colis',
      participantIds: [me, other],
      messages: [],
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
      unreadBy: { [me]: 1 },
    };
    store.dispatch(createLocalConversation(conversation));
    store.dispatch(
      receiveMessage({
        conversationId: 'c1',
        message: {
          id: 'm1',
          senderId: other,
          senderName: 'Awa',
          text: 'Moscou → Cotonou',
          createdAt: '2026-09-01T01:00:00Z',
          readBy: [],
        },
      }),
    );
    await store.dispatch(markConversationRead({ conversationId: 'c1', userId: me }));
    const message = store.getState().messages.conversations[0].messages[0];
    expect(message.readBy).toContain(me);
    expect(store.getState().messages.conversations[0].unreadBy?.[me]).toBe(0);
  });
});
