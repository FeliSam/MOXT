import { describe, expect, it } from 'vitest'
import { mergeUnreadBy } from './mergeUnreadBy.js'

describe('mergeUnreadBy', () => {
  it('applique un zero distant (lu sur un autre appareil)', () => {
    expect(mergeUnreadBy({ u1: 0 }, { u1: 4 })).toEqual({ u1: 0 })
  })

  it('conserve le maximum si le distant signale des non lus', () => {
    expect(mergeUnreadBy({ u1: 3 }, { u1: 1 })).toEqual({ u1: 3 })
  })

  it('garde le local si la cle distante est absente', () => {
    expect(mergeUnreadBy({}, { u1: 2 })).toEqual({ u1: 2 })
  })
})
