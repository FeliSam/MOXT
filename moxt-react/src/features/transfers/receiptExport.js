import { Capacitor } from '@capacitor/core'
import { statusLabelKey } from './exchanger/statusLabels'
import { resolveTransferTimelineLabel } from './detail/transferTimelineUtils'
import { TRANSFER_STATUS, TRANSFER_TIMELINE_EVENT } from './transferConfig'
import { directionLabel, formatDate, formatMoney, getTransferPricing } from './transferUtils'

function resolveMsg(t, key, fallback, vars) {
  if (typeof t === 'function') {
    const translated = t(key, vars)
    if (translated != null && translated !== key) return translated
  }
  if (!vars) return fallback
  return fallback.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

/** Libellés FR de secours si i18n absente (ne jamais exposer le code brut). */
const STATUS_FALLBACKS = {
  [TRANSFER_STATUS.PENDING_ACCEPTANCE]: 'En attente d’acceptation',
  [TRANSFER_STATUS.PENDING]: 'Paiement attendu',
  [TRANSFER_STATUS.DECLINED]: 'Échangeur indisponible',
  [TRANSFER_STATUS.DECLARED]: 'Paiement déclaré',
  [TRANSFER_STATUS.RECEIVED]: 'Paiement reçu',
  [TRANSFER_STATUS.PROCESSING]: 'En traitement',
  [TRANSFER_STATUS.PAID_OUT]: 'Virement effectué',
  [TRANSFER_STATUS.COMPLETED]: 'Terminé',
  [TRANSFER_STATUS.CANCELLED]: 'Annulé',
  [TRANSFER_STATUS.EXPIRED]: 'Expiré',
  [TRANSFER_TIMELINE_EVENT.BUSINESS_ACCEPTED]: 'Demande acceptée',
  // alias historiques éventuels
  pending: 'En attente',
  completed: 'Terminé',
  cancelled: 'Annulé',
  expired: 'Expiré',
  processing: 'En traitement',
}

export function receiptStatusLabel(status, t) {
  if (!status) {
    return resolveMsg(t, 'transfers.receipt.statusUnknown', 'Non défini')
  }
  const key = statusLabelKey(status)
  const fallback = STATUS_FALLBACKS[status] || STATUS_FALLBACKS[key] || String(status)
  if (typeof t === 'function' && key && key !== status) {
    const translated = t(key)
    if (translated != null && translated !== key) return translated
  }
  return fallback
}

function partyName(person, t) {
  if (!person) return resolveMsg(t, 'transfers.receipt.notProvided', 'Non renseignée')
  const name = `${person.firstName || ''} ${person.lastName || ''}`.trim()
  return name || resolveMsg(t, 'transfers.receipt.notProvided', 'Non renseignée')
}

function receiptTimelineRows(transfer, t) {
  return (transfer.timeline || []).map((event) => {
    let label = STATUS_FALLBACKS[event.status] || receiptStatusLabel(event.status, t)
    if (typeof t === 'function') {
      const translated = resolveTransferTimelineLabel(event, t)
      if (
        translated &&
        translated !== event.status &&
        !String(translated).startsWith('transfers.')
      ) {
        label = translated
      }
    }
    return {
      at: formatDate(event.at),
      label,
      proofName: event.proofName || '',
    }
  })
}

export function buildReceiptModel(transfer, t) {
  const pricing = getTransferPricing(transfer)
  const statusLabel = receiptStatusLabel(transfer.status, t)
  const notProvided = resolveMsg(t, 'transfers.receipt.notProvided', 'Non renseignée')
  return {
    id: transfer.id,
    title: resolveMsg(t, 'transfers.receipt.title', 'Réçu de transfert'),
    statusLabel,
    directionLabel: directionLabel(transfer.direction, t),
    businessName: transfer.exchanger?.name || notProvided,
    senderName: partyName(transfer.sender, t),
    recipientName: partyName(transfer.recipient, t),
    amountSent: formatMoney(pricing.amountSent, transfer.currencyFrom),
    fees: formatMoney(pricing.fees, transfer.currencyFrom),
    feePercent: pricing.feePercent,
    totalPaid: formatMoney(pricing.totalToPay, transfer.currencyFrom),
    amountReceived: formatMoney(transfer.amountReceived, transfer.currencyTo),
    createdAt: formatDate(transfer.createdAt),
    timeline: receiptTimelineRows(transfer, t),
    footer: resolveMsg(t, 'transfers.receipt.generatedBy', 'Document généré par MOXT'),
  }
}

export function receiptLines(transfer, t) {
  const model = buildReceiptModel(transfer, t)
  return [
    `MOXT — ${model.title}`,
    resolveMsg(t, 'transfers.receipt.reference', `Référence: ${model.id}`, { id: model.id }),
    resolveMsg(t, 'transfers.receipt.status', `Statut: ${model.statusLabel}`, {
      status: model.statusLabel,
    }),
    resolveMsg(t, 'transfers.receipt.direction', `Direction: ${model.directionLabel}`, {
      direction: model.directionLabel,
    }),
    resolveMsg(t, 'transfers.receipt.business', `Entreprise: ${model.businessName}`, {
      name: model.businessName,
    }),
    resolveMsg(t, 'transfers.receipt.sender', `Expéditeur: ${model.senderName}`, {
      name: model.senderName,
    }),
    resolveMsg(t, 'transfers.receipt.recipient', `Destinataire: ${model.recipientName}`, {
      name: model.recipientName,
    }),
    resolveMsg(t, 'transfers.receipt.amountSent', `Montant envoyé: ${model.amountSent}`, {
      amount: model.amountSent,
    }),
    resolveMsg(
      t,
      'transfers.receipt.fees',
      `Frais (${model.feePercent}%): ${model.fees}`,
      { percent: model.feePercent, amount: model.fees },
    ),
    resolveMsg(t, 'transfers.receipt.totalPaid', `Total payé: ${model.totalPaid}`, {
      amount: model.totalPaid,
    }),
    resolveMsg(t, 'transfers.receipt.amountReceived', `Montant reçu: ${model.amountReceived}`, {
      amount: model.amountReceived,
    }),
    resolveMsg(t, 'transfers.receipt.createdAt', `Créé le: ${model.createdAt}`, {
      date: model.createdAt,
    }),
    '',
    resolveMsg(t, 'transfers.receipt.processing', 'Traitement'),
    ...model.timeline.map(
      (row) => `${row.at} — ${row.label}${row.proofName ? ` — ${row.proofName}` : ''}`,
    ),
    '',
    model.footer,
  ]
}

export function buildReceiptHtml(transfer, t) {
  const model = buildReceiptModel(transfer, t)
  const windowTitle = resolveMsg(t, 'transfers.receipt.windowTitle', `Réçu ${model.id}`, {
    id: model.id,
  })

  const party = (label, value) => `
    <div class="party">
      <div class="party-label">${escapeHtml(label)}</div>
      <div class="party-value">${escapeHtml(value)}</div>
    </div>`

  const amountRow = (label, value, strong = false) => `
    <div class="amount-row${strong ? ' amount-row--strong' : ''}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>`

  const timelineHtml =
    model.timeline.length === 0
      ? ''
      : `<section class="timeline">
          <h2>${escapeHtml(resolveMsg(t, 'transfers.receipt.processing', 'Traitement'))}</h2>
          <ol>
            ${model.timeline
              .map(
                (row) => `<li>
                  <span class="tl-date">${escapeHtml(row.at)}</span>
                  <span class="tl-label">${escapeHtml(row.label)}${
                    row.proofName ? ` · ${escapeHtml(row.proofName)}` : ''
                  }</span>
                </li>`,
              )
              .join('')}
          </ol>
        </section>`

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(windowTitle)}</title>
  <style>
    :root {
      --ink: #10201c;
      --muted: #5b6b66;
      --teal: #07594d;
      --teal-soft: #e7f5f1;
      --teal-line: #14b8a6;
      --cream: #fffef9;
      --paper: #f7f3ea;
      --line: #d7e4df;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 16px;
      background: var(--paper);
      color: var(--ink);
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    .sheet {
      max-width: 720px;
      margin: 0 auto;
      background: var(--cream);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: 0 18px 40px rgba(16, 32, 28, 0.08);
      padding: 36px 40px 28px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand {
      font-weight: 800;
      letter-spacing: 0.18em;
      color: var(--teal);
      font-size: 15px;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--teal-soft);
      color: var(--teal);
      font-size: 12px;
      font-weight: 700;
    }
    .accent {
      height: 3px;
      margin: 18px 0 22px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--teal), var(--teal-line));
    }
    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ink);
    }
    .meta {
      color: var(--muted);
      font-size: 13px;
      margin: 0 0 22px;
    }
    .meta strong { color: var(--ink); }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 18px;
      margin: 0 0 22px;
    }
    .party {
      border-top: 2px solid var(--teal);
      padding-top: 10px;
      background: rgba(7, 89, 77, 0.03);
      border-radius: 0 0 12px 12px;
      padding: 10px 12px 12px;
    }
    .party-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      font-weight: 700;
    }
    .party-value {
      margin-top: 4px;
      font-size: 15px;
      font-weight: 700;
    }
    .amounts {
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 14px;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 14px;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
    }
    .amount-row:last-child { border-bottom: 0; }
    .amount-row--strong {
      background: var(--teal-soft);
      color: var(--teal);
      font-size: 16px;
    }
    .totals {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 0 0 22px;
    }
    .total-box {
      border: 1px solid #b7ddd4;
      background: linear-gradient(180deg, #f3fbf8, #e7f5f1);
      border-radius: 14px;
      padding: 14px 16px;
    }
    .total-box .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      font-weight: 700;
    }
    .total-box .value {
      margin-top: 6px;
      font-size: 22px;
      font-weight: 800;
      color: var(--teal);
    }
    .timeline h2 {
      margin: 0 0 10px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .timeline ol {
      list-style: none;
      margin: 0;
      padding: 0;
      border-left: 2px solid var(--teal-line);
    }
    .timeline li {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 10px;
      padding: 6px 0 6px 14px;
      font-size: 13px;
    }
    .tl-date { color: var(--muted); }
    .tl-label { font-weight: 600; }
    footer {
      margin-top: 26px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 12px;
    }
    @media (max-width: 640px) {
      .sheet { padding: 24px 18px; }
      .parties, .totals { grid-template-columns: 1fr; }
      .timeline li { grid-template-columns: 1fr; gap: 2px; }
    }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border: 0; border-radius: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <article class="sheet">
    <div class="brand-row">
      <div class="brand">MOXT</div>
      <span class="badge">${escapeHtml(model.statusLabel)}</span>
    </div>
    <div class="accent"></div>
    <h1>${escapeHtml(model.title)}</h1>
    <p class="meta">
      ${escapeHtml(resolveMsg(t, 'transfers.receipt.referenceLabel', 'Référence'))}
      <strong>${escapeHtml(model.id)}</strong>
      · ${escapeHtml(model.createdAt)}
    </p>

    <section class="parties">
      ${party(resolveMsg(t, 'transfers.receipt.senderLabel', 'Expéditeur'), model.senderName)}
      ${party(resolveMsg(t, 'transfers.receipt.recipientLabel', 'Destinataire'), model.recipientName)}
      ${party(resolveMsg(t, 'transfers.receipt.businessLabel', 'Entreprise'), model.businessName)}
      ${party(resolveMsg(t, 'transfers.receipt.directionLabel', 'Direction'), model.directionLabel)}
    </section>

    <section class="amounts">
      ${amountRow(resolveMsg(t, 'transfers.receipt.amountSentLabel', 'Montant envoyé'), model.amountSent)}
      ${amountRow(
        resolveMsg(t, 'transfers.receipt.feesLabel', `Frais (${model.feePercent}%)`, {
          percent: model.feePercent,
        }),
        model.fees,
      )}
    </section>

    <section class="totals">
      <div class="total-box">
        <div class="label">${escapeHtml(resolveMsg(t, 'transfers.receipt.totalPaidLabel', 'Total payé'))}</div>
        <div class="value">${escapeHtml(model.totalPaid)}</div>
      </div>
      <div class="total-box">
        <div class="label">${escapeHtml(resolveMsg(t, 'transfers.receipt.amountReceivedLabel', 'Montant reçu'))}</div>
        <div class="value">${escapeHtml(model.amountReceived)}</div>
      </div>
    </section>

    ${timelineHtml}

    <footer>${escapeHtml(model.footer)}</footer>
  </article>
</body>
</html>`

  return { title: windowTitle, html, model }
}

/**
 * Bouton « Enregistrer » : télécharge un HTML imprimable (sauver en PDF via le partage /
 * l'imprimante). Sur WebView natif, window.open+print est bloqué — d'où le fichier.
 */
export async function downloadReceiptPdf(transfer, t) {
  const { html } = buildReceiptHtml(transfer, t)
  await downloadBlob(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    `recu-${transfer.id}.html`,
  )
}

export async function printReceipt(transfer, t) {
  const { title, html } = buildReceiptHtml(transfer, t)
  const canPopup =
    typeof window !== 'undefined' &&
    !Capacitor.isNativePlatform?.() &&
    typeof window.open === 'function'

  if (canPopup) {
    const printable = window.open('', '_blank', 'width=900,height=900')
    if (printable) {
      printable.document.write(
        html.replace('</body>', `<script>window.onload=()=>window.print()</script></body>`),
      )
      printable.document.close()
      printable.document.title = title
      return
    }
  }

  await downloadReceiptPdf(transfer, t)
}

export async function downloadReceiptImage(transfer, t) {
  const model = buildReceiptModel(transfer, t)
  const lines = [
    'MOXT',
    model.title,
    `${model.id} · ${model.statusLabel}`,
    '',
    `Expéditeur — ${model.senderName}`,
    `Destinataire — ${model.recipientName}`,
    `Entreprise — ${model.businessName}`,
    `Direction — ${model.directionLabel}`,
    '',
    `Total payé — ${model.totalPaid}`,
    `Montant reçu — ${model.amountReceived}`,
    '',
    ...model.timeline.map((row) => `${row.at} — ${row.label}`),
    '',
    model.footer,
  ]
  const height = Math.max(900, 180 + lines.length * 34)
  const text = lines
    .map((line, index) => {
      const isTitle = index <= 1
      const isAccent = index === 2
      return `<text x="64" y="${140 + index * 34}" font-size="${isTitle ? 28 : 16}" font-weight="${
        isTitle || isAccent ? 800 : 500
      }" fill="${isTitle ? '#07594d' : '#10201c'}">${escapeXml(line)}</text>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}">
    <rect width="100%" height="100%" fill="#f7f3ea"/>
    <rect x="36" y="36" width="1008" height="${height - 72}" rx="28" fill="#fffef9" stroke="#d7e4df"/>
    <rect x="36" y="36" width="1008" height="8" fill="#07594d"/>
    ${text}
  </svg>`
  await downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `recu-${transfer.id}.svg`)
}

export async function shareReceipt(transfer, t) {
  const text = receiptLines(transfer, t).join('\n')
  if (navigator.share) {
    await navigator.share({
      title: resolveMsg(t, 'transfers.receipt.shareTitle', `Réçu MOXT ${transfer.id}`, {
        id: transfer.id,
      }),
      text,
    })
    return
  }
  await navigator.clipboard?.writeText(text)
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function shareBlobFile(blob, name) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  try {
    const file = new File([blob], name, { type: blob.type || 'application/octet-stream' })
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return false
    await navigator.share({ files: [file], title: name })
    return true
  } catch (error) {
    if (error?.name === 'AbortError') return true
    return false
  }
}

async function writeNativeFilesystem(blob, name) {
  if (!Capacitor.isNativePlatform?.()) return false
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const base64 = await blobToBase64(blob)
    await Filesystem.writeFile({
      path: `moxt-receipts/${name}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    })
    return true
  } catch {
    return false
  }
}

function triggerAnchorDownload(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Délai : iOS / certains WebView révoquent trop tôt l'URL blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Téléchargement robuste : Web Share (fichiers) → Filesystem natif → <a download>.
 * Les WebView Capacitor (surtout iOS) ignorent souvent l'attribut download sur blob:.
 */
export async function downloadBlob(blob, name) {
  if (await shareBlobFile(blob, name)) return 'shared'
  if (await writeNativeFilesystem(blob, name)) return 'saved'
  triggerAnchorDownload(blob, name)
  return 'anchor'
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}
