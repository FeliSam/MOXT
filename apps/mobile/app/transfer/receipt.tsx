import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  FileText,
  Share2,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { directionLabel } from '@moxt/shared/utils/transfers.js';
import { formatCurrency, formatShortDate } from '@moxt/shared/utils/formatters.js';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme, useThemeColors } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

export default function TransferReceiptScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const shadows = useShadows();
  const { isDark } = useTheme();
  const { onScroll } = useSmartNavbarScroll();

  const { id } = useLocalSearchParams<{ id: string }>();
  const transfer = useAppSelector((state) =>
    state.transfers.items.find((t) => t.id === id),
  );

  if (!transfer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: insets.top + 16 }}>
        <Pressable
          onPress={() => router.back()}
          style={[
            {
              height: 40,
              width: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              marginBottom: 16,
            },
            shadows.card,
          ]}>
          <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
        </Pressable>
        <AppText className="text-center text-sm text-app-text-muted mt-8">
          Reçu de transfert introuvable.
        </AppText>
      </View>
    );
  }

  const recipientName =
    [transfer.recipient?.firstName, transfer.recipient?.lastName].filter(Boolean).join(' ') ||
    '—';

  const receiptText = [
    '═══════════════════════════',
    '         REÇU MOXT',
    '═══════════════════════════',
    '',
    `Réf : ${transfer.id}`,
    `Date : ${transfer.createdAt ? formatShortDate(transfer.createdAt) : '-'}`,
    `Statut : ${transfer.status?.toUpperCase()}`,
    '',
    `Direction : ${directionLabel(transfer.direction || 'bj_to_ru')}`,
    '',
    `Montant envoyé : ${formatCurrency(transfer.amountSent ?? 0, transfer.currencyFrom || 'XOF')}`,
    `Montant reçu : ${formatCurrency(transfer.receivedAmount ?? 0, transfer.currencyTo || 'RUB')}`,
    `Frais : ${formatCurrency(transfer.fee ?? 0, transfer.currencyFrom || 'XOF')}`,
    '',
    `Bénéficiaire : ${recipientName}`,
    '',
    '───────────────────────────',
    ' Sécurisé par MOXT Transfer',
    '═══════════════════════════',
  ].join('\n');

  const handleShare = async () => {
    try {
      await Share.share({
        message: receiptText,
        title: `Reçu MOXT — ${transfer.id}`,
      });
    } catch {
      Alert.alert('Erreur', 'Partage impossible.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/history' as never))}
            style={[
              {
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              shadows.card,
            ]}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
              Reçu de transfert
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              Réf. {transfer.id.slice(0, 12)}…
            </AppText>
          </View>
          <Button size="sm" variant="secondary" onPress={handleShare}>
            <Share2 size={15} color={colors.text} />
          </Button>
        </View>

        {/* Digital Receipt Card */}
        <View
          style={[
            {
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 20,
              gap: 16,
            },
            shadows.card,
          ]}>
          {/* Header watermark & badge */}
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <FileText size={24} color={colors.accent} />
            </View>
            <AppText className="text-xs font-black uppercase text-app-accent" style={{ letterSpacing: 1 }}>
              Reçu officiel MOXT
            </AppText>
            <AppText className="text-2xl font-black text-app-text">
              {formatCurrency(transfer.receivedAmount ?? 0, transfer.currencyTo || 'RUB')}
            </AppText>
            <StatusBadge status={transfer.status || ''} />
          </View>

          {/* Dotted divider */}
          <View
            style={{
              height: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              marginVertical: 4,
            }}
          />

          {/* Key-Value lines */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText className="text-xs text-app-text-muted">Référence</AppText>
              <Pressable
                onPress={() => {
                  showNotice('Référence', 'Identifiant copié.');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppText className="text-xs font-bold text-app-text" numberOfLines={1}>
                  {transfer.id}
                </AppText>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText className="text-xs text-app-text-muted">Date d'émission</AppText>
              <AppText className="text-xs font-bold text-app-text">
                {transfer.createdAt ? formatShortDate(transfer.createdAt) : '—'}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText className="text-xs text-app-text-muted">Direction du flux</AppText>
              <AppText className="text-xs font-bold text-app-text">
                {directionLabel(transfer.direction || 'bj_to_ru')}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText className="text-xs text-app-text-muted">Montant envoyé</AppText>
              <AppText className="text-xs font-black text-app-text">
                {formatCurrency(transfer.amountSent ?? 0, transfer.currencyFrom || 'XOF')}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText className="text-xs text-app-text-muted">Frais de transfert</AppText>
              <AppText className="text-xs font-bold text-app-text">
                {formatCurrency(transfer.fee ?? 0, transfer.currencyFrom || 'XOF')}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText className="text-xs text-app-text-muted">Bénéficiaire</AppText>
              <AppText className="text-xs font-bold text-app-text">{recipientName}</AppText>
            </View>
          </View>

          {/* Dotted divider */}
          <View
            style={{
              height: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              marginVertical: 4,
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="#059669" />
            <AppText className="text-[11px] text-app-text-muted flex-1">
              Document certifié par le protocole de séquestre sécurisé MOXT.
            </AppText>
          </View>
        </View>

        {/* Buttons */}
        <Button variant="primary" size="lg" onPress={handleShare}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Share2 size={16} color="#ffffff" />
            <AppText className="text-sm font-bold text-white">Partager ce reçu</AppText>
          </View>
        </Button>

        <Button
          variant="secondary"
          onPress={() => router.push(`/transfer/${transfer.id}` as never)}>
          Voir les détails du transfert
        </Button>
      </ScrollView>
    </View>
  );
}
