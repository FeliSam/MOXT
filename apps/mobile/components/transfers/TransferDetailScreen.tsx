import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname, router } from 'expo-router';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Clock, Repeat, Shield, User } from 'lucide-react-native';

import { canClientDeclareReception } from '@moxt/shared/domain/transferActionUtils.js';
import { canRevealPaymentDetails } from '@moxt/shared/domain/transferAcceptanceUtils.js';
import { transferFromRemoteRow } from '@moxt/shared/domain/transferRemote.js';

import {
  directionLabel,
  formatMoney,
  formatTransferDate,
} from '@moxt/shared/utils/transfers.js';

import { ImagePickerButton } from '@/components/ImagePickerButton';
import { TransferStatusBadge } from '@/components/transfers/TransferStatusBadge';
import { AppScreen } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PROGRESS_STEPS, TRANSFER_STATUS_LABELS } from '@/constants/transfers';
import { twTransfer } from '@/constants/transferTailwind';
import { supabase } from '@/services/supabase';
import { upsertTransfer, transferMatches } from '@/store/transfers';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { idFromPath, routeParam } from '@/utils/routeParam';
import { cn } from '@/lib/cn';

function useCountdown(deadline?: string | null) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  if (!deadline) return null;
  const remaining = Math.max(0, new Date(deadline).getTime() - Date.now());
  const total = Math.floor(remaining / 1000);
  return {
    expired: remaining === 0,
    label: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`,
  };
}

const CANCELLABLE = ['pending_payment', 'payment_declared', 'pending_business_acceptance', 'declined'];

function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Retour', style: 'cancel' },
    { text: 'Confirmer', style: 'destructive', onPress: onConfirm },
  ]);
}

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
  const params = useLocalSearchParams<{ id?: string | string[]; created?: string | string[] }>();
  const transferId = routeParam(params.id) || idFromPath(usePathname());
  const justCreated = routeParam(params.created) === '1';
  const dispatch = useAppDispatch();
  const { t: tr } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const transfer = useAppSelector((state) =>
    state.transfers.items.find((item) => transferMatches(item as any, transferId)),
  );
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(justCreated);
  const [loading, setLoading] = useState(!transfer);
  const [detailTab, setDetailTab] = useState<'suivi' | 'paiement' | 'details'>('suivi');
  const raw = transfer as { status?: string; paymentDeadlineAt?: string; acceptanceExpiresAt?: string } | undefined;
  const paymentCountdown = useCountdown(raw?.status === 'pending_payment' ? raw.paymentDeadlineAt : null);
  const acceptanceCountdown = useCountdown(raw?.status === 'pending_business_acceptance' ? raw.acceptanceExpiresAt : null);

  useEffect(() => {
    if (!justCreated) return undefined;
    const timer = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(timer);
  }, [justCreated]);

  useEffect(() => {
    if (!transferId || !supabase) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    const client = supabase;
    async function load() {
      const byId = await client.from('transfers').select('*').eq('id', transferId).maybeSingle();
      let row = byId.data;
      if (!row && !byId.error) {
        const byReference = await client.from('transfers').select('*').filter('payload->>id', 'eq', transferId).limit(1);
        row = byReference.data?.[0] || null;
      }
      if (!alive) return;
      if (row) dispatch(upsertTransfer(transferFromRemoteRow(row) as any));
      setLoading(false);
    }
    load().catch(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [dispatch, transferId]);

  if (!transfer) {
    if (loading) {
      return (
        <AppScreen edges={['top']} className="items-center justify-center">
          <ActivityIndicator />
        </AppScreen>
      );
    }
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
  const showPayment = canRevealPaymentDetails(t);
  const heroSent = tr('transfers.detail.hero.sent');
  const heroReceived = tr('transfers.detail.hero.receivedEstimated');

  return (
    <AppScreen edges={[]}>
      <ScrollView contentContainerClassName="gap-5 px-4 pb-32 pt-2" showsVerticalScrollIndicator={false}>
        <PageHeader
          className="mx-0"
          eyebrow="Transfert"
          title="Détail du transfert"
          description={`${t.id} · ${directionLabel(t.direction || '')}`}
          actions={
            <Pressable onPress={() => router.back()} className="min-h-11 items-center justify-center rounded-2xl bg-app-surface px-4">
              <Text className="text-sm font-bold text-app-text">Retour</Text>
            </Pressable>
          }
        />
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {[
            { icon: Repeat, label: tr('transfers.detail.metrics.direction'), value: directionLabel(t.direction || '') },
            { icon: Clock, label: tr('transfers.detail.metrics.created'), value: t.createdAt || t.created_at ? formatTransferDate(t.createdAt || t.created_at) : '—' },
            { icon: User, label: tr('transfers.detail.metrics.recipient'), value: recipientName || '—' },
            { icon: Shield, label: tr('transfers.detail.metrics.partner'), value: t.exchanger?.name || tr('transfers.detail.financial.historicPartner') },
          ].map((m) => (
            <View key={m.label} className={twTransfer.detailMetric}>
              <m.icon size={18} color="#08705f" />
              <Text className={twTransfer.detailMetricValue} numberOfLines={2}>{m.value}</Text>
              <Text className={twTransfer.detailMetricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        <View className={twTransfer.detailHero}>
          <LinearGradient
            colors={['#0f766e', '#08705f', '#2563eb']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5"
            style={{ borderRadius: 16, minHeight: 220 }}>
            <View className="mb-4 self-start">
              <TransferStatusBadge status={t.status} />
            </View>
            <Text className={twTransfer.detailHeroLabel}>{heroSent}</Text>
            <Text className={twTransfer.detailHeroValue}>{formatMoney(amountSent, currFrom)}</Text>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <Repeat size={18} color="rgba(255,255,255,0.4)" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
            <Text className={twTransfer.detailHeroLabel}>{heroReceived}</Text>
            <Text className={twTransfer.detailHeroValue}>{formatMoney(amountReceived, currTo)}</Text>
            {t.exchanger?.name ? (
              <View className={twTransfer.detailHeroPartner}>
                <Text className={twTransfer.detailHeroPartnerText}>
                  {tr('transfers.detail.hero.processedBy', { name: t.exchanger.name })}
                </Text>
                <View className={twTransfer.detailVerified}>
                  <Text className={twTransfer.detailVerifiedText}>✓ VÉRIFIÉ MOXT</Text>
                </View>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        <View className="flex-row gap-1 rounded-2xl border border-app-border bg-app-surface-muted p-1">
          {([
            ['suivi', 'Suivi'],
            ['paiement', 'Paiement'],
            ['details', 'Détails'],
          ] as const).map(([key, label]) => {
            const active = detailTab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setDetailTab(key)}
                className={cn('min-h-11 flex-1 items-center justify-center rounded-xl px-2', active && 'bg-app-surface shadow-sm')}>
                <Text className={cn('text-sm font-black', active ? 'text-app-text' : 'text-app-text-muted')}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {detailTab === 'suivi' ? (
          <>
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
        {canClientDeclareReception(t, Boolean(user?.id && (t.userId === user.id || t.senderId === user.id))) ? (
          <Pressable className={twTransfer.navNext} onPress={() => router.push(`/transfer/receive/${t.id}` as never)}>
            <Text className={twTransfer.navNextText}>J’ai reçu les fonds</Text>
          </Pressable>
        ) : null}

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

        {acceptanceCountdown ? (
          <View className={twTransfer.detailCard}>
            <View className="items-center rounded-xl bg-app-surface-muted px-4 py-3">
              <Text className="text-xs font-black uppercase tracking-wide text-app-text-faint">
                {tr('transfers.acceptance.countdownLabel')}
              </Text>
              <Text className="mt-1 text-3xl font-black text-brand-700 dark:text-brand-300" style={{ fontVariant: ['tabular-nums'] }}>
                {acceptanceCountdown.label}
              </Text>
              <Text className="mt-2 text-center text-sm text-app-text-muted">
                {tr('transfers.acceptance.waitingHint', { name: t.exchanger?.name || tr('transfers.acceptance.exchangerFallback') })}
              </Text>
            </View>
          </View>
        ) : null}

        {t.status === 'pending_payment' ? (
          <View className={twTransfer.detailCard}>
            <Text className={twTransfer.detailCardTitle}>Déclarer le paiement</Text>
            <Text className="text-xs text-app-text-muted">
              Ajoutez une preuve, puis déclarez le paiement. Le partenaire est notifié.
              {paymentCountdown ? ` Temps restant : ${paymentCountdown.label}.` : ''}
            </Text>
            <Pressable className={twTransfer.uploadZone}>
              <Text className="text-2xl">⬆️</Text>
              <Text className={twTransfer.uploadTitle}>Preuve de paiement</Text>
              <Text className={twTransfer.uploadHint}>Image ou PDF</Text>
            </Pressable>
            <ImagePickerButton label="Photo de la preuve" currentUri={proofUri} onImageSelected={setProofUri} />
            <Pressable
              className={twTransfer.declareBtn}
              onPress={() => {
                if (!proofUri || !supabase) return;
                const next = { ...t, status: 'payment_declared', paymentProof: proofUri };
                void supabase.from('transfers').update({ status: 'payment_declared', payment_proof: proofUri }).eq('id', t.id);
                dispatch(upsertTransfer(next));
              }}>
              <Text className={twTransfer.submitBtnText}>Déclarer le paiement</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable className={twTransfer.outlineBtn} onPress={() => router.push('/disputes/create' as never)}>
          <Text className={twTransfer.outlineBtnText}>Ouvrir une réclamation</Text>
        </Pressable>
        {CANCELLABLE.includes(t.status) && user?.id && (t.userId === user.id || t.senderId === user.id) ? (
          <Pressable
            testID="transfer-cancel"
            className="min-h-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
            onPress={() =>
              confirmAction(tr('transfers.detail.cancel.title'), tr('transfers.detail.cancel.description'), () => {
                const at = new Date().toISOString();
                const timeline = [...(Array.isArray(t.timeline) ? t.timeline : []), { status: 'cancelled', at, actorType: 'client', actorId: user.id }];
                const next = { ...t, status: 'cancelled', updatedAt: at, timeline };
                dispatch(upsertTransfer(next));
                void supabase?.from('transfers').update({ status: 'cancelled', timeline }).eq('id', t.id);
              })
            }>
            <Text className="text-sm font-black text-red-700 dark:text-red-300">{tr('transfers.workflow.cancelTransfer')}</Text>
          </Pressable>
        ) : null}
          </>
        ) : null}

        {detailTab === 'paiement' ? (
        <>
        <View className={twTransfer.detailCard}>
          <Text className={twTransfer.detailCardTitle}>Coordonnées de paiement</Text>
          <Text className="text-sm text-app-text-muted">
            {showPayment
              ? t.exchanger?.paymentAccount || tr('transfers.detail.financial.confirmWithBusiness')
              : tr('transfers.acceptance.paymentHidden')}
          </Text>
          {t.noteToExchanger ? (
            <Text className="mt-2 text-sm text-app-text">Note : {String(t.noteToExchanger)}</Text>
          ) : null}
        </View>
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
        </>
        ) : null}

        {detailTab === 'details' ? (
        <>
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
          {(Array.isArray(t.timeline) && t.timeline.length
            ? t.timeline
            : [{ status: t.status, at: t.createdAt || t.created_at, label: st.label }]
          ).map((event: { status?: string; at?: string; label?: string }, index: number) => {
            const eventStatus = TRANSFER_STATUS_LABELS[event.status || ''] || st;
            return (
              <View key={`${event.status}-${event.at}-${index}`} className="mb-3 flex-row gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-700 dark:bg-brand-400">
                  <Text className="text-xs font-bold text-white dark:text-slate-950">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-app-text">{event.label || eventStatus.label}</Text>
                  <Text className="mt-1 text-xs text-app-text-muted">
                    {event.at ? formatTransferDate(event.at) : '—'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Operation info */}
        <View className={twTransfer.detailCard}>
          <Text className={cn(twTransfer.detailCardTitle, 'mb-4')}>Informations de l'opération</Text>
          {[
            ['Référence', t.id],
            ['Statut', st.label],
            ['Montant envoyé', formatMoney(amountSent, currFrom)],
            ['Montant reçu (estimé)', formatMoney(amountReceived, currTo)],
            ['Total à payer', formatMoney(totalToPay, currFrom)],
            [tr('transfers.detail.info.mode'), tr('transfers.detail.info.modeValue')],
          ].map(([label, value]) => (
            <View key={label} className={twTransfer.factBlock}>
              <Text className={twTransfer.factLabel}>{label}</Text>
              <Text className={twTransfer.factValue}>{value}</Text>
            </View>
          ))}
        </View>
        </>
        ) : null}
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
