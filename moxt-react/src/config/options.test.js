import { describe, expect, it } from 'vitest'
import {
  BUSINESS_SERVICES,
  COUNTRIES,
  CURRENCIES,
  EVENT_CATEGORIES,
  JOB_CONTRACTS,
  LISTING_TYPES,
  SUPPORT_PRIORITIES,
} from './options'

describe('configuration des options', () => {
  it.each(
    [
      COUNTRIES,
      CURRENCIES,
      BUSINESS_SERVICES,
      LISTING_TYPES,
      JOB_CONTRACTS,
      EVENT_CATEGORIES,
      SUPPORT_PRIORITIES,
    ].map((options) => [options]),
  )('ne contient aucune valeur dupliquee', (options) => {
    const values = options.map((option) => option.value)
    expect(new Set(values).size).toBe(values.length)
  })
})
