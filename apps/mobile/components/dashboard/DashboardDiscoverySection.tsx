import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { formatShortDate } from '@moxt/shared/utils/formatters.js';

import {
  LISTING_TYPES,
  dashboardWidths,
  liveAccents,
  tw,
} from '@/constants/dashboardTailwind';
import { DashboardCardHeader, DashboardSectionHeading } from '@/components/dashboard/DashboardSectionHeading';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

function LiveListSection({
  accent,
  emoji,
  title,
  subtitle,
  path,
  items,
  renderMeta,
  renderHighlight,
  renderBadge,
}: {
  accent: keyof typeof liveAccents;
  emoji: string;
  title: string;
  subtitle: string;
  path: string;
  items: any[];
  renderMeta: (item: any) => string;
  renderHighlight?: (item: any) => string | null;
  renderBadge?: (item: any) => string | null;
}) {
  if (!items.length) return null;
  const styles = liveAccents[accent];

  return (
    <View className={tw.liveListCard}>
      <View className={tw.liveListHeader}>
        <DashboardCardHeader
          emoji={emoji}
          iconClass={styles.icon}
          title={title}
          subtitle={subtitle}
          onOpen={() => router.push(path as any)}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={tw.liveListTrack}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={{ width: dashboardWidths.live }}
            onPress={() => router.push(`${path}/${item.id}` as any)}>
            <View className={tw.liveTile}>
              <LinearGradient
                colors={styles.stripe as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={tw.liveTileStripe}
              />
              <View className={tw.liveTileBody}>
                <View className="flex-row items-start gap-3">
                  <View className={cn('h-10 w-10 items-center justify-center rounded-xl', styles.icon)}>
                    <Text className="text-lg">{emoji}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className={tw.liveTileTitle} numberOfLines={2}>
                      {item.title ?? item.label}
                    </Text>
                    {renderMeta(item) ? (
                      <Text className={tw.liveTileMeta} numberOfLines={1}>
                        {renderMeta(item)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {renderHighlight?.(item) ? (
                  <Text className={tw.liveTileHighlight}>📅 {renderHighlight(item)}</Text>
                ) : null}
                {renderBadge?.(item) ? (
                  <View className="mt-3 flex-row flex-wrap gap-1.5">
                    <Text className={cn(tw.liveChip, styles.chip)}>{renderBadge(item)?.toUpperCase()}</Text>
                  </View>
                ) : null}
                {item.chips?.length ? (
                  <View className="mt-3 flex-row flex-wrap gap-1.5">
                    {item.chips.map((chip: string) => (
                      <Text key={chip} className={cn(tw.liveChip, styles.chip)}>
                        {chip}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function DashboardDiscoverySection({
  listings,
  parcels,
  jobs,
  events,
  isFav,
  toggleFav,
  transfersCount,
  conversationsCount,
}: {
  listings: any[];
  parcels: any[];
  jobs: any[];
  events: any[];
  isFav: (id: string) => boolean;
  toggleFav: (listing: any) => void;
  transfersCount: number;
  conversationsCount: number;
}) {
  return (
    <View className="gap-6">
      <DashboardSectionHeading
        title="Dernières annonces"
        linkLabel="Voir le marché"
        onPress={() => router.push('/marketplace' as any)}
      />
      {listings.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={tw.carouselTrack}>
          {listings.slice(0, 6).map((listing) => {
            const liked = isFav(listing.id);
            return (
              <Pressable
                key={listing.id}
                style={{ width: dashboardWidths.listing }}
                className={tw.listingCard}
                onPress={() => router.push(`/listing/${listing.id}` as any)}>
                <View className={tw.listingImage}>
                  {listing.images?.[0] ? (
                    <Image source={{ uri: listing.images[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={['#0e7490', '#2563eb']}
                      style={StyleSheet.absoluteFill}
                      className="items-center justify-center">
                      <Text className="text-4xl text-white">🛍️</Text>
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)']}
                    locations={[0.3, 0.6, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Pressable
                    onPress={() => toggleFav(listing)}
                    hitSlop={8}
                    className={cn(
                      tw.listingHeart,
                      liked ? 'bg-rose-600' : 'bg-white/20',
                    )}>
                    <Text className="text-sm text-white">♥</Text>
                  </Pressable>
                  <View className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <View className="mb-1.5 flex-row flex-wrap gap-1">
                      {listing.type ? (
                        <Text className={tw.listingTag}>{LISTING_TYPES[listing.type] ?? listing.type}</Text>
                      ) : null}
                      {listing.category ? (
                        <Text className={tw.listingTagMuted}>{listing.category}</Text>
                      ) : null}
                    </View>
                    <Text className={tw.listingTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    <View className="mt-1.5 flex-row items-end justify-between gap-2">
                      <Text className={tw.listingPrice}>
                        {listing.price
                          ? `${Number(listing.price).toLocaleString('fr-FR')} ${listing.currency || 'RUB'}`
                          : 'Sur devis'}
                      </Text>
                      {listing.city ? <Text className={tw.listingCity}>📍 {listing.city}</Text> : null}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <LiveListSection
        accent="parcels"
        emoji="📦"
        title="Colis disponibles"
        subtitle="Voyages récents avec kilos disponibles."
        path="/parcel"
        items={parcels.slice(0, 5).map((p) => ({
          id: p.id,
          title: [p.origin, p.destination].filter(Boolean).join(' → ') || p.id,
          chips: [
            `${p.remainingKg ?? p.capacityKg ?? 0} kg dispo`,
            p.pricePerKg != null ? `${p.pricePerKg} RUB/kg` : null,
          ].filter(Boolean) as string[],
          meta: p.ownerName,
          highlight: p.departureDate ? `Départ ${formatShortDate(p.departureDate)}` : null,
        }))}
        renderMeta={(item) => item.meta || ''}
        renderHighlight={(item) => item.highlight}
      />

      <LiveListSection
        accent="jobs"
        emoji="💼"
        title="Jobs récents"
        subtitle="Missions et opportunités disponibles."
        path="/jobs"
        items={jobs.map((j) => ({
          id: j.id,
          title: j.title,
          meta: [j.salary ? `${j.salary} ${j.currency || 'RUB'}` : null, j.city].filter(Boolean).join(' · '),
          badge: j.sector || j.type,
        }))}
        renderMeta={(item) => item.meta}
        renderBadge={(item) => item.badge}
      />

      <LiveListSection
        accent="events"
        emoji="📅"
        title="Événements à venir"
        subtitle="Rencontres, ateliers et formations."
        path="/search"
        items={events.map((e) => ({
          id: e.id,
          title: e.title,
          meta: [e.city, e.format === 'online' ? 'En ligne' : null].filter(Boolean).join(' · '),
          highlight: e.start_at ? formatShortDate(e.start_at) : null,
          badge: e.category,
        }))}
        renderMeta={(item) => item.meta}
        renderHighlight={(item) => item.highlight}
        renderBadge={(item) => item.badge}
      />

      <DashboardSectionHeading title="Actualités MOXT" linkLabel="Tout lire" onPress={() => router.push('/search' as any)} />
      <Card className="mx-4 items-center gap-3 py-10">
        <Text className="text-3xl">📰</Text>
        <Text className="text-center text-sm text-app-text-muted dark:text-zinc-400">
          Aucune actualité pour le moment.
        </Text>
        <Pressable className={tw.secondaryBtn} onPress={() => router.push('/search' as any)}>
          <Text className={tw.secondaryBtnText}>Voir la page actualités</Text>
        </Pressable>
      </Card>

      <View className="mx-4">
        <View className={tw.activityCard}>
          <View className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/25" />
          <View className={tw.activityIcon}>
            <Text className="text-xl">🕐</Text>
          </View>
          <Text className={tw.activityTitle}>Votre activité MOXT</Text>
          <Text className={tw.activitySubtitle}>
            Retrouvez vos opérations, conversations et suivis importants dans un seul espace.
          </Text>
          <View className="mt-7 gap-3">
            {(
              [
                [transfersCount, 'Transferts', '/transfers'],
                [conversationsCount, 'Discussions', '/messages'],
                [jobs.length + events.length, 'Opportunités', '/jobs'],
              ] as [number, string, string][]
            ).map(([value, label, to]) => (
              <Pressable key={label} className={tw.activityTile} onPress={() => router.push(to as any)}>
                <Text className={tw.activityTileValue}>{value}</Text>
                <Text className={tw.activityTileLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-6 flex-row gap-3">
            <Pressable className={tw.activityBtnPrimary} onPress={() => router.push('/favorites' as any)}>
              <Text className="text-sm font-black text-white dark:text-slate-950">Mes activités</Text>
            </Pressable>
            <Pressable className={tw.activityBtnGhost} onPress={() => router.push('/messages' as any)}>
              <Text className="text-sm font-black text-white">💬  Messages</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
