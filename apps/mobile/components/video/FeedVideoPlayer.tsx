import { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';

const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/**
 * Lecteur vidéo plein cadre (expo-video, natif et Expo web), calqué sur VideoFeedSlide du web :
 * lecture auto de la slide active, pause des autres, boucle, son piloté par le parent,
 * toucher = pause / reprise, grosse icône Play en surimpression quand la slide active est en pause.
 */
export function FeedVideoPlayer({
  videoUrl,
  poster,
  active,
  muted,
  playLabel = 'Lecture',
}: {
  videoUrl: string;
  poster?: string;
  active: boolean;
  muted: boolean;
  playLabel?: string;
}) {
  const [pausedByUser, setPausedByUser] = useState(false);
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = muted;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [firstFrame, setFirstFrame] = useState(false);

  // Une slide qui redevient inactive oublie la pause utilisateur (comme le web au changement de slide).
  useEffect(() => {
    if (!active) setPausedByUser(false);
  }, [active]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (active && !pausedByUser) player.play();
    else player.pause();
  }, [player, active, pausedByUser]);

  const error = status === 'error';
  const showPlayOverlay = active && pausedByUser && !error;

  function onTap() {
    setPausedByUser(isPlaying);
  }

  return (
    <View style={[FILL, { backgroundColor: '#000' }]}>
      {poster && (!firstFrame || error) ? <Image source={{ uri: poster }} resizeMode="cover" style={FILL} /> : null}
      {!error ? (
        <VideoView
          player={player}
          style={[FILL, { opacity: firstFrame ? 1 : 0 }]}
          contentFit="cover"
          nativeControls={false}
          playsInline
          allowsPictureInPicture={false}
          onFirstFrameRender={() => setFirstFrame(true)}
        />
      ) : null}
      {error ? (
        <View style={[FILL, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 24 }]}>
          <View style={{ maxWidth: 384, gap: 8 }}>
            <AppText className="text-center font-bold text-white">Lecture impossible</AppText>
            <AppText className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Ce fichier n’est pas lisible ici (souvent un MOV HEVC iPhone). Republiez-le : MOXT le convertit automatiquement, ou filmez en « Compatibilité » sur iPhone.
            </AppText>
          </View>
        </View>
      ) : null}
      <Pressable accessibilityLabel={isPlaying ? 'Mettre en pause' : playLabel} onPress={onTap} style={FILL}>
        {showPlayOverlay ? (
          <View style={[FILL, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }]}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.55)',
                boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
              }}>
              <Play size={30} color="#fff" strokeWidth={2} style={{ marginLeft: 4 }} />
            </View>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

/**
 * Image fixe d'une vidéo prise à `atSeconds` (le web capture la frame à 5 s pour les cartes) :
 * lecteur muet jamais lancé, positionné sur la frame voulue.
 */
export function VideoFramePoster({ videoUrl, atSeconds = 5, width, height }: { videoUrl: string; atSeconds?: number; width: number; height: number }) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.muted = true;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEffect(() => {
    if (status === 'readyToPlay') player.currentTime = Math.min(atSeconds, Math.max(0, (player.duration || atSeconds) - 0.1));
  }, [player, status, atSeconds]);
  return (
    <View style={{ width, height }} pointerEvents="none">
      <VideoView player={player} style={{ width, height }} contentFit="cover" nativeControls={false} playsInline allowsPictureInPicture={false} />
    </View>
  );
}
