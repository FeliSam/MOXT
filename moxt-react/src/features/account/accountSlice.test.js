import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  addPersonalDocument,
  hydrateAccountPreferences,
  markListingViewed,
  removeTransferProfile,
  requestAccountDeletion,
  saveTransferProfile,
  submitVerificationRequest,
  toggleAccountFavorite,
  updateAccountPreferences,
  updateVerificationStatus,
} from './accountSlice'

const emptyState = {
  favorites: [],
  transferProfiles: [],
  documents: [],
  verificationRequests: [],
  preferences: {},
  deletionRequests: [],
  viewedListings: [],
}

describe('account', () => {
  beforeEach(() => localStorage.clear())

  it('ajoute puis retire un favori générique', () => {
    const action = toggleAccountFavorite({
      userId: 'u1',
      relatedType: 'job',
      relatedId: 'j1',
      title: 'Job',
      path: '/jobs/j1',
    })
    const added = reducer(emptyState, action)
    expect(added.favorites).toHaveLength(1)
    expect(reducer(added, action).favorites).toHaveLength(0)
  })

  it('enregistre puis retire un profil favori de transfert', () => {
    const added = reducer(
      emptyState,
      saveTransferProfile({
        userId: 'u1',
        firstName: 'Amina',
        lastName: 'Demo',
        phone: '+22901000000',
        country: 'BJ',
        method: 'MTN MoMo',
      }),
    )
    expect(added.transferProfiles[0]).toMatchObject({
      userId: 'u1',
      country: 'BJ',
      method: 'MTN MoMo',
    })
    const removed = reducer(
      added,
      removeTransferProfile({ id: added.transferProfiles[0].id, userId: 'u1' }),
    )
    expect(removed.transferProfiles).toHaveLength(0)
  })

  it('ne conserve que les métadonnées du document', () => {
    const state = reducer(
      emptyState,
      addPersonalDocument({
        userId: 'u1',
        category: 'identity',
        name: 'identite.pdf',
        size: 42,
        type: 'application/pdf',
      }),
    )
    expect(state.documents[0]).toMatchObject({ name: 'identite.pdf', size: 42 })
    expect(state.documents[0].content).toBeUndefined()
  })

  it('met à jour les préférences et évite les suppressions en double', () => {
    const preferred = reducer(
      emptyState,
      updateAccountPreferences({ userId: 'u1', preferences: { language: 'ru' } }),
    )
    expect(preferred.preferences.u1.language).toBe('ru')
    const first = reducer(preferred, requestAccountDeletion({ userId: 'u1' }))
    const second = reducer(first, requestAccountDeletion({ userId: 'u1' }))
    expect(second.deletionRequests).toHaveLength(1)
  })

  it('hydrate la langue distante et n’invente pas language si absente du profil', () => {
    const withRemoteLanguage = reducer(
      emptyState,
      hydrateAccountPreferences({
        userId: 'u1',
        fromRemote: true,
        preferences: { language: 'en', emailNotifications: false },
      }),
    )
    expect(withRemoteLanguage.preferences.u1.language).toBe('en')
    expect(withRemoteLanguage.preferences.u1.emailNotifications).toBe(false)

    const withoutRemoteLanguage = reducer(
      withRemoteLanguage,
      hydrateAccountPreferences({
        userId: 'u1',
        fromRemote: true,
        preferences: { pushNotifications: false },
      }),
    )
    expect(withoutRemoteLanguage.preferences.u1.language).toBeUndefined()
    expect(withoutRemoteLanguage.preferences.u1.pushNotifications).toBe(false)
  })

  it('remplace la demande de vérification en attente', () => {
    const first = reducer(
      emptyState,
      submitVerificationRequest({ userId: 'u1', level: 'identity', documentIds: ['d1'] }),
    )
    const second = reducer(
      first,
      submitVerificationRequest({ userId: 'u1', level: 'enhanced', documentIds: ['d1', 'd2'] }),
    )
    expect(second.verificationRequests).toHaveLength(1)
    expect(second.verificationRequests[0].level).toBe('enhanced')
  })

  it('mémorise une annonce vue sans doublon', () => {
    const first = reducer(
      emptyState,
      markListingViewed({ userId: 'u1', listingId: 'lst-1' }),
    )
    expect(first.viewedListings).toHaveLength(1)
    expect(first.viewedListings[0]).toMatchObject({ userId: 'u1', listingId: 'lst-1' })
    const again = reducer(first, markListingViewed({ userId: 'u1', listingId: 'lst-1' }))
    expect(again.viewedListings).toHaveLength(1)
  })

  it('propage la validation KYC aux personal_documents liés', () => {
    const withDocs = {
      ...emptyState,
      documents: [
        {
          id: 'd1',
          userId: 'u1',
          category: 'identity',
          status: 'pending_review',
        },
        {
          id: 'd2',
          userId: 'u1',
          category: 'income',
          status: 'pending_review',
        },
        {
          id: 'd3',
          userId: 'u2',
          category: 'identity',
          status: 'pending_review',
        },
      ],
      verificationRequests: [
        {
          id: 'ver1',
          userId: 'u1',
          documentIds: ['d1'],
          status: 'pending_review',
        },
      ],
    }
    const next = reducer(
      withDocs,
      updateVerificationStatus({ id: 'ver1', status: 'verified', reviewedBy: 'admin' }),
    )
    expect(next.verificationRequests[0].status).toBe('verified')
    expect(next.documents.find((d) => d.id === 'd1').status).toBe('verified')
    expect(next.documents.find((d) => d.id === 'd2').status).toBe('pending_review')
    expect(next.documents.find((d) => d.id === 'd3').status).toBe('pending_review')
  })
})
