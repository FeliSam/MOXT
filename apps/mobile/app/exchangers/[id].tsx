import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, DollarSign, MapPin, Repeat, ShieldCheck, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactButton } from '@/components/communications/ContactButton';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FALLBACK_EXCHANGERS } from '@/constants/transfers';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';

/** Fiche partenaire détaillée (ExchangerDetailPage). */
export default function ExchangerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { isDark } = useTheme();
  const { onScroll } = useSmartNavbarScroll();

  const businesses = useAppSelector((state) => state.account.businesses);
  const business = businesses.find((item) => item.id === id);
  const fallback = FALLBACK_EXCHANGERS.find((item) => item.id === id);
  const name = business?.name || fallback?.name;

  if (!name) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: insets.top + 16 }}>
        <Pressable
          onPress={() => router.back()}
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
              marginBottom: 16,
            },
            shadows.card,
          ]}>
          <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
        </Pressable>
        <AppText className="text-sm text-app-text-muted">Échangeur introuvable.</AppText>
      </View>
    );
  }

  const rating = business?.rating ? String(business.rating) : String(fallback?.rating ?? '4.9');
  const averageDelay = String(business?.averageDelay || fallback?.averageDelay || '15-30 min');
  const feePercent = `${business?.feePercent ?? fallback?.feePercent ?? 2.5} %`;
  const location = [business?.city, business?.country].filter(Boolean).join(', ') || 'Partenaire MOXT certifié';

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
        }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/exchangers' as never))}
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
              {name}
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              Partenaire de change MOXT
            </AppText>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, alignItems: 'center', padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <AppText className="text-base font-black text-app-text">{rating}</AppText>
            </View>
            <AppText className="text-[10px] text-app-text-muted">Avis certifiés</AppText>
          </Card>

          <Card style={{ flex: 1, alignItems: 'center', padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={14} color={colors.accent} />
              <AppText className="text-base font-black text-app-text" numberOfLines={1}>{averageDelay}</AppText>
            </View>
            <AppText className="text-[10px] text-app-text-muted">Délai moyen</AppText>
          </Card>

          <Card style={{ flex: 1, alignItems: 'center', padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <DollarSign size={14} color="#059669" />
              <AppText className="text-base font-black text-app-text">{feePercent}</AppText>
            </View>
            <AppText className="text-[10px] text-app-text-muted">Frais estimés</AppText>
          </Card>
        </View>

        {/* Details Card */}
        <Card style={{ gap: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color={colors.accent} />
            <AppText className="text-sm font-bold text-app-text">{location}</AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="#059669" />
            <AppText className="text-xs text-app-text-muted">
              Transactions garanties par le séquestre MOXT jusqu’à confirmation par le bénéficiaire.
            </AppText>
          </View>
        </Card>

        {/* Action Buttons */}
        <Button
          variant="primary"
          size="lg"
          onPress={() => router.push(`/transfer/wizard?exchangerId=${id}` as never)}>
          Démarrer un transfert avec cet échangeur
        </Button>

        {business ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            <Button
              variant="secondary"
              onPress={() => router.push(`/organization/${business.id}` as never)}>
              Voir la fiche entreprise complète
            </Button>
            <ContactButton
              ownerId={business.ownerId}
              relatedType="business"
              relatedId={business.id}
              relatedPath={`/organization/${business.id}`}
              relatedTitle={business.name}
              label="Contacter l’échangeur"
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
