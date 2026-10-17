import { useState } from 'react';
import { Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native';

import { FeedVideoPlayer } from '@/components/video/FeedVideoPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Média plein cadre d'une slide : lecteur expo-video pour les vidéos,
 * carrousel horizontal avec pagination pour les multi-photos, ou image simple.
 */
export function FeedMedia({
  image,
  images,
  videoUrl,
  active,
  muted,
}: {
  image: string;
  images?: string[];
  videoUrl: string;
  active: boolean;
  muted: boolean;
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (videoUrl) {
    return <FeedVideoPlayer videoUrl={videoUrl} poster={image} active={active} muted={muted} />;
  }

  const photoList = (images && images.length > 0 ? images : image ? [image] : []).filter(Boolean);

  if (photoList.length === 0) return null;

  if (photoList.length > 1) {
    function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / SCREEN_WIDTH);
      if (idx !== activePhotoIdx && idx >= 0 && idx < photoList.length) {
        setActivePhotoIdx(idx);
      }
    }

    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000' }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1, width: '100%', height: '100%' }}
        >
          {photoList.map((uri, idx) => (
            <View key={idx} style={{ width: SCREEN_WIDTH, height: '100%', backgroundColor: '#000000' }}>
              <Image
                source={{ uri }}
                resizeMode="contain"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ))}
        </ScrollView>

        {/* Petite pagination (pill compacte) */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 70,
            right: 14,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,0.65)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            zIndex: 15,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>
            {activePhotoIdx + 1}/{photoList.length}
          </Text>
        </View>

        {/* Puces de pagination en bas */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 110,
            alignSelf: 'center',
            flexDirection: 'row',
            gap: 5,
            zIndex: 15,
          }}
        >
          {photoList.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: idx === activePhotoIdx ? 16 : 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: idx === activePhotoIdx ? '#38bdf8' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoList[0] }}
      resizeMode="contain"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000' }}
    />
  );
}
