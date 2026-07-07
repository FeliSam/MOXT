import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import {
  QUICK_ACCENTS_DARK,
  QUICK_ACCENTS_LIGHT,
  QUICK_ACTIONS,
  dashboardWidths,
  tw,
} from '@/constants/dashboardTailwind';
import { DashboardSectionHeading } from '@/components/dashboard/DashboardSectionHeading';
import { useTheme } from '@/theme/ThemeContext';
import { cn } from '@/lib/cn';

export function DashboardQuickActionsSection() {
  const { isDark } = useTheme();
  const accents = isDark ? QUICK_ACCENTS_DARK : QUICK_ACCENTS_LIGHT;

  return (
    <View className="gap-3">
      <DashboardSectionHeading
        title="Actions rapides"
        linkLabel="Mes activités"
        onPress={() => router.push('/favorites' as any)}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={tw.carouselTrack}>
        {QUICK_ACTIONS.map((action, index) => (
          <Pressable key={action.label} onPress={() => router.push(action.route as any)}>
            <LinearGradient
              colors={accents[index]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: dashboardWidths.quickAction, borderRadius: 16 }}
              className={tw.quickCard}>
              <View
                className="h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: action.tint + '22' }}>
                <action.Icon size={22} color={action.tint} strokeWidth={2.2} />
              </View>
              <View className="mt-4">
                <Text className={tw.quickTitle}>{action.label}</Text>
                <Text className={tw.quickDesc}>{action.description}</Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
