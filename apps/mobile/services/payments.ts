import { supabase } from './supabase';
import { reportError, trackEvent } from './monitoring';

export type PaymentMethod = 'stripe' | 'mobile_money' | 'bank_transfer';

export type PaymentIntent = {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  method: PaymentMethod;
  clientSecret?: string;
  redirectUrl?: string;
  createdAt: string;
};

export type MobileMoneyProvider = 'orange_money' | 'wave' | 'mtn_money' | 'moov_money';

export type MobileMoneyRequest = {
  phone: string;
  provider: MobileMoneyProvider;
  amount: number;
  currency: string;
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  method: PaymentMethod;
  transferId?: string;
  description?: string;
}): Promise<PaymentIntent> {
  trackEvent('payment_intent_create', { method: params.method, amount: params.amount });

  if (!supabase) throw new Error('Service non disponible');

  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      amount: params.amount,
      currency: params.currency,
      method: params.method,
      transfer_id: params.transferId,
      description: params.description,
    },
  });

  if (error) {
    reportError(new Error(error.message), { context: 'createPaymentIntent' });
    throw new Error(error.message);
  }

  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    method: params.method,
    clientSecret: data.client_secret,
    redirectUrl: data.redirect_url,
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export async function initiateMobileMoneyPayment(request: MobileMoneyRequest & {
  transferId?: string;
}): Promise<PaymentIntent> {
  trackEvent('mobile_money_initiate', { provider: request.provider, amount: request.amount });

  if (!supabase) throw new Error('Service non disponible');

  const { data, error } = await supabase.functions.invoke('mobile-money-pay', {
    body: {
      phone: request.phone,
      provider: request.provider,
      amount: request.amount,
      currency: request.currency,
      transfer_id: request.transferId,
    },
  });

  if (error) {
    reportError(new Error(error.message), { context: 'initiateMobileMoneyPayment' });
    throw new Error(error.message);
  }

  return {
    id: data.id,
    amount: request.amount,
    currency: request.currency,
    status: data.status || 'pending',
    method: 'mobile_money',
    redirectUrl: data.redirect_url,
    createdAt: new Date().toISOString(),
  };
}

export async function checkPaymentStatus(paymentId: string): Promise<PaymentIntent['status']> {
  if (!supabase) throw new Error('Service non disponible');

  const { data, error } = await supabase
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .single();

  if (error) throw new Error(error.message);
  return data?.status || 'pending';
}

export async function cancelPayment(paymentId: string): Promise<void> {
  trackEvent('payment_cancel', { paymentId });

  if (!supabase) throw new Error('Service non disponible');

  const { error } = await supabase.functions.invoke('cancel-payment', {
    body: { payment_id: paymentId },
  });

  if (error) throw new Error(error.message);
}

export function getProviderLabel(provider: MobileMoneyProvider): string {
  switch (provider) {
    case 'orange_money': return 'Orange Money';
    case 'wave': return 'Wave';
    case 'mtn_money': return 'MTN Money';
    case 'moov_money': return 'Moov Money';
  }
}

export function getSupportedProviders(country: string): MobileMoneyProvider[] {
  switch (country.toLowerCase()) {
    case 'sn': // Sénégal
    case 'ci': // Côte d'Ivoire
      return ['orange_money', 'wave', 'mtn_money', 'moov_money'];
    case 'ml': // Mali
    case 'bf': // Burkina Faso
      return ['orange_money', 'moov_money'];
    case 'gn': // Guinée
      return ['orange_money', 'mtn_money'];
    default:
      return ['orange_money', 'wave'];
  }
}
