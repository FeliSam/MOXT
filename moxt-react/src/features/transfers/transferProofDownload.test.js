import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../../services/storageService', () => ({
  storageService: {
    downloadTransferProof: vi.fn(),
    getTransferProofSignedUrl: vi.fn(),
  },
}))

import { storageService } from '../../services/storageService'
import { downloadTransferProofFile } from './transferProofDownload'

describe('transferProofDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('telecharge via le client storage quand le chemin existe', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    storageService.downloadTransferProof.mockResolvedValue(blob)

    await downloadTransferProofFile({
      proof: { name: 'preuve.pdf' },
      path: 'user-1/MXT-1/proof.pdf',
      transfer: { id: 'MXT-1', userId: 'user-1' },
      transferId: 'MXT-1',
      kind: 'payment',
    })

    expect(storageService.downloadTransferProof).toHaveBeenCalledWith('user-1/MXT-1/proof.pdf')
  })

  it('essaie plusieurs extensions si le premier chemin echoue', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' })
    storageService.downloadTransferProof
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValueOnce(blob)

    await downloadTransferProofFile({
      proof: { name: 'preuve.jpg' },
      transfer: { id: 'MXT-2', userId: 'user-2' },
      transferId: 'MXT-2',
      kind: 'payment',
    })

    expect(storageService.downloadTransferProof).toHaveBeenCalledTimes(2)
  })
})
