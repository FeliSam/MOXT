import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';
import { PUBLICATION_TABLE, updatePublicationFields } from '@moxt/shared/services/publicationMutations.js';

import { BackHeader } from '@/components/chrome/BackHeader';
import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import type { PublicationType } from '@/components/profile/PublicationCard';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const FIELDS: Record<PublicationType, { key: string; label: string; multiline?: boolean }[]> = {
  listing: [
    { key: 'title', label: 'Titre' },
    { key: 'price', label: 'Prix' },
    { key: 'city', label: 'Ville' },
    { key: 'description', label: 'Description', multiline: true },
  ],
  parcel: [
    { key: 'origin', label: 'Départ' },
    { key: 'destination', label: 'Arrivée' },
    { key: 'pricePerKg', label: 'Prix / kg' },
    { key: 'capacityKg', label: 'Capacité (kg)' },
  ],
  job: [
    { key: 'title', label: 'Titre' },
    { key: 'sector', label: 'Secteur' },
    { key: 'location', label: 'Lieu' },
    { key: 'salary', label: 'Salaire' },
    { key: 'description', label: 'Description', multiline: true },
  ],
  event: [
    { key: 'title', label: 'Titre' },
    { key: 'city', label: 'Ville' },
    { key: 'description', label: 'Description', multiline: true },
  ],
  video: [
    { key: 'title', label: 'Titre' },
    { key: 'caption', label: 'Légende', multiline: true },
  ],
  post: [{ key: 'message', label: 'Texte', multiline: true }],
  other: [
    { key: 'amount', label: 'Montant' },
    { key: 'rate', label: 'Taux' },
  ],
};

/** Modifier une publication (mêmes colonnes que les pages d'édition du web). */
export default function EditPublicationScreen() {
  const { type, id } = useLocalSearchParams<{ type: PublicationType; id: string }>();
  const { colors, isDark } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fields = FIELDS[type] || FIELDS.listing;

  useEffect(() => {
    const table = PUBLICATION_TABLE[type];
    if (!supabase || !table || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then((result) => {
        if (cancelled) return;
        const { data, error } = result;
        if (error || !data) {
          showNotice('Modifier', error?.message || 'Publication introuvable.');
          return;
        }
        const row = fromRow(data) as Record<string, unknown>;
        const next: Record<string, string> = {};
        for (const field of fields) next[field.key] = row[field.key] == null ? '' : String(row[field.key]);
        setValues(next);
      })
      .then(
        () => {
          if (!cancelled) setLoading(false);
        },
        () => {
          if (!cancelled) setLoading(false);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [type, id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!supabase || !type || !id) return;
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = values[field.key] ?? '';
        patch[field.key] = ['price', 'amount', 'rate', 'pricePerKg', 'capacityKg'].includes(field.key) ? Number(raw) : raw;
      }
      await updatePublicationFields(supabase, type, id, patch);
      router.back();
    } catch (error) {
      showNotice('Modifier', error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader inline title="Modifier" />
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {fields.map((field) => (
        <View key={field.key} style={{ gap: 6 }}>
          <AppText className="text-xs font-bold uppercase text-app-text-muted">{field.label}</AppText>
          <TextInput
            value={values[field.key] || ''}
            onChangeText={(text) => setValues((prev) => ({ ...prev, [field.key]: text }))}
            multiline={field.multiline}
            className="text-app-text"
            style={{
              minHeight: field.multiline ? 120 : 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: colors.text,
              textAlignVertical: field.multiline ? 'top' : 'center',
            }}
          />
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        disabled={saving || loading}
        onPress={() => void save()}
        style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 }}>
        <AppText className={WEB_BUTTON_TEXT} style={{ color: isDark ? '#020617' : '#ffffff' }}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </AppText>
      </Pressable>
    </ScrollView>
  );
}
