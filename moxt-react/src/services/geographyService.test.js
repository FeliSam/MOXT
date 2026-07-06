import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAfricanOriginCountries, getRussianCities } from './geographyService'

describe('geographyService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('utilise la liste africaine locale lorsque le reseau est indisponible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const countries = await getAfricanOriginCountries()
    expect(countries.some((item) => item.code === 'BJ')).toBe(true)
    expect(countries.some((item) => item.code === 'NG')).toBe(true)
    expect(countries.some((item) => item.code === 'GH')).toBe(true)
  })

  it('utilise les villes russes locales lorsque le reseau est indisponible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const cities = await getRussianCities()
    expect(cities).toContain('Moscou')
    expect(cities).toContain('Kazan')
  })
})
