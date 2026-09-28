import { createAsyncThunk } from '@reduxjs/toolkit';

import { buildAuthorNotice, createAuthorNotification, newsPostPath } from '@moxt/shared/services/authorNotifications.js';
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

type AppState = {
  auth: { user: { id: string; firstName?: string; lastName?: string } | null };
  feed: { posts: { id: string; authorId?: string; likes?: string[] }[]; videos: { id: string; ownerId?: string; businessId?: string; likes?: string[] }[] };
  account: { businesses: { id: string; ownerId?: string }[] };
  marketplace: { items: { id: string; likes?: string[] }[] };
};

function displayName(user: AppState['auth']['user']) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
}

/** Auteur à prévenir : posts et vidéos seulement (le web ne notifie pas un j'aime d'annonce). */
function authorIdFor(state: AppState, kind: EngagementKind, entityId: string) {
  if (kind === 'listing') return null;
  if (kind === 'post') return state.feed.posts.find((item) => item.id === entityId)?.authorId || null;
  const video = state.feed.videos.find((item) => item.id === entityId);
  if (!video) return null;
  return video.ownerId || state.account.businesses.find((item) => item.id === video.businessId)?.ownerId || null;
}

function alreadyLiked(state: AppState, kind: EngagementKind, entityId: string, userId: string) {
  const list = kind === 'post' ? state.feed.posts : kind === 'video' ? state.feed.videos : state.marketplace.items;
  const entity = list.find((item) => item.id === entityId);
  return Array.isArray(entity?.likes) && entity.likes.includes(userId);
}

async function notifyAuthor(notice: ReturnType<typeof buildAuthorNotice>) {
  if (!notice || !supabase) return;
  try {
    await createAuthorNotification(supabase, notice);
  } catch {
    // La notification ne doit pas annuler le j'aime, le commentaire ou l'abonnement.
  }
}

/** Cœur du Fil (web posts/toggleLike, marketplace/toggleListingLike, videos/toggleVideoLike). */
export const toggleEngagementLike = createAsyncThunk(
  'engagement/toggleLike',
  async (args: { kind: EngagementKind; entityId: string; userId: string }, { dispatch, getState }) => {
    const before = getState() as AppState;
    const wasLiked = alreadyLiked(before, args.kind, args.entityId, args.userId);
    dispatch(likeToggled(args));
    try {
      if (!(await sessionMatches(args.userId))) throw new Error('Session expirée');
      await toggleLike(supabase, args.kind, args.entityId);
      if (!wasLiked) {
        const recipientId = authorIdFor(before, args.kind, args.entityId);
        await notifyAuthor(
          buildAuthorNotice({
            kind: 'like',
            recipientId,
            actorId: args.userId,
            actorName: displayName(before.auth.user),
            link: newsPostPath(args.entityId),
          }),
        );
      }
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
    { dispatch, getState },
  ) => {
    const comment = buildComment({ ...args, authorAvatarUrl: args.authorAvatarUrl || '' }) as EngagementComment;
    if (!comment.text) return;
    dispatch(commentAdded({ kind: args.kind, entityId: args.entityId, comment }));
    try {
      if (!(await sessionMatches(args.authorId))) throw new Error('Session expirée');
      await addComment(supabase, args.kind, args.entityId, comment);
      const state = getState() as AppState;
      await notifyAuthor(
        buildAuthorNotice({
          kind: 'comment',
          recipientId: authorIdFor(state, args.kind, args.entityId),
          actorId: args.authorId,
          actorName: args.authorName,
          text: comment.text,
          link: newsPostPath(args.entityId),
        }),
      );
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
export const subscribeToPublisher = createAsyncThunk('engagement/subscribe', async (args: SubscribeArgs, { dispatch, getState }) => {
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
    if (!args.existing) {
      const state = getState() as AppState;
      const recipientId =
        args.publisherType === 'business'
          ? state.account.businesses.find((item) => item.id === args.publisherId)?.ownerId || null
          : args.publisherId;
      await notifyAuthor(
        buildAuthorNotice({
          kind: 'subscription',
          recipientId,
          actorId: args.userId,
          actorName: displayName(state.auth.user),
          link: `/users/${args.userId}/publications`,
        }),
      );
    }
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
