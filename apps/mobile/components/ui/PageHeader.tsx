import { View, Text } from 'react-native';

import { cn } from '@/lib/cn';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  showDot = true,
  className,
}: PageHeaderProps) {
  return (
    <View className={cn('px-5 pt-3 pb-4 gap-3', className)}>
      <View className="gap-1">
        {eyebrow ? (
          <View className="flex-row items-center gap-1.5 mb-1">
            {showDot ? <View className="w-2 h-2 rounded-full bg-brand-700 dark:bg-brand-400" /> : null}
            <Text className="text-[11px] font-extrabold uppercase tracking-[1.8px] text-brand-700 dark:text-brand-400">
              {eyebrow.toUpperCase()}
            </Text>
          </View>
        ) : null}
        <Text className="text-2xl font-black tracking-tight text-app-text dark:text-zinc-50">{title}</Text>
        {description ? (
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400 mt-1">{description}</Text>
        ) : null}
      </View>
      {actions ? <View className="flex-row flex-wrap gap-2">{actions}</View> : null}
    </View>
  );
}
