import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { useTheme } from '@/theme/ThemeContext';

export function StepBar({ steps, index }: { steps: string[]; index: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {steps.map((label, stepIndex) => (
        <View key={label} style={{ flex: 1, gap: 4 }}>
          <View style={{ height: 4, borderRadius: 99, backgroundColor: stepIndex <= index ? colors.accent : colors.border }} />
          <AppText className="text-[10px] font-bold text-app-text-muted">{label}</AppText>
        </View>
      ))}
    </View>
  );
}

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
  pathname = '/publish/post',
  children,
  onSubmit,
  submitLabel = 'Publier',
  busy = false,
  hideSubmit = false,
}: {
  title: string;
  subtitle?: string;
  pathname?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  busy?: boolean;
  hideSubmit?: boolean;
}) {
  const { colors, isDark } = useTheme();
  return (
    <AppChrome pathname={pathname}>
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 128 }}>
      <AppText className="text-2xl font-black text-app-text">{title}</AppText>
      {subtitle ? <AppText className="text-sm text-app-text-muted">{subtitle}</AppText> : null}
      {children}
      {hideSubmit ? null : (
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onSubmit}
        style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: busy ? 0.7 : 1 }}>
        {busy ? <ActivityIndicator color={isDark ? '#020617' : '#fff'} /> : <AppText className={WEB_BUTTON_TEXT} style={{ color: isDark ? '#020617' : '#ffffff' }}>{submitLabel}</AppText>}
      </Pressable>
      )}
    </ScrollView>
    </AppChrome>
  );
}
