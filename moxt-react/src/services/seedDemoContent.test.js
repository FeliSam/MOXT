import { describe, expect, it } from 'vitest'
import { clearDemoContent, seedDemoContent } from './seedDemoContent'

describe('demo content seeding', () => {
  beforeEach(() => localStorage.clear())

  it('ne seed plus de contenu demo en local', () => {
    expect(seedDemoContent()).toBe(0)
    expect(seedDemoContent()).toBe(0)
  })

  it('supprime les entrees demo conservees dans le localStorage', () => {
    localStorage.setItem(
      'moxt-jobs-v1',
      JSON.stringify([{ id: 'JOB-USER' }, { id: 'JOB-DEMO-1' }]),
    )
    clearDemoContent()
    expect(JSON.parse(localStorage.getItem('moxt-jobs-v1'))).toEqual([{ id: 'JOB-USER' }])
  })
})
