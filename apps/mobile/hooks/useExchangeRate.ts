import { useEffect, useState } from 'react';

import { FALLBACK_RUB_TO_CURRENCY } from '@moxt/shared/domain/transferConfig.js';

/** Même source que le web (services/exchangeRateService) : Frankfurter, repli local. */
const RATE_BASE_URL = 'https://api.frankfurter.dev/v2/rate';
const RATE_FETCH_TIMEOUT_MS = 3000;
const REFRESH_MS = 2 * 60 * 1000;

export type ExchangeRate = {
  rubToOrigin: number | null;
  originToRub: number | null;
  date: string | null;
  source: string | null;
  loading: boolean;
};

type Snapshot = Omit<ExchangeRate, 'loading'>;
const cache = new Map<string, { value: Snapshot; at: number }>();
const inflight = new Map<string, Promise<Snapshot | null>>();

function fallbackFor(currency: string): Snapshot {
  const rubToOrigin = (FALLBACK_RUB_TO_CURRENCY as Record<string, number>)[currency];
  if (!rubToOrigin) return { rubToOrigin: null, originToRub: null, date: null, source: null };
  return {
    rubToOrigin,
    originToRub: Number((1 / rubToOrigin).toFixed(6)),
    date: null,
    source: 'Taux local de secours',
  };
}

async function fetchRate(currency: string): Promise<Snapshot | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), RATE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${RATE_BASE_URL}/RUB/${currency}`, {
      headers: { Accept: 'application/json' },
      signal: controller?.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const rate = Number(data.rate);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return {
      rubToOrigin: rate,
      originToRub: 1 / rate,
      date: data.date || new Date().toISOString().slice(0, 10),
      source: 'Frankfurter',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function refresh(currency: string) {
  if (!inflight.has(currency)) {
    inflight.set(
      currency,
      fetchRate(currency).then((value) => {
        inflight.delete(currency);
        if (value) cache.set(currency, { value, at: Date.now() });
        return value;
      }),
    );
  }
  return inflight.get(currency)!;
}

export function useExchangeRate(currency = 'XOF'): ExchangeRate {
  const cached = cache.get(currency);
  const [snapshot, setSnapshot] = useState<Snapshot>(cached?.value ?? fallbackFor(currency));
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let alive = true;
    const run = () => {
      const hit = cache.get(currency);
      if (hit && Date.now() - hit.at < REFRESH_MS) {
        setSnapshot(hit.value);
        setLoading(false);
        return;
      }
      refresh(currency).then((value) => {
        if (!alive) return;
        if (value) setSnapshot(value);
        setLoading(false);
      });
    };
    run();
    const id = setInterval(run, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [currency]);

  return { ...snapshot, loading };
}
