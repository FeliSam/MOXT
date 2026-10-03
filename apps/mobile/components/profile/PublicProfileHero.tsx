import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Briefcase, Image as ImageIcon, Star, User } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { avatarDisplayUrl } from '@/utils/avatarDisplayUrl';
import { useTheme } from '@/theme/ThemeContext';

import { AvatarBadge } from './AvatarBadge';
import { MoxtCoverBanner, type CoverLabels } from './CoverBanner';
import { resolveCoverStyleId } from './coverStyles';
import { useBrandScale, useScopeColors, type ProfileKind } from './identity';

export function formatRatingAverage(average: unknown) {
  const n = Number(average || 0);
  if (!Number.isFinite(n)) return '0,0';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function profileInitials(name = '', fallback = '') {
  const parts = String(name || fallback || '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || 'M';
}

/** Étoiles + « 5,0 · 6 avis » (StarRatingRow du web). */
export function StarRatingRow({
  average = 0,
  count = 0,
  reviewsLabel = 'avis',
  onPress,
}: {
  average?: number;
  count?: number;
  reviewsLabel?: string;
  onPress?: () => void;
}) {
  if (!count) return null;
  const filled = Math.max(0, Math.min(5, Math.round(Number(average) || 0)));
  const content = (
    <>
      <View className="flex-row items-center" style={{ gap: 2 }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={14}
            color={index < filled ? '#fbbf24' : '#fde68a'}
            fill={index < filled ? '#fbbf24' : 'transparent'}
            strokeWidth={2}
          />
        ))}
      </View>
      <AppText className={onPress ? WEB_BUTTON_TEXT : 'text-sm font-semibold'} style={{ color: '#d97706' }}>
        {formatRatingAverage(average)} · {count} {reviewsLabel}
      </AppText>
    </>
  );
  const style = { marginTop: 8, flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: 6 };
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`Voir les avis (${count})`} onPress={onPress} style={style}>
        {content}
      </Pressable>
    );
  }
  return <View style={style}>{content}</View>;
}

/** Pilule « Modifier la bannière » centrée en bas de la bannière (max 50 % de large, comme le web). */
function EditCoverPill({ label, onPress }: { label: string; onPress: () => void }) {
  const [width, setWidth] = useState(0);
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 12, left: '50%', right: 0, alignItems: 'flex-start', zIndex: 10 }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{
          marginLeft: -width / 2,
          opacity: width ? 1 : 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
          backgroundColor: 'rgba(0,0,0,0.55)',
          paddingHorizontal: 14,
          paddingVertical: 6,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
        }}>
        <ImageIcon size={14} color="#ffffff" strokeWidth={2} />
        <AppText className={`${WEB_BUTTON_TEXT} text-white`} style={{ textAlign: 'center', maxWidth: 108 }}>
          {label}
        </AppText>
      </Pressable>
    </View>
  );
}

/**
 * Hero public (PublicProfileHero du web) : bannière h-44 arrondie, avatar
 * chevauchant (rond + anneau prune en perso, carré arrondi en entreprise),
 * nom + vérif, catégorie · ville, étoiles, puce de type, actions sur 2 colonnes.
 */
