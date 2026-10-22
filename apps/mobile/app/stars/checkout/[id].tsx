import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Gift,
  Shield,
  Star,
  XCircle,
} from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';
import {
  completeStubPurchase,
  fetchStarsPurchase,
  starsPackMeta,
  type StarsPackage,
  type StarsPurchase,
} from '@/services/stars';

export default function StarsCheckoutScreen() {
  const { id, pack: packJson } = useLocalSearchParams<{ id: string; pack?: string }>();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const packFromParams = useMemo<StarsPackage | null>(() => {
    if (!packJson) return null;
    try {
      return JSON.parse(packJson);
    } catch {
      return null;
    }
  }, [packJson]);

  const [purchase, setPurchase] = useState<StarsPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doneStatus, setDoneStatus] = useState<'paid' | 'failed' | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const row = await fetchStarsPurchase(id);
        if (!active) return;
        if (row) {
          setPurchase(row);
          if (row.status === 'paid') setDoneStatus('paid');
          if (row.status === 'failed') setDoneStatus('failed');
        }
      } catch {
        // fallback to param pack
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const stars = packFromParams?.stars ?? purchase?.stars ?? 50;
  const bonusStars = packFromParams?.bonus_stars ?? purchase?.bonus_stars ?? 0;
  const totalStars = stars + bonusStars;
  const priceRub = packFromParams?.price_rub ?? purchase?.price_rub ?? 450;
  const packageLabel = packFromParams?.title || `Pack ${stars} Stars`;
  const meta = starsPackMeta(packFromParams?.id || purchase?.package_id || 'pack-50', 0);

  const finalize = async (success: boolean) => {
    setSubmitting(true);
    try {
      if (id) {
        await completeStubPurchase(id, success);
      }
      const finalStatus = success ? 'paid' : 'failed';
      setDoneStatus(finalStatus);
      if (success) {
        showNotice(
          t('stars.checkoutSuccessTitle') || 'Paiement confirmé',
          t('stars.checkoutSuccessBody', { n: totalStars }) ||
            `Votre compte a été crédité de ${totalStars} Stars !`,
        );
      } else {
        showNotice(
          t('stars.checkoutFailedTitle') || 'Paiement échoué',
          t('stars.checkoutFailedBody') || 'La transaction n’a pas abouti.',
        );
      }
    } catch (err: any) {
      showNotice(
        t('stars.checkoutError') || 'Erreur',
        err?.message || 'Une erreur est survenue lors du paiement.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppChrome pathname="/stars/buy">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#6d28d9', '#4f46e5', '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-[11px] font-black uppercase tracking-widest text-white/80">
                {t('stars.checkoutEyebrow') || 'COMMANDE STARS'}
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-white">
                {t('stars.checkoutTitle') || 'Finalisation de l’achat'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/stars/buy')}
              className="size-10 items-center justify-center rounded-xl bg-white/20 active:opacity-70"
              accessibilityLabel="Retour"
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
          </View>
          <Text className="mt-2 text-xs leading-relaxed text-white/90">
            {t('stars.checkoutDescription') ||
              'Confirmez votre pack pour créditer vos Stars immédiatement sur votre solde.'}
          </Text>
        </LinearGradient>

        {/* Test Simulator Banner */}
        <Card className="flex-row items-start gap-3 border-amber-300/60 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25 p-3.5">
          <AlertTriangle size={18} color="#d97706" className="mt-0.5" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {t('stars.checkoutTestBanner') || 'Simulation de paiement (Mode Test)'}
            </Text>
            <Text className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              {t('stars.checkoutTestHint') ||
                'Ce flux teste l’intégration des Stars. Aucun débit bancaire réel ne sera effectué.'}
            </Text>
          </View>
        </Card>

        {/* Order Details Card */}
        <View className="rounded-2xl border border-app-border bg-app-surface overflow-hidden shadow-sm">
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20, paddingBottom: 28 }}
          >
            <Text className="text-[10px] font-black uppercase tracking-widest text-white/75">
              {t('stars.checkoutOrder') || 'RÉCAPITULATIF DE LA COMMANDE'}
            </Text>
            <Text className="mt-1 text-base font-bold text-white">{packageLabel}</Text>

            <View className="mt-4 flex-row items-baseline gap-2">
              <Text className="text-5xl font-black text-white">{stars}</Text>
              {bonusStars > 0 && (
                <View className="flex-row items-center gap-1 rounded-lg bg-white/20 px-2 py-1">
                  <Gift size={12} color="#ffffff" />
                  <Text className="text-xs font-black text-white">+{bonusStars}</Text>
                </View>
              )}
            </View>
            <Text className="mt-1 text-xs text-white/80">
              Total reçu : {totalStars} ★
            </Text>
          </LinearGradient>

          <View className="p-4 gap-4 bg-app-surface">
            <View className="flex-row items-center justify-between rounded-xl border border-app-border bg-app-surface-muted p-3.5">
              <Text className="text-xs font-semibold text-app-text-muted">
                {t('stars.checkoutAmount') || 'Montant total à régler'}
              </Text>
              <Text className="text-2xl font-black text-app-text">{priceRub} ₽</Text>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-app-surface-muted p-2.5">
                <CreditCard size={14} color="#64748b" />
                <Text className="text-[11px] font-semibold text-app-text-muted">
                  {t('stars.buyPayRub') || 'Paiement en ₽'}
                </Text>
              </View>
              <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-app-surface-muted p-2.5">
                <Shield size={14} color="#64748b" />
                <Text className="text-[11px] font-semibold text-app-text-muted">
                  {t('stars.buySecure') || 'Paiement sécurisé'}
                </Text>
              </View>
            </View>

            {id && (
              <Text className="text-center font-mono text-[10px] text-app-text-faint">
                {t('stars.checkoutRef', { ref: String(id).slice(0, 12) }) ||
                  `Réf : ${String(id).slice(0, 16)}`}
              </Text>
            )}
          </View>
        </View>

        {/* State: Paid */}
        {doneStatus === 'paid' && (
          <Card className="items-center p-6 gap-3 border-emerald-300/60 bg-emerald-50 dark:bg-emerald-950/20">
            <View className="size-14 rounded-2xl bg-emerald-500/15 items-center justify-center">
              <CheckCircle size={32} color="#059669" />
            </View>
            <View className="items-center">
              <Text className="text-lg font-black text-emerald-950 dark:text-emerald-100">
                {t('stars.checkoutSuccessTitle') || 'Achat réussi !'}
              </Text>
              <Text className="text-xs text-emerald-800 dark:text-emerald-300 text-center mt-1">
                {t('stars.checkoutSuccessBody', { n: totalStars }) ||
                  `Votre compte a été crédité de ${totalStars} Stars.`}
              </Text>
            </View>
            <Button
              className="w-full mt-2"
              onPress={() => router.push('/stars')}
              icon={<Star size={16} color="#ffffff" fill="#ffffff" />}
            >
              {t('stars.backWallet') || 'Voir mon portefeuille Stars'}
            </Button>
          </Card>
        )}

        {/* State: Failed */}
        {doneStatus === 'failed' && (
          <Card className="items-center p-6 gap-3 border-rose-300/60 bg-rose-50 dark:bg-rose-950/20">
            <View className="size-14 rounded-2xl bg-rose-500/15 items-center justify-center">
              <XCircle size={32} color="#e11d48" />
            </View>
            <View className="items-center">
              <Text className="text-lg font-black text-rose-950 dark:text-rose-100">
                {t('stars.checkoutFailedTitle') || 'Échec du paiement'}
              </Text>
              <Text className="text-xs text-rose-800 dark:text-rose-300 text-center mt-1">
                {t('stars.checkoutFailedBody') || 'La transaction n’a pas abouti.'}
              </Text>
            </View>
            <View className="w-full gap-2 mt-2">
              <Button
                className="w-full"
                loading={submitting}
                onPress={() => finalize(true)}
              >
                {t('stars.checkoutRetry') || 'Réessayer'}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onPress={() => router.push('/stars/buy')}
              >
                {t('stars.backToPacks') || 'Choisir un autre pack'}
              </Button>
            </View>
          </Card>
        )}

        {/* State: Pending / Action */}
        {!doneStatus && (
          <Card className="p-4 gap-3">
            <Text className="text-sm font-black text-app-text">
              {t('stars.checkoutPayment') || 'Valider le paiement'}
            </Text>
            <Text className="text-xs text-app-text-muted">
              {t('stars.checkoutPaymentHint') ||
                'Cliquez ci-dessous pour confirmer la transaction et créditer vos Stars immédiatement.'}
            </Text>

            <Button
              className="w-full"
              loading={submitting}
              onPress={() => finalize(true)}
              icon={<CheckCircle size={16} color="#ffffff" />}
            >
              {t('stars.checkoutConfirmTest') || 'Confirmer l’achat (Simulation)'}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              loading={submitting}
              onPress={() => finalize(false)}
              icon={<XCircle size={16} color="#64748b" />}
            >
              {t('stars.checkoutSimulateFail') || 'Simuler un échec'}
            </Button>

            <Pressable
              onPress={() => router.push('/stars/buy')}
              className="items-center py-2 active:opacity-70"
            >
              <Text className="text-xs font-bold text-app-text-muted">
                {t('stars.checkoutCancel') || 'Annuler et revenir aux packs'}
              </Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
});
