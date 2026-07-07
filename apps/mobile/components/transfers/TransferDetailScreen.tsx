import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  directionLabel,
  formatMoney,
  formatTransferDate,
} from '@moxt/shared/utils/transfers.js';

import { ImagePickerButton } from '@/components/ImagePickerButton';
import { MobileDashboardHeader } from '@/components/layout/MobileDashboardHeader';
import { AppScreen } from '@/components/ui/Card';
import { PROGRESS_STEPS, TRANSFER_STATUS_LABELS } from '@/constants/transfers';
import { twTransfer } from '@/constants/transferTailwind';
import { useAppSelector } from '@/store/store';
import { cn } from '@/lib/cn';

const NEXT_STEP: Record<string, { title: string; description: string }> = {
  pending_payment: {
    title: 'Action attendue du client',
    description: "Ajoutez une preuve puis déclarez le paiement. L'entreprise sera notifiée automatiquement.",
  },
  payment_declared: {
    title: "Action attendue de l'entreprise",
    description: 'Le partenaire doit confirmer la réception du paiement depuis son tableau de bord.',
  },
  payment_received: {
    title: 'Virement en préparation',
    description: "L'entreprise effectue le transfert.",
  },
  paid_out: {
    title: 'Validation finale',
    description: "L'entreprise valide la fin du transfert.",
  },
  completed: {
    title: 'Terminé',
    description: 'Le transfert est terminé. Reçu disponible.',
  },
};

