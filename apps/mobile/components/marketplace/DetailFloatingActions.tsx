import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Pencil, Plus, Share2, X } from 'lucide-react-native';

import { FavoriteButton } from '@/components/account/FavoriteButton';
import { ContactButton } from '@/components/communications/ContactButton';
import { AppText } from '@/components/ui/AppText';
import type { FavoriteType } from '@/store/favorites';
import { useTheme } from '@/theme/ThemeContext';
import { platformShadow } from '@/theme/platformShadow';

const FAVORITE_TYPES = new Set<FavoriteType>(['listing', 'parcel', 'job', 'event', 'business', 'p2p']);

/**
 * Menu flottant des fiches (web DetailFloatingActions) : partager, favori, contacter, modifier.
 * Le « + » déplie les pastilles. Les fonds suivent le thème clair ou sombre.
 */
export function DetailFloatingActions({
  relatedId,
  title,
  ownerId,
  isOwner,
  relatedType = 'listing',
  relatedPath,
  subtitle,
  editTo,
}: {
  relatedId: string;
  title: string;
  ownerId?: string;
  isOwner: boolean;
  relatedType?: string;
  relatedPath?: string;
  subtitle?: string;
  editTo?: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const path = relatedPath || `/marketplace/${relatedId}`;
  const favoriteType = FAVORITE_TYPES.has(relatedType as FavoriteType) ? (relatedType as FavoriteType) : 'listing';

  async function onShare() {
    await Share.share({ message: `${title}\n${path}` }).catch(() => undefined);
  }

  const circle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  };

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 24, alignItems: 'flex-end', gap: 8, zIndex: 30 }}>
      {open ? (
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText className="text-xs font-bold text-app-text">Partager</AppText>
            <Pressable accessibilityLabel="Partager" onPress={() => void onShare()} style={[circle, platformShadow('0 8px 24px rgba(15,23,20,0.16)')]}>
              <Share2 size={18} color={colors.text} />
            </Pressable>
          </View>
          {isOwner && editTo ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppText className="text-xs font-bold text-app-text">Modifier</AppText>
              <Pressable accessibilityLabel="Modifier" onPress={() => router.push(editTo as never)} style={[circle, platformShadow('0 8px 24px rgba(15,23,20,0.16)')]}>
                <Pencil size={18} color={colors.text} />
              </Pressable>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText className="text-xs font-bold text-app-text">Favori</AppText>
            <FavoriteButton relatedId={relatedId} relatedType={favoriteType} title={title} path={path} subtitle={subtitle} showLabel={false} />
          </View>
          {!isOwner ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppText className="text-xs font-bold text-app-text">Contacter</AppText>
              <ContactButton
                iconOnly
                ownerId={ownerId}
                relatedType={relatedType}
                relatedId={relatedId}
                relatedPath={path}
                relatedTitle={title}
                subtitle={subtitle}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      <Pressable
        accessibilityLabel={open ? 'Fermer le menu actions' : 'Ouvrir le menu actions'}
        onPress={() => setOpen((value) => !value)}
        style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, ...platformShadow('0 12px 28px rgba(8,112,95,0.35)') }}>
        {open ? <X size={24} color={colors.onPrimary} /> : <Plus size={24} color={colors.onPrimary} />}
      </Pressable>
    </View>
  );
}
