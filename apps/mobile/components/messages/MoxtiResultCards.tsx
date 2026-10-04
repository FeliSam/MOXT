import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Briefcase, Building2, CalendarDays, ChevronRight, Package, Repeat, ShoppingBag } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';
import { resolveNativePath } from '@/utils/nativePath';

export type MoxtiCard = {
  kind: string;
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  price?: number | null;
  priceLabel?: string | null;
  image?: string | null;
  path: string;
  kindLabel?: string;
};

const ICONS = {
  listing: ShoppingBag,
  parcel: Package,
  p2p: Repeat,
  business: Building2,
  event: CalendarDays,
  job: Briefcase,
} as const;

function openCard(path: string) {
  const native = resolveNativePath(path);
  if (native) router.push(native as never);
}

function KindIcon({ kind, color, size }: { kind: string; color: string; size: number }) {
  const Icon = ICONS[kind as keyof typeof ICONS] || ShoppingBag;
  return <Icon size={size} color={color} strokeWidth={2} />;
}

function CardImage({
  card,
  width,
  height,
  radius,
}: {
  card: MoxtiCard;
  width: number | `${number}%`;
  height: number;
  radius: number;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(card.image) && !failed;
  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
      {showImage ? (
        <Image
          source={{ uri: card.image || undefined }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <KindIcon kind={card.kind} color={colors.primary} size={height > 80 ? 28 : 20} />
      )}
    </View>
  );
}

function RichCard({ card }: { card: MoxtiCard }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.kindLabel || card.kind}. ${card.title}. ${card.priceLabel || ''}`}
      onPress={() => openCard(card.path)}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        boxShadow: '0 8px 24px rgba(15,23,42,0.09)',
      }}>
      <CardImage card={card} width="100%" height={168} radius={0} />
      <View style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 4 }}>
        {card.kindLabel ? (
          <AppText className="text-[10px] font-black uppercase" style={{ color: colors.primary, letterSpacing: 0.4 }}>
            {card.kindLabel}
          </AppText>
        ) : null}
        <AppText className="text-base font-black text-app-text" numberOfLines={2}>
          {card.title}
        </AppText>
        {card.priceLabel ? (
          <AppText className="text-base font-black" style={{ color: colors.primary }}>
            {card.priceLabel}
          </AppText>
        ) : null}
        {card.subtitle ? (
          <AppText className="text-sm text-app-text-muted" numberOfLines={1}>
            {card.subtitle}
          </AppText>
        ) : null}
        {card.meta ? (
          <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
            {card.meta}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function ListCard({ card }: { card: MoxtiCard }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.kindLabel || card.kind}. ${card.title}. ${card.priceLabel || ''}`}
      onPress={() => openCard(card.path)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 16,
        padding: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
      }}>
      <CardImage card={card} width={64} height={64} radius={12} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {card.kindLabel ? (
          <AppText className="text-[10px] font-black uppercase" style={{ color: colors.primary, letterSpacing: 0.4 }}>
            {card.kindLabel}
          </AppText>
        ) : null}
        <AppText className="text-sm font-black text-app-text" numberOfLines={1}>
          {card.title}
        </AppText>
        {card.subtitle ? (
          <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
            {card.subtitle}
          </AppText>
        ) : null}
        {card.meta ? (
          <AppText className="text-[11px] text-app-text-muted" numberOfLines={1}>
            {card.meta}
          </AppText>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4, maxWidth: 110 }}>
        {card.priceLabel ? (
          <AppText className="text-sm font-black" style={{ color: colors.primary }} numberOfLines={1}>
            {card.priceLabel}
          </AppText>
        ) : null}
        <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

/** Une carte riche, ou une liste triée (l’ordre est déjà celui du service). */
export function MoxtiResultCards({ cards }: { cards?: MoxtiCard[] | null }) {
  const list = (cards || []).filter((card) => card?.id && card.path?.startsWith('/'));
  if (!list.length) return null;
  if (list.length === 1) return <RichCard card={list[0]} />;
  return (
    <View accessibilityRole="list" style={{ gap: 8 }}>
      {list.map((card) => (
        <ListCard key={`${card.kind}-${card.id}`} card={card} />
      ))}
    </View>
  );
}
