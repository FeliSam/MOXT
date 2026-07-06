import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { WIZARD_STEPS } from '@/constants/transfers';

export function TransferWizardStepper({
  step,
  onGoTo,
}: {
  step: number;
  onGoTo?: (s: number) => void;
}) {
  return (
    <View className="relative overflow-hidden rounded-2xl bg-app-surface py-4 px-2 shadow-sm dark:bg-zinc-900">
      <View className="absolute left-6 right-6 top-9 h-0.5 bg-app-border dark:bg-zinc-700" />
      <View
        className="absolute left-6 top-9 h-0.5 bg-brand-700 dark:bg-brand-400"
        style={{ width: `${((step - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
      />
      <View className="flex-row justify-between">
        {WIZARD_STEPS.map((entry, index) => {
          const stepNumber = index + 1;
          const done = step > stepNumber;
          const active = step === stepNumber;
          return (
            <Pressable
              key={entry.key}
              disabled={stepNumber > step}
              className="flex-1 items-center gap-1.5"
              onPress={() => stepNumber < step && onGoTo?.(stepNumber)}>
              <View
                className={cn(
                  'z-10 h-10 w-10 items-center justify-center rounded-full border-2',
                  done
                    ? 'border-brand-700 bg-brand-700 dark:border-brand-400 dark:bg-brand-400'
                    : active
                      ? 'border-brand-700 bg-app-surface dark:border-brand-400 dark:bg-zinc-900'
                      : 'border-app-border bg-app-surface dark:border-zinc-700 dark:bg-zinc-900',
                )}>
                <Text
                  className={cn(
                    done ? 'text-sm text-white dark:text-slate-950' : 'text-xs',
                    !done && active && 'text-brand-700 dark:text-brand-400',
                    !done && !active && 'text-app-text-muted dark:text-zinc-500',
                  )}>
                  {done ? '✓' : entry.icon}
                </Text>
              </View>
              <Text
                className={cn(
                  'text-[10px] text-center',
                  active
                    ? 'font-bold text-brand-700 dark:text-brand-400'
                    : 'text-app-text-muted dark:text-zinc-500',
                )}>
                {entry.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
