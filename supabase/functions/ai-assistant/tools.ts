import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type ToolContextPack = {
  toolsUsed: string[]
  searchHits: Array<Record<string, unknown>>
  transfers: Array<Record<string, unknown>>
  focusedTransfer: Record<string, unknown> | null
  exchangers: Array<Record<string, unknown>>
  playbookIds?: string[]
}

export async function requireUser(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) throw new Error('supabase_env_missing')

  const authHeader = req.headers.get('Authorization') || ''
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('unauthorized')
  return { user: data.user, client }
}

function extractTransferId(question: string) {
  const match = question.match(
    /\b(MXT[-_][A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  )
  return match?.[1] || null
}

function wantsTransfers(question: string) {
  return /transfert|transfer|virement|mandat|paiement|preuve|statut|où en est|ou en est|mon dossier|mxt[-_]/i.test(
    question,
  )
}

function wantsExchangers(question: string) {
  return /échangeur|echangeur|changeur|exchanger|taux|partenaire/i.test(question)
}

function summarizeTransferRow(row: Record<string, unknown>) {
  const payload = (row.payload && typeof row.payload === 'object'
    ? row.payload
    : {}) as Record<string, unknown>
  const exchanger = (row.exchanger && typeof row.exchanger === 'object'
    ? row.exchanger
    : {}) as Record<string, unknown>
  const amount = row.amount
  const received = row.received_amount
  const currencyFrom = payload.currencyFrom || ''
  const currencyTo = payload.currencyTo || ''
  return {
    id: row.id,
    status: row.status,
    direction: row.direction,
    originCountry: row.origin_country,
    amount: amount != null ? `${amount}${currencyFrom ? ` ${currencyFrom}` : ''}` : null,
    received: received != null ? `${received}${currencyTo ? ` ${currencyTo}` : ''}` : null,
    exchanger: exchanger.name || null,
    createdAt: row.created_at || row.updated_at || null,
    path: `/transfers/${row.id}`,
  }
}

async function listMyTransfers(client: SupabaseClient, userId: string, limit = 8) {
  const { data, error } = await client
    .from('transfers')
    .select(
      'id, status, direction, origin_country, amount, fee, received_amount, exchanger, payload, created_at, updated_at, user_id, business_owner_id',
    )
    .or(`user_id.eq.${userId},business_owner_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).map((row) => summarizeTransferRow(row as Record<string, unknown>))
}

async function getTransfer(client: SupabaseClient, transferId: string) {
  const { data, error } = await client
    .from('transfers')
    .select(
      'id, status, direction, origin_country, amount, fee, received_amount, exchanger, payload, created_at, updated_at',
    )
    .eq('id', transferId)
    .maybeSingle()
  if (error) throw error
  return data ? summarizeTransferRow(data as Record<string, unknown>) : null
}

async function listExchangers(client: SupabaseClient, limit = 6) {
  const { data, error } = await client
    .from('businesses')
    .select('id, name, city, country, status, services, fee_percent, rating, average_delay')
    .in('status', ['verified', 'active', 'approved'])
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(40)
  if (error) throw error
  const rows = (data || []).filter((b) => {
    const services = Array.isArray(b.services) ? b.services.map(String) : []
    return services.some((s) => /transfert|transfer/i.test(s)) || services.length === 0
  })
  return rows.slice(0, limit).map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city || null,
    country: b.country || null,
    rating: b.rating ?? null,
    feePercent: b.fee_percent ?? null,
    path: `/businesses/${b.id}`,
  }))
}

/**
 * Fusionne le contexte client avec des tools serveur (RLS).
 * Les tools serveur complètent / rafraîchissent si la question le demande.
 */
export async function gatherToolContext(options: {
  req: Request
  question: string
  clientPack?: Partial<ToolContextPack> | null
}): Promise<ToolContextPack> {
  const { req, question, clientPack } = options
  const toolsUsed = new Set<string>(clientPack?.toolsUsed || [])
  let transfers = Array.isArray(clientPack?.transfers) ? [...clientPack!.transfers!] : []
  let focusedTransfer = clientPack?.focusedTransfer || null
  let exchangers = Array.isArray(clientPack?.exchangers) ? [...clientPack!.exchangers!] : []
  const searchHits = Array.isArray(clientPack?.searchHits) ? [...clientPack!.searchHits!] : []
  if (searchHits.length) toolsUsed.add('search_content')

  try {
    const { user, client } = await requireUser(req)
    const transferId = extractTransferId(question)

    if (wantsTransfers(question) || transferId) {
      if (!transfers.length) {
        transfers = await listMyTransfers(client, user.id, 8)
        if (transfers.length) toolsUsed.add('list_my_transfers')
      }
      if (transferId && !focusedTransfer) {
        focusedTransfer = await getTransfer(client, transferId)
        if (focusedTransfer) toolsUsed.add('get_transfer')
      }
    }

    if (wantsExchangers(question) && !exchangers.length) {
      exchangers = await listExchangers(client, 6)
      if (exchangers.length) toolsUsed.add('list_exchangers')
    }
  } catch {
    // Sans session valide on garde uniquement le pack client (déjà RLS côté app).
  }

  return {
    toolsUsed: [...toolsUsed],
    searchHits,
    transfers,
    focusedTransfer,
    exchangers,
  }
}

export function formatToolContextForPrompt(pack: ToolContextPack): string {
  const blocks: string[] = []
  if (pack.toolsUsed.length) {
    blocks.push(`Tools utilisés: ${pack.toolsUsed.join(', ')}`)
  }
  if (pack.focusedTransfer) {
    blocks.push(`Transfert ciblé:\n${JSON.stringify(pack.focusedTransfer, null, 0)}`)
  }
  if (pack.transfers.length) {
    blocks.push(
      `Mes transferts récents (${pack.transfers.length}):\n${JSON.stringify(pack.transfers.slice(0, 8))}`,
    )
  }
  if (pack.exchangers.length) {
    blocks.push(
      `Échangeurs disponibles (${pack.exchangers.length}):\n${JSON.stringify(pack.exchangers.slice(0, 6))}`,
    )
  }
  if (pack.searchHits.length) {
    blocks.push(
      `Résultats recherche (${pack.searchHits.length}):\n${JSON.stringify(pack.searchHits.slice(0, 8))}`,
    )
  }
  return blocks.join('\n\n')
}

export function buildDynamicCandidates(pack: ToolContextPack) {
  const out: Array<{ id: string; label: string; path?: string; typeLabel?: string }> = []
  if (pack.focusedTransfer?.id) {
    out.push({
      id: `transfer-${pack.focusedTransfer.id}`,
      label: `Transfert ${pack.focusedTransfer.id}`,
      path: String(pack.focusedTransfer.path || `/transfers/${pack.focusedTransfer.id}`),
      typeLabel: 'Transfert',
    })
  }
  for (const t of pack.transfers) {
    if (!t?.id || (pack.focusedTransfer?.id && t.id === pack.focusedTransfer.id)) continue
    out.push({
      id: `transfer-${t.id}`,
      label: `Transfert ${t.id}${t.status ? ` (${t.status})` : ''}`,
      path: String(t.path || `/transfers/${t.id}`),
      typeLabel: 'Transfert',
    })
  }
  for (const e of pack.exchangers) {
    if (!e?.id) continue
    out.push({
      id: `entity-business-${e.id}`,
      label: String(e.name || e.id),
      path: String(e.path || `/businesses/${e.id}`),
      typeLabel: 'Échangeur',
    })
  }
  for (const hit of pack.searchHits) {
    if (!hit?.path) continue
    const id = String(hit.id || hit.path)
    out.push({
      id: id.startsWith('page-') || id.startsWith('entity-') ? id : `search-${id}`,
      label: String(hit.title || hit.path),
      path: String(hit.path),
      typeLabel: hit.type ? String(hit.type) : 'Recherche',
    })
  }
  return out
}
