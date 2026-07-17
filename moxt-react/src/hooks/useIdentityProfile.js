import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  addIdentityProfile,
  removeIdentityProfile,
  updateIdentityProfile,
} from '../features/identity/identitySlice'
import { selectIdentityProfilesByUser } from '../features/addresses/addressesSelectors'
import { useLanguage } from '../contexts/useLanguage'
import { validateIdentityFields, validatePassport } from '../types/contactsValidation'

function emptyIdentity() {
  return {
    firstNames: '',
    lastName: '',
    companyName: '',
    contactName: '',
    idType: 'PASSEPORT',
    passportNumber: '',
    issuedBy: '',
    issuedAt: '',
    expiresAt: '',
    scanMeta: null,
  }
}

export function useIdentityProfile(userId) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const profiles = useSelector((state) => selectIdentityProfilesByUser(state, userId))

  const saveProfile = useCallback(
    (payload) => {
      if (!userId) {
        const translated = t('validation.identity.userRequired')
        return {
          ok: false,
          errors: {
            form:
              translated && translated !== 'validation.identity.userRequired'
                ? translated
                : 'Utilisateur requis.',
          },
        }
      }
      const variant = payload.ownerType === 'COMPANY' ? 'company' : 'person'
      const errors = validateIdentityFields(payload.identity, variant, t)
      if (Object.keys(errors).length) return { ok: false, errors }

      const passport = validatePassport(payload.identity.passportNumber, t)
      const identity = {
        ...payload.identity,
        passportNumber: passport.normalized || payload.identity.passportNumber,
      }

      if (payload.id) {
        dispatch(updateIdentityProfile({ id: payload.id, ownerType: payload.ownerType, identity }))
        return { ok: true, id: payload.id }
      }

      const action = dispatch(
        addIdentityProfile({ userId, ownerType: payload.ownerType, identity }),
      )
      return { ok: true, id: action.payload.id }
    },
    [dispatch, t, userId],
  )

  const deleteProfile = useCallback(
    (id) => {
      dispatch(removeIdentityProfile(id))
    },
    [dispatch],
  )

  return useMemo(
    () => ({
      profiles,
      emptyIdentity,
      saveProfile,
      deleteProfile,
    }),
    [profiles, saveProfile, deleteProfile],
  )
}
