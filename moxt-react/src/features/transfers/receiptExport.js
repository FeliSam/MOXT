import { directionLabel, formatDate, formatMoney, getTransferPricing } from './transferUtils'

export function receiptLines(transfer) {
  const pricing = getTransferPricing(transfer)

  return [
    'MOXT - RECU DE TRANSFERT',
    `Reference: ${transfer.id}`,
    `Statut: ${transfer.status}`,
    `Direction: ${directionLabel(transfer.direction)}`,
    `Entreprise: ${transfer.exchanger?.name || 'Non renseignee'}`,
    `Expediteur: ${transfer.sender.firstName} ${transfer.sender.lastName}`,
    `Destinataire: ${transfer.recipient.firstName} ${transfer.recipient.lastName}`,
    `Montant envoye: ${formatMoney(pricing.amountSent, transfer.currencyFrom)}`,
    `Frais (${pricing.feePercent}%): ${formatMoney(pricing.fees, transfer.currencyFrom)}`,
    `Total paye: ${formatMoney(pricing.totalToPay, transfer.currencyFrom)}`,
    `Montant recu: ${formatMoney(transfer.amountReceived, transfer.currencyTo)}`,
    `Cree le: ${formatDate(transfer.createdAt)}`,
    '',
    'TRAITEMENT',
    ...(transfer.timeline || []).map(
      (event) =>
        `${formatDate(event.at)} - ${event.status}${event.proofName ? ` - ${event.proofName}` : ''}`,
    ),
    '',
    'Document genere localement par MOXT.',
  ]
}

export function printReceipt(transfer) {
  const printable = window.open('', '_blank', 'width=900,height=900')
  if (!printable) return
  const rows = receiptLines(transfer)
    .map((line) => `<p>${escapeHtml(line) || '&nbsp;'}</p>`)
    .join('')
  printable.document.write(`<!doctype html><html><head><title>Recu ${transfer.id}</title>
    <style>body{font-family:Arial,sans-serif;margin:48px;color:#10201c}h1{color:#07594d}
    p{margin:8px 0;padding:7px 0;border-bottom:1px solid #edf2f0}small{color:#64748b}</style>
    </head><body><h1>MOXT</h1>${rows}<small>Utilisez "Enregistrer au format PDF" dans la fenetre d'impression.</small>
    <script>window.onload=()=>window.print()</script></body></html>`)
  printable.document.close()
}

export function downloadReceiptImage(transfer) {
  const lines = receiptLines(transfer)
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

export async function shareReceipt(transfer) {
  const text = receiptLines(transfer).join('\n')
  if (navigator.share) {
    await navigator.share({ title: `Recu MOXT ${transfer.id}`, text })
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
