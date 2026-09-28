import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
  PUBLICATION_TYPE_IDS,
  PUBLICATION_TYPE_LABELS,
  emptyPublications,
  filterPublicationsByTabs,
  preferredPublicationArchiveTab,
} from '@moxt/shared/domain/publicationRules.js';
import {
  fetchUserPublications,
  summarizeUserPublications,
} from '@moxt/shared/services/publicationsService.js';

import { PageHeader } from '@/components/ui/PageHeader';
import { supabase } from '@/services/supabase';
import { useLanguage } from '@/providers/LanguageProvider';
import { selectMySubscriptions } from '@/store/account';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '@/theme/colors';
import { BackHeader } from '@/components/chrome/BackHeader';

type ArchiveTab = 'active' | 'archived';
type TypeTab = 'listing' | 'parcel' | 'job' | 'event' | 'video' | 'post' | 'other';

type Publication = {
  id: string;
  title?: string;
  status?: string;
  views?: number;
  origin?: string;
  destination?: string;
  fromCurrency?: string;
  toCurrency?: string;
  amount?: number;
  text?: string;
  content?: string;
  [key: string]: unknown;
};

type Publications = Record<
  'listings' | 'parcels' | 'jobs' | 'events' | 'videos' | 'posts' | 'others',
  Publication[]
>;

const TYPE_TABS: TypeTab[] = PUBLICATION_TYPE_IDS as TypeTab[];

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  published: 'Publiée',
  pending_review: 'En vérification',
  archived: 'Archivée',
  sold: 'Vendue',
  expired: 'Expirée',
  draft: 'Brouillon',
  completed: 'Terminé',
  full: 'Complet',
  closed: 'Clôturée',
};

function publicationTitle(type: TypeTab, item: Publication) {
  if (type === 'parcel') return `${item.origin || '?'} → ${item.destination || '?'}`;
  if (type === 'other') {
    const pair = [item.fromCurrency, item.toCurrency].filter(Boolean).join(' → ');
    return item.title || (pair ? `Offre P2P ${pair}` : 'Offre P2P');
  }
  if (type === 'post') return item.title || String(item.text || item.content || 'Publication').slice(0, 80);
  return item.title || 'Sans titre';
}

function publicationRoute(type: TypeTab, item: Publication) {
  if (type === 'listing') return `/listing/${item.id}`;
  if (type === 'job') return `/jobs/${item.id}`;
  if (type === 'parcel') return '/(tabs)/parcels';
  return null;
}

/**
 * Mes publications — mêmes règles que la page web (portée personnelle, en attente comptée
 * comme active, toutes catégories dont « Autres » = offres P2P), données chargées par
 * propriétaire via le service partagé.
 */
