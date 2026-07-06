import { useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Dimensions,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DetailMetrics, TrustPanel } from '@/components/ui/DetailBlocks';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { useAppSelector } from '@/store/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = 260;

const TYPE_LABELS: Record<string, string> = {
  product: 'Produit',
  service: 'Service',
  rental: 'Location',
  vehicle: 'Véhicule',
  digital: 'Numérique',
  real_estate: 'Immobilier',
  food: 'Alimentation',
  other: 'Autre',
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  used: 'Occasion',
  refurbished: 'Reconditionné',
};

export default function ListingDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const listing = useAppSelector((state) =>
    state.marketplace.items.find((l) => l.id === id),
  );

  if (!listing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ ...typography.sectionTitle, color: colors.text }}>Annonce introuvable</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  const typeLabel = TYPE_LABELS[listing.type || ''] || listing.type || '';
  const conditionLabel = CONDITION_LABELS[listing.condition || ''] || '';
  const images = listing.images || [];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_WIDTH);
    setActiveImageIndex(index);
  };

  const goToImage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * IMAGE_WIDTH, animated: true });
    setActiveImageIndex(index);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed back button header */}
      <View style={{
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} onPress={() => router.back()}>
          <Text style={{ fontSize: 22, color: colors.primary, fontWeight: '700' }}>←</Text>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '700' }}>Marketplace</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Images Carousel */}
        {images.length > 0 ? (
          <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT + 30, alignSelf: 'center' }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={IMAGE_WIDTH}
              snapToAlignment="start"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: radii.lg, overflow: 'hidden' }}>
              {images.map((uri, idx) => (
                <View key={idx} style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>

            {images.length > 1 && (
              <View style={{
                position: 'absolute', top: 12, right: 12,
                backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radii.md,
                paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {activeImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}

            {images.length > 1 && (
              <>
                {activeImageIndex > 0 && (
                  <Pressable
                    style={{ position: 'absolute', top: IMAGE_HEIGHT / 2 - 20, left: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => goToImage(activeImageIndex - 1)}>
                    <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>‹</Text>
                  </Pressable>
                )}
                {activeImageIndex < images.length - 1 && (
                  <Pressable
                    style={{ position: 'absolute', top: IMAGE_HEIGHT / 2 - 20, right: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => goToImage(activeImageIndex + 1)}>
                    <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 }}>›</Text>
                  </Pressable>
                )}
              </>
            )}

            {images.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
                {images.map((_, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => goToImage(idx)}
                    style={{
                      width: idx === activeImageIndex ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: idx === activeImageIndex ? colors.primary : colors.border,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{
            width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: radii.lg,
            backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
          }}>
            <Text style={{ fontSize: 48 }}>📦</Text>
          </View>
        )}

        {/* Title + price */}
        <Card>
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {typeLabel ? <Badge tone="brand">{typeLabel}</Badge> : null}
              {listing.category ? <Badge tone="neutral">{listing.category}</Badge> : null}
              {conditionLabel ? <Badge tone="success">{conditionLabel}</Badge> : null}
            </View>
            <Text style={{ ...typography.title, color: colors.text }}>{listing.title}</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>
              {listing.price
                ? formatCurrency(listing.price, listing.currency || 'RUB')
                : 'Sur devis'}
            </Text>
            {listing.city ? (
              <Text style={{ ...typography.bodySmall, color: colors.textMuted }}>
                📍 {listing.city}{listing.address ? `, ${listing.address}` : ''}
              </Text>
            ) : null}
            {listing.status ? <StatusBadge status={listing.status} /> : null}
          </View>
        </Card>

        {/* Web : DetailMetrics — prix, état, localisation, statut */}
        <DetailMetrics
          items={[
            { emoji: '💰', label: 'Prix', value: listing.price ? formatCurrency(listing.price, listing.currency || 'RUB') : 'Sur devis' },
            { emoji: '✨', label: 'État', value: conditionLabel || '—' },
            { emoji: '📍', label: 'Localisation', value: listing.city || '—' },
            { emoji: '🏷️', label: 'Catégorie', value: listing.category || typeLabel || '—' },
          ]}
        />

        {/* Web : "À propos de cette annonce" */}
        {listing.description ? (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...typography.sectionTitle, color: colors.text }}>À propos de cette annonce</Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 22 }}>
                {listing.description}
              </Text>
            </View>
          </Card>
        ) : null}

        {/* Web : panneau "Acheter avec prudence" */}
        <TrustPanel
          title="Acheter avec prudence"
          items={[
            'Rencontrez le vendeur dans un lieu public.',
            'Vérifiez l’article avant de payer.',
            'Ne versez jamais d’acompte sans garantie.',
            'Utilisez la messagerie MOXT pour tracer vos échanges.',
          ]}
        />

        {/* Seller */}
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.sectionTitle, color: colors.text }}>Vendeur</Text>
            {listing.sellerName ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
                <Text style={{ ...typography.body, color: colors.textMuted }}>Nom</Text>
                <Text style={{ ...typography.body, fontWeight: '600', color: colors.text }}>{listing.sellerName}</Text>
              </View>
            ) : null}
            {listing.contact ? (
              <Pressable
                style={{
                  marginTop: spacing.xs,
                  backgroundColor: colors.primaryLight,
                  borderWidth: 1,
                  borderColor: colors.primaryBorder,
                  borderRadius: radii.md,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                }}
                onPress={() => Linking.openURL(`tel:${listing.contact}`)}>
                <Text style={{ ...typography.body, fontWeight: '700', color: colors.primary }}>
                  📞 Appeler {listing.contact}
                </Text>
              </Pressable>
            ) : null}
            {listing.whatsapp ? (
              <Pressable
                style={{
                  marginTop: spacing.xs,
                  backgroundColor: colors.successBg,
                  borderWidth: 1,
                  borderColor: colors.successBorder,
                  borderRadius: radii.md,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                }}
                onPress={() => Linking.openURL(`https://wa.me/${listing.whatsapp?.replace(/[^0-9]/g, '')}`)}>
                <Text style={{ ...typography.body, fontWeight: '700', color: colors.success }}>
                  💬 WhatsApp {listing.whatsapp}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