export default function TransferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const transfer = useAppSelector((state) =>
    state.transfers.items.find((t: any) => t.id === id),
  );
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(true);

  if (!transfer) {
    return (
      <AppScreen edges={['top']} className="items-center justify-center gap-4">
        <Text className="text-xl font-black text-app-text dark:text-zinc-50">Transfert introuvable</Text>
        <Pressable className={twTransfer.navNext} onPress={() => router.back()}>
          <Text className={twTransfer.navNextText}>Retour</Text>
        </Pressable>
      </AppScreen>
    );
  }

  const t = transfer as any;
  const recipientName = [t.recipient?.firstName, t.recipient?.lastName].filter(Boolean).join(' ');
  const senderName = [t.sender?.firstName || user?.firstName, t.sender?.lastName || user?.lastName]
    .filter(Boolean)
    .join(' ');
  const senderInitials = `${(t.sender?.firstName || user?.firstName || '?')[0]}${(t.sender?.lastName || user?.lastName || '?')[0]}`.toUpperCase();
  const recipientInitials = `${(t.recipient?.firstName || '?')[0]}${(t.recipient?.lastName || '?')[0]}`.toUpperCase();

  const currFrom = t.currencyFrom || t.currency_from || 'XOF';
  const currTo = t.currencyTo || t.currency_to || 'RUB';
  const amountSent = t.amountSent ?? t.amount_sent ?? t.amount ?? 0;
  const amountReceived = t.receivedAmount ?? t.amount_received ?? amountSent * (t.rate || 7.3953);
  const fee = t.fee ?? Math.round(Number(amountSent) * 0.025);
  const totalToPay = t.totalToPay ?? t.total_to_pay ?? Number(amountSent) + Number(fee);
  const st = TRANSFER_STATUS_LABELS[t.status] || TRANSFER_STATUS_LABELS.pending_payment;
  const currentStepIndex = PROGRESS_STEPS.findIndex((s) => s.key === t.status);
  const nextStep = NEXT_STEP[t.status || 'pending_payment'];

  return (
    <AppScreen edges={['top']}>
      <MobileDashboardHeader eyebrow="FINANCE" title="Transfer details" />
      <ScrollView contentContainerClassName="gap-5 px-4 pb-32 pt-2" showsVerticalScrollIndicator={false}>
        {/* Summary header */}
        <View className={twTransfer.detailCard}>
          <Text className="text-[10px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-400">
            {t.id}
          </Text>
          <Text className="mt-1 text-2xl font-black text-app-text dark:text-zinc-50">Transfer details</Text>
          <Text className="mt-1 text-sm text-app-text-muted dark:text-zinc-400">
            {directionLabel(t.direction || '')} · créé le{' '}
            {t.createdAt || t.created_at ? formatTransferDate(t.createdAt || t.created_at) : '—'}
          </Text>
          <Pressable className={cn(twTransfer.navBack, 'mt-4 self-start px-4')} onPress={() => router.back()}>
            <Text className={twTransfer.navBackText}>← Back</Text>
          </Pressable>
        </View>

        {/* Metrics 2x2 */}
        <View className={twTransfer.detailMetricGrid}>
          {[
            { emoji: '🔁', label: 'Direction', value: directionLabel(t.direction || '') },
            { emoji: '🕐', label: 'Création', value: t.createdAt || t.created_at ? formatTransferDate(t.createdAt || t.created_at) : '—' },
            { emoji: '👤', label: 'Destinataire', value: recipientName || '—' },
            { emoji: '🛡️', label: 'Partenaire', value: t.exchanger?.name || 'MOXT Change' },
          ].map((m) => (
            <View key={m.label} className={twTransfer.detailMetric}>
              <Text className="text-lg">{m.emoji}</Text>
              <Text className={twTransfer.detailMetricValue}>{m.value}</Text>
              <Text className={twTransfer.detailMetricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Hero gradient */}
        <View className={twTransfer.detailHero}>
          <LinearGradient
            colors={['#0f766e', '#08705f', '#2563eb']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5"
            style={{ borderRadius: 16 }}>
            <View className={twTransfer.detailHeroBadge} style={{ backgroundColor: st.bg }}>
              <Text className={twTransfer.detailHeroBadgeText} style={{ color: st.color }}>
                {st.label}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center gap-3">
              <View className="flex-1">
                <Text className={twTransfer.detailHeroLabel}>ENVOYÉ</Text>
                <Text className={twTransfer.detailHeroValue}>{formatMoney(amountSent, currFrom)}</Text>
              </View>
              <Text className="text-xl text-white/40">⇄</Text>
              <View className="flex-1">
                <Text className={twTransfer.detailHeroLabel}>REÇU (ESTIMÉ)</Text>
                <Text className={twTransfer.detailHeroValue}>{formatMoney(amountReceived, currTo)}</Text>
              </View>
            </View>
            {t.exchanger?.name ? (
              <View className={twTransfer.detailHeroPartner}>
                <Text className={twTransfer.detailHeroPartnerText}>Traité par {t.exchanger.name}</Text>
                <View className={twTransfer.detailVerified}>
                  <Text className={twTransfer.detailVerifiedText}>✓ VÉRIFIÉ MOXT</Text>
                </View>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        {/* Progression */}
        <View className={twTransfer.detailCard}>
          <View className="flex-row items-center gap-2">
            <Text className="text-lg">🕐</Text>
            <Text className={twTransfer.detailCardTitle}>Progression</Text>
          </View>
          <View className={twTransfer.progressRow}>
            {PROGRESS_STEPS.map((s, idx) => {
              const done = idx <= currentStepIndex;
              const active = idx === currentStepIndex;
              return (
                <View key={s.key} className="flex-1 items-center">
                  <View
                    className={cn(
                      twTransfer.progressCircle,
                      done
                        ? 'border-brand-700 bg-brand-700 dark:border-brand-400 dark:bg-brand-400'
                        : active
                          ? 'border-brand-700 bg-white dark:border-brand-400 dark:bg-zinc-900'
                          : 'border-app-border bg-white dark:border-zinc-700 dark:bg-zinc-900',
                    )}>
                    <Text
                      className={cn(
                        'text-[11px] font-bold',
                        done ? 'text-white dark:text-slate-950' : active ? 'text-brand-700' : 'text-app-text-muted',
                      )}>
                      {done ? '✓' : idx + 1}
                    </Text>
                  </View>
                  <Text
                    className={cn(
                      twTransfer.progressLabel,
                      done || active ? 'text-brand-700 dark:text-brand-400' : 'text-app-text-muted',
                    )}>
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Security */}
        <View className={twTransfer.warningCard}>
          <Text className="text-lg">🛡️</Text>
          <Text className={cn(twTransfer.warningTitle, 'mt-2')}>⚠ Payez en toute sécurité</Text>
          <Text className={twTransfer.warningText}>
            Ne payez jamais en dehors de MOXT, conservez toutes vos preuves de paiement et vérifiez les
            coordonnées du partenaire avant toute transaction.
          </Text>
        </View>

        {/* Next step */}
        {nextStep ? (
          <View className={twTransfer.detailCard}>
            <Text className={twTransfer.nextEyebrow}>PROCHAINE ÉTAPE</Text>
            <View className="flex-row items-start justify-between gap-3">
              <Text className={cn(twTransfer.nextTitle, 'flex-1')}>{nextStep.title}</Text>
              <View className={twTransfer.statusPill} style={{ backgroundColor: st.bg }}>
                <Text className={twTransfer.statusPillText} style={{ color: st.color }}>
                  {st.label}
                </Text>
              </View>
            </View>
            <Text className={twTransfer.nextDesc}>{nextStep.description}</Text>
          </View>
        ) : null}

        {/* Financial summary */}
        <View className={twTransfer.detailCard}>
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/45">
              <Text>📄</Text>
            </View>
            <Text className={twTransfer.detailCardTitle}>Résumé financier</Text>
          </View>
          {[
            ['Taux appliqué', `${(t.rate || 0.133869).toFixed(6)} ${currTo}`],
            [`Frais ${t.exchanger?.feePercent || 2.5}%`, formatMoney(fee, currFrom)],
            ['Total à payer', formatMoney(totalToPay, currFrom)],
            ['Source du taux', `${t.rateSource || t.rate_source || 'Frankfurter'} · ${t.rateDate || t.rate_date || '—'}`],
            ['Partenaire', t.exchanger?.name || 'MOXT Change'],
            ['Coordonnées de paiement', t.exchanger?.paymentAccount || 'Compte communiqué après confirmation'],
          ].map(([label, value]) => (
            <View key={label} className={twTransfer.financeRow}>
              <Text className={twTransfer.financeLabel}>{label}</Text>
              <Text className={twTransfer.financeValue}>{value}</Text>
            </View>
          ))}
          <View className="mt-4 flex-row flex-wrap gap-2">
            {['Copier la référence', 'PDF', 'Image', 'Partager'].map((label) => (
              <Pressable key={label} className={twTransfer.actionChip}>
                <Text className={twTransfer.actionChipText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Participants */}
        <View className={twTransfer.detailCard}>
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/45">
              <Text>👥</Text>
            </View>
            <Text className={twTransfer.detailCardTitle}>Participants</Text>
          </View>
          <View className="flex-row gap-3">
            <ParticipantCard
              role="EXPÉDITEUR"
              initials={senderInitials}
              name={senderName}
              phone={t.sender?.phone}
              method={t.sender?.method}
            />
            <ParticipantCard
              role="DESTINATAIRE"
              initials={recipientInitials}
              name={recipientName}
              phone={t.recipient?.phone}
              method={t.recipient?.method}
            />
          </View>
        </View>

        {/* Timeline */}
        <View className={twTransfer.detailCard}>
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/45">
              <Text>🕐</Text>
            </View>
            <Text className={twTransfer.detailCardTitle}>Chronologie</Text>
          </View>
          <View className="flex-row gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-700 dark:bg-brand-400">
              <Text className="text-white dark:text-slate-950">🕐</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-app-text dark:text-zinc-50">
                Transfert créé, paiement attendu
              </Text>
              <Text className="mt-1 text-xs text-app-text-muted dark:text-zinc-400">
                {t.createdAt || t.created_at ? formatTransferDate(t.createdAt || t.created_at) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className={twTransfer.detailCard}>
          <View className="mb-2 flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/45">
              <Text>✓</Text>
            </View>
            <View>
              <Text className={twTransfer.detailCardTitle}>Actions</Text>
              <Text className="text-xs text-app-text-muted dark:text-zinc-400">
                Chaque action est unique et la prochaine étape dépend du statut actuel.
              </Text>
            </View>
          </View>

          {t.status === 'pending_payment' ? (
            <View className="gap-3">
              <Pressable className={twTransfer.uploadZone}>
                <Text className="text-2xl">⬆️</Text>
                <Text className={twTransfer.uploadTitle}>Preuve de paiement</Text>
                <Text className={twTransfer.uploadHint}>Cliquez pour ajouter une image ou un PDF</Text>
              </Pressable>
              <ImagePickerButton label="Photo de la preuve" currentUri={proofUri} onImageSelected={setProofUri} />
              <Pressable className={twTransfer.declareBtn}>
                <Text className={twTransfer.submitBtnText}>✓ Déclarer le paiement</Text>
              </Pressable>
            </View>
          ) : null}

          <View className="mt-3 gap-2">
            <Pressable className={twTransfer.cancelBtn}>
              <Text className={twTransfer.cancelBtnText}>✕ Annuler</Text>
            </Pressable>
            <Pressable className={twTransfer.outlineBtn} onPress={() => router.push('/disputes/create' as any)}>
              <Text className={twTransfer.outlineBtnText}>🚩 Ouvrir une réclamation</Text>
            </Pressable>
          </View>
        </View>

        {/* Operation info */}
        <View className={twTransfer.detailCard}>
          <Text className={cn(twTransfer.detailCardTitle, 'mb-4')}>Informations de l'opération</Text>
          {[
            ['Référence', t.id],
            ['Statut', 'Transfert créé, paiement attendu'],
            ['Montant envoyé', formatMoney(amountSent, currFrom)],
            ['Montant reçu (estimé)', formatMoney(amountReceived, currTo)],
            ['Total à payer', formatMoney(totalToPay, currFrom)],
            ['Mode', 'Estimation — aucun débit automatique'],
          ].map(([label, value]) => (
            <View key={label} className={twTransfer.factBlock}>
              <Text className={twTransfer.factLabel}>{label}</Text>
              <Text className={twTransfer.factValue}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {showToast ? (
        <View className="absolute bottom-36 left-4 right-4 flex-row items-start gap-3 rounded-2xl border-l-4 border-emerald-500 bg-white p-4 shadow-lg dark:bg-zinc-900">
          <Text className="text-emerald-600">✓</Text>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-black text-app-text dark:text-zinc-50">Transfert créé</Text>
            <Text className="mt-0.5 text-xs text-app-text-muted dark:text-zinc-400">
              L'entreprise sélectionnée peut maintenant traiter l'opération.
            </Text>
          </View>
          <Pressable onPress={() => setShowToast(false)}>
            <Text className="text-app-text-muted">✕</Text>
          </Pressable>
        </View>
      ) : null}
    </AppScreen>
  );
}

function ParticipantCard({
  role,
  initials,
  name,
  phone,
  method,
}: {
  role: string;
  initials: string;
  name: string;
  phone?: string;
  method?: string;
}) {
  return (
    <View className={twTransfer.participantCard}>
      <View className={twTransfer.participantBadge}>
        <Text className={twTransfer.participantBadgeText}>{initials}</Text>
      </View>
      <Text className={twTransfer.participantRole}>{role}</Text>
      <Text className={twTransfer.participantName}>{name || '—'}</Text>
      {phone ? <Text className={twTransfer.participantMeta}>{phone}</Text> : null}
      {method ? <Text className={twTransfer.participantMeta}>{method}</Text> : null}
    </View>
  );
}
