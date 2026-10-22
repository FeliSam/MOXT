import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';
import { brand } from '@/theme/colors';

export type CategoryTile = {
  id: string;
  label: string;
  type?: string;
  category?: string;
  route?: string;
  imageUrl: string;
  localAsset?: any;
};

const CATEGORY_PAIRS: [CategoryTile, CategoryTile][] = [
  // Colonne 1 : Auto (haut) & Services (bas)
  [
    {
      id: 'auto',
      label: 'Auto',
      type: 'vehicle',
      category: '',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
      localAsset: require('@/assets/services/3d/service-marketplace.png'),
    },
    {
      id: 'services',
      label: 'Services',
      type: 'service',
      category: '',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995574.png',
      localAsset: require('@/assets/services/3d/service-transfer.png'),
    },
  ],
  // Colonne 2 : Immobilier (haut) & Électronique (bas)
  [
    {
      id: 'real_estate',
      label: 'Immobilier',
      type: 'real_estate',
      category: '',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
      localAsset: require('@/assets/services/3d/service-businesses.png'),
    },
    {
      id: 'electronics',
      label: 'Électronique',
      type: 'product',
      category: 'electronics',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/644/644458.png',
      localAsset: require('@/assets/services/3d/quick-marketplace.png'),
    },
  ],
  // Colonne 3 : Hébergement voyage (haut) & Emplois (bas)
  [
    {
      id: 'travel',
      label: 'Hébergement pour le voyage',
      type: 'rental',
      category: 'rental_event',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/2903/2903542.png',
      localAsset: require('@/assets/services/3d/service-parcel.png'),
    },
    {
      id: 'jobs',
      label: 'Emplois à plein et partiel',
      route: '/jobs',
      type: 'job',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3281/3281329.png',
      localAsset: require('@/assets/services/3d/service-job.png'),
    },
  ],
  // Colonne 4 : Maison et jardin (haut) & Business 360 (bas)
  [
    {
      id: 'home',
      label: 'Pour la maison et le jardin',
      type: 'product',
      category: 'home',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/2603/2603741.png',
      localAsset: require('@/assets/services/3d/service-events.png'),
    },
    {
      id: 'business',
      label: 'Business 360',
      route: '/organization',
      type: 'business',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3061/3061341.png',
      localAsset: require('@/assets/services/3d/service-businesses.png'),
    },
  ],
  // Colonne 5 : Pièces de rechange (haut) & Vêtements (bas)
  [
    {
      id: 'parts',
      label: 'Des pièces de rechange',
      type: 'vehicle',
      category: 'auto_parts',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3067/3067260.png',
      localAsset: require('@/assets/services/3d/quick-parcel.png'),
    },
    {
      id: 'fashion',
      label: 'Vêtements, chaussures',
      type: 'product',
      category: 'fashion',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/892/892458.png',
      localAsset: require('@/assets/services/3d/quick-event.png'),
    },
  ],
];

interface Props {
  selectedType?: string;
  selectedCategory?: string;
  onSelect: (type: string, category: string) => void;
}

export function MarketplaceCategoriesGrid({ selectedType, selectedCategory, onSelect }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 2,
        gap: 8,
        paddingBottom: 4,
      }}
    >
      {CATEGORY_PAIRS.map(([top, bottom], colIdx) => (
        <View key={`col-${colIdx}`} style={{ gap: 8 }}>
          <CategoryCard
            tile={top}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
            isDark={isDark}
            colors={colors}
          />
          <CategoryCard
            tile={bottom}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
            isDark={isDark}
            colors={colors}
          />
        </View>
      ))}
    </ScrollView>
  );
}

function CategoryCard({
  tile,
  selectedType,
  selectedCategory,
  onSelect,
  isDark,
  colors,
}: {
  tile: CategoryTile;
  selectedType?: string;
  selectedCategory?: string;
  onSelect: (type: string, category: string) => void;
  isDark: boolean;
  colors: any;
}) {
  const isSelected =
    Boolean(tile.type && selectedType === tile.type) &&
    (!tile.category || selectedCategory === tile.category);

  function onPress() {
    if (tile.route) {
      router.push(tile.route as never);
      return;
    }
    if (isSelected) {
      // Décocher si déjà sélectionné
      onSelect('', '');
    } else {
      onSelect(tile.type || '', tile.category || '');
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        width: 154,
        height: 78,
        borderRadius: 18,
        paddingTop: 10,
        paddingLeft: 12,
        paddingRight: 10,
        paddingBottom: 8,
        backgroundColor: isSelected
          ? isDark
            ? '#1e293b'
            : '#e0f2fe'
          : isDark
          ? '#27272a'
          : '#f1f5f9',
        borderWidth: isSelected ? 1.5 : 1,
        borderColor: isSelected
          ? brand[600]
          : isDark
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isSelected
          ? '0 4px 12px rgba(13,148,136,0.15)'
          : '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <AppText
        numberOfLines={2}
        style={{
          fontSize: 12,
          fontWeight: isSelected ? '800' : '700',
          lineHeight: 14,
          color: isSelected ? (isDark ? '#38bdf8' : brand[700]) : colors.text,
          maxWidth: 92,
        }}
      >
        {tile.label}
      </AppText>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 2,
          bottom: 2,
          width: 52,
          height: 52,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={tile.localAsset || { uri: tile.imageUrl }}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>
    </Pressable>
  );
}
