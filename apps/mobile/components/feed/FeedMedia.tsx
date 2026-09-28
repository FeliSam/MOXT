import { createElement } from 'react';
import { Image, Platform, View } from 'react-native';

/**
 * Média plein cadre d'une slide. Pas de lecteur vidéo natif dans l'app (ni expo-video ni expo-av) :
 * sur le web (Expo web) on rend une balise <video> comme moxt-react ; sur téléphone, l'affiche.
 */
export function FeedMedia({
  image,
  videoUrl,
  active,
  muted,
}: {
  image: string;
  videoUrl: string;
  active: boolean;
  muted: boolean;
}) {
  if (Platform.OS === 'web' && videoUrl) {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {createElement('video', {
          src: videoUrl,
          poster: image || undefined,
          autoPlay: active,
          muted,
          loop: true,
          playsInline: true,
          preload: active ? 'auto' : 'metadata',
          style: { width: '100%', height: '100%', objectFit: 'cover', background: '#000' },
        })}
      </View>
    );
  }
  if (!image) return null;
  return (
    <Image
      source={{ uri: image }}
      resizeMode="cover"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
