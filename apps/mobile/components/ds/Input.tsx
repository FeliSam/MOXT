import { useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { FeatherIcon } from '@/components/chrome/icons';
import { AppText } from '@/components/ui/AppText';
import { fontFamilies } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeContext';

/** Miroir de moxt-react/src/components/ui/Input.jsx (label, hint, error, icônes). */
export function DsInput({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? '#f87171' : focused ? colors.teal : 'transparent';
  const focusRing = error
    ? '0 0 0 3px rgba(220,38,38,0.12)'
    : focused
      ? '0 0 0 3px rgba(18,191,163,0.14)'
      : undefined;
  const hasRight = Boolean(iconRight) || Boolean(error);

  return (
    <View style={{ gap: 6, minWidth: 0 }}>
      {label ? (
        <AppText
          className="text-xs font-black uppercase text-app-text-muted"
          style={{ letterSpacing: 0.96 }}>
          {label}
        </AppText>
      ) : null}
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        {iconLeft ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 14, zIndex: 1 }}>
            {iconLeft}
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={colors.textFaint}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              minHeight: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor,
              backgroundColor: focused ? colors.surface : colors.surfaceMuted,
              paddingHorizontal: 16,
              paddingLeft: iconLeft ? 40 : 16,
              paddingRight: error && iconRight ? 68 : hasRight ? 44 : 16,
              color: colors.text,
              fontSize: 16,
              fontFamily: fontFamilies.regular,
              boxShadow: focusRing,
            },
            style,
          ]}
        />
        {error ? (
          <View pointerEvents="none" style={{ position: 'absolute', right: iconRight ? 44 : 14 }}>
            <FeatherIcon name="alert-circle" size={16} color="#ef4444" />
          </View>
        ) : null}
        {iconRight ? <View style={{ position: 'absolute', right: 8 }}>{iconRight}</View> : null}
      </View>
      {error ? (
        <AppText className="text-xs font-medium text-red-600 dark:text-red-400" accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText className="text-xs text-app-text-faint">{hint}</AppText>
      ) : null}
    </View>
  );
}
