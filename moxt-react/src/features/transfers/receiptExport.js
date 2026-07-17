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

export function receiptLines(transfer, t) {
  const pricing = getTransferPricing(transfer)

  return [
    resolveMsg(t, 'transfers.receipt.header', 'MOXT - RECU DE TRANSFERT'),
    resolveMsg(t, 'transfers.receipt.reference', `Reference: ${transfer.id}`, { id: transfer.id }),
    resolveMsg(t, 'transfers.receipt.status', `Statut: ${transfer.status}`, {
      status: transfer.status,
    }),
    resolveMsg(
      t,
      'transfers.receipt.direction',
      `Direction: ${directionLabel(transfer.direction, t)}`,
      { direction: directionLabel(transfer.direction, t) },
    ),
    resolveMsg(
      t,
      'transfers.receipt.business',
      `Entreprise: ${transfer.exchanger?.name || resolveMsg(t, 'transfers.receipt.notProvided', 'Non renseignee')}`,
      {
        name:
          transfer.exchanger?.name ||
          resolveMsg(t, 'transfers.receipt.notProvided', 'Non renseignee'),
      },
    ),
    resolveMsg(
      t,
      'transfers.receipt.sender',
      `Expediteur: ${transfer.sender.firstName} ${transfer.sender.lastName}`,
      { name: `${transfer.sender.firstName} ${transfer.sender.lastName}` },
    ),
    resolveMsg(
      t,
      'transfers.receipt.recipient',
      `Destinataire: ${transfer.recipient.firstName} ${transfer.recipient.lastName}`,
      { name: `${transfer.recipient.firstName} ${transfer.recipient.lastName}` },
    ),
    resolveMsg(
      t,
      'transfers.receipt.amountSent',
      `Montant envoye: ${formatMoney(pricing.amountSent, transfer.currencyFrom)}`,
      { amount: formatMoney(pricing.amountSent, transfer.currencyFrom) },
    ),
    resolveMsg(
      t,
      'transfers.receipt.fees',
      `Frais (${pricing.feePercent}%): ${formatMoney(pricing.fees, transfer.currencyFrom)}`,
      {
        percent: pricing.feePercent,
        amount: formatMoney(pricing.fees, transfer.currencyFrom),
      },
    ),
    resolveMsg(
      t,
      'transfers.receipt.totalPaid',
      `Total paye: ${formatMoney(pricing.totalToPay, transfer.currencyFrom)}`,
      { amount: formatMoney(pricing.totalToPay, transfer.currencyFrom) },
    ),
    resolveMsg(
      t,
      'transfers.receipt.amountReceived',
      `Montant recu: ${formatMoney(transfer.amountReceived, transfer.currencyTo)}`,
      { amount: formatMoney(transfer.amountReceived, transfer.currencyTo) },
    ),
    resolveMsg(
      t,
      'transfers.receipt.createdAt',
      `Cree le: ${formatDate(transfer.createdAt)}`,
      { date: formatDate(transfer.createdAt) },
    ),
    '',
    resolveMsg(t, 'transfers.receipt.processing', 'TRAITEMENT'),
    ...(transfer.timeline || []).map(
      (event) =>
        `${formatDate(event.at)} - ${event.status}${event.proofName ? ` - ${event.proofName}` : ''}`,
    ),
    '',
    resolveMsg(t, 'transfers.receipt.generatedLocally', 'Document genere localement par MOXT.'),
  ]
}

export function printReceipt(transfer, t) {
  const printable = window.open('', '_blank', 'width=900,height=900')
  if (!printable) return
  const rows = receiptLines(transfer, t)
    .map((line) => `<p>${escapeHtml(line) || '&nbsp;'}</p>`)
    .join('')
  const title = resolveMsg(t, 'transfers.receipt.windowTitle', `Recu ${transfer.id}`, {
    id: transfer.id,
  })
  const printHint = resolveMsg(
    t,
    'transfers.receipt.printHint',
    'Utilisez "Enregistrer au format PDF" dans la fenetre d\'impression.',
  )
  printable.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
    <style>body{font-family:Arial,sans-serif;margin:48px;color:#10201c}h1{color:#07594d}
    p{margin:8px 0;padding:7px 0;border-bottom:1px solid #edf2f0}small{color:#64748b}</style>
    </head><body><h1>MOXT</h1>${rows}<small>${escapeHtml(printHint)}</small>
    <script>window.onload=()=>window.print()</script></body></html>`)
  printable.document.close()
}

export function downloadReceiptImage(transfer, t) {
  const lines = receiptLines(transfer, t)
  const height = Math.max(720, 150 + lines.length * 32)
  const text = lines
    .map(
      (line, index) =>
        `<text x="60" y="${120 + index * 32}" font-size="${index === 0 ? 26 : 16}" font-weight="${index === 0 ? 800 : 500}" fill="#10201c">${escapeXml(line)}</text>`,
    )
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}">
    <rect width="100%" height="100%" fill="#f5faf8"/><rect x="30" y="30" width="1020" height="${height - 60}" rx="34" fill="white"/>
    ${text}</svg>`
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `recu-${transfer.id}.svg`)
}

export async function shareReceipt(transfer, t) {
  const text = receiptLines(transfer, t).join('\n')
  if (navigator.share) {
    await navigator.share({
      title: resolveMsg(t, 'transfers.receipt.shareTitle', `Recu MOXT ${transfer.id}`, {
        id: transfer.id,
      }),
      text,
    })
    return
  }
  await navigator.clipboard?.writeText(text)
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}
