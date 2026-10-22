import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { toggleFavorite, type FavoriteType } from '@/store/favorites';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** CTA favori des fiches (FavoriteButton compte du web). */
export function FavoriteButton({
  relatedId,
  relatedType,
  title,
  path,
  subtitle,
  showLabel = true,
}: {
  relatedId: string;
  relatedType: FavoriteType;
  title: string;
  path: string;
  subtitle?: string;
  showLabel?: boolean;
}) {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const active = useAppSelector((state) => state.favorites.items.some((item) => item.id === relatedId && item.type === relatedType));

  function toggle() {
    if (!user?.id) {
      router.push('/login' as never);
      return;
    }
    dispatch(toggleFavorite({ userId: user.id, id: relatedId, type: relatedType, title, subtitle, path })).catch(() => undefined);
  }

  if (!showLabel) {
    return (
      <Pressable
        accessibilityLabel={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        onPress={toggle}
        style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <Heart size={18} color={active ? '#e11d48' : colors.text} fill={active ? '#e11d48' : 'transparent'} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      onPress={toggle}
      style={{
        minHeight: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        backgroundColor: active ? '#e11d48' : colors.surface,
        borderWidth: 1,
        borderColor: active ? '#e11d48' : colors.border,
      }}>
      <Heart size={16} color={active ? '#fff' : colors.text} fill={active ? '#fff' : 'transparent'} />
      <AppText className="font-bold" style={{ color: active ? '#fff' : colors.text }}>
        {active ? 'Favori enregistré' : 'Ajouter aux favoris'}
      </AppText>
    </Pressable>
  );
}

/** Pastille cœur du menu flottant, sans libellé. */
export function FavoriteIconButton(props: Omit<Parameters<typeof FavoriteButton>[0], 'showLabel'>) {
  return (
    <View>
      <FavoriteButton {...props} showLabel={false} />
    </View>
  );
}
