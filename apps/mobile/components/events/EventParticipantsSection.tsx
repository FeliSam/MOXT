import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { DetailSection } from '@/components/ui/DetailBlocks';
import { useTheme } from '@/theme/ThemeContext';

export type EventRegistrationRow = {
  id: string;
  userId: string;
  participantName: string;
  status: string;
};

/** Liste des inscrits, visible par l’organisateur (EventParticipantsSection du web). */
export function EventParticipantsSection({
  capacity,
  registrations,
  onStatus,
}: {
  capacity: number;
  registrations: EventRegistrationRow[];
  onStatus: (id: string, status: 'checked_in' | 'cancelled' | 'registered') => void;
}) {
  const { colors } = useTheme();
  const active = registrations.filter((row) => row.status !== 'cancelled');
  const cancelled = registrations.filter((row) => row.status === 'cancelled');

  return (
    <DetailSection title="Participants" description={`${active.length} inscrit(s) · ${capacity || '—'} places`}>
      {active.length ? (
        <View style={{ gap: 10 }}>
          {active.map((row) => (
            <View key={row.id} style={{ borderRadius: 16, backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 }}>
              <AppText className="font-black text-app-text">{row.participantName || 'Membre'}</AppText>
              <AppText className="text-xs text-app-text-muted">{row.status === 'checked_in' ? 'Présent' : 'Inscrit'}</AppText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {row.status !== 'checked_in' ? (
                  <Pressable onPress={() => onStatus(row.id, 'checked_in')} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.accent }}>
                    <AppText className="text-xs font-bold text-white">Présent</AppText>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => onStatus(row.id, 'registered')} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                    <AppText className="text-xs font-bold text-app-text">Annuler le pointage</AppText>
                  </Pressable>
                )}
                <Pressable onPress={() => onStatus(row.id, 'cancelled')} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                  <AppText className="text-xs font-bold" style={{ color: colors.danger }}>Retirer</AppText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <AppText className="text-sm text-app-text-muted">Aucun participant pour le moment.</AppText>
      )}
      {cancelled.length ? (
        <AppText className="mt-3 text-xs text-app-text-muted">{cancelled.length} inscription(s) annulée(s)</AppText>
      ) : null}
    </DetailSection>
  );
}
