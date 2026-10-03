import { supabase } from './supabase';

/** Upsert qui retire les colonnes inconnues, comme le middleware web. */
export async function upsertStrippingUnknown(table: string, row: Record<string, unknown>) {
  if (!supabase) throw new Error('Supabase indisponible');
  let payload = { ...row };
  let { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
  for (let i = 0; i < 8 && error; i += 1) {
    const missing = (error.message || '').match(/Could not find the '([^']+)' column/i)?.[1];
    if (!missing || !(missing in payload)) break;
    const rest = { ...payload };
    delete rest[missing];
    payload = rest;
    ({ error } = await supabase.from(table).upsert(payload, { onConflict: 'id' }));
  }
  if (error) throw error;
}
