import { describe, expect, it } from 'vitest'
import { shouldPreserveLocalStatuses } from './statusSync.js'

describe('shouldPreserveLocalStatuses', () => {
  it('conserve le rail local si le réseau renvoie une liste vide', () => {
    expect(shouldPreserveLocalStatuses([], [{ id: 'st-1' }])).toBe(true)
  })

  it('accepte un fetch vide sur un pull forcé', () => {
    expect(shouldPreserveLocalStatuses([], [{ id: 'st-1' }], { force: true })).toBe(false)
  })

  it('remplace dès qu’il y a des lignes distantes', () => {
    expect(shouldPreserveLocalStatuses([{ id: 'st-2' }], [{ id: 'st-1' }])).toBe(false)
  })
})
