import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRightLeft,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  Layers,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  X,
} from 'lucide-react-native';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { brand } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

type SearchResult = {
  id: string;
  type: 'transfer' | 'parcel' | 'listing' | 'job' | 'event';
  title: string;
  subtitle?: string;
  city?: string;
  price?: number;
  currency?: string;
  date?: string;
  image?: string | null;
  badge?: string;
};

type FilterType = 'all' | 'listing' | 'parcel' | 'job' | 'event' | 'transfer';

const FILTER_CONFIG = [
  { key: 'all' as const, label: 'Tous', icon: Layers },
  { key: 'listing' as const, label: 'Annonces', icon: Store },
  { key: 'parcel' as const, label: 'Colis', icon: Package },
  { key: 'job' as const, label: 'Emplois', icon: Briefcase },
  { key: 'event' as const, label: 'Événements', icon: Calendar },
  { key: 'transfer' as const, label: 'Transferts', icon: ArrowRightLeft },
];

const POPULAR_TAGS = [
  'iPhone',
  'Moscou → Cotonou',
  'Appartement',
  'Toyota',
  'Samsung',
  'Paris → Lomé',
  'Développeur',
  'Vêtements',
];

const TYPE_THEMES = {
  listing: {
    label: 'Annonce',
    icon: Store,
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    color: '#d97706',
  },
  parcel: {
    label: 'Colis',
    icon: Package,
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    color: '#0284c7',
  },
  job: {
    label: 'Emploi',
    icon: Briefcase,
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    color: '#059669',
  },
  event: {
    label: 'Événement',
    icon: Calendar,
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    color: '#7c3aed',
  },
  transfer: {
    label: 'Transfert',
    icon: ArrowRightLeft,
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    color: '#0d9488',
  },
} as const;

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const { onScroll, scrollEventThrottle } = useSmartNavbarScroll();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const transfers = useAppSelector((state) => state.transfers.items);
  const parcels = useAppSelector((state) => state.parcels.items);
  const listings = useAppSelector((state) => state.marketplace.items);
  const jobs = useAppSelector((state) => state.dashboard.jobs);
  const events = useAppSelector((state) => state.dashboard.events);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    const city = cityFilter.toLowerCase().trim();
    const pMin = minPrice ? parseFloat(minPrice) : null;
    const pMax = maxPrice ? parseFloat(maxPrice) : null;
    const res: SearchResult[] = [];

    // Marketplace Listings
    if (typeFilter === 'all' || typeFilter === 'listing') {
      listings.forEach((l) => {
        if (l.status && l.status !== 'active') return;
        const searchableText = `${l.title || ''} ${l.description || ''} ${l.category || ''} ${l.brand || ''} ${l.model || ''} ${l.city || ''} ${l.district || ''}`.toLowerCase();
        if (q && !searchableText.includes(q)) return;
        if (city && !(l.city || '').toLowerCase().includes(city)) return;
        const price = l.price || 0;
        if (pMin !== null && price < pMin) return;
        if (pMax !== null && price > pMax) return;
        const img = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null;
        res.push({
          id: l.id,
          type: 'listing',
          title: l.title,
          subtitle: [l.category, l.city].filter(Boolean).join(' · ') || 'Annonce Marketplace',
          city: l.city,
          price: l.price,
          currency: l.currency || 'RUB',
          image: img,
          badge: l.category || 'Annonce',
        });
      });
    }

    // Parcels
    if (typeFilter === 'all' || typeFilter === 'parcel') {
      parcels.forEach((p) => {
        const route = `${p.origin || ''} → ${p.destination || ''}`;
        const searchable = `${route} ${p.ownerName || ''} ${p.conditions || ''} ${p.id || ''}`.toLowerCase();
        if (q && !searchable.includes(q)) return;
        if (city && !(p.origin || '').toLowerCase().includes(city) && !(p.destination || '').toLowerCase().includes(city)) return;
        const price = p.pricePerKg || 0;
        if (pMin !== null && price < pMin) return;
        if (pMax !== null && price > pMax) return;
        res.push({
          id: p.id,
          type: 'parcel',
          title: route || `Colis ${p.id.slice(0, 8)}`,
          subtitle: p.remainingKg != null ? `${p.remainingKg} kg disponibles` : (p.ownerName ? `Par ${p.ownerName}` : 'Trajet voyageur'),
          city: p.origin,
          price: p.pricePerKg,
          currency: p.currency || 'XOF',
          badge: 'Colis',
        });
      });
    }

    // Jobs
    if (typeFilter === 'all' || typeFilter === 'job') {
      (jobs || []).forEach((j: any) => {
        const searchable = `${j.title || ''} ${j.description || ''} ${j.city || ''} ${j.contractType || ''} ${j.businessName || ''}`.toLowerCase();
        if (q && !searchable.includes(q)) return;
        if (city && !(j.city || '').toLowerCase().includes(city)) return;
        const img = Array.isArray(j.images) && j.images.length > 0 ? j.images[0] : null;
        res.push({
          id: j.id,
          type: 'job',
          title: j.title || 'Offre d’emploi',
          subtitle: [j.contractType, j.city, j.businessName].filter(Boolean).join(' · ') || 'Recrutement',
          city: j.city,
          price: j.salaryMin || j.salaryMax || undefined,
          currency: j.currency || 'RUB',
          image: img,
          badge: j.contractType || 'Emploi',
        });
      });
    }

    // Events
    if (typeFilter === 'all' || typeFilter === 'event') {
      (events || []).forEach((e: any) => {
        const searchable = `${e.title || ''} ${e.description || ''} ${e.venue || ''} ${e.city || ''} ${e.organizerName || ''}`.toLowerCase();
        if (q && !searchable.includes(q)) return;
        if (city && !(e.city || '').toLowerCase().includes(city)) return;
        const img = e.coverUrl || e.imageUrl || (Array.isArray(e.images) && e.images[0]) || null;
        res.push({
          id: e.id,
          type: 'event',
          title: e.title || 'Événement',
          subtitle: [e.city, e.venue].filter(Boolean).join(' · ') || 'Événement MOXT',
          city: e.city,
          price: e.ticketPrice || undefined,
          currency: e.currency || 'XOF',
          date: e.startAt || e.createdAt,
          image: img,
          badge: 'Événement',
        });
      });
    }

    // Transfers
    if (typeFilter === 'all' || typeFilter === 'transfer') {
      transfers.forEach((t) => {
        const searchable = `${t.id || ''} ${t.direction || ''} ${t.currencyFrom || ''} ${t.currencyTo || ''}`.toLowerCase();
        if (q && !searchable.includes(q)) return;
        const amt = (t as any).amountSent ?? (t as any).amount;
        if (pMin !== null && amt < pMin) return;
        if (pMax !== null && amt > pMax) return;
        res.push({
          id: t.id,
          type: 'transfer',
          title: `Transfert ${t.id.slice(0, 8)}`,
          subtitle: t.direction ? `Direction · ${t.direction}` : 'Transfert d’argent',
          price: amt,
          currency: t.currencyFrom || 'XOF',
          date: t.createdAt,
          badge: 'Transfert',
        });
      });
    }

    return res.slice(0, 60);
  }, [cityFilter, events, jobs, listings, maxPrice, minPrice, parcels, query, transfers, typeFilter]);

  const handlePress = (item: SearchResult) => {
    if (item.type === 'transfer') router.push(`/transfer/${item.id}` as never);
    else if (item.type === 'parcel') router.push(`/parcel/${item.id}` as never);
    else if (item.type === 'listing') router.push(`/listing/${item.id}` as never);
    else if (item.type === 'job') router.push(`/jobs/${item.id}` as never);
    else if (item.type === 'event') router.push(`/events/${item.id}` as never);
  };

  const activeFiltersCount =
    (typeFilter !== 'all' ? 1 : 0) + (cityFilter ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  const hasSearchInput = Boolean(query.trim() || cityFilter.trim() || minPrice || maxPrice || typeFilter !== 'all');

  return (
    <AppChrome pathname="/search">
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 16 }}
      >
        {/* Modern Top Header Row */}
        <View className="flex-row items-center justify-between gap-3 pt-1">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-400">
              EXPLORER & RECHERCHER
            </Text>
            <Text className="text-xl font-black text-app-text" numberOfLines={1}>
              Recherche globale
            </Text>
            <Text className="text-xs font-semibold text-app-text-muted" numberOfLines={1}>
              {hasSearchInput ? `${results.length} résultat(s) trouvé(s)` : 'Annonces, colis, emplois, transferts'}
            </Text>
          </View>
        </View>

        {/* Search input with filter trigger */}
        <View className="gap-2.5">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center gap-2.5 px-3.5 min-h-[48px] rounded-2xl border border-app-border bg-app-surface shadow-sm">
              <Search size={17} color={colors.textMuted} />
              <TextInput
                placeholder="Que recherchez-vous ? (produit, ville, colis...)"
                placeholderTextColor={colors.textFaint}
                value={query}
                onChangeText={setQuery}
                style={{ fontSize: 16 }}
                className="flex-1 text-sm font-semibold text-app-text"
                autoCorrect={false}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10}>
                  <X size={16} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={() => setShowFilters((prev) => !prev)}
              className={`flex-row items-center gap-1.5 px-3.5 min-h-[48px] rounded-2xl border shadow-sm ${
                activeFiltersCount > 0
                  ? 'bg-brand-50 border-brand-600 dark:bg-brand-950/40'
                  : 'bg-app-surface border-app-border'
              }`}
            >
              <SlidersHorizontal
                size={15}
                color={activeFiltersCount > 0 ? brand[600] : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  activeFiltersCount > 0 ? 'text-brand-700 dark:text-brand-300' : 'text-app-text'
                }`}
              >
                Filtres{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
              {showFilters ? (
                <ChevronUp size={14} color={colors.textMuted} />
              ) : (
                <ChevronDown size={14} color={colors.textMuted} />
              )}
            </Pressable>
          </View>

          {/* Type Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          >
            {FILTER_CONFIG.map(({ key, label, icon: Icon }) => {
              const active = typeFilter === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTypeFilter(key)}
                  className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                    active
                      ? 'bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500'
                      : 'bg-app-surface border-app-border'
                  }`}
                >
                  <Icon size={13} color={active ? '#ffffff' : colors.textMuted} />
                  <Text
                    className={`text-xs font-bold ${
                      active ? 'text-white' : 'text-app-text'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Advanced Filters Card */}
          {showFilters ? (
            <Card variant="flat" className="p-3.5 gap-3 rounded-2xl border border-app-border">
              <View className="gap-1.5">
                <Text className="text-[11px] font-black uppercase text-app-text-faint">
                  Filtrer par ville ou destination
                </Text>
                <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl border border-app-border bg-app-surface">
                  <MapPin size={14} color={colors.textMuted} />
                  <TextInput
                    value={cityFilter}
                    onChangeText={setCityFilter}
                    placeholder="Ex: Moscou, Cotonou, Paris..."
                    placeholderTextColor={colors.textFaint}
                    style={{ fontSize: 16 }}
                    className="flex-1 text-sm font-semibold text-app-text"
                  />
                  {cityFilter ? (
                    <Pressable onPress={() => setCityFilter('')}>
                      <X size={13} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] font-black uppercase text-app-text-faint">
                  Fourchette de prix / montant
                </Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="Min"
                    placeholderTextColor={colors.textFaint}
                    keyboardType="numeric"
                    style={{ fontSize: 16 }}
                    className="flex-1 px-3 py-2 rounded-xl border border-app-border bg-app-surface text-sm font-semibold text-app-text"
                  />
                  <Text className="text-app-text-faint">-</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Max"
                    placeholderTextColor={colors.textFaint}
                    keyboardType="numeric"
                    style={{ fontSize: 16 }}
                    className="flex-1 px-3 py-2 rounded-xl border border-app-border bg-app-surface text-sm font-semibold text-app-text"
                  />
                </View>
              </View>

              {activeFiltersCount > 0 ? (
                <Pressable
                  onPress={() => {
                    setTypeFilter('all');
                    setCityFilter('');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="self-end pt-1"
                >
                  <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    Réinitialiser tous les filtres
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          ) : null}
        </View>

        {/* Popular Tags when not searching */}
        {!hasSearchInput && (
          <View className="gap-2.5">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={14} color={brand[600]} />
              <Text className="text-xs font-black uppercase tracking-wider text-app-text-muted">
                Recherches fréquentes
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setQuery(tag)}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl border border-app-border bg-app-surface"
                >
                  <Tag size={11} color={colors.textMuted} />
                  <Text className="text-xs font-bold text-app-text">{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Results List */}
        <View className="gap-3">
          {!hasSearchInput && (
            <View className="flex-row items-center gap-1.5 pt-2">
              <Flame size={14} color="#f97316" />
              <Text className="text-xs font-black uppercase tracking-wider text-app-text-muted">
                Dernières annonces & publications
              </Text>
            </View>
          )}

          {results.map((item) => {
            const theme = TYPE_THEMES[item.type] || TYPE_THEMES.listing;
            const Icon = theme.icon;

            return (
              <Pressable key={`${item.type}-${item.id}`} onPress={() => handlePress(item)}>
                <Card variant="interactive" className="p-3.5 gap-2.5">
                  <View className="flex-row items-start gap-3">
                    {/* Thumbnail Image or Icon */}
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f172a' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        className={`size-12 rounded-xl items-center justify-center ${theme.bg}`}
                      >
                        <Icon size={20} color={theme.color} />
                      </View>
                    )}

                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center justify-between gap-2">
                        <AppText numberOfLines={1} className="text-sm font-black text-app-text flex-1">
                          {item.title}
                        </AppText>
                        <Badge tone="neutral">{item.badge || theme.label}</Badge>
                      </View>

                      {item.subtitle ? (
                        <AppText numberOfLines={1} className="text-xs text-app-text-muted mt-0.5">
                          {item.subtitle}
                        </AppText>
                      ) : null}
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-app-border/40">
                    <View className="flex-row items-center gap-2">
                      {item.city ? (
                        <View className="flex-row items-center gap-1">
                          <MapPin size={11} color={colors.textMuted} />
                          <Text className="text-[11px] text-app-text-muted">{item.city}</Text>
                        </View>
                      ) : null}
                      {item.date ? (
                        <Text className="text-[11px] text-app-text-faint">
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </Text>
                      ) : null}
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      {item.price != null ? (
                        <Text className="text-xs font-black text-brand-700 dark:text-brand-300">
                          {formatCurrency(item.price, item.currency || 'RUB')}
                        </Text>
                      ) : null}
                      <ChevronRight size={14} color={colors.textMuted} />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {!results.length && hasSearchInput ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucun élément ne correspond à votre recherche. Essayez d'autres mots-clés ou réinitialisez les filtres."
            />
          ) : null}
        </View>
      </ScrollView>
    </AppChrome>
  );
}
