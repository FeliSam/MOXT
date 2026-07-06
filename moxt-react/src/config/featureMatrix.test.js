import { describe, expect, it } from 'vitest'
import { FEATURE_MATRIX, FEATURE_STATUS_META, featureMatrixSummary } from './featureMatrix'

describe('feature matrix', () => {
  it('utilise des identifiants uniques et des statuts connus', () => {
    const features = FEATURE_MATRIX.flatMap((section) => section.features)
    expect(new Set(features.map((feature) => feature.id)).size).toBe(features.length)
    features.forEach((feature) => expect(FEATURE_STATUS_META[feature.status]).toBeDefined())
  })

  it('calcule le résumé', () => {
    const summary = featureMatrixSummary()
    expect(summary.total).toBe(summary.complete + summary.partial + summary.planned)
  })
})
