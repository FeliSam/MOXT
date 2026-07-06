import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const builder = {
    upsert: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
  }
  return {
    builder,
    from: vi.fn(() => builder),
  }
})

vi.mock('../../services/supabaseClient', () => ({
  supabase: { from: mocks.from },
}))

const { saveListingRemote } = await import('./marketplaceRemote')

describe('marketplaceRemote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.builder.upsert.mockReturnValue(mocks.builder)
    mocks.builder.select.mockReturnValue(mocks.builder)
  })

  it('réessaie sans payload avec un ancien schéma Supabase', async () => {
    mocks.builder.single
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST204',
          message: "Could not find the 'payload' column of 'listings' in the schema cache",
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'ANN-1',
          owner_id: 'user-1',
          title: 'Téléphone',
          status: 'active',
        },
        error: null,
      })

    const saved = await saveListingRemote({
      id: 'ANN-1',
      ownerId: 'user-1',
      title: 'Téléphone',
      description: 'Annonce complète',
      status: 'active',
      images: [],
    })

    expect(mocks.builder.upsert).toHaveBeenCalledTimes(2)
    expect(mocks.builder.upsert.mock.calls[0][0]).toHaveProperty('payload')
    expect(mocks.builder.upsert.mock.calls[1][0]).not.toHaveProperty('payload')
    expect(saved.description).toBe('Annonce complète')
    expect(saved.ownerId).toBe('user-1')
  })
})
