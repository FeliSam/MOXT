import { createAction } from '@reduxjs/toolkit';

/** Types de contenus avec j'aime / commentaires en base (mêmes RPC que le web). */
export type EngagementKind = 'video' | 'listing' | 'post';

export type EngagementComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: string;
};

/** Mises à jour optimistes, appliquées par les slices feed (vidéos, posts) et marketplace (annonces). */
export const likeToggled = createAction<{ kind: EngagementKind; entityId: string; userId: string }>('engagement/likeToggled');
export const commentAdded = createAction<{ kind: EngagementKind; entityId: string; comment: EngagementComment }>(
  'engagement/commentAdded',
);
export const commentRemoved = createAction<{ kind: EngagementKind; entityId: string; commentId: string }>(
  'engagement/commentRemoved',
);
export const videoShareIncremented = createAction<{ videoId: string }>('engagement/videoShareIncremented');
