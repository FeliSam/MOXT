import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';

import { MoxtCoverBanner } from './CoverBanner';
import { MAN_COVER_STYLES, WOMAN_COVER_STYLES, normalizeProfileGender, type CoverStyleId } from './coverStyles';

/** Choix de bannière (CoverStylePicker du web) : onglets Femme / Homme et aperçus. */
export function CoverStyleSheet({
  visible,
  gender,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  gender?: string | null;
  selected?: string | null;
  onClose: () => void;
  onSelect: (styleId: CoverStyleId) => void;
}) {
  const { colors, isDark } = useTheme();
  const initial = normalizeProfileGender(gender) === 'female' ? 'woman' : 'man';
  const [tab, setTab] = useState<'woman' | 'man'>(initial);
  const styles = tab === 'woman' ? WOMAN_COVER_STYLES : MAN_COVER_STYLES;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: isDark ? 'rgba(0,0,0,0.62)' : 'rgba(2,6,23,0.55)' }}>
        <Pressable onPress={(event) => event.stopPropagation()} className="bg-app-surface" style={{ maxHeight: '82%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 12 }}>
          <AppText className="text-lg font-black text-app-text">Choisir une bannière</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['woman', 'man'] as const).map((key) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: tab === key ? colors.accent : colors.surfaceMuted,
                }}>
                <AppText className="text-sm font-bold" style={{ color: tab === key ? '#fff' : colors.text }}>
                  {key === 'woman' ? 'Femme' : 'Homme'}
                </AppText>
              </Pressable>
            ))}
          </View>
          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
            {styles.map((styleId) => {
              const active = selected === styleId;
              return (
                <Pressable
                  key={styleId}
                  accessibilityRole="button"
                  onPress={() => onSelect(styleId)}
                  style={{ height: 88, borderRadius: 16, overflow: 'hidden', borderWidth: active ? 3 : 1, borderColor: active ? colors.accent : colors.border }}>
                  <MoxtCoverBanner styleId={styleId} />
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
