import { describe, expect, it } from 'vitest'
import { countAvailableBrowseParcels } from './parcelUtils'

describe('countAvailableBrowseParcels', () => {
  const today = '2026-09-10'

  it('compte les trajets actifs avec kilos restants', () => {
    expect(
      countAvailableBrowseParcels(
        [
          { id: '1', status: 'active', remainingKg: 8, departureDate: '2026-09-20' },
          { id: '2', status: 'full', remainingKg: 0, departureDate: '2026-09-20' },
          { id: '3', status: 'completed', remainingKg: 4, departureDate: '2026-09-20' },
          { id: '4', status: 'active', remainingKg: 2, departureDate: '2026-09-01' },
        ],
        today,
      ),
    ).toBe(1)
  })
})
