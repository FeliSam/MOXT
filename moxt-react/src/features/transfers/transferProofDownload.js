import { storageService } from '../../services/storageService'
import { inferProofStoragePath } from './transferProofUtils'

const FALLBACK_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

function proofExtension(proof) {
  const fromName = proof?.name?.split('.').pop()?.toLowerCase()
  if (fromName) return fromName
  if (proof?.type?.includes('pdf')) return 'pdf'
  if (proof?.type?.startsWith('image/')) return proof.type.split('/')[1] || 'jpg'
  return null
}

function buildPathCandidates(transfer, kind, proof, primaryPath) {
  const candidates = []
  if (primaryPath) candidates.push(primaryPath)
  if (proof?.path) candidates.push(proof.path)

  const ext = proofExtension(proof)
  const extensions = ext ? [ext, ...FALLBACK_EXTENSIONS.filter((item) => item !== ext)] : FALLBACK_EXTENSIONS

  if (transfer && kind === 'payment') {
    for (const extension of extensions) {
      candidates.push(`${transfer.userId}/${transfer.id}/proof.${extension}`)
    }
  }
  if (transfer && kind === 'business') {
    const ownerId = transfer.businessOwnerId || transfer.userId
    for (const extension of extensions) {
      candidates.push(`${ownerId}/${transfer.id}/business.${extension}`)
    }
  }
  if (transfer && kind === 'received') {
    for (const extension of extensions) {
      candidates.push(`${transfer.userId}/${transfer.id}-receive/proof.${extension}`)
    }
  }

  return [...new Set(candidates.filter(Boolean))]
}

async function resolveDownloadBlob(pathCandidates) {
  for (const path of pathCandidates) {
    try {
      return { blob: await storageService.downloadTransferProof(path), path }
    } catch {
      // essayer le chemin suivant
    }
  }
  return null
}

function triggerBrowserDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

async function openSignedUrl(url, fileName) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function downloadTransferProofFile({ proof, path, transfer, transferId, kind }) {
  const fileName = proof?.name || `preuve-${kind || 'transfert'}-${transferId || 'moxt'}`
  const resolvedPath =
    path || (transfer && kind ? inferProofStoragePath(transfer, kind, proof) : null)
  const pathCandidates = buildPathCandidates(transfer, kind, proof, resolvedPath)

  const downloaded = await resolveDownloadBlob(pathCandidates)
  if (downloaded?.blob) {
    triggerBrowserDownload(downloaded.blob, fileName)
    return
  }

  if (proof?.url) {
    await openSignedUrl(proof.url, fileName)
    return
  }

  for (const candidate of pathCandidates) {
    try {
      const signedUrl = await storageService.getTransferProofSignedUrl(candidate)
      await openSignedUrl(signedUrl, fileName)
      return
    } catch {
      // essayer le chemin suivant
    }
  }

  throw new Error('Fichier introuvable')
}
