import { beforeEach, describe, expect, it, vi } from 'vitest'

const quoteStarsBoost = vi.fn()
const applyStarsBoost = vi.fn()
vi.mock('./starsRemote', () => ({
  quoteStarsBoost: (...args) => quoteStarsBoost(...args),
  applyStarsBoost: (...args) => applyStarsBoost(...args),
}))

const { withStarsBoost } = await import('./starsBoost')

describe('withStarsBoost — confirmation du boost inclus', () => {
  beforeEach(() => {
    quoteStarsBoost.mockReset()
    applyStarsBoost.mockReset()
    applyStarsBoost.mockResolvedValue({ ok: true })
  })

  it('demande confirmFree quand aucune étoile n’est débitée ; annuler n’applique rien', async () => {
    quoteStarsBoost.mockResolvedValue({ paid: 0 })
    const confirmFree = vi.fn().mockResolvedValue(false)
    const outcome = await withStarsBoost({ entityType: 'listing', entityId: 'A', confirmFree })
    expect(confirmFree).toHaveBeenCalledTimes(1)
    expect(outcome.cancelled).toBe(true)
    expect(applyStarsBoost).not.toHaveBeenCalled()
  })

  it('confirmer applique le boost une seule fois', async () => {
    quoteStarsBoost.mockResolvedValue({ paid: 0 })
    const confirmFree = vi.fn().mockResolvedValue(true)
    await withStarsBoost({ entityType: 'listing', entityId: 'A', confirmFree })
    expect(applyStarsBoost).toHaveBeenCalledTimes(1)
  })

  it('boost payant : seul confirmPaid est demandé (pas de double confirmation)', async () => {
    quoteStarsBoost.mockResolvedValue({ paid: 5 })
    const confirmFree = vi.fn()
    const confirmPaid = vi.fn().mockResolvedValue(true)
    await withStarsBoost({ entityType: 'listing', entityId: 'A', confirmFree, confirmPaid })
    expect(confirmPaid).toHaveBeenCalledTimes(1)
    expect(confirmFree).not.toHaveBeenCalled()
    expect(applyStarsBoost).toHaveBeenCalledTimes(1)
  })
})