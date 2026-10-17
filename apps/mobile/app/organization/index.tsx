import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Layers,
  MapPin,
  Package,
  Phone,
  Plus,
  Repeat,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessActivityLabel } from '@moxt/shared/config/businessActivityLabels.js';

import { BusinessVerificationProgress } from '@/components/business/BusinessVerificationProgress';
import { AppText } from '@/components/ui/AppText';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  Business,
  loadBusinesses,
  loadBusinessesByIds,
  loadSubscriptions,
  selectMySubscriptions,
  selectOwnedBusinesses,
} from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { brand } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';

const DIRECTORY_SERVICES = [
  { key: '', label: 'Tous', icon: Layers },
  { key: 'Transfert', label: 'Transfert', icon: Repeat },
  { key: 'Colis', label: 'Colis', icon: Package },
  { key: 'Marketplace', label: 'Marketplace', icon: Store },
  { key: 'Jobs', label: 'Jobs', icon: Briefcase },
  { key: 'Events', label: 'Events', icon: Calendar },
];

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  RU: { name: 'Russie', flag: '🇷🇺' },
  BJ: { name: 'Bénin', flag: '🇧🇯' },
  BF: { name: 'Burkina Faso', flag: '🇧🇫' },
  CM: { name: 'Cameroun', flag: '🇨🇲' },
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  ML: { name: 'Mali', flag: '🇲🇱' },
  NE: { name: 'Niger', flag: '🇳🇪' },
  SN: { name: 'Sénégal', flag: '🇸🇳' },
  TG: { name: 'Togo', flag: '🇹🇬' },
  GA: { name: 'Gabon', flag: '🇬🇦' },
  CG: { name: 'Congo', flag: '🇨🇬' },
  CD: { name: 'R.D. Congo', flag: '🇨🇩' },
  GN: { name: 'Guinée', flag: '🇬🇳' },
  TD: { name: 'Tchad', flag: '🇹🇩' },
};

