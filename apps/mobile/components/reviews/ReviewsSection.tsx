import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Briefcase, Building2, Calendar, MessageCircle, MessageSquare, Package, ShoppingBag, Star } from 'lucide-react-native';

import { REVIEW_COMMENT_MIN_LENGTH } from '@moxt/shared/services/reviewsService.js';
import { formatReviewDate } from '@moxt/shared/utils/reviewPublicationResolver.js';
import { REVIEW_SOURCE_LABELS, calculateAggregateRating, isReviewVisible } from '@moxt/shared/utils/reviewUtils.js';

import { EntityAvatar, useMemberProfiles } from '@/components/profile/EntityAvatar';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import { brand, withAlphaColor } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';

export type Review = {
  id: string;
  targetType: string;
  targetId: string;
  authorId?: string;
  authorName?: string;
  rating: number;
  comment?: string;
  status?: string;
  replyText?: string;
  replyAt?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

export type ReviewPublication = { title: string; imageUrl?: string | null; path?: string; typeLabel: string };

type Rating = { average: number; count: number; breakdown: number[] };

const AMBER = '#fbbf24';

const PUBLICATION_ICONS: Record<string, typeof ShoppingBag> = {
  listing: ShoppingBag,
  parcel: Package,
  job: Briefcase,
  event: Calendar,
  post: MessageSquare,
  business: Building2,
};

/** StarRating du web : étoiles FiStar pleines ambre, vides couleur de bordure ; interactif si onChange. */
export function StarRating({ value = 0, size = 'md', onChange }: { value?: number; size?: 'sm' | 'md' | 'lg'; onChange?: (value: number) => void }) {
  const { colors } = useTheme();
  const px = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  return (
    <View
      accessibilityRole={onChange ? 'radiogroup' : 'image'}
      accessibilityLabel={onChange ? 'Note' : `Note : ${value} sur 5`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const icon = <Star size={px} color={active ? AMBER : colors.border} fill={active ? AMBER : 'transparent'} strokeWidth={2} />;
        if (!onChange) return <View key={star}>{icon}</View>;
        return (
          <Pressable
            key={star}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === star }}
            accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
            onPress={() => onChange(star)}
            style={{ padding: 2, borderRadius: 6 }}>
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Carte blanche des avis (Card default du web, p-4 sur mobile). */
function ReviewsCard({ children, gap = 20 }: { children: React.ReactNode; gap?: number }) {
  const shadows = useShadows();
  return (
    <View className="rounded-card-lg border border-app-border bg-app-surface" style={[{ padding: 16, gap }, shadows.card]}>
      {children}
    </View>
  );
}

/** ReviewSummary du web (colonne unique sur téléphone). */
export function ReviewSummary({ rating }: { rating: Rating }) {
  const { t } = useLanguage();
  const maxCount = Math.max(...rating.breakdown, 1);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <AppText className="text-4xl font-black text-app-text" style={{ fontVariant: ['tabular-nums'] }}>
          {rating.count ? String(rating.average) : '—'}
        </AppText>
        <View style={{ marginTop: 8 }}>
          <StarRating value={Math.round(rating.average)} size="sm" />
        </View>
        <AppText className="mt-2 text-sm text-app-text-muted">{t('reviews.summaryTotal', { count: rating.count })}</AppText>
      </View>
      <View style={{ gap: 8 }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = rating.breakdown[star - 1] || 0;
          const width = rating.count ? `${(count / maxCount) * 100}%` : '0%';
          return (
            <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppText className="text-xs font-semibold text-app-text-muted" style={{ width: 32 }}>
                {star}
              </AppText>
              <View className="bg-app-surface-muted" style={{ flex: 1, height: 8, overflow: 'hidden', borderRadius: 999 }}>
                <View style={{ height: '100%', width: width as `${number}%`, borderRadius: 999, backgroundColor: AMBER }} />
              </View>
              <AppText className="text-xs text-app-text-faint" style={{ width: 32, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                {count}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** ReviewCard du web en lecture (auteur, source, date, étoiles, publication liée, commentaire, réponse). */
export function ReviewCard({
  review,
  ownerName,
  author,
  publication,
}: {
  review: Review;
  ownerName?: string;
  author?: { name?: string; avatarUrl?: string | null; verified?: boolean } | null;
  publication?: ReviewPublication | null;
}) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const shadows = useShadows();
  const sourceLabel = (REVIEW_SOURCE_LABELS as Record<string, string>)[review.targetType] || t('reviews.card.publicationFallback');
  const name = author?.name || review.authorName || t('reviews.memberFallback');
  const PublicationIcon = PUBLICATION_ICONS[review.targetType] || ShoppingBag;
  const isProfileReview = review.targetType === 'user_profile';

  return (
    <View className="rounded-2xl border border-app-border bg-app-surface" style={[{ padding: 16 }, shadows.card]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            {/* Le web lie l'auteur à /users/:id/publications, page publique pas encore portée sur mobile. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 1 }}>
              <EntityAvatar name={name} src={author?.avatarUrl} size={36} shape="user" from={brand[600]} />
              <AppText numberOfLines={1} className="text-base font-bold text-app-text" style={{ flexShrink: 1 }}>
                {name}
              </AppText>
              {author?.verified ? (
                <View style={{ flexShrink: 0 }}>
                  <VerifiedIcon size={14} />
                </View>
              ) : null}
            </View>
            <View className="rounded-full bg-app-surface-muted" style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
              <AppText className="text-xs font-semibold text-app-text-muted">{sourceLabel}</AppText>
            </View>
          </View>
          <AppText className="mt-1 text-xs font-medium text-app-text-faint">{formatReviewDate(review.createdAt)}</AppText>
        </View>
        <StarRating value={review.rating} size="sm" />
      </View>

      {publication && !isProfileReview ? (
        <Pressable
          disabled={!publication.path}
          onPress={() => publication.path && router.push(publication.path as never)}
          className="border border-app-border bg-app-surface-muted"
          style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 10 }}>
          {publication.imageUrl ? (
            <Image source={{ uri: publication.imageUrl }} style={{ width: 48, height: 48, borderRadius: 8 }} contentFit="cover" />
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? brand[50] : brand[100] }}>
              <PublicationIcon size={18} color={isDark ? brand[300] : brand[700]} strokeWidth={2} />
            </View>
          )}
          <View style={{ minWidth: 0, flex: 1 }}>
            <AppText className="text-[10px] font-bold uppercase text-app-text-faint" style={{ letterSpacing: 0.8 }}>
              {publication.typeLabel}
            </AppText>
            <AppText numberOfLines={1} className="mt-0.5 text-sm font-bold text-app-text">
              {publication.title}
            </AppText>
          </View>
        </Pressable>
      ) : null}

      {review.comment ? <AppText className="mt-3 text-sm leading-6 text-app-text-muted">{review.comment}</AppText> : null}

      {review.replyText ? (
        // Web : border-brand-100 bg-brand-50/70 (dark:bg-brand-950/20 n'est pas généré, le fond reste brand-50/70).
        <View style={{ marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: isDark ? withAlphaColor(brand[900], 0.4) : brand[100], backgroundColor: withAlphaColor(brand[50], 0.7), padding: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={12} color={isDark ? brand[300] : brand[700]} strokeWidth={2} />
            <AppText className="text-xs font-bold uppercase" style={{ color: isDark ? brand[300] : brand[700], letterSpacing: 0.8, flexShrink: 1 }}>
              {t('reviews.card.ownerReply', { name: ownerName || t('reviews.card.ownerFallback') })}
            </AppText>
            {review.replyAt ? <AppText className="text-xs font-medium text-app-text-faint">· {formatReviewDate(review.replyAt)}</AppText> : null}
          </View>
          <AppText className="mt-2 text-sm leading-6 text-app-text-muted">{review.replyText}</AppText>
        </View>
      ) : null}
    </View>
  );
}

/**
 * ReviewsSection du web (variante embedded des fiches) : résumé, formulaire si l'utilisateur
 * est éligible, message sinon, puis « Tous les avis ».
 */
export function ReviewsSection({
  reviews,
  ownerId,
  ownerName,
  currentUserId,
  eligibility,
  existingReview,
  resolvePublication,
  onSubmit,
}: {
  reviews: Review[];
  ownerId?: string;
  ownerName?: string;
  currentUserId?: string;
  eligibility: { allowed: boolean; reasonKey?: string };
  existingReview?: Review | null;
  resolvePublication?: (review: Review) => ReviewPublication | null;
  /** Publie l'avis (mêmes écritures que le web) ; n'est appelé qu'après un appui sur « Publier ». */
  onSubmit: (values: { rating: number; comment: string }) => Promise<void>;
}) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visible = useMemo(() => (reviews || []).filter(isReviewVisible) as Review[], [reviews]);
  const aggregate = useMemo(() => calculateAggregateRating(visible) as Rating, [visible]);
  const authorIds = useMemo(() => [...new Set(visible.map((r) => r.authorId).filter(Boolean) as string[])], [visible]);
  const authors = useMemberProfiles(authorIds);
  const isOwner = Boolean(currentUserId && currentUserId === ownerId);
  const canReview = eligibility.allowed || Boolean(existingReview);
  const showCompose = canReview && (!existingReview || editing);
  const tooShort = comment.trim().length < REVIEW_COMMENT_MIN_LENGTH;

  async function submit() {
    if (tooShort || !currentUserId || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
      setEditing(false);
      setComment('');
      if (!existingReview) setRating(5);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ gap: 20 }}>
      <AppText className="text-sm text-app-text-muted">
        {t('reviews.embeddedSummary', { count: aggregate.count, average: aggregate.count ? `${aggregate.average}/5` : '—' })}
      </AppText>

      <ReviewsCard>
        <ReviewSummary rating={aggregate} />

        {canReview && existingReview && !editing ? (
          <View className="border-t border-app-border" style={{ gap: 12, paddingTop: 20 }}>
            <AppText className="font-black text-app-text">{t('reviews.publishedTitle')}</AppText>
            <StarRating value={existingReview.rating} size="lg" />
            <AppText className="text-sm leading-6 text-app-text-muted">{existingReview.comment}</AppText>
            <AppText className="text-xs text-app-text-faint">{t('reviews.publishedHint')}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEditing(true);
                setRating(existingReview.rating);
                setComment(existingReview.comment || '');
              }}
              className="flex-row items-center justify-center border border-app-border-md bg-app-surface"
              style={{ minHeight: 44, borderRadius: 12, paddingHorizontal: 20, gap: 8 }}>
              <MessageCircle size={18} color={colors.text} strokeWidth={2} />
              <AppText className="text-sm font-semibold text-app-text">{t('reviews.actions.edit')}</AppText>
            </Pressable>
          </View>
        ) : null}

        {showCompose ? (
          <View className="border-t border-app-border" style={{ gap: 16, paddingTop: 20 }}>
            <AppText className="font-black text-app-text">{existingReview ? t('reviews.update') : t('reviews.leaveReview')}</AppText>
            <View style={{ gap: 8 }}>
              <AppText className="text-sm font-semibold text-app-text">{t('reviews.yourRating')}</AppText>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </View>
            <View style={{ gap: 8 }}>
              <AppText className="text-sm font-semibold text-app-text">{t('reviews.yourComment')}</AppText>
              <TextInput
                multiline
                value={comment}
                onChangeText={setComment}
                placeholder={t('reviews.commentPlaceholder')}
                placeholderTextColor={colors.textFaint}
                className="border border-app-border bg-app-surface-muted text-app-text"
                style={{ minHeight: 112, borderRadius: 12, padding: 12, fontSize: 16, textAlignVertical: 'top' }}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: tooShort || submitting }}
                disabled={tooShort || submitting}
                onPress={submit}
                style={{
                  minHeight: 44,
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  opacity: tooShort || submitting ? 0.5 : 1,
                  backgroundColor: isDark ? brand[400] : brand[700],
                }}>
                <MessageCircle size={18} color={isDark ? '#020617' : '#ffffff'} strokeWidth={2} />
                <AppText className="text-sm font-semibold" style={{ color: isDark ? '#020617' : '#ffffff' }}>
                  {existingReview ? t('reviews.update') : t('reviews.publish')}
                </AppText>
              </Pressable>
              {existingReview ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setEditing(false);
                    setComment('');
                    setRating(existingReview.rating);
                  }}
                  style={{ minHeight: 44, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' }}>
                  <AppText className="text-sm font-semibold text-app-text-muted">{t('reviews.cancelEdit')}</AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {!canReview && !isOwner && currentUserId ? (
          <View className="border border-app-border bg-app-surface-muted" style={{ borderRadius: 12, padding: 12 }}>
            <AppText className="text-sm text-app-text-muted">{eligibility.reasonKey ? t(eligibility.reasonKey) : ''}</AppText>
          </View>
        ) : null}

        {isOwner ? (
          <View style={{ borderRadius: 12, borderWidth: 1, borderColor: isDark ? withAlphaColor(brand[900], 0.4) : brand[100], backgroundColor: withAlphaColor(brand[50], 0.6), padding: 12 }}>
            <AppText className="text-sm text-app-text-muted">{t('reviews.ownerHint')}</AppText>
          </View>
        ) : null}
      </ReviewsCard>

      <ReviewsCard gap={16}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <AppText className="font-black text-app-text">{t('reviews.allReviews')}</AppText>
          {visible.length ? (
            <AppText className="text-xs font-semibold text-app-text-faint" style={{ fontVariant: ['tabular-nums'] }}>
              {t('reviews.summaryTotal', { count: visible.length })}
            </AppText>
          ) : null}
        </View>
        {visible.length ? (
          <View style={{ gap: 12 }}>
            {visible.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                ownerName={ownerName}
                author={review.authorId ? authors[review.authorId] || (review.authorName ? { name: review.authorName } : null) : null}
                publication={resolvePublication?.(review) || null}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon={Star} title={t('reviews.emptyTitle')} description={t('reviews.emptyDescription')} />
        )}
      </ReviewsCard>
    </View>
  );
}
