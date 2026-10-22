import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Package, Briefcase, CalendarDays, ShoppingBag, Heart, MapPin, Clock, MessageCircle,
  type LucideIcon,
} from 'lucide-react-native';

import { formatCurrency, formatDateTime, formatShortDate } from '@moxt/shared/utils/formatters.js';

import {
  LISTING_TYPES,
  dashboardWidths,
  liveAccents,
  tw,
} from '@/constants/dashboardTailwind';
import { DashboardCardHeader, DashboardSectionHeading } from '@/components/dashboard/DashboardSectionHeading';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';

function LiveListSection({
  accent,
  Icon,
  iconColor,
  title,
  subtitle,
  path,
  items,
  renderMeta,
  renderHighlight,
  renderBadge,
}: {
  accent: keyof typeof liveAccents;
  Icon: LucideIcon;
  iconColor: string;
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
          Icon={Icon}
          iconColor={iconColor}
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
                    <Icon size={17} color={iconColor} strokeWidth={2.2} />
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
                  <View className="mt-2.5 flex-row items-center gap-1.5">
                    <CalendarDays size={13} color={iconColor} strokeWidth={2.2} />
                    <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                      {renderHighlight(item)}
                    </Text>
                  </View>
                ) : null}
                {renderBadge?.(item) ? (
                  <View className="mt-3 flex-row flex-wrap gap-1.5">
                    <Text className={cn(tw.liveChip, styles.chip)}>{renderBadge(item)?.toUpperCase()}</Text>
                  </View>
                ) : null}
                {item.footer ? (
                  <View className="mt-3 border-t border-app-border pt-3">
                    <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300" numberOfLines={1}>
                      {item.footer}
                    </Text>
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

function listingCard(listing: any, isFav: (id: string) => boolean, toggleFav: (listing: any) => void) {
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
          <LinearGradient colors={['#0e7490', '#2563eb']} style={StyleSheet.absoluteFill} className="items-center justify-center">
            <ShoppingBag size={40} color="#ffffff" strokeWidth={1.8} />
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
          className={cn(tw.listingHeart, liked ? 'bg-rose-600' : 'bg-white/20')}>
          <Heart size={16} color="#ffffff" strokeWidth={2.2} fill={liked ? '#ffffff' : 'transparent'} />
        </Pressable>
        <View className="absolute inset-x-0 bottom-0 p-3">
          <View className="mb-1.5 flex-row flex-wrap gap-1">
            {listing.type ? <Text className={tw.listingTag}>{LISTING_TYPES[listing.type] ?? listing.type}</Text> : null}
            {listing.category ? <Text className={tw.listingTagMuted}>{listing.category}</Text> : null}
          </View>
          <Text className={tw.listingTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <View className="mt-1.5 flex-row items-end justify-between gap-2">
            <Text className={tw.listingPrice}>
              {listing.price ? `${Number(listing.price).toLocaleString('fr-FR')} ${listing.currency || 'RUB'}` : 'Sur devis'}
            </Text>
            {listing.city ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={11} color="rgba(255,255,255,0.75)" strokeWidth={2.2} />
                <Text className={tw.listingCity}>{listing.city}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** DashboardPostCard du web (Actualités MOXT). */
function PostCard({ post }: { post: any }) {
  return (
    <Pressable
      style={{ width: dashboardWidths.post }}
      className="rounded-2xl bg-app-surface p-4"
      onPress={() => router.push('/(tabs)/feed' as any)}>
      <View className="absolute right-2.5 top-2.5 rounded-full bg-app-surface-muted px-1.5 py-0.5">
        <Text className="text-[9px] font-black text-app-text-muted">Actualité</Text>
      </View>
      <View className="flex-row items-center gap-2 pr-14">
        {post.authorAvatarUrl ? (
          <Image source={{ uri: post.authorAvatarUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} />
        ) : (
          <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-600">
            <Text className="text-[10px] font-black text-white">{post.authorName?.charAt(0)}</Text>
          </View>
        )}
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-bold text-app-text" numberOfLines={1}>
            {post.authorName}
          </Text>
          <Text className="text-[10px] text-app-text-faint">{post.createdAt ? formatShortDate(post.createdAt) : ''}</Text>
        </View>
      </View>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={{ marginTop: 10, height: 163, width: '100%', borderRadius: 12 }} resizeMode="cover" />
      ) : null}
      <Text className="mt-2.5 text-xs leading-5 text-app-text-muted" numberOfLines={3}>
        {post.message || post.text || post.content || post.title}
      </Text>
      <View className="mt-3 flex-row items-center gap-3 pt-2.5">
        <View className="flex-row items-center gap-1">
          <Heart size={10} color="#9ca3af" strokeWidth={2} />
          <Text className="text-[10px] text-app-text-faint">{post.likes?.length || 0}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MessageCircle size={10} color="#9ca3af" strokeWidth={2} />
          <Text className="text-[10px] text-app-text-faint">{post.comments?.length || 0}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Ordre du web : colis, jobs, événements, dernières annonces, actualités, votre activité. */
export function DashboardDiscoverySection({
  listings,
  parcels,
  jobs,
  events,
  posts,
  isFav,
  toggleFav,
  transfersCount,
  conversationsCount,
}: {
  listings: any[];
  parcels: any[];
  jobs: any[];
  events: any[];
  posts: any[];
  isFav: (id: string) => boolean;
  toggleFav: (listing: any) => void;
  transfersCount: number;
  conversationsCount: number;
}) {
  const { t } = useLanguage();
  return (
    <View className="gap-6">
      <LiveListSection
        accent="parcels"
        Icon={Package}
        iconColor="#059669"
        title={t('dashboard.discovery.availableParcels')}
        subtitle={t('dashboard.discovery.recentTrips')}
        path="/parcel"
        items={parcels.slice(0, 5).map((p) => ({
          id: p.id,
          title: [p.origin, p.destination].filter(Boolean).join(' → ') || p.id,
          chips: [
            `${p.remainingKg ?? p.capacityKg ?? 0} kg dispo`,
            p.pricePerKg != null ? `${formatCurrency(p.pricePerKg, p.currency || 'RUB')}/kg` : null,
          ].filter(Boolean) as string[],
          meta: p.ownerName,
          highlight: p.departureDate ? `Départ ${formatShortDate(p.departureDate)}` : null,
        }))}
        renderMeta={(item) => item.meta || ''}
        renderHighlight={(item) => item.highlight}
      />

      <LiveListSection
        accent="jobs"
        Icon={Briefcase}
        iconColor="#7c3aed"
        title={t('dashboard.discovery.recentJobs')}
        subtitle={t('dashboard.discovery.recentMissions')}
        path="/jobs"
        items={jobs.map((j) => ({
          id: j.id,
          title: j.title,
          meta: [j.salary ? `${j.salary} ${j.currency || 'RUB'}` : null, j.city || j.location].filter(Boolean).join(' · '),
          badge: j.sector || j.contractType,
        }))}
        renderMeta={(item) => item.meta}
        renderBadge={(item) => item.badge}
      />

      <LiveListSection
        accent="events"
        Icon={CalendarDays}
        iconColor="#d97706"
        title={t('dashboard.discovery.upcomingEvents')}
        subtitle={t('dashboard.discovery.upcomingMeetups')}
        path="/search"
        items={events.map((e) => ({
          id: e.id,
          title: e.title,
          meta: [e.city, e.format === 'online' ? t('dashboard.discovery.online') : null].filter(Boolean).join(' · '),
          footer: e.startAt ? formatDateTime(e.startAt) : null,
          badge: e.organizerName || e.category,
        }))}
        renderMeta={(item) => item.meta}
        renderBadge={(item) => item.badge}
      />

      {listings.length > 0 ? (
        <>
          <DashboardSectionHeading
            title={t('dashboard.discovery.latestListings')}
            linkLabel={t('dashboard.discovery.viewMarket')}
            onPress={() => router.push('/(tabs)/marketplace' as any)}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={tw.carouselTrack}>
            {listings.slice(0, 4).map((listing) => listingCard(listing, isFav, toggleFav))}
          </ScrollView>
        </>
      ) : null}

      {posts.length > 0 ? (
        <>
          <DashboardSectionHeading
            title={t('dashboard.discovery.newsTitle')}
            linkLabel={t('dashboard.discovery.readAll')}
            onPress={() => router.push('/(tabs)/feed' as any)}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={tw.carouselTrack}>
            {posts.slice(0, 4).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View className="mx-4">
        <View className={tw.activityCard}>
          <View className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/25" />
          <View className={tw.activityIcon}>
            <Clock size={20} color="#ffffff" strokeWidth={2.2} />
          </View>
          <Text className={tw.activityTitle}>{t('dashboard.activity.title')}</Text>
          <Text className={tw.activitySubtitle}>{t('dashboard.activity.description')}</Text>
          <View className="mt-7 gap-3">
            {(
              [
                [transfersCount, t('dashboard.activity.transfers'), '/(tabs)/transfers'],
                [conversationsCount, t('dashboard.activity.discussions'), '/(tabs)/messages'],
                [jobs.length + events.length, t('dashboard.activity.activity'), '/favorites'],
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
              <Text className="text-sm font-black text-white dark:text-slate-950">{t('dashboard.activity.myActivities')}</Text>
            </Pressable>
            <Pressable className={cn(tw.activityBtnGhost, 'flex-row items-center gap-2')} onPress={() => router.push('/(tabs)/messages' as any)}>
              <MessageCircle size={16} color="#ffffff" strokeWidth={2.2} />
              <Text className="text-sm font-black text-white">{t('dashboard.activity.messages')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
