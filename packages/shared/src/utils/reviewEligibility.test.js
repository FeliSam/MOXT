import { describe, expect, it } from 'vitest'
import { hasReviewEligibility } from './reviewEligibility.js'
import { REVIEW_TARGET_TYPES } from './reviewUtils.js'

describe('reviewEligibility', () => {
  it('refuse un avis sur son propre profil', () => {
    const result = hasReviewEligibility(
      {},
      'u1',
      REVIEW_TARGET_TYPES.USER_PROFILE,
      'u1',
    )
    expect(result.allowed).toBe(false)
  })

  it('autorise un avis après message partagé', () => {
    const state = {
      communications: {
        conversations: [{ participantIds: ['u1', 'u2'] }],
      },
    }
    const result = hasReviewEligibility(
      state,
      'u1',
      REVIEW_TARGET_TYPES.USER_PROFILE,
      'u2',
    )
    expect(result.allowed).toBe(true)
  })

  it('autorise un avis job pour un candidat', () => {
    const state = {
      jobs: {
        applications: [{ jobId: 'job-1', userId: 'u1', status: 'submitted' }],
        items: [],
      },
    }
    const result = hasReviewEligibility(state, 'u1', REVIEW_TARGET_TYPES.JOB, 'job-1')
    expect(result.allowed).toBe(true)
  })
})
