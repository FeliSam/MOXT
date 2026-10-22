import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Briefcase, Calendar, Package, Repeat, ShoppingBag } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

import { STRIP_KIND_LABEL, buildPublisherStripItems, type PublicationBuckets } from './publisherCatalog';

const ICONS = {
  listing: ShoppingBag,
  job: Briefcase,
  event: Calendar,
  parcel: Package,
  p2p: Repeat,
} as const;

/** Bandeau « Autres publications » du même auteur. */
export function PublisherPublicationsStrip({
  currentId,
  ownerId,
  publications,
  allPath,
  limit = 8,
}: {
  currentId: string;
  ownerId?: string;
  publications?: PublicationBuckets | null;
  allPath?: string | null;
  limit?: number;
}) {
  const { colors } = useTheme();
  if (!ownerId || !publications) return null;
  const items = buildPublisherStripItems(publications, currentId, limit);
  if (!items.length) return null;

  return (
    <View style={{ borderRadius: 18, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <AppText className="text-base font-black text-app-text">Autres publications</AppText>
        {allPath ? (
          <Pressable onPress={() => router.push(allPath as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppText className="text-xs font-bold" style={{ color: colors.accent }}>
              Tout voir
            </AppText>
            <ArrowRight size={14} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {items.map((item) => {
          const Icon = ICONS[item.kind];
          return (
            <Pressable
              key={`${item.kind}-${item.id}`}
              onPress={() => router.push(item.path as never)}
              style={{ width: 180, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted }}>
              {item.image ? (
                <View>
                  <Image source={{ uri: item.image }} style={{ width: 180, height: 120 }} resizeMode="cover" />
                  <View style={{ position: 'absolute', left: 8, bottom: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon size={10} color="#1e293b" />
                    <AppText className="text-[9px] font-black uppercase" style={{ color: '#1e293b' }}>
                      {STRIP_KIND_LABEL[item.kind]}
                    </AppText>
                  </View>
                </View>
              ) : (
                <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                  <Icon size={24} color={colors.accent} />
                  <AppText className="mt-2 text-[9px] font-black uppercase text-app-text-muted">{STRIP_KIND_LABEL[item.kind]}</AppText>
                </View>
              )}
              <View style={{ minHeight: 68, justifyContent: 'center', padding: 12, gap: 2 }}>
                <AppText className="text-sm font-black text-app-text" numberOfLines={2}>
                  {item.title}
                </AppText>
                {item.meta ? (
                  <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
                    {item.meta}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
