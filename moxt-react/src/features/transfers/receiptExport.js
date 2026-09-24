import { Capacitor } from '@capacitor/core'
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

function buildReceiptHtml(transfer, t) {
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
  return {
    title,
    html: `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
    <style>body{font-family:Arial,sans-serif;margin:48px;color:#10201c}h1{color:#07594d}
    p{margin:8px 0;padding:7px 0;border-bottom:1px solid #edf2f0}small{color:#64748b}</style>
    </head><body><h1>MOXT</h1>${rows}<small>${escapeHtml(printHint)}</small></body></html>`,
  }
}

/**
 * Bouton « PDF » : télécharge un HTML imprimable (sauver en PDF via le partage /
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
  await downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `recu-${transfer.id}.svg`)
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
