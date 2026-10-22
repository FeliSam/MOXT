import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/ui/AppText';
import { avatarDisplayUrl } from '@/utils/avatarDisplayUrl';
import { brand, withAlphaColor } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

import { HEADER } from './headerTokens';

/** Pastille titre / marque (HEADER_BRAND_CHIP_CLASS) : h 44px, rounded-full, surface/85 + border. */
export function HeaderChip({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          height: HEADER.height,
          minWidth: 0,
          flexShrink: 1,
          maxWidth: '52%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: withAlphaColor(colors.border, 0.75),
          backgroundColor: withAlphaColor(colors.surface, 0.88),
          paddingLeft: 5,
          paddingRight: 12,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Pastille rouge de compteur (CountBounce, maxDisplay 9). */
export function HeaderCountBadge({ value }: { value?: number | null }) {
  const { colors } = useTheme();
  if (!value || value <= 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: -3,
        top: -3,
        zIndex: 10,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 999,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.surface,
      }}>
      <AppText style={{ fontSize: 9, lineHeight: 11, fontWeight: '700', color: '#ffffff' }}>
        {value > 9 ? '9+' : String(value)}
      </AppText>
    </View>
  );
}

/** Bouton rond d'action (.header-action-btn mobile) : 44px, surface/85 + border, centré avec badge optionnel. */
export function HeaderActionButton({
  children,
  onPress,
  accessibilityLabel,
  transparent = false,
  size = HEADER.height,
  badge,
  testID,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  testID?: string;
  transparent?: boolean;
  size?: number;
  badge?: number | null;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: transparent ? 0 : 1,
        borderColor: transparent ? 'transparent' : withAlphaColor(colors.border, 0.75),
        backgroundColor: transparent
          ? pressed
            ? withAlphaColor(colors.surfaceMuted, 0.6)
            : 'transparent'
          : withAlphaColor(colors.surface, pressed ? 0.95 : 0.88),
      })}>
      {children}
      {badge && badge > 0 ? <HeaderCountBadge value={badge} /> : null}
    </Pressable>
  );
}

type AvatarUser = {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  verified?: boolean | null;
} | null | undefined;

/** Avatar : photo / portrait / Lorelei (PNG) sinon dégradé brand-700 → teal + initiales (Header.jsx). */
export function UserAvatar({ user, size = HEADER.avatar }: { user: AvatarUser; size?: number }) {
  const { colors } = useTheme();
  const uri = avatarDisplayUrl(user?.avatarUrl, Math.max(size * 2, 80));
  const borderStyle: ViewStyle | null = user?.verified
    ? { borderWidth: 2, borderColor: colors.teal }
    : null;

  if (uri) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, borderStyle]}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          accessibilityLabel={`${user?.firstName || 'Utilisateur'} ${user?.lastName || ''}`.trim()}
        />
      </View>
    );
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'M';
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, borderStyle]}>
      <LinearGradient
        colors={[brand[700], colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontSize: 12, lineHeight: 15, fontWeight: '900', color: '#ffffff' }}>{initials}</AppText>
      </LinearGradient>
    </View>
  );
}

