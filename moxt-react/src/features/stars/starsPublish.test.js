import { describe, expect, it, vi } from 'vitest'
import { StarsInsufficientError, starsOwnerFromPublish, withStarsConsume } from './starsPublish'

vi.mock('./starsRemote', () => ({
  quoteStarsAction: vi.fn(),
  consumeStars: vi.fn(),
  refundFailedStarsPublish: vi.fn(),
}))

import { consumeStars, quoteStarsAction, refundFailedStarsPublish } from './starsRemote'

describe('withStarsConsume', () => {
  it('saute la consommation si le serveur ne l’applique pas', async () => {
    quoteStarsAction.mockResolvedValue({ skipped: true, paid: 0, insufficient: false })
    const publish = vi.fn().mockResolvedValue({ id: 'ANN-1' })
    const result = await withStarsConsume({
      category: 'marketplace',
      entityId: 'ANN-1',
      publish,
    })
    expect(consumeStars).not.toHaveBeenCalled()
    expect(publish).toHaveBeenCalled()
    expect(result.consumed.skipped).toBe(true)
  })

  it('refuse si le solde est insuffisant', async () => {
    quoteStarsAction.mockResolvedValue({ skipped: false, paid: 2, insufficient: true })
    await expect(
      withStarsConsume({
        category: 'marketplace',
        entityId: 'ANN-1',
        publish: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(StarsInsufficientError)
  })

  it('rembourse si la publication échoue après débit', async () => {
    quoteStarsAction.mockResolvedValue({ skipped: false, paid: 0, bonus: 1, insufficient: false })
    consumeStars.mockResolvedValue({ skipped: false, bonus: 1, paid: 0 })
    refundFailedStarsPublish.mockResolvedValue({ ok: true })
    await expect(
      withStarsConsume({
        category: 'jobs',
        entityId: 'JOB-1',
        publish: vi.fn().mockRejectedValue(new Error('insert failed')),
      }),
    ).rejects.toThrow('insert failed')
    expect(refundFailedStarsPublish).toHaveBeenCalledWith({
      idempotencyKey: 'JOB-1',
      ownerType: 'user',
      ownerId: null,
    })
  })

  it('utilise le wallet entreprise quand on publie en business', () => {
    expect(
      starsOwnerFromPublish({
        useBusiness: true,
        business: { id: 'BIZ-1' },
        user: { id: 'user-1' },
      }),
    ).toEqual({ ownerType: 'business', ownerId: 'BIZ-1' })
  })
})