export function PublicProfileHero({
  name,
  verified = false,
  category,
  city,
  coverUrl,
  avatarUrl,
  profileKind,
  kindLabel,
  rating,
  reviewsLabel = 'avis',
  coverStyle,
  gender,
  coverCategory = 'personal',
  coverLabels,
  shareSlot,
  actions,
  showCoverEdit = false,
  onEditCover,
  editCoverLabel = 'Modifier la bannière',
  onOpenReviews,
}: {
  name: string;
  verified?: boolean;
  category?: string | null;
  city?: string | null;
  coverUrl?: string | null;
  avatarUrl?: string | null;
  profileKind: ProfileKind;
  kindLabel?: string;
  rating?: { average?: number; count?: number } | null;
  reviewsLabel?: string;
  coverStyle?: string | null;
  gender?: string | null;
  coverCategory?: 'personal' | 'business';
  coverLabels?: CoverLabels;
  shareSlot?: ReactNode;
  actions?: ReactNode;
  showCoverEdit?: boolean;
  onEditCover?: () => void;
  editCoverLabel?: string;
  onOpenReviews?: () => void;
}) {
  const { isDark } = useTheme();
  const scale = useBrandScale(profileKind);
  const colors = useScopeColors(profileKind === 'personal' ? 'personal' : 'base');
  const [coverFailed, setCoverFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const cover = coverUrl && !coverFailed ? coverUrl : '';
  const avatar = avatarUrl && !avatarFailed ? avatarDisplayUrl(avatarUrl, 160) : null;
  const metaLine = [category, city].filter(Boolean).join(' · ');
  const personal = profileKind === 'personal';
  const avatarRadius = personal ? 36 : 18.4;
  const avatarFrame = {
    width: 72,
    height: 72,
    borderRadius: avatarRadius,
    borderWidth: 3,
    borderColor: colors.surface,
    boxShadow: `${personal ? `0 0 0 2px ${scale[400]}, ` : ''}0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)`,
  } as const;

  return (
    <View style={{ minWidth: 0 }}>
      <View style={{ position: 'relative' }}>
        <View style={{ height: 176, width: '100%', overflow: 'hidden', borderRadius: 16 }}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" onError={() => setCoverFailed(true)} />
          ) : (
            <MoxtCoverBanner styleId={resolveCoverStyleId({ coverStyle, category: coverCategory, gender })} labels={coverLabels} />
          )}
        </View>

        <View style={{ position: 'absolute', bottom: -40, left: 16, zIndex: 10 }}>
          <View>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={[avatarFrame, { backgroundColor: colors.surface }]}
                contentFit="cover"
                onError={() => setAvatarFailed(true)}
                accessibilityLabel={name}
              />
            ) : (
              <View style={[avatarFrame, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }]}>
                <AppText className="text-xl font-black" style={{ color: colors.accent }}>
                  {profileInitials(name)}
                </AppText>
              </View>
            )}
            <AvatarBadge url={avatarUrl} top={-6} />
          </View>
        </View>

        {shareSlot ? <View style={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>{shareSlot}</View> : null}
        {showCoverEdit && onEditCover ? <EditCoverPill label={editCoverLabel} onPress={onEditCover} /> : null}
      </View>

      <View style={{ paddingTop: 48, gap: 12 }}>
        <View style={{ minWidth: 0 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <AppText numberOfLines={1} className="text-xl font-black text-app-text" style={{ letterSpacing: -0.5, flexShrink: 1 }}>
              {name}
            </AppText>
            {verified ? <VerifiedIcon size={16} /> : null}
          </View>
          {metaLine ? (
            <AppText numberOfLines={1} className="mt-1 text-sm text-app-text-muted">
              {metaLine}
            </AppText>
          ) : null}
          <StarRatingRow average={rating?.average} count={rating?.count} reviewsLabel={reviewsLabel} onPress={onOpenReviews} />
          {kindLabel ? (
            <View style={{ marginTop: 8, flexDirection: 'row' }}>
              <View
                className="flex-row items-center rounded-full"
                style={{
                  gap: 4,
                  borderWidth: 1,
                  borderColor: isDark ? scale[800] : scale[200],
                  backgroundColor: isDark ? colors.accentSoft : scale[50],
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                }}>
                {personal ? (
                  <User size={12} color={isDark ? scale[300] : scale[700]} strokeWidth={2} />
                ) : (
                  <Briefcase size={12} color={isDark ? scale[300] : scale[700]} strokeWidth={2} />
                )}
                <AppText className="text-[11px] font-bold" style={{ color: isDark ? scale[300] : scale[700], lineHeight: 16 }}>
                  {kindLabel}
                </AppText>
              </View>
            </View>
          ) : null}
        </View>
        {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>{actions}</View> : null}
      </View>
    </View>
  );
}
