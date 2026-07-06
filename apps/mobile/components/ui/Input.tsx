import { useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn('gap-1.5', className)}>
      {label ? (
        <Text className="text-[13px] font-bold text-app-text-muted dark:text-zinc-400">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="#9ca3af"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          'border rounded-xl px-3.5 py-3 text-[15px]',
          'bg-white dark:bg-zinc-900 text-app-text dark:text-zinc-50',
          error
            ? 'border-app-danger dark:border-red-500'
            : focused
              ? 'border-brand-700 dark:border-brand-400'
              : 'border-app-border-md dark:border-zinc-600',
        )}
        {...props}
      />
      {error ? <Text className="text-xs font-medium text-app-danger dark:text-red-400">{error}</Text> : null}
    </View>
  );
}
