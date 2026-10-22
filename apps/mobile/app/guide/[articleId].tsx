import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/theme/ThemeContext';

/** Article du guide (HelpArticleDetailPage). */
export default function GuideArticleScreen() {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const { colors } = useTheme();
  const [article, setArticle] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!articleId || !supabase) return;
    void supabase
      .from('help_articles')
      .select('*')
      .eq('id', articleId)
      .maybeSingle()
      .then(({ data }) => setArticle(data ? (fromRow(data) as Record<string, any>) : null));
  }, [articleId]);

  return (
    <AppChrome pathname="/guide">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">{article?.title || 'Article'}</AppText>
        {article?.summary ? <AppText className="text-sm text-app-text-muted">{String(article.summary)}</AppText> : null}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          <LinkifiedText text={String(article?.content || 'Chargement…')} />
        </View>
        {article?.verifiedAt ? <AppText className="text-xs font-bold text-app-accent">Vérifié</AppText> : null}
        {article?.sourceUrl ? (
          <Pressable onPress={() => Linking.openURL(String(article.sourceUrl)).catch(() => undefined)}>
            <AppText className="font-bold text-app-accent">{String(article.sourceName || 'Source')}</AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </AppChrome>
  );
}
