/**
 * Harnais local (Playwright / captures) — même contrat que le web
 * (`window.__MOXT_E2E__`). Jamais actif hors localhost.
 */

type E2eSession = { user: { id: string }; token?: string };

export type E2eFixtures = {
  transfers?: unknown[];
  receipts?: Array<{ id: string; userId?: string; relatedId?: string }>;
  conversation?: { id: string };
  businesses?: Array<{
    id: string;
    ownerId: string;
    name: string;
    status?: string;
    services?: string[] | string;
    city?: string;
    country?: string;
    feePercent?: number;
    rating?: number;
    deletedByUserAt?: string | null;
  }>;
  statuses?: Array<{
    id: string;
    authorId: string;
    authorName?: string;
    images?: string[];
    viewedBy?: string[];
    createdAt?: string;
  }>;
};

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function isE2eHarnessActive() {
  if (typeof window === 'undefined') return false;
  if (!isLocalHost(window.location.hostname)) return false;
  return (window as unknown as { __MOXT_E2E__?: boolean }).__MOXT_E2E__ === true;
}

export function readE2eSession(): E2eSession | null {
  if (!isE2eHarnessActive()) return null;
  const payload = (window as unknown as { __MOXT_E2E_SESSION__?: E2eSession }).__MOXT_E2E_SESSION__;
  if (!payload?.user?.id) return null;
  return { user: payload.user, token: payload.token || 'e2e-token' };
}

export function readE2eFixtures(): E2eFixtures | null {
  if (!isE2eHarnessActive()) return null;
  const payload = (window as unknown as { __MOXT_E2E_FIXTURES__?: E2eFixtures }).__MOXT_E2E_FIXTURES__;
  return payload || null;
}
