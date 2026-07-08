import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  buildReviewPublicationIndex,
  getReviewPublication,
} from '@moxt/shared/utils/reviewPublicationResolver.js'

export function useReviewPublicationIndex() {
  const state = useSelector((root) => root)
  return useMemo(() => buildReviewPublicationIndex(state), [state])
}

export function useReviewPublication(review) {
  const index = useReviewPublicationIndex()
  return useMemo(() => getReviewPublication(index, review), [index, review])
}
