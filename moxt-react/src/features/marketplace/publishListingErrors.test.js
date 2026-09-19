import { describe, expect, it } from 'vitest'
import { publishListingErrorMessage, usableErrorMessage } from './publishListingErrors'

describe('publishListingErrorMessage', () => {
  it('prefers rejectWithValue payload over RTK "Rejected"', () => {
    expect(
      publishListingErrorMessage(
        { payload: "La colonne listings.payload manque encore dans Supabase.", error: { message: 'Rejected' } },
        'fallback',
      ),
    ).toBe("La colonne listings.payload manque encore dans Supabase.")
  })

  it('ignores literal Rejected payload and falls back', () => {
    expect(
      publishListingErrorMessage({ payload: 'Rejected', error: { message: 'Rejected' } }, 'fallback'),
    ).toBe('fallback')
  })

  it('uses non-Rejected error.message when payload missing', () => {
    expect(
      publishListingErrorMessage({ error: { message: 'Upload Yandex réseau' } }, 'fallback'),
    ).toBe('Upload Yandex réseau')
  })
})

describe('usableErrorMessage', () => {
  it('hides RTK Rejected', () => {
    expect(usableErrorMessage(new Error('Rejected'), 'Réessayez.')).toBe('Réessayez.')
  })

  it('keeps real messages', () => {
    expect(usableErrorMessage(new Error('Supabase non configuré.'), 'Réessayez.')).toBe(
      'Supabase non configuré.',
    )
  })
})
