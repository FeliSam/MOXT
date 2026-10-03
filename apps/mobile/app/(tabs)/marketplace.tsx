import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LayoutGrid, List, Plus, Search, ShoppingBag, SlidersVertical, X } from 'lucide-react-native';

import { MarketplaceListingCard, DISCOVERY_CARD_HEIGHT } from '@/components/marketplace/MarketplaceListingCard';
import {
  MarketplaceDiscoveryRail,
  MarketplaceVideoRail,
  RAIL_BADGE_COLORS,
  railCardWidth,
} from '@/components/marketplace/MarketplaceRails';
import { CATEGORIES_BY_TYPE, LISTING_TYPES_META } from '@/components/marketplace/listingMeta';
import { buildMarketplaceDiscovery, rankMarketplaceVideos } from '@/components/marketplace/marketplaceFeed';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { clearSearchHistory, mergeSearchTerm, readSearchHistory, saveSearchTerm } from '@/services/searchHistory';
import { loadListings } from '@/store/marketplace';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useIsDark, useShadows, useThemeColors } from '@/theme/ThemeContext';
import { brand } from '@/theme/colors';

const GRID_GAP = 3.6;
/** .theme-community (index.css) : surface-muted / border chauds. */
const COMMUNITY = {
  light: { muted: '#fff4ec', border: '#f0e4d8' },
  dark: { muted: '#2a221c', border: '#3d342c' },
};

/** .community-warm-bg : radial-gradient(circle at 95% 5%, rgba(255,107,74,0.07) 0%, transparent 35%). */
function WarmBackground({ width, height }: { width: number; height: number }) {
  if (!width || !height) return null;
  const cx = width * 0.95;
  const cy = height * 0.05;
  const farthest = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="warm" cx={cx} cy={cy} r={farthest * 0.35} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#ff6b4a" stopOpacity={0.07} />
            <Stop offset="1" stopColor="#ff6b4a" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#warm)" />
      </Svg>
    </View>
  );
}

