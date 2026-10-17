import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { useShadows, useTheme } from '@/theme/ThemeContext';

export function StepBar({ steps, index }: { steps: string[]; index: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8, marginVertical: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {steps.map((label, stepIndex) => {
          const isDone = stepIndex < index;
          const isCurrent = stepIndex === index;
          return (
            <View key={label} style={{ flex: 1, gap: 4 }}>
              <View
                style={{
                  height: 4,
                  borderRadius: 99,
                  backgroundColor: isCurrent ? colors.accent : isDone ? colors.primary : colors.border,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText className="text-xs font-bold" style={{ color: colors.text }}>
          {steps[index] || ''}
        </AppText>
        <AppText className="text-[11px] font-semibold" style={{ color: colors.textMuted }}>
          Étape {index + 1} / {steps.length}
        </AppText>
      </View>
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
      <AppText className="text-xs font-bold tracking-wider uppercase text-app-text-muted">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          minHeight: multiline ? 110 : 50,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.text,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

/** Formulaire de publication moderne : en-tête épuré avec bouton retour goutte, défilement unifié. */
export function PublishForm({
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = 'Publier',
  busy = false,
  hideSubmit = false,
  onBack,
}: {
  title: string;
  subtitle?: string;
  pathname?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  busy?: boolean;
  hideSubmit?: boolean;
  onBack?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();
  const { onScroll } = useSmartNavbarScroll();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}>
        {/* Top Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={onBack || (() => router.back())}
            style={[
              {
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              shadows.card,
            ]}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>{title}</AppText>
            {subtitle ? <AppText className="text-xs text-app-text-muted" numberOfLines={1}>{subtitle}</AppText> : null}
          </View>
        </View>

        {children}

        {hideSubmit ? null : (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onSubmit}
            style={[
              {
                minHeight: 50,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
                opacity: busy ? 0.7 : 1,
                marginTop: 8,
              },
              shadows.card,
            ]}>
            {busy ? (
              <ActivityIndicator color={isDark ? '#020617' : '#fff'} />
            ) : (
              <AppText className={WEB_BUTTON_TEXT} style={{ color: isDark ? '#020617' : '#ffffff', fontSize: 15, fontWeight: '700' }}>
                {submitLabel}
              </AppText>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
