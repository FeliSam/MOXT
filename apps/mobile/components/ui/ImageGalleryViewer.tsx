import { Image, Modal, Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';

/** Visionneuse plein écran (ImageGalleryViewer / ImageLightbox du web). */
export function ImageGalleryViewer({
  open,
  images,
  index,
  title,
  onClose,
  onIndex,
}: {
  open: boolean;
  images: string[];
  index: number;
  title?: string;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  if (!open || !images.length) return null;
  const safe = ((index % images.length) + images.length) % images.length;
  const current = images[safe];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <View style={{ paddingTop: Math.max(insets.top, 12), paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText className="text-sm font-bold text-white">
            {title || 'Galerie'} · {safe + 1} / {images.length}
          </AppText>
          <Pressable accessibilityLabel="Fermer la galerie" onPress={onClose} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' }}>
            <X size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={{ uri: current }} style={{ width: '100%', height: '78%' }} resizeMode="contain" />
          {images.length > 1 ? (
            <>
              <Pressable
                accessibilityLabel="Image précédente"
                onPress={() => onIndex(safe - 1)}
                style={{ position: 'absolute', left: 12, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)' }}>
                <ChevronLeft size={22} color="#0f172a" />
              </Pressable>
              <Pressable
                accessibilityLabel="Image suivante"
                onPress={() => onIndex(safe + 1)}
                style={{ position: 'absolute', right: 12, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)' }}>
                <ChevronRight size={22} color="#0f172a" />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
