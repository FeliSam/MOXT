import { useState } from 'react';
import { Image, Modal, Pressable, TextInput, View } from 'react-native';
import { Image as ImageIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { pickLibraryFile, type UploadFile } from '@/services/mediaUpload';
import { submitContentReport, uploadReportEvidence, type ReportTarget } from '@/services/contentReports';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

/** Dialogue « Signaler » du web : motif obligatoire + capture optionnelle. */
export function ReportSheet({
  open,
  title,
  target,
  targetId,
  userId,
  userName,
  onClose,
}: {
  open: boolean;
  title: string;
  target: ReportTarget;
  targetId: string;
  userId?: string;
  userName?: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<UploadFile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function reset() {
    setReason('');
    setFile(null);
    setError('');
    setBusy(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function pick() {
    try {
      const next = await pickLibraryFile('images');
      if (!next) return;
      if (next.size && next.size > 5 * 1024 * 1024) {
        setError('L’image ne doit pas dépasser 5 Mo.');
        return;
      }
      setError('');
      setFile(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image impossible.');
    }
  }

  async function submit() {
    const trimmed = reason.trim();
    if (trimmed.length < 8) {
      setError('Expliquez la raison (au moins 8 caractères).');
      return;
    }
    if (!userId) {
      setError('Connectez-vous pour signaler.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const evidenceUrl = file ? await uploadReportEvidence(userId, file) : null;
      await submitContentReport({
        target,
        targetId,
        reporterId: userId,
        reporterName: userName,
        reason: trimmed,
        evidenceUrl,
      });
      reset();
      onClose();
      showNotice('Signalement envoyé', 'Notre équipe va examiner ce contenu.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’envoyer le signalement.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={close} />
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText className="text-lg font-black text-app-text">{title}</AppText>
          <Pressable accessibilityLabel="Fermer" onPress={close} hitSlop={8}>
            <X size={20} color={colors.textMuted} />
          </Pressable>
        </View>
        <AppText className="text-sm font-bold text-app-text">Raison du signalement</AppText>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Décrivez le problème (contenu trompeur, spam, harcèlement…)"
          placeholderTextColor={colors.textFaint}
          multiline
          style={{ minHeight: 110, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, padding: 12, color: colors.text, textAlignVertical: 'top' }}
        />
        <AppText className="text-sm font-bold text-app-text">Capture d’écran (optionnel)</AppText>
        <Pressable onPress={() => void pick()} style={{ borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surfaceMuted, minHeight: 72, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <AppText className="font-semibold text-app-text-muted">{file ? file.name : 'Ajouter une image'}</AppText>
        </Pressable>
        {file ? (
          <Image source={{ uri: file.uri }} style={{ height: 140, borderRadius: 16 }} resizeMode="contain" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ImageIcon size={14} color={colors.textFaint} />
            <AppText className="text-xs text-app-text-muted">Une capture aide l’équipe à traiter plus vite.</AppText>
          </View>
        )}
        {error ? <AppText className="text-sm font-semibold" style={{ color: colors.danger }}>{error}</AppText> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onPress={close} disabled={busy}>Annuler</Button>
          <Button variant="primary" loading={busy} onPress={() => void submit()}>Envoyer le signalement</Button>
        </View>
      </View>
    </Modal>
  );
}
