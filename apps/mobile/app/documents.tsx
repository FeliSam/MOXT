import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { buildPersonalDocument, buildPersonalDocumentPath, savePersonalDocument } from '@moxt/shared/services/accountWrites.js';
import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { UploadProgressBar } from '@/components/publish/publishKit';
import { AppText } from '@/components/ui/AppText';
import { pickImageOrPdf, uploadLikeWeb } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const CATEGORIES = [
  ['identity', 'Identité'],
  ['address', 'Adresse'],
  ['income', 'Revenus'],
  ['other', 'Autre'],
] as const;

type Doc = { id: string; name?: string; category?: string; status?: string; size?: number; deletedAt?: string };

/** Documents personnels : envoi, liste, retrait (DocumentsPage). */
export default function DocumentsScreen() {
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number][0]>('identity');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [progress, setProgress] = useState<number | null>(null);

  async function reload() {
    if (!user?.id || !supabase) return;
    const { data } = await supabase.from('personal_documents').select('*').eq('user_id', user.id).limit(50);
    setDocs(fromRows(data || []) as Doc[]);
  }

  useEffect(() => {
    void reload();
  }, [user?.id]);

  async function upload() {
    if (!user || !supabase) return;
    const file = await pickImageOrPdf();
    if (!file) return;
    setProgress(0.4);
    try {
      const path = buildPersonalDocumentPath(user.id, category, file.name);
      await uploadLikeWeb('documents', path, file, 'private');
      setProgress(1);
      const doc = buildPersonalDocument({ userId: user.id, category, name: file.name, size: file.size, type: file.type, storagePath: path });
      await savePersonalDocument(supabase, doc);
      await reload();
    } catch (error) {
      showNotice('Documents', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setProgress(null);
    }
  }

  async function remove(doc: Doc) {
    if (!supabase) return;
    const { error } = await supabase.from('personal_documents').update({ deleted_at: new Date().toISOString(), deleted_by_user: true }).eq('id', doc.id);
    if (error) showNotice('Documents', error.message);
    else setDocs((list) => list.map((item) => (item.id === doc.id ? { ...item, deletedAt: new Date().toISOString() } : item)));
  }

  const visible = docs.filter((doc) => !doc.deletedAt);

  return (
    <AppChrome pathname="/documents">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Compte</AppText>
        <AppText className="text-2xl font-black text-app-text">Mes documents</AppText>
        <AppText className="text-sm text-app-text-muted">PDF ou image. Chaque fichier part en revue.</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(([id, label]) => (
            <Pressable key={id} onPress={() => setCategory(id)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: category === id ? colors.accent : colors.surfaceMuted }}>
              <AppText className="text-xs font-bold" style={{ color: category === id ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => void upload()} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Ajouter un document</AppText>
        </Pressable>
        <UploadProgressBar progress={progress} />
        {visible.length === 0 ? <AppText className="text-sm text-app-text-muted">Aucun document.</AppText> : null}
        {visible.map((doc) => (
          <View key={doc.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 6 }}>
            <AppText className="font-bold text-app-text">{doc.name || 'Document'}</AppText>
            <AppText className="text-xs text-app-text-muted">{doc.category} · {doc.status || 'pending_review'}{doc.size ? ` · ${doc.size} o` : ''}</AppText>
            <Pressable onPress={() => void remove(doc)}>
              <AppText className="text-sm font-bold text-red-600">Retirer</AppText>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </AppChrome>
  );
}
