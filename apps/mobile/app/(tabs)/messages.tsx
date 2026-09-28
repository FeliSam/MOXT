import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Archive,
  BellOff,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Filter,
  Headphones,
  MessageSquare,
  Package,
  Repeat,
  Search,
  ShoppingBag,
  Star,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { HeaderActionButton, HeaderChip } from '@/components/chrome/HeaderChrome';
import { HEADER, headerPaddingTop } from '@/components/chrome/headerTokens';
import { ASSISTANT_ID, MoxtiBadge } from '@/components/messages/MoxtiBadge';
import { EntityAvatar } from '@/components/profile/EntityAvatar';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  type Conversation,
  getConversationPeer,
  loadConversations,
  selectInboxList,
  selectUnreadMessageCount,
} from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { brand, withAlphaColor } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';
import { getMobileConversationPreview, getMobileConversationPreviewAt } from '@/utils/conversationPreview';

type FilterId = 'all' | 'unread' | 'pinned' | 'transfer' | 'p2p' | 'support';

/** MESSAGE_FILTER_IDS du web. */
const FILTERS: { id: FilterId; labelKey: string; icon?: LucideIcon }[] = [
  { id: 'all', labelKey: 'messages.filterAll' },
  { id: 'unread', labelKey: 'messages.filterUnread' },
  { id: 'pinned', labelKey: 'messages.filterPinned', icon: Star },
  { id: 'transfer', labelKey: 'messages.filterTransfer', icon: Repeat },
  { id: 'p2p', labelKey: 'messages.filterP2p', icon: Repeat },
  { id: 'support', labelKey: 'messages.filterSupport', icon: Headphones },
];

/** RELATED_CONTENT_META du web (icône + teinte de la pastille sur l'avatar). */
const RELATED_META: Record<string, { icon: LucideIcon; tone: string }> = {
  business: { icon: Building2, tone: '#8b5cf6' },
  event: { icon: Calendar, tone: '#f59e0b' },
  job: { icon: Briefcase, tone: '#3b82f6' },
  listing: { icon: ShoppingBag, tone: '#ec4899' },
  parcel: { icon: Package, tone: '#f97316' },
  p2p: { icon: Repeat, tone: '#0891b2' },
  transfer: { icon: Repeat, tone: '#059669' },
  support: { icon: Headphones, tone: '#e11d48' },
  general: { icon: Users, tone: '#64748b' },
};

function matchesFilter(item: Conversation, filter: FilterId, userId: string) {
  if (filter === 'unread' && !((item.unreadBy?.[userId] || 0) > 0)) return false;
  if (filter === 'pinned' && !item.pinnedBy?.includes(userId)) return false;
  if (filter === 'support' && item.relatedType !== 'support') return false;
  if (filter === 'transfer' && item.relatedType !== 'transfer') return false;
  if (filter === 'p2p' && item.relatedType !== 'p2p' && item.relatedType !== 'p2p_order') return false;
  return true;
}

/** shortTime du web : heure si aujourd'hui, sinon « 26 sept. ». */
function shortTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (date.toDateString() === new Date().toDateString()) {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
}

