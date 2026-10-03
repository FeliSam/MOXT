import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, MessageSquare, ShoppingBag, Star, UserRound } from 'lucide-react-native';

import { formatShortDate } from '@moxt/shared/utils/formatters.js';

import { ExpandableText } from '@/components/ui/ExpandableText';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useTheme } from '@/theme/ThemeContext';

import type { PublisherProfile } from './usePublisherDetailProfile';

/** Carte éditeur du web (PublisherDetailCard) : identité, note, volume, lien profil. */
export function PublisherDetailCard({ profile }: { profile: PublisherProfile }) {
  const { colors } = useTheme();
  const rating =
    profile.rating.count > 0 ? `${Number(profile.rating.average || 0).toFixed(1)} (${profile.rating.count})` : '—';
  const initials = profile.publisherName.slice(0, 2).toUpperCase() || 'MO';
  const destination = profile.businessProfilePath || profile.publicationsPath;
  const cta = profile.businessProfilePath ? 'Voir la fiche entreprise' : profile.ctaLabel;

  return (
    <View style={{ borderRadius: 18, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accentSoft,
          }}>
          <AppText className="text-lg font-black" style={{ color: colors.accent }}>
            {initials}
          </AppText>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText className="flex-1 text-base font-black text-app-text" numberOfLines={1}>
              {profile.publisherName}
            </AppText>
            {profile.verified ? <VerifiedIcon size={16} /> : null}
          </View>
          <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="#10b981" />
            <AppText className="text-xs text-app-text-muted">
              {profile.business ? 'Entreprise MOXT' : 'Particulier'}
            </AppText>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { icon: Star, value: rating, label: 'Note' },
          { icon: ShoppingBag, value: String(profile.publicationCount), label: profile.countLabel },
          { icon: MessageSquare, value: String(profile.contactCount), label: 'Contacts' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <View key={stat.label} style={{ flex: 1, borderRadius: 16, backgroundColor: colors.surfaceMuted, padding: 10, alignItems: 'center' }}>
              <Icon size={16} color={colors.accent} />
              <AppText className="mt-1 text-sm font-black text-app-text" numberOfLines={1}>
                {stat.value}
              </AppText>
              <AppText className="text-[10px] text-app-text-muted" numberOfLines={1}>
                {stat.label}
              </AppText>
            </View>
          );
        })}
      </View>

      <ExpandableText text={profile.description} maxLines={4} className="text-sm leading-6 text-app-text-muted" />

      {destination ? (
        <Pressable
          onPress={() => router.push(destination as never)}
          style={{
            minHeight: 44,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}>
          <UserRound size={16} color={colors.text} />
          <AppText className="font-bold text-app-text">{cta}</AppText>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <AppText className="text-xs text-app-text-muted">{profile.shareCount} partage(s)</AppText>
        {profile.updatedAt ? (
          <AppText className="text-xs text-app-text-muted">Mis à jour le {formatShortDate(profile.updatedAt)}</AppText>
        ) : null}
      </View>
    </View>
  );
}
