import { Image } from 'react-native';

import { FeedVideoPlayer } from '@/components/video/FeedVideoPlayer';

/**
 * Média plein cadre d'une slide : lecteur expo-video pour les vidéos (téléphone et Expo web),
 * image de couverture sinon.
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
  if (videoUrl) {
    return <FeedVideoPlayer videoUrl={videoUrl} poster={image} active={active} muted={muted} />;
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
