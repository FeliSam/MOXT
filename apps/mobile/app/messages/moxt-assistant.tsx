import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Headphones,
  Package,
  Paperclip,
  Repeat,
  Send,
  ShoppingBag,
  Trash2,
  Zap,
} from 'lucide-react-native';

import { HeaderActionButton, HeaderChip } from '@/components/chrome/HeaderChrome';
import { HEADER, headerPaddingTop } from '@/components/chrome/headerTokens';
import { MoxtiBadge } from '@/components/messages/MoxtiBadge';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { askMoxti } from '@moxt/shared/services/assistantService.js';
import {
  processSmartAssistantQuery,
  type AssistantResultCard,
} from '@/services/assistantIntelligence';
import { pickImageOrPdf } from '@/services/mediaUpload';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { brand, withAlphaColor } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const SUGGESTIONS = [
  'Lister les articles qui ont le même nom',
  'Trouve mon dernier transfert effectué',
  'Liste les offres de jobs disponibles',
  'Chercher les colis et voyages',
  'Comment publier une annonce ?',
  'Comment fonctionne la vérification ?',
];

type AssistantEntry = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  results?: AssistantResultCard[];
};

const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.09)';
const CHIP_SHADOW = '0 8px 24px rgba(15,23,42,0.08)';

export default function MoxtAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { colors, isDark } = useTheme();

  const userId = useAppSelector((state) => state.auth.user?.id);
  const listings = useAppSelector((state) => state.marketplace.items);
  const transfers = useAppSelector((state) => state.transfers.items);
  const parcels = useAppSelector((state) => state.parcels.items);

  const [history, setHistory] = useState<AssistantEntry[]>([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<any>(null);
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
      // 1. Moteur intelligent d'analyse locale & données plateforme
      const smartResponse = await processSmartAssistantQuery(
        questionText,
        {
          listings,
          transfers,
          parcels,
          userId,
        },
        language || 'fr'
      );

      let replyText = smartResponse.text;
      let replyResults = smartResponse.results;

      // 2. Si aucune intention directe n'a produit de résultats, appeler l'IA Edge distante avec le contexte enrichi
      if (!replyResults.length && !questionText.toLowerCase().includes('meme nom')) {
        try {
          const remoteAnswer = await askMoxti(supabase, {
            question: questionText,
            history: next,
            language: language || 'fr',
            context: {
              toolsUsed: ['search_content', 'list_my_transfers'],
              searchHits: listings.slice(0, 5).map((l) => ({ id: l.id, type: 'listing', title: l.title, path: `/listing/${l.id}` })),
              transfers: transfers.slice(0, 5).map((tr) => ({ id: tr.id, amount: tr.amountSent, status: tr.status })),
            },
          });
          if (remoteAnswer?.text) {
            replyText = remoteAnswer.text;
          }
        } catch {
          // Utilise le fallback local de smartResponse
        }
      }

      const assistantEntry: AssistantEntry = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        results: replyResults,
      };

      const withReply = [...next, assistantEntry];
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

  const canSend = Boolean(question.trim()) && !sending;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header Island */}
      <View
        style={{
          paddingTop: headerPaddingTop(insets.top),
          paddingHorizontal: HEADER.padX,
          flexDirection: 'row',
          alignItems: 'center',
          gap: HEADER.gap,
          zIndex: 10,
        }}
      >
        <HeaderChip>
          <HeaderActionButton
            transparent
            size={HEADER.avatar}
            accessibilityLabel={t('messages.assistant.backAria') || 'Retour'}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages' as never))}
          >
            <ArrowLeft
              size={HEADER.icon}
              color={colors.text}
              strokeWidth={HEADER.iconStroke}
              opacity={HEADER.iconOpacity}
            />
          </HeaderActionButton>
          <View style={{ borderRadius: 999 }}>
            <MoxtiBadge size={HEADER.avatar} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText numberOfLines={1} className="text-sm font-black text-app-text" style={{ lineHeight: 14 }}>
              {t('messages.assistant.name') || 'Moxti'}
            </AppText>
            <AppText
              numberOfLines={1}
              className="text-[11px] text-app-text-muted"
              style={{ marginTop: 2, lineHeight: 13 }}
            >
              Assistant IA & Recherche intelligente
            </AppText>
          </View>
        </HeaderChip>

        <View style={{ flexDirection: 'row', gap: HEADER.gap }}>
          <HeaderActionButton
            accessibilityLabel="Contacter le support"
            onPress={() => router.push('/support' as never)}
          >
            <Headphones size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />
          </HeaderActionButton>
          <HeaderActionButton accessibilityLabel="Effacer l'historique" onPress={clearHistory}>
            <Trash2 size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />
          </HeaderActionButton>
        </View>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 16 }}
      >
        {/* Welcome bubble */}
        <View style={{ flexDirection: 'row', gap: 8, maxWidth: '100%' }}>
          <View style={{ alignSelf: 'flex-end' }}>
            <MoxtiBadge size={32} radius={12} />
          </View>
          <View
            className="bg-app-surface"
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 16,
              borderBottomLeftRadius: 6,
              paddingHorizontal: 16,
              paddingVertical: 12,
              boxShadow: CARD_SHADOW,
            }}
          >
            <AppText className="text-sm leading-6 text-app-text">
              Bonjour ! Je suis Moxti, votre assistant intelligent. Je peux chercher directement dans les annonces (regrouper les articles de même nom), vérifier l’état de vos transferts, lister les jobs et les colis. Posez-moi votre question !
            </AppText>
          </View>
        </View>

        {/* Suggestion Chips */}
        {!history.length ? (
          <View accessibilityRole="list" style={{ marginLeft: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                onPress={() => ask(suggestion)}
                className="border border-app-border bg-app-surface"
                style={{
                  minHeight: 52,
                  flexBasis: '47%',
                  flexGrow: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  boxShadow: CHIP_SHADOW,
                }}
              >
                <Zap size={14} color="#f59e0b" strokeWidth={2} />
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
                <View
                  className="bg-app-surface"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: 16,
                    borderBottomLeftRadius: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    boxShadow: CARD_SHADOW,
                    gap: 10,
                  }}
                >
                  <AppText className="text-sm leading-6 text-app-text">{entry.text}</AppText>

                  {/* Render interactive search result cards if present */}
                  {entry.results && entry.results.length > 0 && (
                    <View style={{ gap: 8, marginTop: 4 }}>
                      {entry.results.map((res) => {
                        const IconComp =
                          res.type === 'listing'
                            ? ShoppingBag
                            : res.type === 'transfer'
                            ? Repeat
                            : res.type === 'job'
                            ? Briefcase
                            : Package;

                        return (
                          <Pressable
                            key={`${res.type}-${res.id}`}
                            onPress={() => router.push(res.path as never)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRadius: 12,
                              padding: 10,
                              backgroundColor: isDark ? '#27272a' : '#f8fafc',
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <View
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  backgroundColor: `${res.badgeColor || '#0d9488'}18`,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <IconComp size={16} color={res.badgeColor || '#0d9488'} />
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <AppText numberOfLines={1} className="text-xs font-black text-app-text">
                                  {res.title}
                                </AppText>
                                <AppText numberOfLines={1} className="text-[11px] text-app-text-muted mt-0.5">
                                  {res.subtitle}
                                </AppText>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                              {res.badge ? (
                                <View
                                  style={{
                                    borderRadius: 6,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    backgroundColor: `${res.badgeColor || '#0d9488'}20`,
                                  }}
                                >
                                  <AppText
                                    className="text-[9px] font-black"
                                    style={{ color: res.badgeColor || '#0d9488' }}
                                  >
                                    {res.badge}
                                  </AppText>
                                </View>
                              ) : null}
                              <ChevronRight size={14} color={colors.textMuted} />
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View
                key={entry.id}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '88%',
                  borderRadius: 16,
                  borderBottomRightRadius: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: brand[700],
                }}
              >
                <AppText className="text-sm leading-6 text-white">{entry.text}</AppText>
              </View>
            ),
          )
        )}

        {sending && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MoxtiBadge size={28} radius={10} />
            <View
              className="bg-app-surface"
              style={{
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                boxShadow: CARD_SHADOW,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color="#0d9488" />
              <AppText className="text-xs text-app-text-muted">Recherche dans MOXT en cours…</AppText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input composer dock */}
      <View
        className="bg-app-surface-muted"
        style={{
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: Math.max(12, insets.bottom),
        }}
      >
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
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Joindre un document"
            onPress={() => {
              void pickImageOrPdf()
                .then((file) => {
                  if (!file) return;
                  setQuestion((current) => `${current}${current ? ' ' : ''}[${file.name}]`.trim());
                })
                .catch((error) =>
                  showNotice('Moxti', error instanceof Error ? error.message : 'Fichier impossible.')
                );
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Paperclip size={18} color={colors.accent} strokeWidth={2} />
          </Pressable>

          <TextInput
            multiline
            value={question}
            onChangeText={setQuestion}
            placeholder="Posez une question ou demandez une recherche..."
            placeholderTextColor={colors.textFaint}
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 128,
              paddingHorizontal: 8,
              paddingVertical: 8,
              fontSize: 16,
              color: colors.text,
            }}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
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
            }}
          >
            <Send size={18} color="#ffffff" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
