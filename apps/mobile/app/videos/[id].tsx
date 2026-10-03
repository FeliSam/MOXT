import { Redirect, useLocalSearchParams } from 'expo-router';

/** Même redirection que le web (`/videos/:videoId` → fil vidéo). */
export default function VideoDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = encodeURIComponent(`video:${id || ''}`);
  return <Redirect href={`/(tabs)/feed?type=video&item=${item}` as never} />;
}
