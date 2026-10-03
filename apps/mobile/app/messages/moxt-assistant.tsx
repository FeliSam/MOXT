import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Headphones, Paperclip, Send, Trash2, Zap } from 'lucide-react-native';

import { HeaderActionButton, HeaderChip } from '@/components/chrome/HeaderChrome';
import { HEADER, headerPaddingTop } from '@/components/chrome/headerTokens';
import { MoxtiBadge } from '@/components/messages/MoxtiBadge';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { askMoxti } from '@moxt/shared/services/assistantService.js';

import { pickImageOrPdf } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { brand, withAlphaColor } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

/** ASSISTANT_SUGGESTION_KEYS du web (même ordre). */
const SUGGESTION_KEYS = [
  'messages.assistant.suggestions.transfer',
  'messages.assistant.suggestions.p2p',
  'messages.assistant.suggestions.publishListing',
  'messages.assistant.suggestions.shipping',
  'messages.assistant.suggestions.parcel',
  'messages.assistant.suggestions.verify',
  'messages.assistant.suggestions.dispute',
  'messages.assistant.suggestions.contribute',
  'messages.assistant.suggestions.admin',
  'messages.assistant.suggestions.business',
];

type AssistantEntry = { id: string; role: 'user' | 'assistant'; text: string };

const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.09)';
const CHIP_SHADOW = '0 8px 24px rgba(15,23,42,0.08)';

/**
 * Conversation Moxti (AiAssistantPanel du web, ?conversation=moxt-assistant).
 * Écran local (historique AsyncStorage) qui appelle la même fonction Edge ai-assistant que le web.
 */
export default function MoxtAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [history, setHistory] = useState<AssistantEntry[]>([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const storageKey = `moxt-ai-assistant-${userId || 'guest'}`;

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed as AssistantEntry[]);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [storageKey]);

  async function ask(text: string) {
    const questionText = text.trim();
    if (!questionText || sending) return;
    const userEntry: AssistantEntry = { id: `u-${Date.now()}`, role: 'user', text: questionText };
    const next = [...history, userEntry];
    setHistory(next);
    setQuestion('');
    setSending(true);
    try {
      const answer = await askMoxti(supabase, {
        question: questionText,
        history: next,
        language: language || 'fr',
      });
      const withReply = [...next, { id: `a-${Date.now()}`, role: 'assistant' as const, text: answer.text }];
      setHistory(withReply.slice(-30));
      AsyncStorage.setItem(storageKey, JSON.stringify(withReply.slice(-30))).catch(() => undefined);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "Moxti n'a pas pu répondre. Réessayez.";
      const withReply = [...next, { id: `a-${Date.now()}`, role: 'assistant' as const, text: fallback }];
      setHistory(withReply.slice(-30));
    } finally {
      setSending(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    AsyncStorage.removeItem(storageKey).catch(() => undefined);
  }

  const suggestions = SUGGESTION_KEYS.map((key) => t(key));
  const canSend = Boolean(question.trim());

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: headerPaddingTop(insets.top), paddingHorizontal: HEADER.padX, flexDirection: 'row', alignItems: 'center', gap: HEADER.gap, zIndex: 10 }}>
        <HeaderChip>
          <HeaderActionButton transparent size={HEADER.avatar} accessibilityLabel={t('messages.assistant.backAria')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages' as never))}>
            <ArrowLeft size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />
          </HeaderActionButton>
          <View style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: 999 }}>
            <MoxtiBadge size={HEADER.avatar} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText numberOfLines={1} className="text-sm font-black text-app-text" style={{ lineHeight: 14 }}>
              {t('messages.assistant.name')}
            </AppText>
            <AppText numberOfLines={1} className="text-[11px] text-app-text-muted" style={{ marginTop: 2, lineHeight: 13 }}>
              {t('messages.assistant.subtitle')}
            </AppText>
          </View>
        </HeaderChip>
        <View style={{ flexDirection: 'row', gap: HEADER.gap }}>
          <HeaderActionButton
            accessibilityLabel={t('messages.assistant.contactAdminAria')}
            onPress={() => router.push('/support/create' as never)}>
            <Headphones size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />
          </HeaderActionButton>
          <HeaderActionButton accessibilityLabel={t('messages.assistant.clearHistoryAria')} onPress={clearHistory}>
            <Trash2 size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />
          </HeaderActionButton>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 16 }}>
        {/* Message d'accueil (AssistantMessage) */}
        <View style={{ flexDirection: 'row', gap: 8, maxWidth: '100%' }}>
          <View style={{ alignSelf: 'flex-end' }}>
            <MoxtiBadge size={32} radius={12} />
          </View>
          <View className="bg-app-surface" style={{ flex: 1, minWidth: 0, borderRadius: 16, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12, boxShadow: CARD_SHADOW }}>
            <AppText className="text-sm leading-6 text-app-text">{t('messages.assistant.greeting')}</AppText>
          </View>
        </View>

        {!history.length ? (
          <View accessibilityRole="list" style={{ marginLeft: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                onPress={() => ask(suggestion)}
                className="border border-app-border bg-app-surface"
                style={{ minHeight: 56, flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 16, paddingLeft: 12, paddingRight: 6, paddingVertical: 10, boxShadow: CHIP_SHADOW }}>
                <Zap size={14} color={brand[500]} strokeWidth={2} style={{ marginTop: 5 }} />
                {/* Rendu web observé : 16 px, graisse moyenne (la règle mobile du web agrandit ces puces). */}
                <AppText className="text-xs font-bold text-app-text" style={{ flex: 1, minWidth: 0, lineHeight: 16 }}>
                  {suggestion}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : (
          history.map((entry) =>
            entry.role === 'assistant' ? (
              <View key={entry.id} style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ alignSelf: 'flex-end' }}>
                  <MoxtiBadge size={32} radius={12} />
                </View>
                <View className="bg-app-surface" style={{ flex: 1, minWidth: 0, borderRadius: 16, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12, boxShadow: CARD_SHADOW }}>
                  <AppText className="text-sm leading-6 text-app-text">{entry.text}</AppText>
                </View>
              </View>
            ) : (
              <View key={entry.id} style={{ alignSelf: 'flex-end', maxWidth: '88%', borderRadius: 16, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: brand[700] }}>
                <AppText className="text-sm leading-6 text-white">{entry.text}</AppText>
              </View>
            ),
          )
        )}
      </ScrollView>

      {/* Dock de saisie (message-composer-dock) : fond surface-muted, formulaire arrondi. */}
      <View className="bg-app-surface-muted" style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: Math.max(12, insets.bottom) }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: withAlphaColor(colors.border, 0.4),
            backgroundColor: colors.surface,
            padding: 8,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('messages.assistant.addDocAria')}
            onPress={() => {
              void pickImageOrPdf()
                .then((file) => {
                  if (!file) return;
                  setQuestion((current) => `${current}${current ? ' ' : ''}[${file.name}]`.trim());
                })
                .catch((error) => showNotice(t('messages.assistant.name'), error instanceof Error ? error.message : 'Fichier impossible.'));
            }}
            style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <Paperclip size={18} color={colors.accent} strokeWidth={2} />
          </Pressable>
          <TextInput
            multiline
            value={question}
            onChangeText={setQuestion}
            placeholder={t('messages.assistant.placeholder')}
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, minHeight: 40, maxHeight: 128, paddingHorizontal: 8, paddingVertical: 8, fontSize: 16, color: colors.text }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('messages.assistant.sendAria')}
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => ask(question)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: brand[700],
              opacity: canSend ? 1 : 0.4,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
            }}>
            <Send size={18} color="#ffffff" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
