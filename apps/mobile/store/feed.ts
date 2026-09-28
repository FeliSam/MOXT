import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  fetchActiveStatuses,
  fetchFeedPosts,
  fetchVideos,
  groupStatusesByAuthor,
} from '@moxt/shared/services/feedService.js';
import { incrementEntityView } from '@moxt/shared/services/viewsService.js';
import { supabase } from '../services/supabase';
import { commentAdded, commentRemoved, likeToggled, videoShareIncremented, type EngagementKind } from './engagementActions';
import { toggleLikeList } from '@moxt/shared/services/engagementService.js';

export type FeedPost = {
  id: string;
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  title?: string;
  text?: string;
  content?: string;
  imageUrl?: string | null;
  status?: string;
  createdAt?: string;
  lastSharedAt?: string | null;
  [key: string]: unknown;
};

export type FeedVideo = {
  id: string;
  title?: string;
  businessId?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type StatusItem = {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  businessId?: string | null;
  images: string[];
  viewedBy: string[];
  createdAt?: string;
  expiresAt?: string;
  isOfficial?: boolean;
};

export type StatusGroup = {
  key: string;
  authorId: string;
  businessId: string | null;
  name: string;
  avatarUrl: string | null;
  isOfficial: boolean;
  items: StatusItem[];
  unseen: boolean;
};

type FeedState = {
  posts: FeedPost[];
  videos: FeedVideo[];
  statuses: StatusItem[];
  status: 'idle' | 'loading' | 'ready' | 'error';
};

const initialState: FeedState = { posts: [], videos: [], statuses: [], status: 'idle' };

/** Fil comme le web : posts (publiés + les miens), vidéos (50), statuts non expirés (60). */
export const loadFeed = createAsyncThunk('feed/load', async (userId: string) => {
  if (!supabase) return { posts: [], videos: [], statuses: [] };
  const [posts, videos, statuses] = await Promise.all([
    fetchFeedPosts(supabase, userId).catch(() => []),
    fetchVideos(supabase).catch(() => []),
    fetchActiveStatuses(supabase).catch(() => []),
  ]);
  return {
    posts: posts as FeedPost[],
    videos: videos as FeedVideo[],
    statuses: statuses as StatusItem[],
  };
});

/** Vue d'une vidéo après 350 ms d'affichage (videos/incrementVideoView). Le RPC ignore l'auteur. */
export const recordVideoView = createAsyncThunk('feed/recordView', async (videoId: string) => {
  if (!supabase) return null;
  return incrementEntityView(supabase, 'video', videoId) as Promise<number | null>;
});

function findEntity(state: FeedState, kind: EngagementKind, id: string): Record<string, unknown> | undefined {
  if (kind === 'video') return state.videos.find((item) => item.id === id);
  if (kind === 'post') return state.posts.find((item) => item.id === id);
  return undefined;
}

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFeed.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadFeed.fulfilled, (state, action) => {
        state.posts = action.payload.posts;
        state.videos = action.payload.videos;
        state.statuses = action.payload.statuses;
        state.status = 'ready';
      })
      .addCase(loadFeed.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(likeToggled, (state, action) => {
        const entity = findEntity(state, action.payload.kind, action.payload.entityId);
        if (entity) entity.likes = toggleLikeList(entity.likes, action.payload.userId);
      })
      .addCase(commentAdded, (state, action) => {
        const entity = findEntity(state, action.payload.kind, action.payload.entityId);
        if (entity) entity.comments = [...(Array.isArray(entity.comments) ? entity.comments : []), action.payload.comment];
      })
      .addCase(commentRemoved, (state, action) => {
        const entity = findEntity(state, action.payload.kind, action.payload.entityId);
        if (entity && Array.isArray(entity.comments)) {
          entity.comments = entity.comments.filter((item: { id?: string }) => item?.id !== action.payload.commentId);
        }
      })
      .addCase(videoShareIncremented, (state, action) => {
        const video = state.videos.find((item) => item.id === action.payload.videoId);
        if (video) video.shareCount = (Number(video.shareCount) || 0) + 1;
      })
      .addCase(recordVideoView.fulfilled, (state, action) => {
        if (action.payload == null) return;
        const video = state.videos.find((item) => item.id === action.meta.arg);
        if (video) video.viewCount = action.payload;
      });
  },
});

export const feedReducer = feedSlice.reducer;

export function selectStatusGroups(statuses: StatusItem[], userId?: string | null): StatusGroup[] {
  return groupStatusesByAuthor(statuses, userId) as StatusGroup[];
}
