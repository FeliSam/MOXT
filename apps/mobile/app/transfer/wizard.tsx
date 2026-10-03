import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { TransferCalculatorModal } from '@/components/transfers/TransferCalculatorModal';
import { TransferPageHeader } from '@/components/transfers/TransferPageHeader';
import { TransferWizardStepper } from '@/components/transfers/TransferWizardStepper';
import {
  TransferWizardConfirmStep,
  TransferWizardNav,
} from '@/components/transfers/wizard/TransferWizardConfirmStep';
import { TransferWizardPartyStep } from '@/components/transfers/wizard/TransferWizardPartyStep';
import { TransferWizardStep1, type WizardExchanger } from '@/components/transfers/wizard/TransferWizardStep1';
import { AppScreen } from '@/components/ui/Card';
import {
  DIRECTIONS,
  calculateTransfer,
  directionInfo,
} from '@/constants/transfers';
import { twTransfer } from '@/constants/transferTailwind';
import { supabase } from '@/services/supabase';
import { loadBusinesses, type Business } from '@/store/account';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';

const READY = new Set(['verified', 'approved', 'active']);

function toExchanger(business: Business): WizardExchanger {
  const services = business.services;
  const fee = Number(business.feePercent ?? 2.5);
  return {
    id: business.id,
    name: business.name,
    rating: Number(business.rating) || 0,
    feePercent: Number.isFinite(fee) ? fee : 2.5,
    averageDelay: '10 à 20 min',
    city: business.city,
    country: typeof business.country === 'string' ? business.country : undefined,
    ...(Array.isArray(services) ? {} : {}),
  };
}

export default function TransferWizardScreen() {
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ exchangerId?: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const businesses = useAppSelector((state) => state.account.businesses);
  const originCountry = (user as any)?.originCountry || ((user as any)?.country !== 'RU' ? (user as any)?.country : 'BJ') || 'BJ';

  const initialDirection = (user as any)?.country === 'RU' ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU;

  // Le web (NewTransferPage) est déjà un assistant en 4 étapes. L’accord
  // « assistants multi-étapes » portait sur l’édition et la publication, pas
  // sur un formulaire unique : on garde donc le même découpage que le web.
  const [step, setStep] = useState(1);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [direction, setDirection] = useState<(typeof DIRECTIONS)[keyof typeof DIRECTIONS]>(initialDirection);
  const [amount, setAmount] = useState('');
  const [exchangerId, setExchangerId] = useState(typeof params.exchangerId === 'string' ? params.exchangerId : '');

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
  const exchangers = useMemo(
    () =>
      businesses
        .filter((business) => {
          const services = business.services;
          const offersTransfer = Array.isArray(services)
            ? services.includes('Transfert')
            : String(services || '').includes('Transfert');
          return (
            offersTransfer &&
            READY.has(String(business.status || '')) &&
            business.ownerId !== user?.id &&
            !business.deletedByUserAt
          );
        })
        .map(toExchanger),
    [businesses, user?.id],
  );
  const exchanger = exchangers.find((item) => item.id === exchangerId) || exchangers[0];
  const numAmount = Number(amount) || 0;
  const calc = calculateTransfer(numAmount, direction, exchanger?.feePercent ?? 2.5);

  useEffect(() => {
    if (user?.id) dispatch(loadBusinesses(user.id));
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (!exchangers.length) return;
    if (!exchangers.some((item) => item.id === exchangerId)) setExchangerId(exchangers[0].id);
  }, [exchangerId, exchangers]);

  const goNext = () => {
    if (step === 1) {
      if (numAmount < calc.minimumRequired) {
        Alert.alert('Montant invalide', `Minimum : ${formatCurrency(calc.minimumRequired, calc.currencyFrom, 'fr-FR')}`);
        return;
      }
      if (!exchanger) {
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
    if (!supabase || !exchanger) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const transferId = `MXT-${Date.now().toString(36).toUpperCase()}`;
      const business = businesses.find((item) => item.id === exchanger.id);
      const { error } = await supabase.from('transfers').insert({
        id: transferId,
        user_id: user?.id,
        business_id: exchanger.id,
        business_owner_id: business?.ownerId || null,
        status: 'pending_payment',
        direction,
        amount: numAmount,
        fee: calc.fees,
        received_amount: calc.amountReceived,
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
        exchanger: { id: exchanger.id, name: exchanger.name, feePercent: exchanger.feePercent, rating: exchanger.rating },
        origin_country: originCountry,
        timeline: [{ status: 'pending_payment', at: now }],
        payload: {
          amountSent: numAmount,
          fees: calc.fees,
          totalToPay: calc.totalToPay,
          currencyFrom: calc.currencyFrom,
          currencyTo: calc.currencyTo,
          feePercent: exchanger.feePercent,
          amountReceived: calc.amountReceived,
          rawRate: calc.rawRate,
        },
        created_at: now,
        updated_at: now,
      });
      if (error) throw new Error(error.message);
      await dispatch(loadCoreData());
      router.replace(`/transfer/${transferId}?created=1` as any);
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
                const next = d as (typeof DIRECTIONS)[keyof typeof DIRECTIONS];
                setDirection(next);
                if (next === DIRECTIONS.RU_TO_BJ) {
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
              exchangers={exchangers}
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
              feePercent={exchanger?.feePercent ?? 2.5}
              exchangerName={exchanger?.name || '—'}
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
