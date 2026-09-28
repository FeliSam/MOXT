import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, CircleCheck, Inbox, Repeat } from 'lucide-react-native';

import { WebCard } from '@/components/dashboard/webUi';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/theme/ThemeContext';

export type TodoItem = { labelKey: string; count: number; to: string };

/** DashboardTodoInbox du web. */
export function DashboardTodoInbox({ todoItems }: { todoItems: TodoItem[] }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  return (
    <WebCard>
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
          <Inbox size={16} color={isDark ? '#fcd34d' : '#b45309'} strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-base font-black text-app-text">{t('dashboard.overview.todoTitle')}</AppText>
          <AppText className="text-xs text-app-text-muted">{t('dashboard.overview.todoDescription')}</AppText>
        </View>
      </View>
      <View className="mt-5 gap-2">
        {todoItems.length ? (
          todoItems.map((item) => (
            <Pressable
              key={item.labelKey}
              onPress={() => router.push(item.to as never)}
              className="flex-row items-center gap-3 rounded-2xl bg-app-surface-muted p-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-app-surface">
                <Repeat size={16} color={colors.accent} strokeWidth={2} />
              </View>
              <AppText className="min-w-0 flex-1 text-sm font-bold text-app-text">
                {t(item.labelKey, { count: item.count })}
              </AppText>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          ))
        ) : (
          <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <CircleCheck size={14} color={isDark ? '#6ee7b7' : '#047857'} strokeWidth={2} />
            <AppText className="flex-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {t('dashboard.overview.allUpToDate')}
            </AppText>
          </View>
        )}
      </View>
    </WebCard>
  );
}
