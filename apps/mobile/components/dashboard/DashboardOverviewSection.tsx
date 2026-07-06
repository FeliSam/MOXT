import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { RATE_RUB_TO_XOF, RATE_SOURCE, tw } from '@/constants/dashboardTailwind';
import { DashboardCardHeader } from '@/components/dashboard/DashboardSectionHeading';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

const TRANSFER_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  declared: { label: 'PAIEMENT DÉCLARÉ', bg: '#e0f2fe', text: '#0369a1' },
  pending: { label: 'PAIEMENT ATTENDU', bg: '#fef3c7', text: '#b45309' },
  confirmed: { label: 'CONFIRMÉ', bg: '#d2f8ec', text: '#08705f' },
  completed: { label: 'TERMINÉ', bg: '#d1fae5', text: '#047857' },
  cancelled: { label: 'ANNULÉ', bg: '#fee2e2', text: '#b91c1c' },
};

export function DashboardOverviewSection({
  verified,
  toDeclareCount,
  activeTransfers,
  profileCompletion,
  onboardingSteps,
  onboardingDone,
}: {
  verified: boolean;
  toDeclareCount: number;
  activeTransfers: any[];
  profileCompletion: number;
  onboardingSteps: { label: string; done: boolean }[];
  onboardingDone: number;
}) {
  const onboardingComplete = onboardingDone >= onboardingSteps.length;
  const rateDate = new Date().toISOString().slice(0, 10);

  return (
    <View className="gap-5">
      {!verified ? (
        <View className={tw.verifyCard}>
          <View className="flex-row items-start gap-3">
            <View className={tw.verifyIcon}>
              <Text className="text-lg">🛡️</Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className={tw.verifyTitle}>Vérifiez votre compte</Text>
              <Text className={tw.verifySubtitle}>
                Un compte vérifié inspire confiance et débloque des plafonds plus élevés pour vos transferts.
              </Text>
            </View>
          </View>
          <Pressable className={tw.verifyBtn} onPress={() => router.push('/kyc' as any)}>
            <Text className={tw.verifyBtnText}>Vérifier mon compte</Text>
          </Pressable>
        </View>
      ) : null}

      <Card className="mx-4">
        <DashboardCardHeader
          emoji="📥"
          iconClass="bg-amber-100 dark:bg-amber-900/40"
          title="Actions à faire"
          subtitle="Ce qui attend votre intervention."
        />
        <View className="mt-5 gap-2">
          {toDeclareCount > 0 ? (
            <Pressable className={tw.todoRow} onPress={() => router.push('/transfers' as any)}>
              <View className={tw.todoIcon}>
                <Text className="text-[13px] text-brand-700 dark:text-brand-400">💱</Text>
              </View>
              <Text className={tw.todoLabel}>{toDeclareCount} transfert(s) à déclarer</Text>
              <Text className="text-app-text-muted dark:text-zinc-400">›</Text>
            </Pressable>
          ) : (
            <View className={tw.todoEmpty}>
              <Text className={tw.todoEmptyText}>✓  Tout est à jour, aucune action en attente.</Text>
            </View>
          )}
        </View>
      </Card>

      <Card className="mx-4">
        <DashboardCardHeader
          emoji="💱"
          iconClass="bg-brand-100 dark:bg-brand-950/45"
          title="Mes transferts en cours"
          subtitle="Suivi de vos opérations actives."
          onOpen={() => router.push('/transfers' as any)}
        />
        <View className="mt-5 gap-2">
          {activeTransfers.length ? (
            activeTransfers.slice(0, 4).map((t) => {
              const badge = TRANSFER_STATUS[t.status || 'pending'] ?? TRANSFER_STATUS.pending;
              const amount = t.amountSent ?? 0;
              const currency = t.currencyFrom ?? 'XOF';
              return (
                <Pressable
                  key={t.id}
                  className={tw.transferRow}
                  onPress={() => router.push(`/transfer/${t.id}` as any)}>
                  <View className="absolute right-2 top-0 rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
                    <Text className="text-[9px] font-black" style={{ color: badge.text }}>
                      {badge.label}
                    </Text>
                  </View>
                  <Text className={cn(tw.transferAmount, 'pr-24')} numberOfLines={1}>
                    {amount.toLocaleString('fr-FR')} {currency === 'XOF' ? 'FCFA' : currency} ·{' '}
                    {t.exchanger?.name || 'Transfert'}
                  </Text>
                  <Text className={tw.transferId}>{t.id}</Text>
                </Pressable>
              );
            })
          ) : (
            <View className={tw.emptyBox}>
              <Text className={tw.emptyText}>Aucun transfert en cours.</Text>
              <Pressable className={tw.primaryBtn} onPress={() => router.push('/transfer/wizard' as any)}>
                <Text className={tw.primaryBtnText}>→  Créer un transfert</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Card>

      <Card className="mx-4">
        <DashboardCardHeader
          emoji="📈"
          iconClass="bg-brand-100 dark:bg-brand-950/45"
          title="Taux du jour"
          subtitle={`${RATE_SOURCE} · ${rateDate}`}
        />
        <View className="mt-5 flex-row gap-3">
          <View className={tw.rateTile}>
            <Text className={tw.rateTileLabel}>1 XOF</Text>
            <Text className={tw.rateTileValue}>{(1 / RATE_RUB_TO_XOF).toFixed(4)} RUB</Text>
          </View>
          <View className={tw.rateTile}>
            <Text className={tw.rateTileLabel}>1 RUB</Text>
            <Text className={tw.rateTileValue}>{RATE_RUB_TO_XOF.toFixed(2)} XOF</Text>
          </View>
        </View>
        <Pressable className={cn(tw.primaryBtn, 'mt-4')} onPress={() => router.push('/transfer/wizard' as any)}>
          <Text className={tw.primaryBtnText}>→  Envoyer de l'argent</Text>
        </Pressable>
      </Card>

      <Card className="mx-4">
        <View className="flex-row items-center gap-3">
          <View className={cn(tw.cardIcon, 'bg-brand-100 dark:bg-brand-950/45')}>
            <Text className="text-lg">👤</Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className={tw.cardTitle}>Profil complété</Text>
            <Text className={tw.cardSubtitle}>Un profil complet inspire confiance.</Text>
          </View>
          <Text className={tw.profilePercent}>{profileCompletion}%</Text>
        </View>
        <View className={tw.progressTrack}>
          <View className={tw.progressFill} style={{ width: `${profileCompletion}%` }} />
        </View>
        {profileCompletion === 100 ? (
          <Text className={tw.profileDone}>✓  Votre profil est complet.</Text>
        ) : (
          <Pressable className={cn(tw.secondaryBtn, 'mt-4')} onPress={() => router.push('/profile/edit' as any)}>
            <Text className={tw.secondaryBtnText}>Compléter mon profil  →</Text>
          </Pressable>
        )}
      </Card>

      {!onboardingComplete ? (
        <Card className="mx-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className={tw.cardTitle}>Premiers pas sur MOXT</Text>
              <Text className={tw.cardSubtitle}>Activez tout le potentiel de votre compte.</Text>
            </View>
            <View className={tw.stepBadge}>
              <Text className={tw.stepBadgeText}>
                {onboardingDone}/{onboardingSteps.length}
              </Text>
            </View>
          </View>
          <View className="mt-4 gap-2">
            {onboardingSteps.map((step) => (
              <View
                key={step.label}
                className={cn(tw.stepRow, step.done && 'opacity-70')}>
                <View
                  className={cn(
                    tw.stepCircle,
                    step.done ? 'bg-emerald-500' : 'border-2 border-app-border dark:border-zinc-700',
                  )}>
                  {step.done ? <Text className="text-[10px] font-black text-white">✓</Text> : null}
                </View>
                <Text className={cn(tw.stepLabel, step.done && 'line-through')}>{step.label}</Text>
                {!step.done ? <Text className="text-app-text-muted dark:text-zinc-400">›</Text> : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}
