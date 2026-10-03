import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  Copy,
  CornerUpLeft,
  ExternalLink,
  FileText,
  Flag,
  Globe,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react-native';

import { HeaderActionButton, HeaderChip } from '@/components/chrome/HeaderChrome';
import { HEADER, headerPaddingTop } from '@/components/chrome/headerTokens';
import { EntityAvatar } from '@/components/profile/EntityAvatar';
import { ReportSheet } from '@/components/ui/ReportSheet';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import { subscribePresenceUpdates } from '@/services/chatRealtime';
import { supabase } from '@/services/supabase';
import { pickImageOrPdf, uploadLikeWeb, type UploadFile } from '@/services/mediaUpload';
import {
  buildConversationTimeline,
  ensureConversation,
  getConversationPeer,
  loadConversationMessages,
  markConversationRead,
  messageRemoved,
  patchMessage,
  sendMessage,
  type Message,
  type MessageAttachment,
  type RelatedSnapshot,
} from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { openLink } from '@/utils/appLinks';
import { isE2eHarnessActive } from '@/utils/e2eHarness';
import { showNotice } from '@/utils/notice';
import {
  attachmentImageSrcs,
  bubbleRadii,
  firstUnreadMessageIndex,
  formatDateLabel,
  isImageAttachment,
  messageReadStatus,
  mobileContentPath,
  peerActivityLabel,
  shortTime,
  shouldGroupMessages,
} from '@/utils/messageThread';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥'];
const TRANSLATE_LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
];

const RELATED_TONE: Record<string, string> = {
  parcel: '#f97316',
  listing: '#ec4899',
  job: '#3b82f6',
  event: '#f59e0b',
  p2p: '#0891b2',
  transfer: '#059669',
  business: '#8b5cf6',
  support: '#e11d48',
};

