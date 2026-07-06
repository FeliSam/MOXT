import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

type Action = { label: string; onPress: () => void; primary?: boolean };

export function TransferPageHeader({
  eyebrow,
  title,
  description,
  actions,
  onBack,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: Action[];
  onBack?: () => void;
}) {
  return (
    <View className="gap-2 mb-3">
      {onBack ? (
        <Pressable className="mb-1" onPress={onBack}>
          <Text className="text-sm font-semibold text-brand-700 dark:text-brand-400">← Retour</Text>
        </Pressable>
      ) : null}
      <View className="flex-row items-center gap-1.5">
        <View className="w-2 h-2 rounded-full bg-brand-700 dark:bg-brand-400" />
        <Text className="text-[11px] font-bold tracking-widest text-brand-700 dark:text-brand-400">
          {eyebrow.toUpperCase()}
        </Text>
      </View>
      <Text className="text-2xl font-black tracking-tight text-app-text dark:text-zinc-50">{title}</Text>
      {description ? (
        <Text className="text-[13px] leading-[19px] text-app-text-muted dark:text-zinc-400">{description}</Text>
      ) : null}
      {actions && actions.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              className={cn(
                'rounded-full px-3.5 py-2',
                action.primary
                  ? 'bg-brand-800 dark:bg-brand-600'
                  : 'bg-app-surface-muted dark:bg-zinc-800',
              )}
              onPress={action.onPress}>
              <Text
                className={cn(
                  'text-xs font-bold',
                  action.primary ? 'text-white dark:text-slate-950' : 'text-app-text-secondary dark:text-zinc-300',
                )}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
