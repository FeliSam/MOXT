import { describe, expect, it } from 'vitest'
import reducer, { addToast } from './uiSlice'

describe('uiSlice toasts', () => {
  it('utilise un ton informatif par défaut', () => {
    const state = reducer(undefined, addToast({ title: 'Information', message: 'Message' }))

    expect(state.toasts[0]).toMatchObject({
      title: 'Information',
      message: 'Message',
      tone: 'info',
    })
  })

  it('évite les notifications identiques affichées simultanément', () => {
    const action = addToast({ title: 'Enregistré', message: 'Action terminée', tone: 'success' })
    const firstState = reducer(undefined, action)
    const secondState = reducer(firstState, addToast(action.payload))

    expect(secondState.toasts).toHaveLength(1)
  })
})
