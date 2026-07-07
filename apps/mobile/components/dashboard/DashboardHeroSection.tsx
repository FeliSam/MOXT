import { Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, ArrowUpRight, ArrowRightLeft, CheckCircle2 } from 'lucide-react-native';

import { tw } from '@/constants/dashboardTailwind';
import { cn } from '@/lib/cn';

const RATE_RUB_TO_XOF = 7.3953;

export function DashboardHeroSection({
  firstName,
  sendAmount,
  setSendAmount,
  rubToXof,
  setRubToXof,
  estimation,
  currencyFrom,
  currencyTo,
}: {
  firstName?: string;
  sendAmount: string;
  setSendAmount: (v: string) => void;
  rubToXof: boolean;
  setRubToXof: (fn: (v: boolean) => boolean) => void;
  estimation: number;
  currencyFrom: string;
  currencyTo: string;
}) {
  return (
    <View className="px-4">
      <LinearGradient
        colors={['#07594d', '#08705f', '#245de8']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.95 }}
        className={tw.hero}
        style={{ borderRadius: 36, overflow: 'hidden' }}>
        <View className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-cyan-300/20" />
        <View className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-blue-400/25" />

        <View className="relative z-10">
          <View className={cn(tw.heroChip, 'flex-row items-center gap-2')}>
            <CheckCircle2 size={14} color="#ffffff" strokeWidth={2.4} />
            <Text className={tw.heroChipText}>Bienvenue {firstName || ''}</Text>
          </View>

          <Text className={tw.heroTitle}>Tous vos services essentiels, réunis.</Text>
          <Text className={tw.heroSubtitle}>
            Transferts, colis, ventes, jobs et événements dans une expérience simple, instantanée
            et pensée pour vos échanges entre l'Afrique et la Russie.
          </Text>

          <View className="mt-8 flex-row flex-wrap gap-3">
            <Pressable className={cn(tw.heroCtaPrimary, 'flex-row items-center gap-2')} onPress={() => router.push('/transfer/wizard' as any)}>
              <Text className={tw.heroCtaPrimaryText}>Créer un transfert</Text>
              <ArrowRight size={16} color="#020617" strokeWidth={2.6} />
            </Pressable>
            <Pressable className={tw.heroCtaGhost} onPress={() => router.push('/marketplace' as any)}>
              <Text className={tw.heroCtaGhostText}>Explorer les services</Text>
            </Pressable>
          </View>

          {/* DashboardTransferCalculator — classes web exactes */}
          <View className={tw.calcWrap}>
            <View className="flex-row items-center justify-between gap-3">
              <View>
                <Text className={tw.calcEyebrow}>Transfert rapide</Text>
                <Text className={tw.calcTitle}>Estimez votre envoi</Text>
              </View>
              <Pressable className={tw.calcInvert} onPress={() => setRubToXof((v) => !v)}>
                <ArrowRightLeft size={18} color="#07594d" strokeWidth={2.4} />
              </Pressable>
            </View>

            <View className="mt-6 gap-3">
              <View className={tw.calcFieldLight}>
                <Text className={tw.calcFieldLabel}>VOUS ENVOYEZ</Text>
                <View className="mt-2 flex-row items-center gap-3">
                  <TextInput
                    keyboardType="numeric"
                    value={sendAmount}
                    onChangeText={setSendAmount}
                    className="min-w-0 flex-1 text-2xl font-black text-slate-950 p-0"
                    placeholderTextColor="#9ca3af"
                  />
                  <View className={tw.calcChipFrom}>
                    <Text className={tw.calcChipFromText}>{currencyFrom}</Text>
                  </View>
                </View>
              </View>

              <View className={tw.calcFieldDark}>
                <Text className={tw.calcFieldLabelDark}>ESTIMATION REÇUE</Text>
                <View className="mt-2 flex-row items-center gap-3">
                  <Text className={cn(tw.calcInputDark, 'flex-1')}>
                    {estimation.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <View className={tw.calcChipTo}>
                    <Text className={tw.calcChipToText}>{currencyTo}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className={tw.calcRateRow}>
              <Text className={tw.calcRateText}>
                1 {currencyFrom} = {(rubToXof ? RATE_RUB_TO_XOF : 1 / RATE_RUB_TO_XOF).toFixed(5)} {currencyTo}
              </Text>
              <Text className={tw.calcRateText}>Frankfurter</Text>
            </View>

            <Pressable className={cn(tw.calcBtn, 'flex-row items-center justify-center gap-2')} onPress={() => router.push('/transfer/wizard' as any)}>
              <Text className={tw.calcBtnText}>Ouvrir la calculatrice</Text>
              <ArrowUpRight size={16} color="#020617" strokeWidth={2.6} />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
