import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/ui/AppText';
import { avatarDisplayUrl } from '@/utils/avatarDisplayUrl';
import { brand, withAlphaColor } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

import { HEADER } from './headerTokens';

/** Pastille titre / marque (HEADER_BRAND_CHIP_CLASS) : h 3.004rem, rounded-full, surface/65. */
export function HeaderChip({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          height: HEADER.height,
          minWidth: 0,
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderRadius: 999,
          backgroundColor: withAlphaColor(colors.surface, 0.65),
          paddingLeft: 6,
          paddingRight: 10,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Bouton rond d'action (.header-action-btn mobile) : 3.004rem, surface/65, sans bordure. */
export function HeaderActionButton({
  children,
  onPress,
  accessibilityLabel,
  transparent = false,
  size = HEADER.height,
  testID,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  testID?: string;
  transparent?: boolean;
  size?: number;
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
        backgroundColor: transparent
          ? pressed
            ? withAlphaColor(colors.surfaceMuted, 0.6)
            : 'transparent'
          : withAlphaColor(colors.surface, pressed ? 0.8 : 0.65),
      })}>
      {children}
    </Pressable>
  );
}

/** Pastille rouge de compteur (CountBounce, maxDisplay 9). */
export function HeaderCountBadge({ value }: { value?: number | null }) {
  if (!value) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1,
        minWidth: 16.8,
        paddingHorizontal: 4,
        borderRadius: 999,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
      }}>
      <AppText style={{ fontSize: 9, lineHeight: 13.5, fontWeight: '700', color: '#ffffff' }}>
        {value > 9 ? '9+' : String(value)}
      </AppText>
    </View>
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
  const ring: ViewStyle | null = user?.verified
    ? { boxShadow: `0 0 0 2px ${colors.surface}, 0 0 0 4px ${brand[500]}` }
    : null;
  const shadow: ViewStyle = { boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' };

  if (uri) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2 }, shadow, ring]}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          accessibilityLabel={`${user?.firstName || 'Utilisateur'} ${user?.lastName || ''}`.trim()}
        />
      </View>
    );
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2 }, shadow, ring]}>
      <LinearGradient
        colors={[brand[700], colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontSize: 12, lineHeight: 16, fontWeight: '900', color: '#ffffff' }}>{initials}</AppText>
      </LinearGradient>
    </View>
  );
}
