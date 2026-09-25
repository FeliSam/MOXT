import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateAccountPreferences } from '../../account/accountSlice'
import { saveBusiness } from '../../businesses/businessSlice'
import {
  COVER_STYLE_LABELS_FR,
  DEFAULT_BUSINESS_COVER_STYLE,
  defaultCoverStyleForPersonal,
} from './coverBannerCatalog'

/**
 * Owner cover-style editor: open sheet + persist to business.payload or preferences.
 */
export function useOwnerCoverStyleEdit({
  category = 'business',
  business = null,
  userId = null,
  gender = null,
  coverStyle = null,
} = {}) {
  const dispatch = useDispatch()
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

  return {
    open,
    openEditor,
    closeEditor,
    value,
    onChange,
    labels: COVER_STYLE_LABELS_FR,
    category,
    gender,
  }
}
