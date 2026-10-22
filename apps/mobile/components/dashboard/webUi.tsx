import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { useShadows, useThemeColors } from '@/theme/ThemeContext';

/**
 * Carte web (components/ui/Card.jsx, variante default) :
 * rounded-[var(--radius-card-lg)] border bg-surface p-4 shadow-card.
 * `bare` = `!border-0 shadow-none` (cartes « Taux du jour », « Mes transferts »).
 */
export function WebCard({
  children,
  className,
  style,
  bare = false,
}: {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
  bare?: boolean;
}) {
  const shadows = useShadows();
  return (
    <View
      className={cn('min-w-0 rounded-2xl bg-app-surface p-4', !bare && 'border border-app-border', className)}
      style={[!bare && shadows.card, style]}>
      {children}
    </View>
  );
}

/** DashboardSectionHeading du web : sur-titre « Découvrir MOXT », titre 2xl, flèche ronde. */
export function WebSectionHeading({ title, link, linkLabel }: { title: string; link: string; linkLabel?: string }) {
  const { t } = useLanguage();
  const colors = useThemeColors();
  const shadows = useShadows();
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="min-w-0 flex-1">
        <AppText
          className="text-[11px] font-black uppercase text-brand-700 dark:text-brand-300"
          style={{ letterSpacing: 2.2 }}>
          {t('dashboard.discovery.eyebrow')}
        </AppText>
        <AppText className="mt-1 text-2xl font-black text-app-text" style={{ letterSpacing: -0.84, lineHeight: 32 }}>
          {title}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(link as never)}
        className="flex-row items-center gap-2 rounded-2xl border border-app-border bg-white px-3 py-2 dark:bg-app-surface"
        style={shadows.card}>
        {linkLabel ? <AppText className="text-xs font-black text-app-text">{linkLabel}</AppText> : null}
        <ArrowRight size={14} color={colors.text} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

/** Pastille Badge du web (tons Tailwind), texte 10px majuscules. */
export const BADGE_TONES = {
  brand: { box: 'bg-brand-100 dark:bg-brand-900', text: 'text-brand-800 dark:text-brand-100' },
  success: { box: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300' },
  warning: { box: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
  danger: { box: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300' },
  info: { box: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  teal: { box: 'bg-app-teal-soft', text: 'text-[#0a6b5d] dark:text-app-teal' },
  slate: { box: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  violet: { box: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300' },
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function WebBadge({
  children,
  tone = 'brand',
  small = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  small?: boolean;
  className?: string;
}) {
  const t = BADGE_TONES[tone] ?? BADGE_TONES.brand;
  return (
    <View className={cn('flex-row items-center self-start rounded-full', small ? 'px-1.5 py-px' : 'px-2.5 py-1', t.box, className)}>
      <AppText
        numberOfLines={1}
        className={cn(small ? 'text-[9px]' : 'text-[10px]', 'font-black uppercase', t.text)}
        style={{ letterSpacing: 0.6, lineHeight: small ? 13 : 15 }}>
        {children}
      </AppText>
    </View>
  );
}