/** Détail d'une conversation (ConversationPanel + MessagesThreadHeader), pas Moxti. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const subscriptions = useAppSelector((state) => state.account.subscriptions);
  const conversation = useAppSelector((state) => state.messages.conversations.find((item) => item.id === id));
  const [text, setText] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [threadQuery, setThreadQuery] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const initialUnread = useRef<number | null>(null);
  const lookupFor = useRef<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  if (conversation && user?.id && initialUnread.current == null) {
    initialUnread.current = conversation.unreadBy?.[user.id] || 0;
  }

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOpen(true);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!id || conversation || lookupFor.current === id) return;
    lookupFor.current = id;
    setLookupDone(false);
    dispatch(ensureConversation(id))
      .finally(() => setLookupDone(true))
      .catch(() => undefined);
  }, [conversation, dispatch, id]);

  useEffect(() => {
    if (!id || !conversation) return;
    if (conversation.messagesLoading) return;
    const loadedCount = conversation.messages.length;
    const expectedCount = conversation.messageCount || 0;
    if (!conversation.messagesLoaded || (expectedCount > 0 && loadedCount < expectedCount)) {
      dispatch(loadConversationMessages(id));
    }
  }, [conversation, dispatch, id]);

  useEffect(() => {
    if (!id || !user?.id || !conversation) return;
    // Le harnais local ne doit pas marquer « lu » côté serveur.
    if (isE2eHarnessActive()) return;
    dispatch(markConversationRead({ conversationId: id, userId: user.id }));
  }, [conversation?.id, conversation?.messagesLoaded, dispatch, id, user?.id]);

  const peer = conversation && user ? getConversationPeer(conversation, user.id) : null;

  useEffect(() => {
    return subscribePresenceUpdates((state) => {
      setOnline(Boolean(peer?.id && state[peer.id]?.online));
    });
  }, [peer?.id]);

  const timeline = (conversation ? buildConversationTimeline(conversation) : []).filter((item) => {
    const query = threadQuery.trim().toLowerCase();
    if (!query) return true;
    if (item.kind === 'related') return `${item.preview.title} ${item.preview.subtitle || ''}`.toLowerCase().includes(query);
    const message = item.message;
    const images = attachmentImageSrcs(message.attachment);
    return `${message.text} ${message.attachment?.name || ''} ${images.join(' ')}`.toLowerCase().includes(query);
  });
  const firstUnread = useMemo(() => {
    if (!conversation || !user?.id) return -1;
    return firstUnreadMessageIndex(conversation.messages, user.id, initialUnread.current || 0);
  }, [conversation, user?.id]);

  async function addFile() {
    setMenuOpen(false);
    try {
      const file = await pickImageOrPdf();
      if (!file) return;
      setFiles((current) => {
        const images = current.filter((item) => item.type.startsWith('image/'));
        if (file.type.startsWith('image/')) return [...images, file].slice(0, 4);
        return [file];
      });
    } catch (error) {
      showNotice('Fichier', error instanceof Error ? error.message : 'Ouverture impossible.');
    }
  }

  async function copyMessage(value: string) {
    const payload = value.trim();
    if (!payload) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      }
      showNotice(t('messages.copiedTitle'), t('messages.copied'));
    } catch {
      showNotice(t('messages.copyFailedTitle'), t('messages.copyFailed'));
    }
  }

  async function translateMessage(message: Message, lang: string) {
    const source = message.text?.trim();
    if (!source) return;
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(source.slice(0, 450))}&langpair=autodetect|${lang}`,
      );
      const body = (await response.json()) as { responseData?: { translatedText?: string } };
      const translated = body.responseData?.translatedText?.trim();
      if (!translated) throw new Error('empty');
      setTranslations((current) => ({ ...current, [message.id]: translated }));
    } catch {
      showNotice(t('messages.translateFailedTitle'), t('messages.translateFailed'));
    }
  }

  async function reactTo(message: Message, emoji: string) {
    if (!conversation) return;
    const next = { ...message, attachment: { ...(message.attachment || {}), reactionEmoji: emoji } };
    dispatch(patchMessage({ conversationId: conversation.id, message: next }));
    if (supabase) {
      await supabase.from('messages').update({ attachment: next.attachment }).eq('id', message.id);
    }
  }

  async function saveEdit() {
    if (!conversation || !editing) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = { ...editing, text: trimmed, editedAt: new Date().toISOString() };
    dispatch(patchMessage({ conversationId: conversation.id, message: next }));
    if (supabase) {
      await supabase.from('messages').update({ text: trimmed }).eq('id', editing.id);
    }
    setEditing(null);
    setText('');
  }

  function removeMessage(message: Message) {
    if (!conversation) return;
    Alert.alert(t('messages.deleteConfirmTitle'), '', [
      { text: t('common.cancel') || 'Annuler', style: 'cancel' },
      {
        text: t('messages.delete'),
        style: 'destructive',
        onPress: () => {
          dispatch(messageRemoved({ conversationId: conversation.id, messageId: message.id }));
          if (supabase) void supabase.from('messages').delete().eq('id', message.id);
        },
      },
    ]);
  }

  async function shareContact(contact: { userId: string; name: string; city?: string }) {
    if (!conversation || !user) return;
    await dispatch(
      sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`.trim(),
        text: '',
        attachment: {
          kind: 'contact',
          userId: contact.userId,
          name: contact.name,
          city: contact.city || '',
          path: `/users/${contact.userId}/publications`,
        },
      }),
    ).unwrap();
  }

  async function handleSend() {
    if (editing) {
      setSending(true);
      try {
        await saveEdit();
      } finally {
        setSending(false);
      }
      return;
    }
    if (!conversation || !user || sending) return;
    const trimmed = text.trim();
    if (!trimmed && !files.length) return;
    setSending(true);
    try {
      let attachment: MessageAttachment | null = null;
      if (files.length) {
        const images = files.filter((file) => file.type.startsWith('image/'));
        const chosen = images.length ? images : files.slice(0, 1);
        const urls: string[] = [];
        for (let index = 0; index < chosen.length; index += 1) {
          const file = chosen[index];
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
          const uploaded = await uploadLikeWeb(
            'listings',
            `${user.id}/messages/${conversation.id}/${Date.now()}-${index}.${ext}`,
            file,
            'public',
          );
          if (uploaded.url) urls.push(uploaded.url);
        }
        if (!urls.length && !trimmed) throw new Error('Envoi de la pièce jointe impossible.');
        if (urls.length) {
          attachment = {
            name: chosen.length === 1 ? chosen[0].name : `${chosen.length} photos`,
            type: chosen[0].type,
            size: chosen.reduce((sum, file) => sum + (file.size || 0), 0),
            url: urls[0],
            ...(urls.length > 1 ? { urls } : {}),
            ...(chosen[0].type.startsWith('video/') ? { kind: 'video' } : {}),
          };
        }
      }
      await dispatch(
        sendMessage({
          conversationId: conversation.id,
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`.trim(),
          text: replyTo ? `${t('messages.replyToMessage', { name: replyTo.senderName || t('messages.replyToMessageFallback') })}\n${trimmed}` : trimmed,
          attachment,
        }),
      ).unwrap();
      setText('');
      setFiles([]);
      setReplyTo(null);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (error) {
      showNotice('Message', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  }

  if (!conversation || !peer) {
    if (!lookupDone) {
      return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12 }}>
        <AppText className="text-lg font-black text-app-text">Conversation introuvable</AppText>
        <Pressable onPress={() => router.back()}>
          <AppText className="font-bold text-app-accent">Retour</AppText>
        </Pressable>
      </View>
    );
  }

  const composerPad = keyboardOpen ? 12 : Math.max(12, insets.bottom);
  const canSend = Boolean(text.trim() || files.length) && !sending;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted, paddingBottom: Platform.OS === 'ios' ? keyboardHeight : 0 }}>
      <View style={{ paddingTop: headerPaddingTop(insets.top), paddingHorizontal: HEADER.padX, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: HEADER.gap }}>
        <HeaderChip style={{ height: undefined, minHeight: HEADER.height, paddingVertical: 4 }}>
          <HeaderActionButton accessibilityLabel={t('messages.closeConversation')} onPress={() => router.back()} transparent>
            <X size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} />
          </HeaderActionButton>
          <Pressable onPress={() => peer.id && router.push(`/users/${peer.id}/publications` as never)} style={{ position: 'relative' }}>
            <EntityAvatar name={peer.name} src={peer.avatarUrl} size={HEADER.avatar} shape="user" />
            {online ? (
              <View
                accessibilityLabel={t('messages.activity.online')}
                style={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 2, borderColor: colors.surface }}
              />
            ) : null}
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText numberOfLines={1} className="text-sm font-black text-app-text">{peer.name}</AppText>
              {peer.verified ? <VerifiedIcon size={12} /> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {online ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} /> : null}
              <AppText numberOfLines={1} className="text-[11px] font-semibold" style={{ color: online ? (isDark ? '#6ee7b7' : '#059669') : colors.textMuted }}>
                {online ? t('messages.activity.online') : peerActivityLabel(peer.lastActiveAt, t)}
              </AppText>
            </View>
          </View>
        </HeaderChip>
        <HeaderActionButton accessibilityLabel={searchOpen ? t('messages.closeSearchInThread') : t('messages.searchInThread')} onPress={() => setSearchOpen((open) => !open)}>
          <Search size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} />
        </HeaderActionButton>
        <HeaderActionButton accessibilityLabel={t('messages.conversationOptionsAria')} onPress={() => setOptionsOpen(true)}>
          <MoreVertical size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} />
        </HeaderActionButton>
      </View>
      {searchOpen ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, backgroundColor: colors.surface, paddingHorizontal: 12, minHeight: 40 }}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              autoFocus
              value={threadQuery}
              onChangeText={setThreadQuery}
              placeholder={t('messages.searchInConversation')}
              placeholderTextColor={colors.textFaint}
              style={{ flex: 1, color: colors.text, fontSize: 16, paddingVertical: 8 }}
            />
            {threadQuery ? (
              <Pressable accessibilityLabel={t('messages.clearSearch')} onPress={() => setThreadQuery('')}>
                <X size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={timeline}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => {
          const previous = timeline[index - 1];
          const showDate = !previous || new Date(previous.at).toDateString() !== new Date(item.at).toDateString();
          if (item.kind === 'related') {
            return (
              <View>
                {showDate ? <DateChip date={new Date(item.at)} label={formatDateLabel(new Date(item.at), t)} colors={colors} /> : null}
                <RelatedCard preview={item.preview} colors={colors} t={t} />
              </View>
            );
          }
          const message = item.message;
          const sourceIndex = conversation.messages.findIndex((entry) => entry.id === message.id);
          const showUnread = sourceIndex === firstUnread && firstUnread >= 0 && (initialUnread.current || 0) > 0;
          let previousMessage: Message | null = null;
          for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
            const entry = timeline[cursor];
            if (entry.kind === 'message') {
              previousMessage = entry.message;
              break;
            }
          }
          let nextMessage: Message | null = null;
          for (let cursor = index + 1; cursor < timeline.length; cursor += 1) {
            const entry = timeline[cursor];
            if (entry.kind === 'message') {
              nextMessage = entry.message;
              break;
            }
          }
          const groupedPrev = shouldGroupMessages(previousMessage, message, showDate);
          const groupedNext = Boolean(
            nextMessage &&
              shouldGroupMessages(
                message,
                nextMessage,
                new Date(message.createdAt).toDateString() !== new Date(nextMessage.createdAt).toDateString(),
              ),
          );
          return (
            <View>
              {showUnread ? (
                <AppText className="my-3 text-center text-[11px] font-bold uppercase text-app-accent">
                  {(initialUnread.current || 0) > 1
                    ? t('messages.unreadSeparatorPlural', { count: initialUnread.current || 0 })
                    : t('messages.unreadSeparator')}
                </AppText>
              ) : null}
              {showDate ? <DateChip date={new Date(item.at)} label={formatDateLabel(new Date(item.at), t)} colors={colors} /> : null}
              <Bubble
                message={message}
                mine={String(message.senderId) === String(user?.id)}
                groupedPrev={groupedPrev}
                groupedNext={groupedNext}
                peer={peer}
                userId={user?.id || ''}
                colors={colors}
                isDark={isDark}
                t={t}
                translation={translations[message.id]}
                onOpenImage={setPreview}
                onPress={() => {
                  setTranslateOpen(false);
                  setActionMessage(message);
                }}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ marginTop: 32, marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surface, padding: 24 }}>
            <AppText className="text-center text-sm font-black text-app-text">{t('messages.threadEmptyTitle')}</AppText>
            <AppText className="mt-2 text-center text-sm text-app-text-muted">{t('messages.threadEmptyDescription')}</AppText>
          </View>
        }
      />

      <View style={{ paddingHorizontal: 12, paddingBottom: composerPad, paddingTop: 8, backgroundColor: colors.surfaceMuted, overflow: 'visible', zIndex: 20 }}>
        {replyTo ? (
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: colors.accent, paddingHorizontal: 12, paddingVertical: 8 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText className="text-xs font-bold text-app-accent">{t('messages.replyToMessage', { name: replyTo.senderName || t('messages.replyToMessageFallback') })}</AppText>
              <AppText numberOfLines={1} className="text-xs text-app-text-muted">{replyTo.text}</AppText>
            </View>
            <Pressable accessibilityLabel={t('messages.cancelReply')} onPress={() => setReplyTo(null)}>
              <X size={16} color={colors.accent} />
            </Pressable>
          </View>
        ) : null}
        {editing ? (
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 8 }}>
            <View style={{ flex: 1 }}>
              <AppText className="text-xs font-bold" style={{ color: '#b45309' }}>{t('messages.editingTitle')}</AppText>
              <AppText className="text-xs text-app-text-muted">{t('messages.editingHint')}</AppText>
            </View>
            <Pressable accessibilityLabel={t('messages.cancelEdit')} onPress={() => { setEditing(null); setText(''); }}>
              <X size={16} color="#b45309" />
            </Pressable>
          </View>
        ) : null}
        {files.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {files.map((file) => (
              <View key={`${file.name}-${file.uri}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Paperclip size={14} color={colors.textMuted} />
                <AppText numberOfLines={1} className="max-w-[140px] text-xs font-bold text-app-text">{file.name}</AppText>
                <Pressable onPress={() => setFiles((current) => current.filter((item) => item.uri !== file.uri))}>
                  <X size={14} color={colors.accent} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 6, overflow: 'visible' }}>
          <View style={{ position: 'relative', overflow: 'visible' }}>
            {menuOpen ? (
              <View
                accessibilityRole="menu"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: 9,
                  zIndex: 30,
                  minWidth: 184,
                  gap: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 6,
                }}>
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => void addFile()}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                    <FileText size={16} color={colors.accent} />
                  </View>
                  <AppText className="text-sm font-bold text-app-text">{t('messages.composerAttachFile')}</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => {
                    setMenuOpen(false);
                    setContactOpen(true);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                    <User size={16} color={colors.accent} />
                  </View>
                  <AppText className="text-sm font-bold text-app-text">{t('messages.composerAttachContact')}</AppText>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={t('messages.composerPlusAria')}
              onPress={() => setMenuOpen((open) => !open)}
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: menuOpen ? colors.accentSoft : 'transparent' }}>
              <Plus size={20} color={colors.accent} style={{ transform: [{ rotate: menuOpen ? '45deg' : '0deg' }] }} />
            </Pressable>
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('messages.writePlaceholder')}
            placeholderTextColor={colors.textFaint}
            multiline
            style={{ flex: 1, maxHeight: 112, minHeight: 36, color: colors.text, fontSize: 16, lineHeight: 22, paddingVertical: 8 }}
          />
          <Pressable
            accessibilityLabel={t('messages.send')}
            disabled={!canSend}
            onPress={() => void handleSend()}
            style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend ? colors.accent : colors.border, opacity: canSend ? 1 : 0.7 }}>
            <Send size={18} color={canSend ? (isDark ? '#020617' : '#fff') : colors.textFaint} />
          </Pressable>
        </View>
      </View>

      <Modal visible={optionsOpen} transparent animationType="fade" onRequestClose={() => setOptionsOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.45)', justifyContent: 'flex-end' }} onPress={() => setOptionsOpen(false)}>
          <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.surface, padding: 16, gap: 8 }}>
            {['Épingler', 'Sourdine', 'Archiver', 'Bloquer'].map((label) => (
              <Pressable key={label} onPress={() => setOptionsOpen(false)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <AppText className="text-base font-bold text-app-text">{label}</AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={Boolean(actionMessage)} transparent animationType="slide" onRequestClose={() => setActionMessage(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }} onPress={() => setActionMessage(null)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{ borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(16, insets.bottom), gap: 10 }}>
            <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 999, backgroundColor: colors.border }} />
            {actionMessage ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 6, paddingHorizontal: 4 }}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      accessibilityLabel={t('messages.reactAria', { emoji })}
                      onPress={() => {
                        void reactTo(actionMessage, emoji);
                        setActionMessage(null);
                      }}
                      style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      <AppText style={{ fontSize: 22 }}>{emoji}</AppText>
                    </Pressable>
                  ))}
                </View>
                {translateOpen ? (
                  TRANSLATE_LANGS.map((lang) => (
                    <Pressable
                      key={lang.code}
                      onPress={() => {
                        void translateMessage(actionMessage, lang.code);
                        setActionMessage(null);
                        setTranslateOpen(false);
                      }}
                      style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingHorizontal: 8 }}>
                      <Globe size={18} color={colors.text} />
                      <AppText className="text-base font-semibold text-app-text">{lang.label}</AppText>
                    </Pressable>
                  ))
                ) : (
                  <>
                    <SheetAction icon={<CornerUpLeft size={18} color={colors.text} />} label={t('messages.reply')} onPress={() => { setReplyTo(actionMessage); setEditing(null); setActionMessage(null); }} />
                    <SheetAction icon={<Copy size={18} color={colors.text} />} label={t('messages.copy')} onPress={() => { void copyMessage(actionMessage.text || ''); setActionMessage(null); }} />
                    <SheetAction icon={<Globe size={18} color={colors.text} />} label={t('messages.translate')} onPress={() => setTranslateOpen(true)} />
                    {String(actionMessage.senderId) !== String(user?.id) ? (
                      <SheetAction icon={<User size={18} color={colors.text} />} label={t('messages.viewProfile')} onPress={() => { const target = actionMessage.senderId; setActionMessage(null); if (target) router.push(`/users/${target}/publications` as never); }} />
                    ) : null}
                    {String(actionMessage.senderId) !== String(user?.id) ? (
                      <SheetAction icon={<Flag size={18} color={colors.text} />} label={t('messages.report')} onPress={() => { setReportId(actionMessage.id); setActionMessage(null); }} />
                    ) : null}
                    {String(actionMessage.senderId) === String(user?.id) ? (
                      <SheetAction icon={<Pencil size={18} color={colors.text} />} label={t('messages.edit')} onPress={() => { setEditing(actionMessage); setReplyTo(null); setText(actionMessage.text || ''); setActionMessage(null); }} />
                    ) : null}
                    {String(actionMessage.senderId) === String(user?.id) ? (
                      <SheetAction icon={<Trash2 size={18} color="#dc2626" />} label={t('messages.delete')} danger onPress={() => { const current = actionMessage; setActionMessage(null); removeMessage(current); }} />
                    ) : null}
                  </>
                )}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={contactOpen} transparent animationType="slide" onRequestClose={() => setContactOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }} onPress={() => setContactOpen(false)}>
          <Pressable onPress={(event) => event.stopPropagation()} style={{ maxHeight: '70%', borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: colors.surface, padding: 16, paddingBottom: Math.max(16, insets.bottom) }}>
            <AppText className="text-base font-black text-app-text">{t('messages.composerAttachContact')}</AppText>
            <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {shareableContacts(subscriptions, user?.id).map((contact) => (
                <Pressable
                  key={contact.userId}
                  onPress={() => {
                    setContactOpen(false);
                    void shareContact(contact).catch((error) => showNotice('Contact', error instanceof Error ? error.message : 'Envoi impossible.'));
                  }}
                  style={{ minHeight: 48, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 8 }}>
                  <AppText className="text-sm font-bold text-app-text">{contact.name}</AppText>
                  {contact.city ? <AppText className="text-xs text-app-text-muted">{contact.city}</AppText> : null}
                </Pressable>
              ))}
              {!shareableContacts(subscriptions, user?.id).length ? (
                <AppText className="text-sm text-app-text-muted">Aucun contact à partager.</AppText>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ReportSheet
        open={Boolean(reportId)}
        title={t('messages.reportTitle')}
        target="message"
        targetId={reportId || ''}
        userId={user?.id}
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
        onClose={() => setReportId(null)}
      />

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.88)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview }} style={{ width: '92%', height: '70%' }} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </View>
  );
}

function shareableContacts(
  subscriptions: { userId?: string; publisherType?: string; publisherId?: string; publisherName?: string }[],
  userId?: string,
) {
  if (!userId) return [] as { userId: string; name: string; city?: string }[];
  const seen = new Set<string>();
  const contacts: { userId: string; name: string; city?: string }[] = [];
  for (const item of subscriptions) {
    const following = item.userId === userId && item.publisherType === 'user' && item.publisherId && item.publisherId !== userId;
    const follower = item.publisherType === 'user' && item.publisherId === userId && item.userId && item.userId !== userId;
    const id = following ? String(item.publisherId) : follower ? String(item.userId) : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    contacts.push({ userId: id, name: item.publisherName || 'Contact MOXT' });
  }
  return contacts.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function SheetAction({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingHorizontal: 8 }}>
      {icon}
      <AppText className={`text-base font-semibold ${danger ? 'text-red-600' : 'text-app-text'}`}>{label}</AppText>
    </Pressable>
  );
}

function DateChip({ label, colors }: { date: Date; label: string; colors: { border: string; surface: string; textMuted: string } }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <AppText className="text-[10px] font-bold uppercase" style={{ letterSpacing: 1.2, color: colors.textMuted, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
        {label}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

function RelatedCard({
  preview,
  colors,
  t,
}: {
  preview: RelatedSnapshot;
  colors: { surface: string; surfaceMuted: string; border: string; accent: string; accentSoft: string; text: string; textMuted: string };
  t: (key: string) => string;
}) {
  const labelKey = `communications.related.${preview.type}`;
  const translated = t(labelKey);
  const label = translated && translated !== labelKey ? translated : 'Annonce';
  return (
    <Pressable
      onPress={() => router.push(mobileContentPath(preview.path) as never)}
      style={{ marginVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: RELATED_TONE[preview.type] || colors.surfaceMuted }}>
        {preview.imageUrl ? (
          <Image source={{ uri: preview.imageUrl }} style={{ width: 56, height: 56 }} resizeMode="cover" />
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText className="text-[10px] font-bold uppercase" style={{ color: colors.accent, backgroundColor: colors.accentSoft, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 2 }}>{label}</AppText>
          {preview.badge ? <AppText className="text-[10px] font-semibold text-app-text-muted">{preview.badge}</AppText> : null}
        </View>
        <AppText numberOfLines={2} className="text-sm font-black text-app-text">{preview.title}</AppText>
        {preview.subtitle ? <AppText className="text-sm font-semibold" style={{ color: colors.accent }}>{preview.subtitle}</AppText> : null}
        {preview.details?.length ? <AppText className="text-xs text-app-text-muted">{preview.details.join(' · ')}</AppText> : null}
      </View>
      <ExternalLink size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function Bubble({
  message,
  mine,
  groupedPrev,
  groupedNext,
  peer,
  userId,
  colors,
  isDark,
  t,
  translation,
  onOpenImage,
  onPress,
}: {
  message: Message;
  mine: boolean;
  groupedPrev: boolean;
  groupedNext: boolean;
  peer: { id: string | null; name: string; avatarUrl: string | null };
  userId: string;
  colors: { surface: string; accent: string; accentSoft: string; teal: string; text: string; textMuted: string; textFaint: string; border: string };
  isDark: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  translation?: string;
  onOpenImage: (uri: string) => void;
  onPress: () => void;
}) {
  const images = attachmentImageSrcs(message.attachment);
  const showImages = isImageAttachment(message.attachment) && images.length > 0;
  const fromStatus = Boolean(message.attachment?.fromStatus);
  const reaction = message.attachment?.reactionEmoji;
  const receipt = messageReadStatus(message, userId);
  const receiptLabel =
    receipt === 'read' ? t('messages.statusRead') : receipt === 'delivered' ? t('messages.statusDelivered') : receipt === 'sent' ? t('messages.statusSent') : '';
  const readColor = isDark ? colors.teal : colors.accent;
  const radius = bubbleRadii(mine, groupedPrev, groupedNext);

  return (
    <View style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, marginTop: groupedPrev ? 4 : 12, maxWidth: '86%', alignSelf: mine ? 'flex-end' : 'flex-start' }}>
      {!mine ? (
        groupedPrev ? (
          <View style={{ width: 26 }} />
        ) : (
          <EntityAvatar name={message.senderName || peer.name} src={String(message.senderId) === String(peer.id) ? peer.avatarUrl : null} size={26} shape="user" />
        )
      ) : null}
      <Pressable onPress={onPress} style={{ maxWidth: '100%', alignItems: mine ? 'flex-end' : 'flex-start' }}>
        <View
          style={{
            ...radius,
            paddingHorizontal: showImages ? 6 : 12,
            paddingVertical: showImages ? 6 : 8,
            backgroundColor: mine ? colors.accent : colors.accentSoft,
            borderWidth: mine ? 0 : 1,
            borderColor: colors.border,
          }}>
          {showImages ? (
            <View>
              {images.map((uri) => (
                <Pressable key={uri} onPress={() => onOpenImage(uri)}>
                  <Image source={{ uri }} style={{ width: 220, height: 160, borderRadius: 12, backgroundColor: '#0f172a', marginBottom: message.text ? 6 : 0 }} resizeMode="cover" />
                </Pressable>
              ))}
              {fromStatus ? (
                <View style={{ position: 'absolute', left: 8, top: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3 }}>
                  <AppText className="text-[10px] font-black" style={{ color: '#fff' }}>Statut</AppText>
                </View>
              ) : null}
              {reaction ? (
                <AppText className="absolute text-2xl" style={{ right: 8, bottom: 8 }}>{reaction}</AppText>
              ) : null}
            </View>
          ) : null}
          {fromStatus && !showImages ? (
            <AppText className="text-sm font-bold" style={{ color: mine ? '#fff' : colors.text }}>{message.text || 'Statut'}</AppText>
          ) : null}
          {message.attachment && message.attachment.kind !== 'contact' && !showImages && !fromStatus ? (
            <Pressable
              onPress={() => {
                const href = message.attachment?.url;
                if (href) openLink(href);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: message.text ? 6 : 0 }}>
              <Paperclip size={14} color={mine ? '#fff' : colors.accent} />
              <AppText className="text-xs font-bold" style={{ color: mine ? '#fff' : colors.text }}>{message.attachment.name || 'Fichier'}</AppText>
            </Pressable>
          ) : null}
          {message.attachment?.kind === 'contact' && message.attachment.userId ? (
            <Pressable onPress={() => router.push(`/users/${message.attachment?.userId}/publications` as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: message.text ? 6 : 0 }}>
              <User size={16} color={mine ? '#fff' : colors.accent} />
              <AppText className="text-sm font-bold" style={{ color: mine ? '#fff' : colors.text }}>{message.attachment.name || t('messages.composerAttachContact')}</AppText>
            </Pressable>
          ) : null}
          {message.text && !(fromStatus && !showImages) ? (
            <AppText className="text-[15px]" style={{ lineHeight: 22, color: mine ? '#fff' : colors.text }}>{translation || message.text}</AppText>
          ) : null}
          {translation ? (
            <AppText className="text-[10px] font-semibold" style={{ marginTop: 4, color: mine ? 'rgba(255,255,255,0.75)' : colors.textMuted }}>{t('messages.autoTranslated')}</AppText>
          ) : null}
        </View>
        {!groupedNext ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <AppText className="text-[9px] font-semibold" style={{ color: colors.textFaint }}>{shortTime(message.createdAt)}</AppText>
            {mine && receiptLabel ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Check size={11} color={receipt === 'read' ? readColor : colors.textFaint} strokeWidth={2.5} style={receipt === 'sent' ? { opacity: 0.55 } : undefined} />
                {receipt === 'read' ? <Check size={11} color={readColor} strokeWidth={2.5} style={{ marginLeft: -7 }} /> : null}
                <AppText className="text-[9px] font-semibold" style={{ color: receipt === 'read' ? readColor : colors.textFaint }}>{receiptLabel}</AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
