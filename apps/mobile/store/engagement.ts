import { createAsyncThunk } from '@reduxjs/toolkit';

import {
  addComment,
  buildComment,
  buildPublisherSubscription,
  deleteComment,
  incrementVideoShare,
  removePublisherSubscription,
  toggleLike,
  upsertPublisherSubscription,
} from '@moxt/shared/services/engagementService.js';
import { supabase } from '../services/supabase';
import { subscriptionRemoved, subscriptionUpserted, type PublisherSubscription } from './account';
import {
  commentAdded,
  commentRemoved,
  likeToggled,
  videoShareIncremented,
  type EngagementComment,
  type EngagementKind,
} from './engagementActions';

export * from './engagementActions';

/** Écrit seulement si la session Supabase est bien celle de l'utilisateur (comme les favoris). */
async function sessionMatches(userId: string) {
  if (!supabase) return false;
  let {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user?.id !== userId) {
    ({
      data: { session },
    } = await supabase.auth.refreshSession());
  }
  return session?.user?.id === userId;
}

/** Cœur du Fil (web posts/toggleLike, marketplace/toggleListingLike, videos/toggleVideoLike). */
export const toggleEngagementLike = createAsyncThunk(
  'engagement/toggleLike',
  async (args: { kind: EngagementKind; entityId: string; userId: string }, { dispatch }) => {
    dispatch(likeToggled(args));
    try {
      if (!(await sessionMatches(args.userId))) throw new Error('Session expirée');
      await toggleLike(supabase, args.kind, args.entityId);
    } catch (error) {
      dispatch(likeToggled(args));
      throw error;
    }
  },
);

/** Commentaire (web addComment / addListingComment / addVideoComment), même format. */
export const addEngagementComment = createAsyncThunk(
  'engagement/addComment',
  async (
    args: { kind: EngagementKind; entityId: string; authorId: string; authorName: string; authorAvatarUrl?: string; text: string },
    { dispatch },
  ) => {
    const comment = buildComment({ ...args, authorAvatarUrl: args.authorAvatarUrl || '' }) as EngagementComment;
    if (!comment.text) return;
    dispatch(commentAdded({ kind: args.kind, entityId: args.entityId, comment }));
    try {
      if (!(await sessionMatches(args.authorId))) throw new Error('Session expirée');
      await addComment(supabase, args.kind, args.entityId, comment);
    } catch (error) {
      dispatch(commentRemoved({ kind: args.kind, entityId: args.entityId, commentId: comment.id }));
      throw error;
    }
  },
);

export const deleteEngagementComment = createAsyncThunk(
  'engagement/deleteComment',
  async (args: { kind: EngagementKind; entityId: string; commentId: string; userId: string }, { dispatch }) => {
    dispatch(commentRemoved(args));
    if (!(await sessionMatches(args.userId))) return;
    await deleteComment(supabase, args.kind, args.entityId, args.commentId);
  },
);

/** Partage d'une vidéo réellement effectué : compteur serveur (web incrementVideoShare). */
export const shareVideo = createAsyncThunk('engagement/shareVideo', async (videoId: string, { dispatch }) => {
  dispatch(videoShareIncremented({ videoId }));
  if (!supabase) return;
  await incrementVideoShare(supabase, videoId);
});

type SubscribeArgs = {
  userId: string;
  publisherType: 'user' | 'business';
  publisherId: string;
  publisherName?: string;
  publisherPath?: string;
  notifyPref?: 'all' | 'important' | 'muted';
  existing?: PublisherSubscription | null;
};

/** S'abonner ou changer la préférence (web upsertPublisherSubscription / updatePublisherSubscriptionPref). */
export const subscribeToPublisher = createAsyncThunk('engagement/subscribe', async (args: SubscribeArgs, { dispatch }) => {
  const sub = buildPublisherSubscription({
    ...args,
    id: args.existing?.id,
    createdAt: args.existing?.createdAt,
  }) as PublisherSubscription & { updatedAt: string };
  dispatch(subscriptionUpserted({ ...sub, subscriberId: args.userId }));
  try {
    if (!(await sessionMatches(args.userId))) throw new Error('Session expirée');
    const saved = (await upsertPublisherSubscription(supabase, sub)) as PublisherSubscription;
    dispatch(subscriptionUpserted({ ...saved, subscriberId: args.userId }));
  } catch (error) {
    if (args.existing) dispatch(subscriptionUpserted(args.existing));
    else dispatch(subscriptionRemoved(args));
    throw error;
  }
});

/** Se désabonner (web removePublisherSubscription). */
export const unsubscribeFromPublisher = createAsyncThunk(
  'engagement/unsubscribe',
  async (args: { userId: string; publisherType: 'user' | 'business'; publisherId: string; existing?: PublisherSubscription | null }, { dispatch }) => {
    dispatch(subscriptionRemoved(args));
    try {
      if (!(await sessionMatches(args.userId))) throw new Error('Session expirée');
      await removePublisherSubscription(supabase, args);
    } catch (error) {
      if (args.existing) dispatch(subscriptionUpserted(args.existing));
      throw error;
    }
  },
);
