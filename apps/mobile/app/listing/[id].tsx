import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, usePathname, router } from 'expo-router';
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

import { DetailFloatingActions } from '@/components/marketplace/DetailFloatingActions';
import { listingCategoryLabel, listingTypeLabel } from '@/components/marketplace/listingMeta';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { loadListingById } from '@/store/marketplace';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { idFromPath, routeParam } from '@/utils/routeParam';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = 260;

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  used: 'Occasion',
  refurbished: 'Reconditionné',
};

const DELIVERY_LABELS: Record<string, string> = {
  pickup: 'Retrait sur place',
  local: 'Livraison locale',
  shipping: 'Expédition',
  home: 'Livraison à domicile',
  onSite: 'Sur site client',
  remote: 'À distance',
  workshop: 'En atelier / boutique',
  handDelivery: 'Remise en main propre',
  possible: 'Livraison possible',
  online: 'Téléchargement en ligne',
  visit: 'Visite sur rendez-vous',
};

const DETAIL_TABS = [
  ['description', 'Description'],
  ['details', 'Caractéristiques'],
  ['delivery', 'Livraison et garantie'],
  ['questions', 'Questions'],
  ['history', 'Historique'],
] as const;

export default function ListingDetailScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const pathnameId = idFromPath(usePathname());
  const id = routeParam(params.id) || pathnameId;
  const dispatch = useAppDispatch();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [detailTab, setDetailTab] = useState<(typeof DETAIL_TABS)[number][0]>('description');
  const [pending, setPending] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const fetched = useRef(false);

  const listing = useAppSelector((state) =>
    state.marketplace.items.find((l) => l.id === id),
  );
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!id) {
      setPending(false);
      return;
    }
    if (listing || fetched.current) {
      setPending(false);
      return;
    }
    fetched.current = true;
    dispatch(loadListingById(id))
      .finally(() => setPending(false))
      .catch(() => undefined);
  }, [dispatch, id, listing]);

  if (!listing) {
    if (pending) {
      return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ ...typography.sectionTitle, color: colors.text }}>Annonce introuvable</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  const typeLabel = listingTypeLabel(listing.type);
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

  const categoryLabel = listingCategoryLabel(listing.type, listing.category) || typeLabel;

  const isOwner = Boolean(user?.id && listing.ownerId === user.id);
  const deliveryModes = (listing.deliveryOptions?.length ? listing.deliveryOptions : ['pickup'])
    .map((value) => DELIVERY_LABELS[value] || value)
    .join(', ');
  const carriers = (listing.shippingCarriers || [])
    .map((carrier) => {
      if (typeof carrier === 'string') return carrier;
      const row = carrier as { id?: string; etaHint?: string };
      return row.etaHint ? `${row.id} (${row.etaHint})` : row.id || '';
    })
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120, gap: spacing.lg }}>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textMuted }}>
          Marketplace / {categoryLabel} / <Text style={{ color: colors.text, fontWeight: '800' }}>{listing.title}</Text>
        </Text>
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

            {images.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
                {images.map((uri, idx) => (
                  <Pressable
                    key={`thumb-${idx}`}
                    onPress={() => goToImage(idx)}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      overflow: 'hidden',
                      borderWidth: idx === activeImageIndex ? 2 : 1,
                      borderColor: idx === activeImageIndex ? colors.primary : colors.border,
                    }}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

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

        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {DETAIL_TABS.map(([key, label]) => {
              const active = detailTab === key;
              return (
                <Pressable key={key} onPress={() => setDetailTab(key)} style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: active ? colors.primary : 'transparent', paddingHorizontal: 4 }}>
                  <Text style={{ fontWeight: '800', color: active ? colors.text : colors.textMuted }}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ marginTop: 16, gap: 8 }}>
            {detailTab === 'description' ? (
              <>
                <Text style={{ ...typography.sectionTitle, color: colors.text }}>À propos de cette annonce</Text>
                <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 22 }}>
                  {listing.description || 'Aucune description.'}
                </Text>
              </>
            ) : null}
            {detailTab === 'details' ? (
              [
                ['Catégorie', categoryLabel || '—'],
                ['Type', typeLabel || '—'],
                ['Marque', listing.brand || '—'],
                ['Modèle', listing.model || '—'],
                ['Couleur', listing.color || '—'],
                ['État', conditionLabel || '—'],
                ['Quartier', listing.district || '—'],
                ['Localisation', [listing.city, listing.address].filter(Boolean).join(', ') || '—'],
              ].map(([label, value]) => (
                <View key={label} style={{ borderRadius: 12, backgroundColor: colors.surfaceMuted, padding: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 0.6, color: colors.textFaint }}>{label.toUpperCase()}</Text>
                  <Text style={{ marginTop: 4, fontWeight: '700', color: colors.text }}>{value}</Text>
                </View>
              ))
            ) : null}
            {detailTab === 'delivery' ? (
              [
                ['Modes de remise', deliveryModes],
                ...(carriers ? [['Transporteurs', carriers] as const] : []),
                ['Frais de livraison', listing.deliveryFee ? formatCurrency(listing.deliveryFee, listing.currency || 'RUB', 'fr-FR') : 'Gratuit ou à convenir'],
                ['Délai', listing.deliveryDelay || '—'],
                ['Garantie', listing.warranty || '—'],
                ['Politique de retour', listing.returnPolicy || '—'],
                ['Paiements acceptés', listing.paymentMethods?.length ? listing.paymentMethods.join(', ') : 'À convenir'],
              ].map(([label, value]) => (
                <View key={label} style={{ borderRadius: 12, backgroundColor: colors.surfaceMuted, padding: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 0.6, color: colors.textFaint }}>{String(label).toUpperCase()}</Text>
                  <Text style={{ marginTop: 4, fontWeight: '700', color: colors.text }}>{value}</Text>
                </View>
              ))
            ) : null}
            {detailTab === 'questions' ? (
              (listing.questions || []).length ? (
                listing.questions!.map((item, index) => (
                  <View key={item.id || String(index)} style={{ gap: 4 }}>
                    <Text style={{ fontWeight: '800', color: colors.text }}>{item.authorName || 'Membre'}</Text>
                    <Text style={{ color: colors.textSecondary }}>{item.text}</Text>
                    {item.answer ? <Text style={{ color: colors.textMuted }}>Réponse du vendeur : {item.answer}</Text> : <Text style={{ color: colors.textFaint }}>En attente de réponse du vendeur.</Text>}
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textMuted }}>Aucune question publique.</Text>
              )
            ) : null}
            {detailTab === 'history' ? (
              (listing.history || []).length ? (
                listing.history!.map((entry, index) => (
                  <Text key={`${entry.at || index}`} style={{ color: colors.text }}>
                    {entry.status || '—'}{entry.at ? ` · ${entry.at}` : ''}
                  </Text>
                ))
              ) : (
                <Text style={{ color: colors.textMuted }}>Aucun historique.</Text>
              )
            ) : null}
          </View>
        </Card>

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
      <DetailFloatingActions relatedId={listing.id} title={listing.title} ownerId={listing.ownerId} isOwner={isOwner} />
    </SafeAreaView>
  );
}
