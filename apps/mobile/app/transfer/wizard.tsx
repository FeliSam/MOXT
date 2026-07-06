import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { TransferCalculatorModal } from '@/components/transfers/TransferCalculatorModal';
import { TransferPageHeader } from '@/components/transfers/TransferPageHeader';
import { TransferWizardStepper } from '@/components/transfers/TransferWizardStepper';
import {
  TransferWizardConfirmStep,
  TransferWizardNav,
} from '@/components/transfers/wizard/TransferWizardConfirmStep';
import { TransferWizardPartyStep } from '@/components/transfers/wizard/TransferWizardPartyStep';
import { TransferWizardStep1 } from '@/components/transfers/wizard/TransferWizardStep1';
import { AppScreen } from '@/components/ui/Card';
import {
  DIRECTIONS,
  FALLBACK_EXCHANGERS,
  calculateTransfer,
  directionInfo,
} from '@/constants/transfers';
import { twTransfer } from '@/constants/transferTailwind';
import { supabase } from '@/services/supabase';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';

export default function TransferWizardScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const originCountry = (user as any)?.originCountry || ((user as any)?.country !== 'RU' ? (user as any)?.country : 'BJ') || 'BJ';

  const initialDirection = (user as any)?.country === 'RU' ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU;

  const [step, setStep] = useState(1);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [direction, setDirection] = useState(initialDirection);
  const [amount, setAmount] = useState((user as any)?.country === 'RU' ? '5000' : '');
  const [exchangerId, setExchangerId] = useState(FALLBACK_EXCHANGERS[0].id);

  const [senderFirstName, setSenderFirstName] = useState(user?.firstName || '');
  const [senderLastName, setSenderLastName] = useState(user?.lastName || '');
  const [senderPhone, setSenderPhone] = useState((user as any)?.phone || (user as any)?.russianPhone || '+229');
  const [senderMethod, setSenderMethod] = useState('');

  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('+7');
  const [recipientMethod, setRecipientMethod] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const info = useMemo(() => directionInfo(direction, originCountry), [direction, originCountry]);
  const exchanger = FALLBACK_EXCHANGERS.find((e) => e.id === exchangerId)!;
  const numAmount = Number(amount) || 0;
  const calc = calculateTransfer(numAmount, direction, exchanger.feePercent);

  const goNext = () => {
    if (step === 1) {
      if (numAmount < calc.minimumRequired) {
        Alert.alert('Montant invalide', `Minimum : ${formatCurrency(calc.minimumRequired, calc.currencyFrom)}`);
        return;
      }
      if (!exchangerId) {
        Alert.alert('Partenaire requis', 'Choisissez un échangeur.');
        return;
      }
    }
    if (step === 2 && !senderFirstName.trim()) {
      Alert.alert('Expéditeur requis', 'Renseignez le prénom.');
      return;
    }
    if (step === 3 && !recipientFirstName.trim()) {
      Alert.alert('Destinataire requis', 'Renseignez le prénom.');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    if (!acceptTerms) {
      Alert.alert('Conditions', 'Acceptez les conditions pour continuer.');
      return;
    }
    if (!supabase) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const transferId = `MXT-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('transfers').insert({
        id: transferId,
        user_id: user?.id,
        status: 'pending_payment',
        direction,
        amount_sent: numAmount,
        fee: calc.fees,
        amount_received: calc.amountReceived,
        total_to_pay: calc.totalToPay,
        currency_from: calc.currencyFrom,
        currency_to: calc.currencyTo,
        rate: calc.rawRate,
        rate_source: 'Frankfurter',
        rate_date: new Date().toISOString().slice(0, 10),
        recipient: {
          firstName: recipientFirstName.trim(),
          lastName: recipientLastName.trim(),
          phone: recipientPhone.trim(),
          method: recipientMethod,
        },
        sender: {
          firstName: senderFirstName.trim(),
          lastName: senderLastName.trim(),
          phone: senderPhone.trim(),
          method: senderMethod,
        },
        exchanger: { id: exchanger.id, name: exchanger.name, feePercent: exchanger.feePercent },
        origin_country: originCountry,
        created_at: now,
        updated_at: now,
      });
      if (error) throw new Error(error.message);
      await dispatch(loadCoreData());
      router.replace(`/transfer/${transferId}` as any);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Création impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen edges={['top']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName={twTransfer.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TransferPageHeader
            eyebrow="Transfert"
            title="Créer un transfert"
            description="Choisissez une entreprise validée. Elle recevra l'opération et suivra son traitement jusqu'à la validation."
            actions={[
              { label: 'Calculatrice', onPress: () => setCalculatorOpen(true) },
              { label: 'Échangeurs', onPress: () => router.push('/exchangers' as any) },
              { label: 'Historique', onPress: () => router.push('/(tabs)/transfers' as any) },
            ]}
          />

          <TransferWizardStepper step={step} onGoTo={setStep} />

          {step === 1 ? (
            <TransferWizardStep1
              direction={direction}
              onDirectionChange={(d) => {
                setDirection(d);
                if (d === DIRECTIONS.RU_TO_BJ) {
                  setSenderPhone('+7');
                  setRecipientPhone('+229');
                } else {
                  setSenderPhone('+229');
                  setRecipientPhone('+7');
                }
                setSenderMethod('');
                setRecipientMethod('');
              }}
              amount={amount}
              setAmount={setAmount}
              exchangerId={exchangerId}
              setExchangerId={setExchangerId}
              originCountry={originCountry}
            />
          ) : null}

          {step === 2 ? (
            <TransferWizardPartyStep
              title="2. Expéditeur"
              country={info.sourceCountry}
              firstName={senderFirstName}
              setFirstName={setSenderFirstName}
              lastName={senderLastName}
              setLastName={setSenderLastName}
              phone={senderPhone}
              setPhone={setSenderPhone}
              method={senderMethod}
              setMethod={setSenderMethod}
            />
          ) : null}

          {step === 3 ? (
            <TransferWizardPartyStep
              title="3. Destinataire"
              country={info.destinationCountry}
              isRecipient
              firstName={recipientFirstName}
              setFirstName={setRecipientFirstName}
              lastName={recipientLastName}
              setLastName={setRecipientLastName}
              phone={recipientPhone}
              setPhone={setRecipientPhone}
              method={recipientMethod}
              setMethod={setRecipientMethod}
            />
          ) : null}

          {step === 4 ? (
            <TransferWizardConfirmStep
              direction={direction}
              amount={numAmount}
              feePercent={exchanger.feePercent}
              exchangerName={exchanger.name}
              senderName={`${senderFirstName} ${senderLastName}`.trim()}
              recipientName={`${recipientFirstName} ${recipientLastName}`.trim()}
              acceptTerms={acceptTerms}
              setAcceptTerms={setAcceptTerms}
              loading={loading}
              onSubmit={handleSubmit}
            />
          ) : null}

          <TransferWizardNav step={step} loading={loading} onBack={goBack} onNext={goNext} />
        </ScrollView>
      </KeyboardAvoidingView>

      <TransferCalculatorModal visible={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </AppScreen>
  );
}
