import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname, router } from 'expo-router';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  FileDown,
  FileText,
  History,
  Image as ImageIcon,
  Repeat,
  Share2,
  Shield,
  ShieldAlert,
  UploadCloud,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

async function copyToClipboard(text: string) {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // @ts-ignore - optional native clipboard
    const expoClipboard = await import('expo-clipboard').catch(() => null);
    if (expoClipboard?.setStringAsync) {
      await expoClipboard.setStringAsync(text);
      return true;
    }
  } catch {
    // fallback
  }
  return false;
}

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
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';

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
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const transfer = useAppSelector((state) =>
    state.transfers.items.find((item) => transferMatches(item as any, transferId)),
  );
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(justCreated);
  const [loading, setLoading] = useState(!transfer);
  const [detailTab, setDetailTab] = useState<'suivi' | 'paiement' | 'details'>('suivi');
  const insets = useSafeAreaInsets();
  const { onScroll, scrollEventThrottle } = useSmartNavbarScroll();
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom + 100, 140),
          paddingHorizontal: 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* Titre moderne épuré avec actions retour et partage intégrées */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/transfers' as never))}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.2} />
          </Pressable>

          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: isDark ? '#2dd4bf' : '#08705f' }}>
              Transfert · {directionLabel(t.direction || '')}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.4 }}>
              Détail du transfert
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
              Réf. {t.id}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Partager"
            onPress={async () => {
              try {
                await Share.share({
                  title: `Transfert ${t.id}`,
                  message: `Transfert MOXT ${t.id} · ${directionLabel(t.direction || '')} · Montant : ${formatMoney(amountSent, currFrom)}`,
                });
              } catch {}
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Share2 size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* 4 Detail Metrics in modern 2x2 grid */}
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {[
            { icon: Repeat, label: tr('transfers.detail.metrics.direction'), value: directionLabel(t.direction || '') },
            { icon: Clock, label: tr('transfers.detail.metrics.created'), value: t.createdAt || t.created_at ? formatTransferDate(t.createdAt || t.created_at) : '—' },
            { icon: User, label: tr('transfers.detail.metrics.recipient'), value: recipientName || '—' },
            { icon: Shield, label: tr('transfers.detail.metrics.partner'), value: t.exchanger?.name || tr('transfers.detail.financial.historicPartner') },
          ].map((m) => (
            <View key={m.label} className="w-[48%] rounded-2xl border border-app-border bg-app-surface p-4 shadow-sm">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/45">
                <m.icon size={16} color="#08705f" />
              </View>
              <Text className="mt-2 text-sm font-black text-app-text" numberOfLines={1}>{m.value}</Text>
              <Text className="mt-0.5 text-[11px] font-bold text-app-text-muted">{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Hero Card with Gradient */}
        <View className="overflow-hidden rounded-3xl shadow-md">
          <LinearGradient
            colors={['#0f766e', '#08705f', '#2563eb']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5"
            style={{ borderRadius: 24, minHeight: 210 }}>
            <View className="mb-4 flex-row items-center justify-between">
              <TransferStatusBadge status={t.status} />
              <View className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
                <Text className="text-[10px] font-black uppercase text-white/90">
                  {t.direction?.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View className="gap-3">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-white/70">{heroSent}</Text>
                <Text className="mt-0.5 text-2xl font-black text-white">{formatMoney(amountSent, currFrom)}</Text>
              </View>
              <View style={{ alignItems: 'center', marginVertical: 4 }}>
                <Repeat size={18} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-white/70">{heroReceived}</Text>
                <Text className="mt-0.5 text-2xl font-black text-white">{formatMoney(amountReceived, currTo)}</Text>
              </View>
            </View>
            {t.exchanger?.name ? (
              <View className="mt-4 flex-row items-center justify-between border-t border-white/15 pt-3">
                <Text className="flex-1 text-xs font-semibold text-white/80" numberOfLines={1}>
                  {tr('transfers.detail.hero.processedBy', { name: t.exchanger.name })}
                </Text>
                <View className="rounded-full border border-white/25 bg-white/15 px-2 py-0.5">
                  <Text className="text-[9px] font-black text-white">✓ VÉRIFIÉ MOXT</Text>
                </View>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        {/* Segmented Tabs */}
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
        {/* Progression with Stepper Journey */}
        <View className="rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm">
          <View className="mb-3 flex-row items-center justify-between border-b border-app-border pb-3">
            <View>
              <Text className="text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-400">
                PARCOURS DE TRANSFERT
              </Text>
              <Text className="mt-0.5 text-xs font-bold text-app-text-muted">
                {Math.max(0, currentStepIndex + 1)} sur {PROGRESS_STEPS.length} étapes
              </Text>
            </View>
            <TransferStatusBadge status={t.status} />
          </View>
          <View className="mt-2 flex-row items-start justify-between">
            {PROGRESS_STEPS.map((s, idx) => {
              const done = idx <= currentStepIndex;
              const active = idx === currentStepIndex;
              const hasNext = idx < PROGRESS_STEPS.length - 1;
              return (
                <View key={s.key} className="flex-1 items-center">
                  <View className="w-full flex-row items-center">
                    <View className="flex-1" />
                    <View
                      className={cn(
                        'h-8 w-8 items-center justify-center rounded-full border-2',
                        done
                          ? 'border-brand-700 bg-brand-700 dark:border-brand-400 dark:bg-brand-400'
                          : active
                            ? 'border-brand-700 bg-app-surface dark:border-brand-400'
                            : 'border-app-border bg-app-surface-muted',
                      )}>
                      {done ? (
                        <Check size={14} color={isDark ? '#020617' : '#ffffff'} strokeWidth={3} />
                      ) : (
                        <Text
                          className={cn(
                            'text-xs font-black',
                            active ? 'text-brand-700 dark:text-brand-400' : 'text-app-text-muted',
                          )}>
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    <View
                      className={cn(
                        'flex-1 h-0.5',
                        hasNext
                          ? idx < currentStepIndex
                            ? 'bg-brand-700 dark:bg-brand-400'
                            : 'bg-app-border'
                          : 'bg-transparent',
                      )}
                    />
                  </View>
                  <Text
                    className={cn(
                      'mt-1.5 text-center text-[10px] font-bold',
                      done || active ? 'text-brand-700 dark:text-brand-400' : 'text-app-text-muted',
                    )}
                    numberOfLines={2}>
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Security */}
        <View className={twTransfer.warningCard}>
          <View className="flex-row items-center gap-2">
            <ShieldAlert size={18} color="#b45309" />
            <Text className={twTransfer.warningTitle}>Payez en toute sécurité</Text>
          </View>
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
              <UploadCloud size={28} color="#08705f" />
              <Text className={cn(twTransfer.uploadTitle, 'mt-2')}>Preuve de paiement</Text>
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
              <FileText size={18} color="#08705f" />
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
            <Pressable
              className={cn(twTransfer.actionChip, 'flex-row items-center gap-1.5')}
              onPress={async () => {
                await copyToClipboard(t.id);
                showNotice('Référence copiée', t.id);
              }}>
              <Copy size={13} color={isDark ? '#e4e4e7' : '#334155'} />
              <Text className={twTransfer.actionChipText}>Copier la référence</Text>
            </Pressable>
            <Pressable
              className={cn(twTransfer.actionChip, 'flex-row items-center gap-1.5')}
              onPress={() => router.push({ pathname: '/transfer/receipt', params: { id: t.id } } as never)}>
              <FileDown size={13} color={isDark ? '#e4e4e7' : '#334155'} />
              <Text className={twTransfer.actionChipText}>Reçu / PDF</Text>
            </Pressable>
            <Pressable
              className={cn(twTransfer.actionChip, 'flex-row items-center gap-1.5')}
              onPress={() => {
                if (t.paymentProof || t.payment_proof) {
                  router.push((t.paymentProof || t.payment_proof) as never);
                } else {
                  router.push({ pathname: '/transfer/receipt', params: { id: t.id } } as never);
                }
              }}>
              <ImageIcon size={13} color={isDark ? '#e4e4e7' : '#334155'} />
              <Text className={twTransfer.actionChipText}>Preuve / Image</Text>
            </Pressable>
            <Pressable
              className={cn(twTransfer.actionChip, 'flex-row items-center gap-1.5')}
              onPress={async () => {
                try {
                  await Share.share({
                    title: `Transfert ${t.id}`,
                    message: `Transfert MOXT ${t.id} · ${directionLabel(t.direction || '')} · Montant : ${formatMoney(amountSent, currFrom)}`,
                  });
                } catch {
                  // user cancelled or share failed
                }
              }}>
              <Share2 size={13} color={isDark ? '#e4e4e7' : '#334155'} />
              <Text className={twTransfer.actionChipText}>Partager</Text>
            </Pressable>
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
              <Users size={18} color="#08705f" />
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
              <History size={18} color="#08705f" />
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
          <Check size={18} color="#059669" strokeWidth={2.5} />
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-black text-app-text dark:text-zinc-50">Transfert créé</Text>
            <Text className="mt-0.5 text-xs text-app-text-muted dark:text-zinc-400">
              L'entreprise sélectionnée peut maintenant traiter l'opération.
            </Text>
          </View>
          <Pressable onPress={() => setShowToast(false)}>
            <X size={16} color={isDark ? '#a1a1aa' : '#64748b'} />
          </Pressable>
        </View>
      ) : null}
    </View>
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
    <View className="flex-1 items-center rounded-2xl border border-app-border bg-app-surface-muted/60 p-4">
      <View className="mb-2 h-11 w-11 items-center justify-center rounded-full bg-brand-700 dark:bg-brand-500 shadow-sm">
        <Text className="text-sm font-black text-white">{initials}</Text>
      </View>
      <Text className="text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-400">{role}</Text>
      <Text className="mt-1 text-center text-sm font-black text-app-text" numberOfLines={1}>{name || '—'}</Text>
      {phone ? <Text className="mt-0.5 text-center text-xs font-semibold text-app-text-muted">{phone}</Text> : null}
      {method ? (
        <View className="mt-2 rounded-full bg-app-surface px-2.5 py-0.5 border border-app-border">
          <Text className="text-[10px] font-bold text-app-text-muted">{method}</Text>
        </View>
      ) : null}
    </View>
  );
}
