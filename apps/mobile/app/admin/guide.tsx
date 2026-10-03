import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { upsertStrippingUnknown } from '@/services/rowWrite';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type Article = { id: string; title?: string; summary?: string; status?: string; category?: string; language?: string };

const CATEGORIES = ['documents', 'student_life', 'money', 'safety', 'laws', 'getting_started'];

/** Articles d’aide internes : liste, publication, retrait (AdminHelpArticlesPage). */
export default function AdminGuideScreen() {
  const { colors, isDark } = useTheme();
  const role = useAppSelector((state) => state.auth.user?.role);
  const user = useAppSelector((state) => state.auth.user);
  const allowed = role === 'moderator' || role === 'admin' || role === 'superadmin';
  const [articles, setArticles] = useState<Article[]>([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('documents');

  async function reload() {
    if (!supabase) return;
    const { data } = await supabase.from('help_articles').select('*').order('created_at', { ascending: false }).limit(80);
    setArticles(fromRows(data || []) as Article[]);
  }

  useEffect(() => {
    if (allowed) void reload();
  }, [allowed]);

  async function publish() {
    if (!user || title.trim().length < 2) return;
    const id = `HELP-${Date.now().toString(36).toUpperCase()}`;
    try {
      await upsertStrippingUnknown('help_articles', {
        id,
        translation_group_id: id,
        category,
        language: 'fr',
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        status: 'published',
        author_id: user.id,
        author_name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setTitle('');
      setSummary('');
      setContent('');
      await reload();
    } catch (error) {
      showNotice('Guide', error instanceof Error ? error.message : 'Publication impossible.');
    }
  }

  async function remove(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('help_articles').delete().eq('id', id);
    if (error) showNotice('Guide', error.message);
    else setArticles((list) => list.filter((item) => item.id !== id));
  }

  if (!allowed) {
    return (
      <AppChrome pathname="/admin/guide">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Réservé à l’équipe.</AppText>
        </View>
      </AppChrome>
    );
  }

  const field = { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 };

  return (
    <AppChrome pathname="/admin/guide">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Guide interne</AppText>
        <TextInput value={title} onChangeText={setTitle} placeholder="Titre" placeholderTextColor={colors.textFaint} style={field} />
        <TextInput value={summary} onChangeText={setSummary} placeholder="Résumé" placeholderTextColor={colors.textFaint} style={field} />
        <TextInput value={content} onChangeText={setContent} placeholder="Contenu" placeholderTextColor={colors.textFaint} style={[field, { minHeight: 88 }]} multiline />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: category === item ? colors.accent : colors.surfaceMuted }}>
              <AppText className="text-xs font-bold" style={{ color: category === item ? (isDark ? '#020617' : '#fff') : colors.text }}>{item}</AppText>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={() => void publish()} style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Publier</AppText>
        </Pressable>
        {articles.map((item) => (
          <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 }}>
            <AppText className="font-bold text-app-text">{item.title}</AppText>
            <AppText className="text-xs text-app-text-muted">{item.category} · {item.language} · {item.status}</AppText>
            <Pressable onPress={() => void remove(item.id)}><AppText className="text-xs font-bold text-red-600">Supprimer</AppText></Pressable>
          </View>
        ))}
      </ScrollView>
    </AppChrome>
  );
}
