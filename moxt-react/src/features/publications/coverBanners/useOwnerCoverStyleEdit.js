import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLanguage } from '../../../contexts/useLanguage'
import { storageService } from '../../../services/storageService'
import { updateAccountPreferences } from '../../account/accountSlice'
import { saveBusiness } from '../../businesses/businessSlice'
import { addToast } from '../../ui/uiSlice'
import {
  COVER_STYLE_LABELS_FR,
  DEFAULT_BUSINESS_COVER_STYLE,
  defaultCoverStyleForPersonal,
} from './coverBannerCatalog'

/**
 * Éditeur de bannière du propriétaire : ouverture + enregistrement du style
 * (business.coverStyle ou preferences.coverStyle).
 * `uploadPhoto` (entreprise uniquement) réutilise l’upload de bannière existant
 * (`storageService.uploadBusinessBanner`) puis enregistre `bannerUrl` ; null pour un profil perso
 * (pas de stockage de couverture perso aujourd’hui).
 */
export function useOwnerCoverStyleEdit({
  category = 'business',
  business = null,
  userId = null,
  gender = null,
  coverStyle = null,
} = {}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const value = useMemo(() => {
    if (category === 'business') {
      return coverStyle || business?.coverStyle || DEFAULT_BUSINESS_COVER_STYLE
    }
    return coverStyle || defaultCoverStyleForPersonal(gender)
  }, [business?.coverStyle, category, coverStyle, gender])

  const openEditor = useCallback(() => setOpen(true), [])
  const closeEditor = useCallback(() => setOpen(false), [])

  const onChange = useCallback(
    (styleId) => {
      if (!styleId) return
      if (category === 'business') {
        if (!business) return
        dispatch(saveBusiness({ ...business, coverStyle: styleId }))
        return
      }
      if (!userId) return
      dispatch(
        updateAccountPreferences({
          userId,
          preferences: { coverStyle: styleId },
        }),
      )
    },
    [business, category, dispatch, userId],
  )

  const ownerId = business?.ownerId || userId
  const uploadPhoto = useMemo(() => {
    if (category !== 'business' || !business?.id || !ownerId) return null
    return async (file, { onProgress } = {}) => {
      try {
        const url = await storageService.uploadBusinessBanner(ownerId, business.id, file, {
          onProgress,
        })
        // Le toast « Entreprise enregistrée » est déjà émis par l’interaction middleware.
        dispatch(saveBusiness({ ...business, bannerUrl: url }))
        return url
      } catch (err) {
        dispatch(
          addToast({
            title: t('profile.bannerEditor.photoFailTitle'),
            message: err?.message || t('profile.bannerEditor.photoFailBody'),
            tone: 'error',
          }),
        )
        throw err
      }
    }
  }, [business, category, dispatch, ownerId, t])

  return {
    open,
    openEditor,
    closeEditor,
    value,
    onChange,
    uploadPhoto,
    labels: COVER_STYLE_LABELS_FR,
    category,
    gender,
  }
}
