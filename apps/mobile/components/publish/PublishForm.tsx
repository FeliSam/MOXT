import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';

import { BackHeader } from '@/components/chrome/BackHeader';
import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { useTheme } from '@/theme/ThemeContext';

export function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <AppText className="text-xs font-bold uppercase text-app-text-muted">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          minHeight: multiline ? 110 : 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: colors.text,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

/** Formulaire de publication (en-tête, champs, bouton) calqué sur les pages Publier du web. */
export function PublishForm({
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = 'Publier',
  busy = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  busy?: boolean;
}) {
  const { colors, isDark } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}>
      <BackHeader inline title={title} subtitle={subtitle} />
      {children}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onSubmit}
        style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.7 : 1 }}>
        {busy ? <ActivityIndicator color={isDark ? '#020617' : '#fff'} /> : <AppText className={WEB_BUTTON_TEXT} style={{ color: isDark ? '#020617' : '#ffffff' }}>{submitLabel}</AppText>}
      </Pressable>
    </ScrollView>
  );
}