/** MarketplaceTypeChip du web : tuile 5rem × 5.35rem, icône 36 px en dégradé, libellé 10px. */
function TypeChip({
  active,
  label,
  icon: Icon,
  colors: gradient,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: typeof LayoutGrid;
  colors?: [string, string];
  onPress: () => void;
}) {
  const isDark = useIsDark();
  const border = isDark ? COMMUNITY.dark.border : COMMUNITY.light.border;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="shrink-0 items-center justify-center gap-1.5 px-1.5"
      style={{
        width: 80,
        height: 85.6,
        borderRadius: 17.6,
        backgroundColor: active ? (isDark ? brand[600] : brand[700]) : undefined,
        boxShadow: active
          ? '0 1px 2px 0 rgba(0,0,0,0.05)'
          : `0 0 0 1px ${border}, 0 1px 2px 0 rgba(0,0,0,0.05)`,
      }}>
      {!active ? <View className="absolute inset-0 rounded-[17.6px] bg-app-surface" /> : null}
      {active ? (
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Icon size={18} color="#fff" strokeWidth={2} />
        </View>
      ) : (
        <LinearGradient
          colors={gradient || ['#16a98f', '#14b8a6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="#fff" strokeWidth={2} />
        </LinearGradient>
      )}
      <View className="w-full items-center justify-center" style={{ height: 27.2 }}>
        <AppText
          numberOfLines={2}
          className={active ? 'text-center text-[10px] font-black text-white' : 'text-center text-[10px] font-black text-app-text-muted'}
          style={{ letterSpacing: 0.25, lineHeight: 12.5 }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

function IslandButton({ icon: Icon, label, onPress }: { icon: typeof List; label: string; onPress: () => void }) {
  const shadows = useShadows();
  const isDark = useIsDark();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-2xl border border-app-border"
      style={shadows.card}>
      <Icon size={16} color={isDark ? brand[300] : brand[700]} strokeWidth={2} />
    </Pressable>
  );
}

type Filters = { query: string; type: string; category: string; city: string; min: string; max: string };
const EMPTY_FILTERS: Filters = { query: '', type: '', category: '', city: '', min: '', max: '' };

function FilterInput({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className="min-w-0 flex-1 gap-1.5">
      <AppText className="text-xs font-bold text-app-text-muted">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholderTextColor={colors.textFaint}
        className="h-11 rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text"
      />
    </View>
  );
}

export default function MarketplaceScreen() {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const shadows = useShadows();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const items = useAppSelector((s) => s.marketplace.items);
  const loading = useAppSelector((s) => s.marketplace.loading);
  const authStatus = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);
  const favorites = useAppSelector((s) => s.favorites.items);
  const videos = useAppSelector((s) => s.feed.videos);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);
  const discoverY = useRef(0);
  const anchorY = useRef(0);
  const wrapperY = useRef(0);
  const contentHeight = useRef(0);

  /** useScrollToSecondSection du web : la page s'ouvre sur les tuiles (scroll-mt-24), une fois le contenu assez haut. */
  function tryAutoScroll() {
    if (didAutoScroll.current || !anchorY.current) return;
    const target = Math.max(0, anchorY.current - 16);
    if (contentHeight.current < target + viewportHeight) return;
    didAutoScroll.current = true;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: target, animated: false }));
  }
  const community = isDark ? COMMUNITY.dark : COMMUNITY.light;

  const contentWidth = Math.min(viewportWidth, 960) - 32;
  const itemWidth = railCardWidth(viewportWidth);
  const gridColumns = viewportWidth >= 768 ? 3 : 2;
  const gridItemWidth = (contentWidth - GRID_GAP * (gridColumns - 1)) / gridColumns;

  useEffect(() => {
    // Lecture publique (comme le web) : les invités voient aussi les annonces actives.
    if (authStatus !== 'loading') dispatch(loadListings());
  }, [dispatch, authStatus]);

  const [history, setHistory] = useState<string[]>([]);
  const update = (patch: Partial<Filters>) => setFilters((cur) => ({ ...cur, ...patch }));
  const searching = Boolean(filters.query.trim() || filters.category || filters.city || filters.min || filters.max);
  const searchTerms = useMemo(() => {
    const live = filters.query.trim();
    if (live.length >= 2 && !history.some((term) => term.toLocaleLowerCase('fr') === live.toLocaleLowerCase('fr'))) {
      return [live, ...history];
    }
    return history;
  }, [filters.query, history]);

  useEffect(() => {
    readSearchHistory().then(setHistory);
  }, []);

  function onQueryChange(query: string) {
    update({ query });
    if (query.trim().length >= 2) {
      setHistory((current) => mergeSearchTerm(current, query));
      saveSearchTerm(query).then(setHistory);
    }
  }

  const feed = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const text = `${item.title} ${item.description || ''} ${item.category || ''} ${item.city || ''}`.toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (!filters.type || item.type === filters.type) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.city || `${item.city || ''}`.toLowerCase().includes(filters.city.toLowerCase())) &&
        (!filters.min || Number(item.price) >= Number(filters.min)) &&
        (!filters.max || Number(item.price) <= Number(filters.max))
      );
    });
    return {
      ...buildMarketplaceDiscovery(filtered, {
        userId: user?.id,
        userCity: (user as { city?: string } | null)?.city,
        favorites: favorites.map((f) => ({ id: f.id, type: f.type, addedAt: f.addedAt })),
        searching,
        searchTerms,
      }),
      total: filtered.length,
    };
  }, [items, filters, user, favorites, searching, searchTerms]);

  const videoRail = useMemo(
    () => rankMarketplaceVideos(videos, { userId: user?.id, searchTerms }),
    [videos, user?.id, searchTerms],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(loadListings());
    setRefreshing(false);
  }, [dispatch]);

  // Positions onLayout relatives au parent : padding (12) + bloc tuiles + section + titre « Découvrir ».
  const scrollToDiscover = () =>
    scrollRef.current?.scrollTo({
      y: Math.max(0, 12 + anchorY.current + wrapperY.current + discoverY.current - 16),
      animated: true,
    });
  const activeFilterCount = [filters.category, filters.city, filters.min, filters.max].filter(Boolean).length;
  const categoryOptions = filters.type ? CATEGORIES_BY_TYPE[filters.type] || [] : [];

  if (authStatus === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-app-bg">
        <ActivityIndicator size="large" color={brand[700]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-bg">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(width, height) => {
          setContentSize({ width, height });
          contentHeight.current = height;
          tryAutoScroll();
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand[700]} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 128 }}>
        <WarmBackground width={contentSize.width} height={contentSize.height} />
        <View style={{ gap: 28, width: '100%', maxWidth: 960, alignSelf: 'center' }}>
          {/* PageHeader du web ; comme useScrollToSecondSection, la page s'ouvre sur les tuiles. */}
          <View className="gap-3 rounded-[18px] bg-app-surface/80 p-4" style={shadows.card}>
            <AppText className="font-display text-xl text-app-text" style={{ letterSpacing: -0.4 }} numberOfLines={1}>
              Marketplace
            </AppText>
            <View className="flex-row flex-wrap items-center gap-2">
              <IslandButton icon={List} label="Mes publications" onPress={() => router.push('/listing/mine' as never)} />
              <IslandButton icon={Plus} label="Publier une annonce" onPress={() => router.push('/listing/create' as never)} />
            </View>
          </View>

          <View
            style={{ gap: 20 }}
            onLayout={(e) => {
              anchorY.current = e.nativeEvent.layout.y;
              tryAutoScroll();
            }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -4 }}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 4, paddingBottom: 4, paddingTop: 1 }}>
              <TypeChip
                active={!filters.type}
                icon={LayoutGrid}
                label="Tout"
                onPress={() => update({ type: '', category: '' })}
              />
              {LISTING_TYPES_META.map((option) => (
                <TypeChip
                  key={option.value}
                  active={filters.type === option.value}
                  icon={option.icon}
                  colors={option.colors}
                  label={option.label}
                  onPress={() => update({ type: option.value, category: '' })}
                />
              ))}
            </ScrollView>

            {/* CatalogSearch du web */}
            <View className="rounded-[18px] border border-app-border bg-app-surface p-4" style={[shadows.card, { borderColor: community.border }]}>
              <View className="flex-row items-center gap-2">
                <View className="min-w-0 flex-1 justify-center">
                  <View pointerEvents="none" className="absolute left-4 z-10">
                    <Search size={16} color={colors.textFaint} strokeWidth={2} />
                  </View>
                  <TextInput
                    accessibilityLabel={t('catalog.search.label')}
                    placeholder="Rechercher : iPhone, coiffure, appartement, électricien..."
                    placeholderTextColor={colors.textFaint}
                    value={filters.query}
                    onChangeText={onQueryChange}
                    numberOfLines={1}
                    className="rounded-xl pl-11 pr-12 text-base text-app-text"
                    style={{ minHeight: 52, backgroundColor: community.muted }}
                  />
                  {filters.query ? (
                    <Pressable
                      accessibilityLabel={t('catalog.search.clearSearch')}
                      onPress={() => setFilters(EMPTY_FILTERS)}
                      className="absolute right-3 h-9 w-9 items-center justify-center rounded-xl">
                      <X size={16} color={colors.textMuted} strokeWidth={2} />
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel={t('catalog.search.filters')}
                  accessibilityState={{ expanded: advancedOpen }}
                  onPress={() => setAdvancedOpen((v) => !v)}
                  className={
                    advancedOpen
                      ? 'h-[52px] flex-row items-center justify-center gap-1 rounded-[14px] bg-brand-700 px-3.5 dark:bg-brand-400'
                      : 'h-[52px] flex-row items-center justify-center gap-1 rounded-[14px] border border-app-border-md bg-app-surface px-3.5'
                  }>
                  <SlidersVertical size={18} color={advancedOpen ? (isDark ? '#020617' : '#fff') : colors.text} strokeWidth={2} />
                  {activeFilterCount > 0 ? (
                    <View className={advancedOpen ? 'h-5 w-5 items-center justify-center rounded-full bg-white/25' : 'h-5 w-5 items-center justify-center rounded-full bg-brand-700'}>
                      <AppText className="text-[10px] font-black text-white">{activeFilterCount}</AppText>
                    </View>
                  ) : null}
                </Pressable>
              </View>
              {history.length ? (
                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  <AppText className="text-xs font-bold text-app-text-muted">Récent</AppText>
                  {history.map((term) => (
                    <Pressable key={term} onPress={() => onQueryChange(term)} className="rounded-full bg-app-surface-muted px-3 py-1.5">
                      <AppText className="text-xs font-semibold text-app-text">{term}</AppText>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => {
                      clearSearchHistory();
                      setHistory([]);
                    }}>
                    <AppText className="text-xs font-bold text-red-600">Effacer</AppText>
                  </Pressable>
                </View>
              ) : null}

              {advancedOpen ? (
                <View className="mt-4 rounded-2xl border border-app-border p-4" style={{ backgroundColor: community.muted, borderColor: community.border }}>
                  <View className="mb-4 flex-row items-start justify-between gap-3 border-b border-app-border pb-3">
                    <View className="min-w-0 flex-1">
                      <AppText className="text-xs font-black uppercase text-brand-700 dark:text-brand-300" style={{ letterSpacing: 1.44 }}>
                        {t('catalog.search.advancedTitle')}
                      </AppText>
                      <AppText className="mt-1 text-xs text-app-text-faint" style={{ lineHeight: 20 }}>
                        {t('catalog.search.advancedDescription')}
                      </AppText>
                    </View>
                    <Pressable onPress={() => setFilters(EMPTY_FILTERS)} className="rounded-full bg-app-surface px-3 py-1.5">
                      <AppText className="text-xs font-black text-brand-700 dark:text-brand-300">{t('catalog.search.clearAll')}</AppText>
                    </Pressable>
                  </View>
                  <View className="gap-3">
                    <View className="gap-1.5">
                      <AppText className="text-xs font-bold text-app-text-muted">Catégorie</AppText>
                      {categoryOptions.length ? (
                        <View className="flex-row flex-wrap gap-1.5">
                          {[{ value: '', label: 'Toutes' }, ...categoryOptions].map((option) => {
                            const on = filters.category === option.value;
                            return (
                              <Pressable
                                key={option.value || 'all'}
                                onPress={() => update({ category: option.value })}
                                className={on ? 'rounded-full bg-brand-700 px-3 py-1.5' : 'rounded-full border border-app-border bg-app-surface px-3 py-1.5'}>
                                <AppText className={on ? 'text-xs font-bold text-white' : 'text-xs font-bold text-app-text-muted'}>
                                  {option.label}
                                </AppText>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <AppText className="text-xs text-app-text-faint">Choisissez un type d abord</AppText>
                      )}
                    </View>
                    <FilterInput label="Ville / quartier" value={filters.city} onChange={(city) => update({ city })} />
                    <View className="flex-row gap-3">
                      <FilterInput label="Prix minimum" numeric value={filters.min} onChange={(min) => update({ min })} />
                      <FilterInput label="Prix maximum" numeric value={filters.max} onChange={(max) => update({ max })} />
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            {loading && items.length === 0 ? (
              <View className="items-center gap-3 py-16">
                <ActivityIndicator size="large" color={brand[700]} />
              </View>
            ) : feed.discover.length ? (
              <View onLayout={(e) => (wrapperY.current = e.nativeEvent.layout.y)}>
                {!searching ? (
                  <View style={{ gap: 24 }}>
                    <MarketplaceDiscoveryRail
                      title="Pour vous"
                      badge={{ label: 'Pour vous', color: RAIL_BADGE_COLORS.forYou }}
                      listings={feed.forYou}
                      itemWidth={itemWidth}
                      onViewAll={scrollToDiscover}
                    />
                    <MarketplaceDiscoveryRail
                      title="Tendances"
                      badge={{ label: 'Tendance', color: RAIL_BADGE_COLORS.trending }}
                      listings={feed.trending}
                      itemWidth={itemWidth}
                      onViewAll={scrollToDiscover}
                    />
                    <MarketplaceVideoRail
                      videos={videoRail}
                      itemWidth={itemWidth}
                      onViewAll={() => router.push({ pathname: '/(tabs)/feed', params: { type: 'video' } } as never)}
                    />
                    <MarketplaceDiscoveryRail
                      title="Nouveautés"
                      badge={{ label: 'Nouveau', color: RAIL_BADGE_COLORS.fresh }}
                      listings={feed.fresh}
                      itemWidth={itemWidth}
                      onViewAll={scrollToDiscover}
                    />
                  </View>
                ) : null}
                <View
                  className="gap-3"
                  style={{ marginTop: searching ? 0 : 24 }}
                  onLayout={(e) => {
                    discoverY.current = e.nativeEvent.layout.y;
                  }}>
                  <View className="min-w-0">
                    <AppText className="font-display text-sm text-app-text" style={{ letterSpacing: -0.35 }}>
                      {searching ? 'Résultats' : 'Découvrir'}
                    </AppText>
                    {searching ? (
                      <AppText className="mt-0.5 text-xs text-app-text-muted">
                        Classés par pertinence, engagement et proximité.
                      </AppText>
                    ) : null}
                  </View>
                  <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                    {feed.discover.map((listing) => (
                      <MarketplaceListingCard
                        key={listing.id}
                        listing={listing}
                        width={gridItemWidth}
                        height={DISCOVERY_CARD_HEIGHT}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View className="items-center gap-3 rounded-[18px] bg-app-surface px-6 py-12" style={shadows.card}>
                <View className="h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: isDark ? '#2a1814' : '#fff0eb' }}>
                  <ShoppingBag size={24} color="#ff6b4a" strokeWidth={2} />
                </View>
                <AppText className="text-base font-black text-app-text">Aucune annonce trouvée</AppText>
                <AppText className="text-center text-sm text-app-text-muted">
                  Essayez d&apos;élargir votre recherche ou publiez la vôtre des maintenant.
                </AppText>
                <Pressable onPress={() => router.push('/listing/create' as never)} className="mt-1 flex-row items-center gap-2 rounded-[14px] bg-brand-700 px-5 py-3">
                  <Plus size={16} color="#fff" strokeWidth={2} />
                  <AppText className="text-sm font-bold text-white">Publier une annonce</AppText>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
