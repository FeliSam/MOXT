import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CheckCircle,
  Globe,
  MessageSquare,
  Package,
  Repeat,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/providers/LanguageProvider';

const PILLARS = [
  { id: 'transfers', icon: Repeat, color: '#3b82f6' },
  { id: 'community', icon: Users, color: '#8b5cf6' },
  { id: 'trust', icon: Shield, color: '#10b981' },
  { id: 'i18n', icon: Globe, color: '#f59e0b' },
];

const SERVICES = [
  { id: 'transfers', icon: ArrowLeftRight, color: '#3b82f6' },
  { id: 'parcels', icon: Package, color: '#10b981' },
  { id: 'marketplace', icon: ShoppingBag, color: '#f59e0b' },
  { id: 'businesses', icon: Building2, color: '#6366f1' },
  { id: 'community', icon: Users, color: '#ec4899' },
  { id: 'messages', icon: MessageSquare, color: '#06b6d4' },
];

const TRUST_PRINCIPLES = [
  { id: 'phone', icon: Smartphone },
  { id: 'identity', icon: Shield },
  { id: 'messaging', icon: MessageSquare },
  { id: 'validation', icon: Repeat },
];

export default function PresentationScreen() {
  const { t } = useLanguage();

  return (
    <AppChrome pathname="/presentation">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 56, gap: 24 }}
      >
        {/* Hero Section */}
        <View className="py-2">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-brand-500/10 px-3 py-1 mb-3">
            <Smartphone size={13} color="#6366f1" />
            <Text className="text-[11px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
              {t('public.presentation.badge') || 'Web · Mobile · PWA'}
            </Text>
          </View>

          <Text className="text-3xl font-black text-app-text leading-tight">
            {t('public.presentation.title') || 'MOXT, la solution pour relier l’Afrique et la Russie.'}
          </Text>

          <Text className="text-sm leading-relaxed text-app-text-muted mt-3">
            {t('public.presentation.subtitle') ||
              'Une plateforme unique pour les transferts, le transport de colis, la marketplace, les entreprises de la diaspora et la communication.'}
          </Text>

          <View className="mt-5 flex-row flex-wrap gap-2.5">
            <Button
              onPress={() => router.push('/(tabs)/moxt')}
              icon={<ArrowRight size={16} color="#ffffff" />}
            >
              {t('public.presentation.ctaStart') || 'Commencer gratuitement'}
            </Button>
            <Button
              variant="secondary"
              onPress={() => router.push('/(tabs)/moxt')}
            >
              {t('public.presentation.ctaExplore') || 'Explorer les services'}
            </Button>
          </View>

          <View className="mt-5 gap-2 border-t border-app-border/60 pt-4">
            <View className="flex-row items-center gap-2">
              <CheckCircle size={15} color="#059669" />
              <Text className="text-xs text-app-text-muted">
                {t('public.presentation.bulletSame') ||
                  'Même expérience sur navigateur et application native'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <CheckCircle size={15} color="#059669" />
              <Text className="text-xs text-app-text-muted">
                {t('public.presentation.bulletLang') ||
                  'Interface multilingue adaptable en un clic'}
              </Text>
            </View>
          </View>
        </View>

        {/* 4 Pillars Section */}
        <View className="gap-3">
          <Text className="text-xs font-black uppercase tracking-widest text-brand-700 dark:text-brand-300">
            PILIERS FONDATEURS
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {PILLARS.map((item) => {
              const IconComp = item.icon;
              return (
                <View
                  key={item.id}
                  style={styles.gridCard}
                  className="rounded-2xl border border-app-border bg-app-surface p-4"
                >
                  <View
                    style={{ backgroundColor: `${item.color}15` }}
                    className="size-10 rounded-xl items-center justify-center mb-3"
                  >
                    <IconComp size={20} color={item.color} />
                  </View>
                  <Text className="text-sm font-black text-app-text">
                    {t(`public.pillars.${item.id}.title`)}
                  </Text>
                  <Text className="text-xs leading-relaxed text-app-text-muted mt-1">
                    {t(`public.pillars.${item.id}.description`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Services Section */}
        <View className="gap-3">
          <View>
            <Text className="text-xl font-black text-app-text">
              {t('public.presentation.servicesTitle') || 'Tous les services au même endroit'}
            </Text>
            <Text className="text-xs text-app-text-muted mt-1 leading-relaxed">
              {t('public.presentation.servicesSubtitle') ||
                'MOXT regroupe les usages quotidiens de la diaspora dans une application unique.'}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {SERVICES.map((s) => {
              const IconComp = s.icon;
              return (
                <View
                  key={s.id}
                  style={styles.gridCard}
                  className="rounded-2xl border border-app-border bg-app-surface p-4"
                >
                  <View
                    style={{ backgroundColor: `${s.color}15` }}
                    className="size-9 rounded-xl items-center justify-center mb-2.5"
                  >
                    <IconComp size={18} color={s.color} />
                  </View>
                  <Text className="text-sm font-black text-app-text">
                    {t(`public.services.${s.id}.label`)}
                  </Text>
                  <Text className="text-xs text-app-text-muted mt-1 leading-snug">
                    {t(`public.services.${s.id}.description`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Why MOXT / Trust Section */}
        <LinearGradient
          colors={['#1e1b4b', '#1e3a8a', '#0f766e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.trustBanner}
        >
          <Text className="text-2xl font-black text-white">
            {t('public.presentation.whyTitle') || 'Pourquoi choisir MOXT ?'}
          </Text>

          <View className="mt-4 gap-3">
            {TRUST_PRINCIPLES.map((item) => {
              const IconComp = item.icon;
              return (
                <View key={item.id} className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm">
                  <View className="flex-row items-center gap-2 mb-1">
                    <IconComp size={16} color="#93c5fd" />
                    <Text className="text-xs font-bold text-white flex-1">
                      {t(`public.trust.${item.id}.title`)}
                    </Text>
                  </View>
                  <Text className="text-xs leading-relaxed text-blue-100/80">
                    {t(`public.trust.${item.id}.description`)}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="mt-5">
            <Pressable
              onPress={() => router.push('/(tabs)/moxt')}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-white py-3 px-4 shadow-md active:bg-white/90"
            >
              <Sparkles size={16} color="#1e1b4b" />
              <Text className="text-xs font-black text-slate-950">
                {t('public.presentation.ctaStart') || 'Rejoindre MOXT'}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ScrollView>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: '48%',
    flexGrow: 1,
  },
  trustBanner: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
});
