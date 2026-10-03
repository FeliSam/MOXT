import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { openContactConversation } from '@moxt/shared/services/contactService.js';

import { FavoriteButton } from '@/components/account/FavoriteButton';
import { AppChrome } from '@/components/chrome/AppChrome';
import { ContactButton } from '@/components/communications/ContactButton';
import { EventParticipantsSection, type EventRegistrationRow } from '@/components/events/EventParticipantsSection';
import { DetailFloatingActions } from '@/components/marketplace/DetailFloatingActions';
import { PublisherBlock } from '@/components/publications/PublisherBlock';
import { usePublisherDetailProfile } from '@/components/publications/usePublisherDetailProfile';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { DetailFacts, DetailMetrics, DetailSection, TrustPanel } from '@/components/ui/DetailBlocks';
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer';
import { ReportSheet } from '@/components/ui/ReportSheet';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import { mapConversationRow, receiveRemoteConversation, sendMessage } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const STORAGE_KEY = 'moxt-event-registrations-v1';

type Registration = {
  id: string;
  eventId: string;
  userId: string;
  participantName: string;
  status: string;
  createdAt: string;
};

function formatWhen(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

/** Fiche événement (EventDetailPage) : date, lieu, places, inscription. */
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const event = useAppSelector((state) => state.dashboard.events.find((item) => item.id === id));
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [busy, setBusy] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const publisherProfile = usePublisherDetailProfile(event as unknown as Record<string, unknown> | undefined, 'event');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setRegistrations(parsed as Registration[]);
      })
      .catch(() => undefined);
  }, []);

  async function save(next: Registration[]) {
    setRegistrations(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  if (!event) {
    return (
      <AppChrome pathname="/events">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
          <AppText className="text-base font-black text-app-text">{t('events.detail.notFound')}</AppText>
        </View>
      </AppChrome>
    );
  }

  const current = event;
  const mine = registrations.find((item) => item.eventId === current.id && item.userId === user?.id && item.status !== 'cancelled');
  const active = registrations.filter((item) => item.eventId === current.id && item.status !== 'cancelled');
  const capacity = Number(event.capacity) || 0;
  const full = capacity > 0 && active.length >= capacity;
  const images = Array.isArray(event.images) ? event.images.filter((src): src is string => typeof src === 'string') : [];
  const isOwner = Boolean(user?.id && String(event.ownerId || '') === user.id);
  const price = Number(event.price) || 0;
  const priceLabel = price > 0 ? `${price} ${event.currency || ''}`.trim() : t('events.detail.free');

  async function register() {
    if (!user?.id || !supabase) {
      router.push('/login' as never);
      return;
    }
    if (mine || full || busy) return;
    setBusy(true);
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    const next = [
      {
        id: `REG-${Date.now().toString(36).toUpperCase()}`,
        eventId: current.id,
        userId: user.id,
        participantName: name,
        status: 'registered',
        createdAt: new Date().toISOString(),
      },
      ...registrations,
    ];
    try {
      await save(next);
      const ownerId = String(current.ownerId || '');
      if (ownerId && ownerId !== user.id) {
        const result = await openContactConversation(supabase, {
          createdBy: user.id,
          ownerId,
          senderName: name,
          relatedType: 'event',
          relatedId: current.id,
          relatedPath: `/events/${current.id}`,
          relatedSnapshot: {
            type: 'event',
            id: current.id,
            title: String(current.title || 'Événement'),
            path: `/events/${current.id}`,
          },
        });
        dispatch(receiveRemoteConversation(mapConversationRow(result.conversation as unknown as Record<string, unknown>)));
        await dispatch(sendMessage({
          conversationId: result.id,
          senderId: user.id,
          senderName: name || 'Membre',
          text: t('events.detail.registerChatMessage'),
        }));
        router.push(`/messages/${result.id}` as never);
      }
    } catch (error) {
      showNotice('Événement', error instanceof Error ? error.message : 'Inscription impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome pathname="/events">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <PageHeader className="mx-0" title={String(event.title || 'Événement')} />
        <DetailMetrics
          items={[
            { emoji: '📅', label: t('events.detail.date'), value: formatWhen(String(event.startAt || '')) },
            { emoji: '📍', label: t('events.detail.location'), value: String(event.city || event.venue || '—') },
            { emoji: '👥', label: t('events.detail.seatsRemaining'), value: capacity ? String(Math.max(capacity - active.length, 0)) : '—' },
            { emoji: '✓', label: t('events.detail.access'), value: priceLabel },
          ]}
        />
        {images.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {images.map((src, index) => (
              <Pressable key={src} onPress={() => setGalleryIndex(index)}>
                <Image source={{ uri: src }} style={{ width: index === 0 ? 280 : 160, height: 160, borderRadius: 16 }} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <DetailSection title={t('events.detail.about')}>
          <AppText className="text-sm text-app-text-muted">{String(event.description || '')}</AppText>
        </DetailSection>
        <DetailFacts
          items={[
            { label: t('events.detail.facts.organizer'), value: String(event.organizerName || '—') },
            { label: t('events.detail.facts.category'), value: String(event.category || '—') },
            { label: t('events.detail.facts.city'), value: String(event.city || '—') },
            { label: t('events.detail.facts.capacity'), value: capacity ? t('events.detail.capacityValue', { count: capacity }) : '—' },
          ]}
        />
        <TrustPanel
          title={t('events.detail.trustTitle')}
          items={[t('events.detail.trust.venue'), t('events.detail.trust.confirmation'), t('events.detail.trust.contact')]}
        />
        <ContactButton
          ownerId={String(event.ownerId || '')}
          relatedType="event"
          relatedId={current.id}
          relatedPath={`/events/${current.id}`}
          relatedTitle={String(event.title || 'Événement')}
          variant="secondary"
          badge="Événement"
        />
        <FavoriteButton
          relatedId={current.id}
          relatedType="event"
          title={String(event.title || 'Événement')}
          path={`/events/${current.id}`}
        />
        {mine ? (
          <AppText className="text-sm font-semibold text-app-accent">{t('events.detail.registrationTracked')}</AppText>
        ) : isOwner ? (
          <AppText className="text-sm text-app-text-muted">{t('events.detail.ownerHint')}</AppText>
        ) : (
          <Pressable
            disabled={full || busy}
            onPress={() => void register()}
            style={{ minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: full ? colors.border : colors.accent }}>
            <AppText className="font-bold text-white">{full ? t('events.detail.eventFull') : busy ? t('events.detail.registering') : t('events.detail.register')}</AppText>
          </Pressable>
        )}
        {!isOwner && user?.id ? <Button variant="danger" onPress={() => setReportOpen(true)}>{t('events.detail.report')}</Button> : null}
        {isOwner ? (
          <EventParticipantsSection
            capacity={capacity}
            registrations={registrations.filter((item) => item.eventId === current.id) as EventRegistrationRow[]}
            onStatus={(registrationId, status) => {
              const next = registrations.map((item) => (item.id === registrationId ? { ...item, status } : item));
              void save(next);
            }}
          />
        ) : null}
        <PublisherBlock profile={publisherProfile} currentId={current.id} />
      </ScrollView>
      <DetailFloatingActions
        relatedId={current.id}
        title={String(event.title || 'Événement')}
        ownerId={String(event.ownerId || '')}
        isOwner={isOwner}
        relatedType="event"
        relatedPath={`/events/${current.id}`}
        editTo={isOwner ? `/publications/edit?id=${current.id}&type=event` : undefined}
      />
      <ImageGalleryViewer
        open={galleryIndex !== null}
        images={images}
        index={galleryIndex ?? 0}
        title={String(event.title || '')}
        onClose={() => setGalleryIndex(null)}
        onIndex={setGalleryIndex}
      />
      <ReportSheet
        open={reportOpen}
        title={t('events.detail.reportTitle')}
        target="event"
        targetId={current.id}
        userId={user?.id}
        userName={[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
        onClose={() => setReportOpen(false)}
      />
    </AppChrome>
  );
}
