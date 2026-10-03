import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/theme/ThemeContext';

const CATEGORIES = [
  ['all', 'Tout'],
  ['documents', 'Documents'],
  ['student_life', 'Vie étudiante'],
  ['money', 'Argent'],
  ['safety', 'Sécurité'],
  ['laws', 'Lois'],
] as const;

const PRODUCT = new Set(['getting_started', 'transfers', 'marketplace', 'parcels', 'messages', 'account', 'p2p', 'exchangers', 'businesses', 'professional', 'jobs', 'events', 'news', 'verification', 'security', 'disputes', 'subscriptions']);

type Article = { id: string; title?: string; summary?: string; category?: string; status?: string; language?: string; pinned?: boolean };

/** Guide pratique (HelpGuidePage), hors sessions produit. */
export default function GuideScreen() {
  const { colors, isDark } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number][0]>('all');

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from('help_articles')
      .select('*')
      .eq('status', 'published')
      .limit(200)
      .then(({ data }) => setArticles(fromRows(data || []) as Article[]));
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr');
    return articles
      .filter((item) => item.category && !PRODUCT.has(item.category))
      .filter((item) => !item.language || item.language === 'fr')
      .filter((item) => category === 'all' || item.category === category)
      .filter((item) => !needle || `${item.title} ${item.summary}`.toLocaleLowerCase('fr').includes(needle));
  }, [articles, category, query]);

  return (
    <AppChrome pathname="/guide">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Guide</AppText>
        <AppText className="text-sm text-app-text-muted">{visible.length} article(s) publié(s).</AppText>
        <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un article" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map(([id, label]) => (
            <Pressable key={id} onPress={() => setCategory(id)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: category === id ? colors.accent : colors.surfaceMuted }}>
              <AppText className="text-xs font-bold" style={{ color: category === id ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
            </Pressable>
          ))}
        </ScrollView>
        {visible.length === 0 ? <AppText className="text-sm text-app-text-muted">Aucun article pour ce filtre.</AppText> : null}
        {visible.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/guide/${item.id}` as never)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 4 }}>
            <AppText className="text-xs font-black uppercase text-app-accent">{item.category}</AppText>
            <AppText className="font-black text-app-text">{item.title}</AppText>
            {item.summary ? <AppText className="text-sm text-app-text-muted">{item.summary}</AppText> : null}
          </Pressable>
        ))}
      </ScrollView>
    </AppChrome>
  );
}
