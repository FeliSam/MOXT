import { trackEvent } from './monitoring';

export type AnalyticsEvent =
  | 'app_open'
  | 'sign_up'
  | 'sign_in'
  | 'transfer_start'
  | 'transfer_complete'
  | 'transfer_fail'
  | 'payment_start'
  | 'payment_complete'
  | 'parcel_create'
  | 'parcel_reserve'
  | 'listing_create'
  | 'listing_view'
  | 'listing_contact'
  | 'job_apply'
  | 'message_send'
  | 'referral_share'
  | 'referral_apply'
  | 'kyc_start'
  | 'kyc_complete'
  | 'search_perform'
  | 'favorite_add'
  | 'favorite_remove'
  | 'org_create'
  | 'org_invite'
  | 'dispute_open'
  | 'export_csv'
  | 'export_summary'
  | 'onboarding_complete'
  | 'onboarding_skip';

type EventProps = Record<string, string | number | boolean | undefined>;

let userId: string | null = null;
let sessionStart = Date.now();

export function identifyUser(id: string, props?: { email?: string; name?: string; country?: string }) {
  userId = id;
  trackEvent('user_identify', { userId: id, ...props });
}

export function resetUser() {
  userId = null;
}

export function track(event: AnalyticsEvent, properties?: EventProps) {
  const enriched = {
    ...properties,
    userId: userId || undefined,
    sessionDurationMs: Date.now() - sessionStart,
    timestamp: new Date().toISOString(),
  };
  trackEvent(event, enriched as any);
}

export function trackScreenView(screen: string, properties?: EventProps) {
  track('app_open' as any, { screen, ...properties });
  trackEvent('screen_view', { screen, ...(properties || {}) } as any);
}

// Funnel tracking
export type FunnelStep = {
  name: string;
  timestamp: number;
};

const activeFunnels: Map<string, FunnelStep[]> = new Map();

export function startFunnel(funnelId: string, firstStep: string) {
  activeFunnels.set(funnelId, [{ name: firstStep, timestamp: Date.now() }]);
}

export function advanceFunnel(funnelId: string, step: string) {
  const funnel = activeFunnels.get(funnelId);
  if (funnel) {
    funnel.push({ name: step, timestamp: Date.now() });
  }
}

export function completeFunnel(funnelId: string) {
  const funnel = activeFunnels.get(funnelId);
  if (!funnel || funnel.length === 0) return;
  const totalDurationMs = Date.now() - funnel[0].timestamp;
  const steps = funnel.map((s) => s.name);
  trackEvent(`funnel_complete`, {
    funnelId,
    steps: steps.join(' → '),
    stepCount: steps.length,
    durationMs: totalDurationMs,
  } as any);
  activeFunnels.delete(funnelId);
}

export function dropFunnel(funnelId: string, reason?: string) {
  const funnel = activeFunnels.get(funnelId);
  if (!funnel || funnel.length === 0) return;
  const lastStep = funnel[funnel.length - 1].name;
  trackEvent(`funnel_drop`, {
    funnelId,
    lastStep,
    stepCount: funnel.length,
    reason: reason || 'abandoned',
  } as any);
  activeFunnels.delete(funnelId);
}

// Retention
export function trackRetentionDay(daysSinceInstall: number) {
  trackEvent('retention', { day: daysSinceInstall, userId: userId || 'unknown' } as any);
}

// Revenue
export function trackRevenue(amount: number, currency: string, source: string) {
  trackEvent('revenue', { amount, currency, source } as any);
}
