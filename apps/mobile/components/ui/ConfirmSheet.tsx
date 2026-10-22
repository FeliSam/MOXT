import { ActivityIndicator, Modal, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { prune } from '@/components/profile/identity';
import { brand } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

export type ConfirmRequest = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  subject?: string;
  subjectLabel?: string;
  tone?: 'danger' | 'accent';
  accent?: 'personal' | 'business';
};

/** Modale de confirmation (ConfirmDialog du web) : sujet, texte, Annuler / action. */
export function ConfirmSheet({
  request,
  busy = false,
  onCancel,
  onConfirm,
}: {
  request: ConfirmRequest | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { colors, isDark } = useTheme();
  if (!request) return null;
  const danger = request.tone === 'danger';
  const accent = request.accent === 'business' ? (isDark ? brand[400] : brand[700]) : isDark ? prune[400] : prune[700];
  const confirmBg = danger ? (isDark ? '#7f1d1d' : '#dc2626') : accent;
  const confirmFg = danger || !isDark ? '#ffffff' : '#020617';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable
        accessibilityLabel={request.cancelLabel || 'Annuler'}
        onPress={busy ? undefined : onCancel}
        style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: isDark ? 'rgba(0,0,0,0.62)' : 'rgba(2,6,23,0.55)' }}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="bg-app-surface"
          style={{ borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: colors.border }}>
          <AppText className="text-lg font-black text-app-text">{request.title}</AppText>
          {request.description ? <AppText className="text-sm leading-5 text-app-text-muted">{request.description}</AppText> : null}
          {request.subject ? (
            <View className="rounded-xl bg-app-surface-muted" style={{ padding: 12, gap: 4 }}>
              <AppText className="text-[11px] font-bold uppercase text-app-text-faint">{request.subjectLabel || 'Publication concernée'}</AppText>
              <AppText className="text-sm font-bold text-app-text">{request.subject}</AppText>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onCancel}
              className="border border-app-border-md bg-app-surface"
              style={{ flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <AppText className={`${WEB_BUTTON_TEXT} text-app-text`}>{request.cancelLabel || 'Annuler'}</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onConfirm}
              style={{ flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: confirmBg, opacity: busy ? 0.7 : 1 }}>
              {busy ? <ActivityIndicator color={confirmFg} /> : <AppText className={WEB_BUTTON_TEXT} style={{ color: confirmFg }}>{request.confirmLabel}</AppText>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