export default function MyPublicationsScreen() {
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const [publications, setPublications] = useState<Publications>(
    emptyPublications() as Publications,
  );
  const [loading, setLoading] = useState(false);
  const [requestedArchiveTab, setArchiveTab] = useState<ArchiveTab>('active');
  const [requestedTypeTab, setTypeTab] = useState<TypeTab>('listing');
  // Web : panneau « Abonnements » de Mes publications (?panel=subscriptions).
  const [panel, setPanel] = useState<'publications' | 'subscriptions'>('publications');
  const allSubscriptions = useAppSelector((state) => state.account.subscriptions);
  const mySubscriptions = useMemo(
    () => selectMySubscriptions(allSubscriptions, user?.id),
    [allSubscriptions, user?.id],
  );
  const followedUsers = mySubscriptions.filter((item) => item.publisherType === 'user');
  const followedBusinesses = mySubscriptions.filter((item) => item.publisherType === 'business');

  const reload = useCallback(async () => {
    if (!supabase || !user?.id) return;
    setLoading(true);
    try {
      const result = await fetchUserPublications(supabase, user.id);
      setPublications(result.publications as Publications);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const summary = useMemo(() => summarizeUserPublications(publications), [publications]);
  const archiveCounts = summary.archiveCounts as { active: number; archived: number };
  const archiveTab = preferredPublicationArchiveTab(summary.scoped, requestedArchiveTab, {
    includePending: true,
  }) as ArchiveTab;
  const typeCounts = (archiveTab === 'active'
    ? summary.activeTypeCounts
    : summary.archivedTypeCounts) as Record<TypeTab, number>;
  const visibleTypeTabs = TYPE_TABS.filter((id) => (typeCounts[id] ?? 0) > 0);
  const typeTab: TypeTab =
    visibleTypeTabs.includes(requestedTypeTab) || !visibleTypeTabs.length
      ? requestedTypeTab
      : visibleTypeTabs[0];

  const visible = useMemo(() => {
    const filtered = filterPublicationsByTabs(summary.scoped, {
      archiveTab,
      typeTab,
      includePending: true,
    }) as Record<TypeTab, Publication[]>;
    return (filtered[typeTab] || []).map((item) => ({
      id: item.id,
      title: publicationTitle(typeTab, item),
      subtitle: [
        STATUS_LABELS[String(item.status)] || item.status,
        typeTab === 'listing' ? `${item.views || 0} ${translateLabel('vues')}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      route: publicationRoute(typeTab, item),
    }));
  }, [archiveTab, summary.scoped, translateLabel, typeTab]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BackHeader inline title="Mes publications" />
      </View>
      <PageHeader
        eyebrow="Compte"
        title={translateLabel('Mes publications')}
        description={
          loading
            ? 'Chargement…'
            : `${archiveCounts.active} active(s) · ${archiveCounts.archived} archive(s)`
        }
      />

      <View style={styles.tabs}>
        {([
          ['publications', 'Publications', archiveCounts.active + archiveCounts.archived],
          ['subscriptions', 'Abonnements', mySubscriptions.length],
        ] as const).map(([key, label, count]) => (
          <Pressable
            key={key}
            testID={`publication-panel-${key}`}
            style={[
              styles.tab,
              {
                backgroundColor: panel === key ? colors.surfaceMuted : colors.surface,
                borderColor: panel === key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setPanel(key)}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {translateLabel(label)} ({count})
            </Text>
          </Pressable>
        ))}
      </View>

      {panel === 'subscriptions' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {([
            ['Membres', followedUsers],
            ['Entreprises', followedBusinesses],
          ] as const).map(([label, items]) => (
            <View key={label} style={{ gap: spacing.sm }}>
              <Text style={[styles.cardTitle, { color: colors.textMuted }]}>
                {translateLabel(label)} · {items.length}
              </Text>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  testID={`subscription-${item.publisherType}-${item.publisherId}`}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
                  onPress={() =>
                    item.publisherType === 'business'
                      ? router.push(`/organization/${item.publisherId}` as any)
                      : undefined
                  }>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.publisherName || item.publisherId}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {translateLabel('Toutes les annonces')}
                    </Text>
                  </View>
                  {item.publisherType === 'business' ? (
                    <Text style={{ color: colors.primary, fontWeight: '800' }}>→</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
      <>
      <View style={styles.tabs}>
        {(['active', 'archived'] as const).map((key) => (
          <Pressable
            key={key}
            testID={`publication-archive-${key}`}
            style={[
              styles.tab,
              {
                backgroundColor: archiveTab === key ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setArchiveTab(key)}>
            <Text style={{ color: archiveTab === key ? '#fff' : colors.text, fontWeight: '800' }}>
              {translateLabel(key === 'active' ? 'Actives' : 'Archives')} (
              {archiveCounts[key]})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeTabs}>
        {visibleTypeTabs.map((tabId) => (
          <Pressable
            key={tabId}
            testID={`publication-type-${tabId}`}
            style={[
              styles.typeTab,
              {
                backgroundColor: typeTab === tabId ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setTypeTab(tabId)}>
            <Text style={{ color: typeTab === tabId ? '#fff' : colors.text, fontWeight: '700' }}>
              {translateLabel(PUBLICATION_TYPE_LABELS[tabId])} ({typeCounts[tabId]})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>{typeTab === 'parcel' ? '📦' : typeTab === 'job' ? '💼' : '📋'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {translateLabel(
                archiveTab === 'active' ? 'Aucune publication active' : 'Aucune archive',
              )}
            </Text>
          </View>
        ) : (
          visible.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              onPress={() => item.route && router.push(item.route as any)}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.subtitle}</Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>→</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
      </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  backArrow: { fontSize: 18, fontWeight: '800' },
  backLabel: { ...typography.label },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tab: { flex: 1, borderWidth: 1, borderRadius: radii.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  typeTabs: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  typeTab: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: { ...typography.label },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  emptyTitle: { ...typography.sectionTitle },
});
