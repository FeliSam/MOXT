import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Plus,
  Repeat,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { FALLBACK_EXCHANGERS } from '@/constants/transfers';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { brand } from '@/theme/palette';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';

type ExchangerDisplay = {
  id: string;
  name: string;
  rating: number;
  averageDelay: string;
  feePercent: number;
  city?: string;
  country?: string;
  phone?: string;
  verified?: boolean;
  logoUrl?: string | null;
  rateRubToXof?: number;
  rateXofToRub?: number;
};

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  BF: '🇧🇫',
  CM: '🇨🇲',
  CI: '🇨🇮',
  ML: '🇲🇱',
  NE: '🇳🇪',
  SN: '🇸🇳',
  TG: '🇹🇬',
  RU: '🇷🇺',
  GA: '🇬🇦',
  CG: '🇨🇬',
  CD: '🇨🇩',
  GN: '🇬🇳',
};

export default function ExchangersScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const businesses = useAppSelector((state) => state.account.businesses);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [scope, setScope] = useState<'mine' | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const userCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ') || 'BJ';

  // Merge live businesses having transfer services with fallback exchangers
  const allExchangers = useMemo<ExchangerDisplay[]>(() => {
    const list: ExchangerDisplay[] = [];
    const seen = new Set<string>();

    const transferBusinesses = businesses.filter(
      (b) =>
        b.primaryActivity === 'transfer' ||
        (Array.isArray(b.services) && b.services.some((s) => String(s).toLowerCase().includes('transfer'))),
    );

    for (const b of transferBusinesses) {
      seen.add(b.id);
      list.push({
        id: b.id,
        name: b.name || 'Échangeur Partenaire',
        rating: typeof b.rating === 'number' ? b.rating : 4.9,
        averageDelay: typeof b.averageDelay === 'string' ? b.averageDelay : '15-30 min',
        feePercent: typeof b.feePercent === 'number' ? b.feePercent : 2.5,
        city: typeof b.city === 'string' ? b.city : undefined,
        country: typeof b.country === 'string' ? b.country : undefined,
        phone: typeof b.phone === 'string' ? b.phone : undefined,
        verified: true,
        logoUrl: typeof b.logoUrl === 'string' ? b.logoUrl : null,
        rateRubToXof: typeof b.rateRubToXof === 'number' ? b.rateRubToXof : 7.42,
        rateXofToRub: typeof b.rateXofToRub === 'number' ? b.rateXofToRub : 0.135,
      });
    }

    for (const f of FALLBACK_EXCHANGERS) {
      if (!seen.has(f.id)) {
        list.push({
          id: f.id,
          name: f.name,
          rating: f.rating,
          averageDelay: f.averageDelay,
          feePercent: f.feePercent,
          city: 'Moscou',
          country: 'RU',
          phone: undefined,
          verified: true,
          logoUrl: null,
          rateRubToXof: 7.42,
          rateXofToRub: 0.135,
        });
      }
    }

    return list;
  }, [businesses]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cityFilter = city.trim().toLowerCase();

    return allExchangers.filter((item) => {
      if (scope === 'mine' && userCountry) {
        const itemCountry = item.country?.toUpperCase();
        if (itemCountry && itemCountry !== userCountry.toUpperCase() && itemCountry !== 'RU') {
          return false;
        }
      }
      if (cityFilter && !item.city?.toLowerCase().includes(cityFilter)) {
        return false;
      }
      if (!q) return true;
      const haystack = `${item.name} ${item.city || ''} ${item.country || ''} ${item.averageDelay}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allExchangers, city, query, scope, userCountry]);

  const { onScroll } = useSmartNavbarScroll();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}
      >
        {/* Header Row */}
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
            ]}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
              Échangeurs
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              {visible.length} partenaire(s) de change vérifié(s)
            </AppText>
          </View>
          <Button
            size="sm"
            variant="primary"
            onPress={() => router.push('/transfer/wizard' as never)}
            style={{ paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Plus size={14} color="#ffffff" strokeWidth={2.4} />
              <AppText className="text-xs font-bold text-white">Nouveau</AppText>
            </View>
          </Button>
        </View>

        {/* Scope selector tabs */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => setScope('all')}
            style={[
              {
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 14,
                borderWidth: 1,
                alignItems: 'center',
                backgroundColor: scope === 'all' ? colors.accent : colors.surface,
                borderColor: scope === 'all' ? colors.accent : colors.border,
              },
              shadows.card,
            ]}
          >
            <AppText
              className="text-xs font-bold"
              style={{ color: scope === 'all' ? '#ffffff' : colors.text }}
            >
              Tous les changeurs ({allExchangers.length})
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setScope('mine')}
            style={[
              {
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 14,
                borderWidth: 1,
                alignItems: 'center',
                backgroundColor: scope === 'mine' ? colors.accent : colors.surface,
                borderColor: scope === 'mine' ? colors.accent : colors.border,
              },
              shadows.card,
            ]}
          >
            <AppText
              className="text-xs font-bold"
              style={{ color: scope === 'mine' ? '#ffffff' : colors.text }}
            >
              {COUNTRY_FLAGS[userCountry] || '🌍'} Mon pays ({userCountry})
            </AppText>
          </Pressable>
        </View>

        {/* Search & Filters */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                minHeight: 48,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Échangeur, ville ou délai..."
                placeholderTextColor={colors.textFaint}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: colors.text,
                  paddingVertical: 8,
                }}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <X size={15} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={() => setShowFilters((prev) => !prev)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                minHeight: 48,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: city ? colors.accent : colors.border,
                backgroundColor: city ? colors.accentSoft : colors.surface,
              }}
            >
              <SlidersHorizontal
                size={15}
                color={city ? colors.accent : colors.textMuted}
              />
              <AppText
                className="text-xs font-bold"
                style={{ color: city ? colors.accent : colors.text }}
              >
                Ville{city ? ' (1)' : ''}
              </AppText>
            </Pressable>
          </View>

          {showFilters ? (
            <Card variant="flat" style={{ padding: 12, gap: 8 }}>
              <AppText className="text-[11px] font-black uppercase text-app-text-faint">
                Filtrer par ville
              </AppText>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  minHeight: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <MapPin size={14} color={colors.textMuted} />
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ex: Moscou, Cotonou, Douala..."
                  placeholderTextColor={colors.textFaint}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                    paddingVertical: 6,
                  }}
                />
                {city ? (
                  <Pressable onPress={() => setCity('')}>
                    <X size={13} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ) : null}
        </View>

        {/* Exchangers List */}
        <View style={{ gap: 14 }}>
          {visible.map((exchanger) => {
            const initial = exchanger.name.charAt(0).toUpperCase();
            const flag = COUNTRY_FLAGS[exchanger.country || ''] || '🌍';

            return (
              <Card key={exchanger.id} variant="verified" style={{ padding: 14, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  {exchanger.logoUrl ? (
                    <Image
                      source={{ uri: exchanger.logoUrl }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: colors.surfaceMuted,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: colors.accentSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <AppText className="text-xl font-black text-app-accent">
                        {initial}
                      </AppText>
                    </View>
                  )}

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AppText numberOfLines={1} className="text-base font-black text-app-text flex-1">
                        {exchanger.name}
                      </AppText>
                      {exchanger.verified ? <VerifiedIcon size={14} /> : null}
                    </View>

                    <AppText className="text-xs text-app-text-muted mt-0.5">
                      {flag} {[exchanger.city, exchanger.country].filter(Boolean).join(' · ')}
                    </AppText>
                  </View>

                  <Badge tone="success">DISPONIBLE</Badge>
                </View>

                {/* 3 Metric Cells */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 14,
                    backgroundColor: colors.surfaceMuted,
                    padding: 10,
                  }}
                >
                  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <AppText className="text-xs font-black text-app-text">
                        {exchanger.rating.toFixed(1)}
                      </AppText>
                    </View>
                    <AppText className="text-[10px] text-app-text-faint">Note</AppText>
                  </View>

                  <View style={{ width: 1, height: 24, backgroundColor: colors.border }} />

                  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                    <AppText className="text-xs font-black text-app-text">
                      {exchanger.feePercent}%
                    </AppText>
                    <AppText className="text-[10px] text-app-text-faint">Frais</AppText>
                  </View>

                  <View style={{ width: 1, height: 24, backgroundColor: colors.border }} />

                  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color={colors.textMuted} />
                      <AppText className="text-xs font-black text-app-text" numberOfLines={1}>
                        {exchanger.averageDelay}
                      </AppText>
                    </View>
                    <AppText className="text-[10px] text-app-text-faint">Délai</AppText>
                  </View>
                </View>

                {/* Exchange Rates Chips */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: colors.accentSoft,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Repeat size={12} color={colors.accent} />
                  <AppText className="text-[11px] font-bold text-app-accent">
                    1 RUB ≈ {exchanger.rateRubToXof} XOF · 10 000 XOF ≈ {(10000 * (exchanger.rateXofToRub || 0.135)).toFixed(0)} RUB
                  </AppText>
                </View>

                {/* Action Buttons */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/exchangers/${exchanger.id}` as never)}
                  >
                    Voir la fiche
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/transfer/wizard?exchangerId=${exchanger.id}` as never)}
                  >
                    Transférer →
                  </Button>
                </View>
              </Card>
            );
          })}

          {!visible.length ? (
            <EmptyState
              title="Aucun échangeur trouvé"
              description="Aucun partenaire ne correspond à vos critères de recherche ou à la localisation sélectionnée."
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
