import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';

/** Miroir de moxt-react/src/components/ui/Badge.jsx (tons Tailwind identiques). */
export type DsBadgeTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'violet' | 'rose' | 'teal' | 'slate';

const TONES: Record<DsBadgeTone, { box: string; text: string }> = {
  brand: { box: 'bg-brand-100 dark:bg-brand-900', text: 'text-brand-800 dark:text-brand-100' },
  info: { box: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  success: { box: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300' },
  warning: { box: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
  danger: { box: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300' },
  violet: { box: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300' },
  rose: { box: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300' },
  teal: { box: 'bg-app-teal-soft', text: 'text-[#0a6b5d] dark:text-app-teal' },
  slate: { box: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
};

export function DsBadge({ children, tone = 'brand', className }: { children: ReactNode; tone?: DsBadgeTone; className?: string }) {
  const t = TONES[tone] ?? TONES.brand;
  return (
    <View className={cn('flex-row items-center self-start rounded-full px-2.5 py-1', t.box, className)}>
      <AppText
        className={cn('text-[10px] font-black uppercase', t.text)}
        style={{ letterSpacing: 0.6, lineHeight: 15 }}>
        {children}
      </AppText>
    </View>
  );
}