export default function BusinessesScreen() {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const businesses = useAppSelector((state) => state.account.businesses);
  const businessById = useAppSelector((state) => state.account.businessById);
  const subscriptions = useAppSelector((state) => state.account.subscriptions);
  const loading = useAppSelector(
    (state) => Boolean(state.account.loading.businesses || state.account.loading.subscriptions),
  );

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [service, setService] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const refresh = () => {
    if (!userId) return;
    dispatch(loadBusinesses(userId));
    dispatch(loadSubscriptions());
  };

  useEffect(refresh, [dispatch, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const owned = useMemo(() => selectOwnedBusinesses(businesses, userId), [businesses, userId]);
  const ownBusiness = owned[0] || null;

  const followed = useMemo(
    () =>
      selectMySubscriptions(subscriptions, userId).filter(
        (item) => item.publisherType === 'business',
      ),
    [subscriptions, userId],
  );

  const missingIds = useMemo(
    () => followed.map((item) => item.publisherId).filter((id) => !businessById[id]),
    [followed, businessById],
  );

  useEffect(() => {
    if (missingIds.length) dispatch(loadBusinessesByIds(missingIds));
  }, [dispatch, missingIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const countryOptions = useMemo(() => {
    const codes = new Set<string>();
    for (const b of businesses) {
      const code = String(b.originCountry || b.country || '').trim().toUpperCase();
      if (code) codes.add(code);
    }
    return Object.entries(COUNTRY_MAP)
      .filter(([code]) => codes.has(code))
      .map(([code, item]) => ({ code, name: item.name, flag: item.flag }));
  }, [businesses]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of businesses) {
      if (country && String(b.originCountry || b.country || '').trim().toUpperCase() !== country) {
        continue;
      }
      const c = String(b.city || '').trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [businesses, country]);

  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ready = new Set(['verified', 'approved', 'active']);
    return businesses
      .filter((business) => {
        if (business.deletedByUserAt) return false;
        if (ownBusiness && ownBusiness.id === business.id) return false;
        const status = String(business.status || '').toLowerCase();
        if (status && !ready.has(status) && !business.verified) return false;
        const services = Array.isArray(business.services) ? business.services.map(String) : [];
        if (service && !services.includes(service)) return false;
        if (country) {
          const bCountry = String(business.originCountry || business.country || '').trim().toUpperCase();
          if (bCountry !== country) return false;
        }
        if (city && !String(business.city || '').toLowerCase().includes(city.trim().toLowerCase())) {
          return false;
        }
        if (!q) return true;
        const haystack = `${business.name || ''} ${business.city || ''} ${business.primaryActivity || ''} ${business.description || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const pinDelta = Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt));
        if (pinDelta !== 0) return pinDelta;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [businesses, city, country, ownBusiness, query, service]);

  const activeAdvancedFilterCount = Number(Boolean(country)) + Number(Boolean(city));
  const insets = useSafeAreaInsets();
  const shadows = useShadows();
  const { onScroll, scrollEventThrottle } = useSmartNavbarScroll();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle || 16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={brand[700]} />}
      >
        {/* Droplet Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as never))}
            style={[
              {
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              shadows.card,
            ]}
          >
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
              Entreprises
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              {directory.length} partenaire(s) vérifié(s)
            </AppText>
          </View>

          <Button
            size="sm"
            variant="primary"
            onPress={() => router.push('/organization/setup' as never)}
            style={{ paddingHorizontal: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Plus size={14} color="#ffffff" strokeWidth={2.4} />
              <AppText className="text-xs font-bold text-white">
                {ownBusiness ? 'Modifier' : 'Créer'}
              </AppText>
            </View>
          </Button>
        </View>

        {/* Own Business Featured Card */}
        {ownBusiness ? (
          <Card variant="featured" className="p-4 gap-3 border border-app-border" style={shadows.card}>
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <AppText className="text-[11px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Votre entreprise
                </AppText>
                <AppText className="text-lg font-black text-app-text mt-0.5">
                  {ownBusiness.name}
                </AppText>
                <AppText className="text-xs text-app-text-muted mt-0.5">
                  {[businessActivityLabel(ownBusiness.primaryActivity), ownBusiness.city]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
              <StatusBadge status={String(ownBusiness.status || 'pending')} />
            </View>

            <BusinessVerificationProgress business={ownBusiness} />

            <View className="flex-row flex-wrap gap-2 pt-2 border-t border-app-border/40">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => router.push('/professional' as never)}
              >
                Espace pro
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => router.push('/organization/setup' as never)}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => router.push(`/organization/${ownBusiness.id}` as never)}
              >
                Voir profil public →
              </Button>
            </View>
          </Card>
        ) : null}

        {/* Service Pills Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
        >
          {DIRECTORY_SERVICES.map(({ key, label, icon: Icon }) => {
            const active = service === key;
            return (
              <Pressable
                key={key || 'all'}
                onPress={() => setService(key)}
                className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                  active
                    ? 'bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500'
                    : 'bg-app-surface border-app-border'
                }`}
                style={shadows.card}
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

        {/* Search & Filter Bar */}
        <View className="gap-2.5">
          <View className="flex-row items-center gap-2">
            <View
              className="flex-1 flex-row items-center gap-2.5 px-3.5 min-h-[46px] rounded-2xl border border-app-border bg-app-surface"
              style={shadows.card}
            >
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une entreprise, activité..."
                placeholderTextColor={colors.textFaint}
                className="flex-1 font-medium text-app-text"
                style={{ fontSize: 16, color: colors.text }}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <X size={15} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={() => setAdvancedOpen((prev) => !prev)}
              className={`flex-row items-center gap-1.5 px-3.5 min-h-[46px] rounded-2xl border ${
                activeAdvancedFilterCount > 0
                  ? 'bg-brand-50 border-brand-600 dark:bg-brand-950/40'
                  : 'bg-app-surface border-app-border'
              }`}
              style={shadows.card}
            >
              <SlidersHorizontal
                size={15}
                color={activeAdvancedFilterCount > 0 ? brand[600] : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  activeAdvancedFilterCount > 0 ? 'text-brand-700 dark:text-brand-300' : 'text-app-text'
                }`}
              >
                Filtres{activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''}
              </Text>
              {advancedOpen ? (
                <ChevronUp size={14} color={colors.textMuted} />
              ) : (
                <ChevronDown size={14} color={colors.textMuted} />
              )}
            </Pressable>
          </View>

          {/* Advanced Filter Panel */}
          {advancedOpen ? (
            <Card variant="flat" className="p-3.5 gap-3 rounded-2xl" style={shadows.card}>
              <View className="gap-1.5">
                <Text className="text-[11px] font-black uppercase text-app-text-faint">
                  Pays d'origine
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <Pressable
                    onPress={() => setCountry('')}
                    className={`px-3 py-1.5 rounded-xl border ${
                      !country ? 'bg-brand-600 border-brand-600' : 'bg-app-surface border-app-border'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${!country ? 'text-white' : 'text-app-text'}`}>
                      Tous les pays
                    </Text>
                  </Pressable>
                  {countryOptions.map((c) => (
                    <Pressable
                      key={c.code}
                      onPress={() => setCountry(c.code === country ? '' : c.code)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        country === c.code
                          ? 'bg-brand-600 border-brand-600'
                          : 'bg-app-surface border-app-border'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          country === c.code ? 'text-white' : 'text-app-text'
                        }`}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] font-black uppercase text-app-text-faint">
                  Ville
                </Text>
                <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl border border-app-border bg-app-surface">
                  <MapPin size={14} color={colors.textMuted} />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Filtrer par ville..."
                    placeholderTextColor={colors.textFaint}
                    className="flex-1 text-app-text"
                    style={{ fontSize: 16, color: colors.text }}
                  />
                  {city ? (
                    <Pressable onPress={() => setCity('')}>
                      <X size={13} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {(country || city) ? (
                <Pressable
                  onPress={() => {
                    setCountry('');
                    setCity('');
                  }}
                  className="self-end pt-1"
                >
                  <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    Réinitialiser les filtres
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          ) : null}

          {/* Active filter badges */}
          {!advancedOpen && activeAdvancedFilterCount > 0 ? (
            <View className="flex-row flex-wrap items-center gap-2">
              {country ? (
                <Pressable
                  onPress={() => setCountry('')}
                  className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 dark:bg-brand-950/40 dark:border-brand-800"
                >
                  <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                    Pays: {country}
                  </Text>
                  <X size={12} color={brand[600]} />
                </Pressable>
              ) : null}
              {city ? (
                <Pressable
                  onPress={() => setCity('')}
                  className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 dark:bg-brand-950/40 dark:border-brand-800"
                >
                  <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                    Ville: {city}
                  </Text>
                  <X size={12} color={brand[600]} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Directory List */}
        <View className="gap-3">
          <AppText className="text-base font-black text-app-text">
            Annuaire des partenaires ({directory.length})
          </AppText>

          {directory.map((business) => {
            const initials = String(business.name || '')
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join('');
            const services = Array.isArray(business.services) ? business.services : [];

            return (
              <Pressable
                key={business.id}
                onPress={() => router.push(`/organization/${business.id}` as never)}
              >
                <Card variant="verified" className="p-4 gap-3.5" style={shadows.card}>
                  <View className="flex-row items-start gap-3">
                    {business.logoUrl ? (
                      <Image
                        source={{ uri: String(business.logoUrl) }}
                        className="size-13 rounded-2xl bg-app-surface-muted"
                      />
                    ) : (
                      <View className="size-13 rounded-2xl bg-brand-600 dark:bg-brand-500 items-center justify-center">
                        {initials ? (
                          <Text className="text-white font-black text-base">{initials}</Text>
                        ) : (
                          <Building2 size={22} color="#ffffff" />
                        )}
                      </View>
                    )}

                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5">
                        <AppText numberOfLines={1} className="text-base font-black text-app-text flex-1">
                          {business.name}
                        </AppText>
                        <VerifiedIcon size={14} />
                      </View>

                      <AppText className="text-xs text-app-text-muted mt-0.5">
                        {[businessActivityLabel(business.primaryActivity), business.city]
                          .filter(Boolean)
                          .join(' · ')}
                      </AppText>

                      <View className="flex-row items-center gap-2 mt-1.5">
                        <StatusBadge status={String(business.status || 'verified')} />
                        <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10">
                          <Star size={11} color="#f59e0b" fill="#f59e0b" />
                          <Text className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            5.0
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {business.description ? (
                    <Text
                      numberOfLines={2}
                      className="text-xs text-app-text-muted leading-relaxed"
                    >
                      {business.description}
                    </Text>
                  ) : null}

                  {services.length > 0 ? (
                    <View className="flex-row flex-wrap gap-1.5">
                      {services.slice(0, 3).map((s) => (
                        <View
                          key={String(s)}
                          className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20"
                        >
                          <Text className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                            {String(s)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View className="flex-row items-center justify-between pt-2.5 border-t border-app-border/40 text-xs">
                    <View className="flex-row items-center gap-3">
                      {business.city ? (
                        <View className="flex-row items-center gap-1">
                          <MapPin size={12} color={colors.textMuted} />
                          <Text className="text-xs text-app-text-muted">{business.city}</Text>
                        </View>
                      ) : null}
                      {business.phone ? (
                        <View className="flex-row items-center gap-1">
                          <Phone size={12} color={colors.textMuted} />
                          <Text className="text-xs text-app-text-muted">{business.phone}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">
                        Voir la fiche
                      </Text>
                      <ChevronRight size={14} color={brand[600]} />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {!directory.length ? (
            <EmptyState
              title="Aucune entreprise trouvée"
              description="Ajustez vos filtres ou effectuez une recherche différente pour afficher les partenaires."
            />
          ) : null}
        </View>

        {/* Followed Businesses */}
        {followed.length > 0 ? (
          <View className="gap-3 pt-4 border-t border-app-border">
            <AppText className="text-base font-black text-app-text">
              Entreprises suivies ({followed.length})
            </AppText>
            {followed.map((sub) => {
              const b =
                businessById[sub.publisherId] ||
                ({
                  id: sub.publisherId,
                  ownerId: '',
                  name: sub.publisherName || 'Entreprise',
                } as Business);
              return (
                <Pressable
                  key={sub.id}
                  onPress={() => router.push(`/organization/${b.id}` as never)}
                >
                  <Card variant="flat" className="p-3.5 flex-row items-center gap-3" style={shadows.card}>
                    <View className="size-10 rounded-xl bg-app-surface items-center justify-center">
                      <Building2 size={18} color={colors.textMuted} />
                    </View>
                    <View className="flex-1">
                      <AppText className="text-sm font-bold text-app-text">{b.name}</AppText>
                      <AppText className="text-xs text-app-text-muted">Abonné</AppText>
                    </View>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
