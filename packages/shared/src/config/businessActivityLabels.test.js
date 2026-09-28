import { describe, expect, it } from 'vitest'
import { businessActivityLabel } from './businessActivityLabels.js'

describe('businessActivityLabel', () => {
  it('traduit les valeurs web et garde les inconnues', () => {
    expect(businessActivityLabel('transfer')).toBe('Transfert')
    expect(businessActivityLabel('commerce')).toBe('Commerce et marketplace')
    expect(businessActivityLabel('autre')).toBe('autre')
    expect(businessActivityLabel(null)).toBe('')
  })
})
