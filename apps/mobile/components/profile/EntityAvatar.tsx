import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchPublicProfile } from '@moxt/shared/services/profileService.js';

import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { avatarDisplayUrl } from '@/utils/avatarDisplayUrl';
import { useTheme } from '@/theme/ThemeContext';

import { profileInitials } from './PublicProfileHero';

export type MemberProfile = { name: string; avatarUrl: string | null; verified: boolean };

/** Profils publics des membres suivis (useProfileAvatarMap du web). */
export function useMemberProfiles(ids: string[]) {
  const [map, setMap] = useState<Record<string, MemberProfile>>({});
  const key = ids.slice().sort().join(',');
  useEffect(() => {
    if (!supabase || !key) return undefined;
    let cancelled = false;
    Promise.all(
      key.split(',').map(async (id) => {
        const profile = await fetchPublicProfile(supabase, id).catch(() => null);
        return [id, profile] as const;
      }),
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, MemberProfile> = {};
      for (const [id, profile] of rows) {
        if (!profile) continue;
        next[id] = {
          name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          avatarUrl: profile.avatarUrl,
          verified: Boolean(profile.verified),
        };
      }
      setMap(next);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return map;
}

export function EntityAvatar({
  name,
  src,
  size,
  shape,
  ring,
  from = '#8a3f75',
}: {
  name: string;
  src?: string | null;
  size: number;
  shape: 'user' | 'business';
  ring?: string;
  /** Début du dégradé (brand-600 de la portée : prune en perso, vert sinon). */
  from?: string;
}) {
  const { colors } = useTheme();
  const radius = shape === 'business' ? 16 : size / 2;
  const uri = src ? avatarDisplayUrl(src, size * 2) : null;
  const style = { width: size, height: size, borderRadius: radius, ...(ring ? { boxShadow: `0 0 0 2px ${ring}` } : null) };
  if (uri) return <Image source={{ uri }} style={style} contentFit="cover" />;
  return (
    <LinearGradient colors={[from, colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
      <AppText className="font-black text-white" style={{ fontSize: size > 40 ? 12 : 11 }}>
        {profileInitials(name)}
      </AppText>
    </LinearGradient>
  );
}