/** ConversationRow du web (ligne de liste, sans le menu d'actions). */
function ConversationRow({
  conversation,
  userId,
  divided,
  assistant = false,
}: {
  conversation?: Conversation;
  userId: string;
  divided: boolean;
  assistant?: boolean;
}) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const peer = !assistant && conversation ? getConversationPeer(conversation, userId, t('messages.userFallback')) : null;
  const unread = !assistant && conversation ? conversation.unreadBy?.[userId] || 0 : 0;
  const pinned = Boolean(!assistant && conversation?.pinnedBy?.includes(userId));
  const muted = Boolean(!assistant && conversation?.mutedBy?.includes(userId));
  const related = !assistant && conversation?.relatedType ? RELATED_META[conversation.relatedType] || RELATED_META.general : null;
  const preview = assistant
    ? t('messages.assistant.preview')
    : getMobileConversationPreview(conversation as Conversation, userId, {
        youPrefix: t('messages.youPrefix'),
        empty: t('messages.startConversation'),
      });
  const timestamp = assistant ? t('messages.assistant.alwaysThere') : shortTime(getMobileConversationPreviewAt(conversation as Conversation));
  const RelatedIcon = related?.icon;
  // Web : p-[2%] de la largeur, min-h 3.875rem, gap 2.5.
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/messages/${assistant ? ASSISTANT_ID : conversation?.id}` as never)}
      style={({ pressed }) => ({
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 10,
        borderRadius: 16,
        paddingHorizontal: '2%',
        paddingVertical: 7.8,
        backgroundColor: pressed ? withAlphaColor(colors.surface, 0.55) : 'transparent',
      })}>
      <View style={{ alignSelf: 'center' }}>
        {assistant ? (
          <MoxtiBadge />
        ) : (
          <EntityAvatar name={peer?.name || ''} src={peer?.avatarUrl} size={44} shape="user" from={brand[600]} />
        )}
        {RelatedIcon ? (
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 16,
              height: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: related?.tone,
            }}>
            <RelatedIcon size={9} color="#ffffff" strokeWidth={2.4} />
          </View>
        ) : null}
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
          borderBottomWidth: divided ? 1 : 0,
          borderBottomColor: withAlphaColor(colors.border, 0.45),
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingRight: 4 }}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {pinned ? <Star size={12} color="#f59e0b" strokeWidth={2} /> : null}
            <AppText
              numberOfLines={1}
              className={`text-[13px] text-app-text ${unread ? 'font-black' : 'font-semibold'}`}
              style={{ lineHeight: 16, flexShrink: 1 }}>
              {assistant ? t('messages.assistant.name') : peer?.name}
            </AppText>
            {peer?.verified ? (
              <View style={{ flexShrink: 0 }}>
                <VerifiedIcon size={14} />
              </View>
            ) : null}
            {muted ? <BellOff size={12} color={colors.textFaint} strokeWidth={2} /> : null}
          </View>
          <AppText
            className={`text-[10px] ${unread ? 'font-semibold' : 'font-medium'}`}
            style={{ lineHeight: 12, fontVariant: ['tabular-nums'], color: unread ? colors.accent : colors.textFaint }}>
            {timestamp}
          </AppText>
        </View>
        <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText
            numberOfLines={1}
            className={`text-[12px] ${unread ? 'font-medium text-app-text-muted' : 'text-app-text-faint'}`}
            style={{ flex: 1, minWidth: 0, lineHeight: 16 }}>
            {preview}
          </AppText>
          {unread ? (
            <View style={{ minWidth: 20, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center', backgroundColor: isDark ? brand[500] : brand[600] }}>
              <AppText className="text-[10px] font-black text-white" style={{ lineHeight: 12 }}>
                {unread}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/** Menu « Afficher » (ConversationFilterMenu du web), en feuille flottante. */
function FilterMenu({
  open,
  onClose,
  filter,
  onFilter,
  showArchived,
  onToggleArchived,
  counts,
  archivedCount,
  top,
}: {
  open: boolean;
  onClose: () => void;
  filter: FilterId;
  onFilter: (id: FilterId) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  counts: Record<FilterId, number>;
  archivedCount: number;
  top: number;
}) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const shadows = useShadows();
  const row = (active: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: active ? withAlphaColor(colors.accentSoft, 0.7) : 'transparent',
  });
  const countChip = (value: number) =>
    value ? (
      <View style={{ minWidth: 18, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center', backgroundColor: colors.surfaceMuted }}>
        <AppText className="text-[10px] font-bold text-app-text-muted">{value}</AppText>
      </View>
    ) : null;
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View
          accessibilityRole="menu"
          className="border border-app-border bg-app-surface"
          style={[{ position: 'absolute', top, right: 12, width: 240, borderRadius: 16, padding: 6 }, shadows.float]}>
          <AppText className="text-[11px] font-bold uppercase text-app-text-faint" style={{ paddingHorizontal: 12, paddingVertical: 8, letterSpacing: 0.9 }}>
            {t('messages.filterShow')}
          </AppText>
          {FILTERS.map((item) => {
            const active = filter === item.id && !showArchived;
            const Icon = item.icon;
            const tint = active ? colors.accent : colors.text;
            return (
              <Pressable key={item.id} accessibilityRole="menuitem" accessibilityState={{ checked: active }} onPress={() => onFilter(item.id)} style={row(active)}>
                {Icon ? <Icon size={16} color={tint} strokeWidth={2} /> : null}
                <AppText className="text-sm font-semibold" style={{ flex: 1, color: tint }}>
                  {t(item.labelKey)}
                </AppText>
                {countChip(counts[item.id])}
                {active ? <Check size={16} color={tint} strokeWidth={2} /> : null}
              </Pressable>
            );
          })}
          <View className="bg-app-border" style={{ height: 1, marginVertical: 4 }} />
          <Pressable accessibilityRole="menuitem" accessibilityState={{ checked: showArchived }} onPress={onToggleArchived} style={row(showArchived)}>
            <Archive size={16} color={showArchived ? colors.accent : colors.text} strokeWidth={2} />
            <AppText className="text-sm font-semibold" style={{ flex: 1, color: showArchived ? colors.accent : colors.text }}>
              {showArchived ? t('messages.actives') : t('messages.archives')}
            </AppText>
            {countChip(archivedCount)}
            {showArchived ? <Check size={16} color={colors.accent} strokeWidth={2} /> : null}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

/** Liste des conversations (MessagesPage du web en viewport téléphone). Aucune écriture : l'ouverture d'une ligne navigue seulement. */
export default function MessagesTabScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const shadows = useShadows();
  const user = useAppSelector((state) => state.auth.user);
  const conversations = useAppSelector((state) => state.messages.conversations);
  const loading = useAppSelector((state) => state.messages.loading);
  const [filter, setFilter] = useState<FilterId>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const userId = user?.id || '';

  useEffect(() => {
    if (user?.id) dispatch(loadConversations(user.id));
  }, [dispatch, user?.id]);

  const mine = useMemo(() => conversations.filter((c) => c.participantIds?.includes(userId)), [conversations, userId]);
  const activeHuman = useMemo(() => mine.filter((c) => !c.archivedBy?.includes(userId)), [mine, userId]);
  const unreadMessages = selectUnreadMessageCount(conversations, userId);

  const inbox = useMemo(() => selectInboxList(conversations, userId, { showArchived }), [conversations, userId, showArchived]);
  const visible = useMemo(() => inbox.filter((c) => matchesFilter(c, filter, userId)), [inbox, filter, userId]);
  const counts = useMemo(() => {
    const active = selectInboxList(conversations, userId, { showArchived: false });
    return Object.fromEntries(FILTERS.map((f) => [f.id, f.id === 'all' ? 0 : active.filter((c) => matchesFilter(c, f.id, userId)).length])) as Record<FilterId, number>;
  }, [conversations, userId]);
  const archivedCount = useMemo(() => selectInboxList(conversations, userId, { showArchived: true }).length, [conversations, userId]);
  const searchResults = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('fr');
    const all = selectInboxList(conversations, userId, { showArchived: false });
    if (!q) return all;
    return all.filter((c) =>
      `${getConversationPeer(c, userId).name} ${getMobileConversationPreview(c, userId)}`.toLocaleLowerCase('fr').includes(q),
    );
  }, [conversations, userId, query]);

  const hasActiveFilter = filter !== 'all' || showArchived;
  const headerTop = headerPaddingTop(insets.top);
  const subtitle = `${t('messages.exchangeCount', { count: activeHuman.length + 1 })} ${showArchived ? t('messages.archived') : t('messages.active')}${
    !showArchived && unreadMessages > 0 ? t(unreadMessages > 1 ? 'messages.unreadCountPlural' : 'messages.unreadCount', { count: unreadMessages }) : ''
  }`;

  const emptyText =
    filter === 'pinned'
      ? t('messages.noPinned')
      : filter === 'transfer'
        ? t('messages.noTransferChats')
        : filter === 'p2p'
          ? t('messages.noP2pChats')
          : filter === 'support'
            ? t('messages.noSupportChats')
            : t('messages.noUnread');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: headerTop, paddingHorizontal: HEADER.padX, flexDirection: 'row', alignItems: 'center', gap: HEADER.gap }}>
        <HeaderChip>
          <View style={{ width: HEADER.avatar, height: HEADER.avatar, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
            <MessageSquare size={18} color={colors.accent} strokeWidth={2} opacity={0.92} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText numberOfLines={1} className="text-sm font-black text-app-text" style={{ lineHeight: 14 }}>
              {t('messages.conversations')}
            </AppText>
            <AppText numberOfLines={1} className="text-[11px] text-app-text-muted" style={{ marginTop: 2, lineHeight: 13 }}>
              {subtitle}
            </AppText>
          </View>
        </HeaderChip>
        <View style={{ flexDirection: 'row', gap: HEADER.gap }}>
          <HeaderActionButton accessibilityLabel={t('messages.filterAria')} onPress={() => setMenuOpen(true)}>
            <Filter
              size={HEADER.icon}
              color={hasActiveFilter ? colors.accent : colors.text}
              strokeWidth={HEADER.iconStroke}
              opacity={hasActiveFilter ? 1 : HEADER.iconOpacity}
            />
          </HeaderActionButton>
          <HeaderActionButton accessibilityLabel={t('messages.searchConversationAria')} onPress={() => setSearchOpen(true)}>
            <Search size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />
          </HeaderActionButton>
        </View>
      </View>

      {loading && !conversations.length ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 128 }}>
          <View style={{ paddingBottom: 4 }}>
            <ConversationRow assistant userId={userId} divided />
          </View>
          {visible.length || showArchived || filter !== 'all' ? (
            <AppText className="text-[10px] font-semibold text-app-text-faint" style={{ paddingHorizontal: 10, paddingTop: 12, paddingBottom: 4, letterSpacing: 0.25 }}>
              {t('messages.yourConversations')}
            </AppText>
          ) : null}
          {visible.map((conversation, index) => (
            <ConversationRow key={conversation.id} conversation={conversation} userId={userId} divided={index < visible.length - 1} />
          ))}
          {!visible.length && filter === 'all' && !showArchived ? (
            <View className="border border-dashed border-app-border bg-app-surface" style={[{ marginHorizontal: 8, marginTop: 8, borderRadius: 21.6, padding: 24, alignItems: 'center' }, shadows.card]}>
              <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                <MessageSquare size={20} color={colors.accent} strokeWidth={2} />
              </View>
              <AppText className="mt-4 text-base font-extrabold text-app-text">{t('messages.empty.title')}</AppText>
              <AppText className="mt-2 text-center text-sm leading-6 text-app-text-muted">{t('messages.empty.description')}</AppText>
            </View>
          ) : !visible.length ? (
            <AppText className="text-center text-sm text-app-text-faint" style={{ padding: 24 }}>
              {emptyText}
            </AppText>
          ) : null}
        </ScrollView>
      )}

      <FilterMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        filter={filter}
        onFilter={(id) => {
          setFilter(id);
          setShowArchived(false);
          setMenuOpen(false);
        }}
        showArchived={showArchived}
        onToggleArchived={() => {
          setShowArchived((v) => !v);
          setMenuOpen(false);
        }}
        counts={counts}
        archivedCount={archivedCount}
        top={headerTop + HEADER.height + 8}
      />

      <Modal transparent visible={searchOpen} animationType="fade" onRequestClose={() => setSearchOpen(false)}>
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityLabel={t('messages.closeSearch')}
            onPress={() => setSearchOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(2,6,23,0.2)' }}
          />
          <View
            accessibilityRole="search"
            className="border border-app-border bg-app-surface"
            style={[{ position: 'absolute', left: 12, right: 12, top: Math.max(12, insets.top + 12), maxHeight: '72%', borderRadius: 16, overflow: 'hidden' }, shadows.float]}>
            <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: withAlphaColor(colors.border, 0.6) }}>
              <View className="bg-app-surface-muted" style={{ minHeight: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                <Search size={16} color={colors.textMuted} strokeWidth={2} />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('messages.searchPlaceholder')}
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel={t('messages.searchPlaceholder')}
                  style={{ flex: 1, minWidth: 0, fontSize: 14, color: colors.text }}
                />
                <Pressable
                  accessibilityLabel={t('messages.closeSearch')}
                  onPress={() => setSearchOpen(false)}
                  className="bg-app-surface"
                  style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color={colors.text} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
            <ScrollView style={{ maxHeight: 448 }} contentContainerStyle={{ paddingBottom: 8, paddingTop: 4 }} keyboardShouldPersistTaps="handled">
              <AppText className="text-[10px] font-semibold text-app-text-faint" style={{ paddingHorizontal: 10, paddingTop: 4, paddingBottom: 6 }}>
                {query.trim() ? t('messages.resultsCount', { count: searchResults.length }) : t('messages.conversations')}
              </AppText>
              {searchResults.map((conversation, index) => (
                <ConversationRow key={conversation.id} conversation={conversation} userId={userId} divided={index < searchResults.length - 1} />
              ))}
              {query.trim() && !searchResults.length ? (
                <AppText className="text-center text-sm text-app-text-faint" style={{ padding: 24 }}>
                  {t('messages.noMatch')}
                </AppText>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
