import { useState } from 'react';
import { Modal, Pressable, Share, View } from 'react-native';
import { Image } from 'expo-image';
import { QrCode, Share2, X } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import { useShadows, useTheme, useThemeCssVars } from '@/theme/ThemeContext';

/** Site public (CANONICAL_SITE_URL du web). */
export const SITE_URL = 'https://moxtapp.ru';

/** Même service que le web (utils/qrCode.js). */
export function makeQrCodeUrl(value: string, size = 240) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&ecc=M&color=000000&bgcolor=ffffff&data=${encodeURIComponent(value || SITE_URL)}`;
}

export function userProfileShareUrl(userId: string) {
  return `${SITE_URL}/users/${encodeURIComponent(userId)}/publications`;
}

export function businessShareUrl(businessId: string) {
  return `${SITE_URL}/businesses/${encodeURIComponent(businessId)}`;
}

/**
 * Bouton QR posé sur la bannière (ProfileQrShareButton appearance="cover") :
 * carré 44 px blanc translucide, ouvre la fenêtre QR du profil ou de l'entreprise.
 */
export function ProfileQrButton({
  type,
  shareUrl,
  title,
  subtitle,
  verified = false,
  city,
  accent,
}: {
  type: 'user' | 'business';
  shareUrl: string;
  title: string;
  subtitle?: string;
  verified?: boolean;
  city?: string;
  accent: string;
}) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const shadows = useShadows();
  const cssVars = useThemeCssVars();
  const [open, setOpen] = useState(false);
  const isBusiness = type === 'business';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isBusiness ? t('share.showBusinessQr') : t('share.showProfileQr')}
        onPress={() => setOpen(true)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
          backgroundColor: isDark ? 'rgba(2,6,23,0.75)' : 'rgba(255,255,255,0.95)',
          boxShadow: '0 6px 18px -6px rgba(0,0,0,0.45)',
        }}>
        <QrCode size={24} color={isDark ? '#ffffff' : '#0f172a'} strokeWidth={1.8} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={[{ flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', alignItems: 'center', justifyContent: 'center', padding: 16 }, cssVars]}>
          <Pressable
            onPress={() => undefined}
            className="w-full max-w-[26rem] rounded-3xl border border-app-border bg-app-surface p-5"
            style={shadows.float}>
            <View className="flex-row items-center justify-between">
              <AppText className="text-base font-black text-app-text">
                {isBusiness ? t('share.qrBusiness') : t('share.qrProfile')}
              </AppText>
              <Pressable accessibilityLabel="Fermer" onPress={() => setOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-app-surface-muted">
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View className="mt-4 items-center gap-1">
              <View className="flex-row items-center gap-1.5">
                <AppText className="text-lg font-black text-app-text">{title}</AppText>
                {verified ? <VerifiedIcon size={16} /> : null}
              </View>
              {subtitle || city ? (
                <AppText className="text-sm text-app-text-muted">{[subtitle, city].filter(Boolean).join(' · ')}</AppText>
              ) : null}
            </View>
            <View className="mt-4 items-center">
              <View className="rounded-2xl bg-white p-3" style={{ borderWidth: 2, borderColor: accent }}>
                <Image source={{ uri: makeQrCodeUrl(shareUrl, 240) }} style={{ width: 220, height: 220 }} contentFit="contain" accessibilityLabel="QR code" />
              </View>
              <AppText numberOfLines={1} className="mt-3 text-xs text-app-text-faint">{shareUrl}</AppText>
            </View>
            <Pressable
              onPress={() => Share.share({ message: `${title} — ${shareUrl}`, url: shareUrl }).catch(() => undefined)}
              className="mt-4 min-h-11 flex-row items-center justify-center gap-2 rounded-xl"
              style={{ backgroundColor: accent }}>
              <Share2 size={16} color="#ffffff" />
              <AppText className="text-sm font-semibold text-white">{t('share.share')}</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
