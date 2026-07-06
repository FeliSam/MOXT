import { reportError, trackEvent } from './monitoring';

type RateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
};

type RateLimitEntry = {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
};

const limits: Map<string, RateLimitEntry> = new Map();

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 5 * 60_000, blockDurationMs: 15 * 60_000 },
  register: { maxAttempts: 3, windowMs: 10 * 60_000, blockDurationMs: 30 * 60_000 },
  transfer: { maxAttempts: 10, windowMs: 60_000, blockDurationMs: 5 * 60_000 },
  payment: { maxAttempts: 5, windowMs: 5 * 60_000, blockDurationMs: 15 * 60_000 },
  message: { maxAttempts: 30, windowMs: 60_000, blockDurationMs: 2 * 60_000 },
  otp: { maxAttempts: 3, windowMs: 5 * 60_000, blockDurationMs: 30 * 60_000 },
  dispute: { maxAttempts: 3, windowMs: 60 * 60_000, blockDurationMs: 60 * 60_000 },
  api_general: { maxAttempts: 100, windowMs: 60_000, blockDurationMs: 60_000 },
};

export function checkRateLimit(action: string, identifier?: string): { allowed: boolean; retryAfterMs?: number } {
  const key = `${action}:${identifier || 'global'}`;
  const config = DEFAULT_CONFIGS[action] || DEFAULT_CONFIGS.api_general;
  const now = Date.now();

  let entry = limits.get(key);

  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, retryAfterMs: entry.blockedUntil - now };
  }

  if (!entry || now - entry.firstAttemptAt > config.windowMs) {
    entry = { attempts: 1, firstAttemptAt: now, blockedUntil: null };
    limits.set(key, entry);
    return { allowed: true };
  }

  entry.attempts++;

  if (entry.attempts > config.maxAttempts) {
    entry.blockedUntil = now + config.blockDurationMs;
    limits.set(key, entry);
    trackEvent('rate_limit_triggered', { action, identifier: identifier || 'global' });
    return { allowed: false, retryAfterMs: config.blockDurationMs };
  }

  limits.set(key, entry);
  return { allowed: true };
}

export function resetRateLimit(action: string, identifier?: string) {
  const key = `${action}:${identifier || 'global'}`;
  limits.delete(key);
}

// Anti-fraud detection
export type FraudSignal = {
  type: 'velocity' | 'amount' | 'location' | 'device' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
};

export function detectTransferFraud(params: {
  amount: number;
  currency: string;
  recentTransfers: { amount: number; createdAt: string }[];
  userAccountAgeDays: number;
}): FraudSignal[] {
  const signals: FraudSignal[] = [];

  // High amount for new accounts
  if (params.userAccountAgeDays < 7 && params.amount > 500_000) {
    signals.push({
      type: 'amount',
      severity: 'high',
      description: 'Montant élevé pour un compte récent',
    });
  }

  // Velocity check: too many transfers in short time
  const last24h = params.recentTransfers.filter(
    (t) => Date.now() - new Date(t.createdAt).getTime() < 24 * 60 * 60_000,
  );
  if (last24h.length >= 10) {
    signals.push({
      type: 'velocity',
      severity: 'medium',
      description: `${last24h.length} transferts en 24h`,
    });
  }

  // Unusual amount pattern (e.g., many small amounts = structuring)
  const smallAmounts = last24h.filter((t) => t.amount < 10_000);
  if (smallAmounts.length >= 5) {
    signals.push({
      type: 'pattern',
      severity: 'medium',
      description: 'Multiples petits montants détectés (structuration)',
    });
  }

  // Large single amount
  if (params.amount > 2_000_000) {
    signals.push({
      type: 'amount',
      severity: 'high',
      description: 'Montant unitaire très élevé',
    });
  }

  if (signals.some((s) => s.severity === 'high')) {
    reportError(new Error('High fraud signal detected'), {
      signals: JSON.stringify(signals),
      amount: String(params.amount),
    });
  }

  return signals;
}

export function shouldRequireAdditionalVerification(signals: FraudSignal[]): boolean {
  return signals.some((s) => s.severity === 'high') || signals.filter((s) => s.severity === 'medium').length >= 2;
}
