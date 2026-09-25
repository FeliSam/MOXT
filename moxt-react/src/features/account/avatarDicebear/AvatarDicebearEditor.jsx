import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import {
  LuCamera,
  LuCheck,
  LuChevronRight,
  LuImage,
  LuPenTool,
  LuSparkles,
  LuX,
} from 'react-icons/lu'
import { useDispatch, useSelector } from 'react-redux'
import { Modal } from '../../../components/ui/Modal'
import { UploadProgress } from '../../../components/ui/UploadProgress'
import { useLanguage } from '../../../contexts/useLanguage'
import { useUploadProgress } from '../../../hooks/useUploadProgress'
import { storageService } from '../../../services/storageService'
import { setUser, updateProfile } from '../../auth/authSlice'
import { useAvatarModule } from '../../platform/useAvatarModule'
import { addToast } from '../../ui/uiSlice'
import { updateAccountPreferences } from '../accountSlice'
import './avatarEditor.css'
import { AvatarPreviewRing } from './AvatarPreviewRing'
import { promptDonePreferences } from './avatarPrompt'
import { MoxtMark, Segmented } from './editorParts'
import { initialAvatarStyle } from './editorUtils'
import {
  loreleiOptionsKey,
  preferencesToLoreleiOptions,
  randomizeLoreleiOptions,
} from './loreleiOptions'
import { PortraitControls } from './PortraitControls'
import {
  findPortrait,
  initialPortraitChoice,
  portraitChoiceKey,
  randomPortraitChoice,
} from './portraitOptions'
import { profileDetailsFromUser, saveDicebearAvatar } from './saveDicebearAvatar'
import { savePortraitAvatar } from './savePortraitAvatar'

// DiceBear n’est chargé que si l’utilisateur ouvre le style « Illustré ».
const LoreleiControls = lazy(() => import('./LoreleiControls.jsx'))

/** Aperçu Lorelei calculé à la demande (import dynamique de DiceBear). */
function useLoreleiPreview(options, active) {
  const key = active ? loreleiOptionsKey(options) : ''
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (!active) return undefined
    let cancelled = false
    import('./createLoreleiAvatar.js')
      .then((mod) => {
        if (!cancelled) setSrc(mod.loreleiSvgDataUri(options, { size: 360 }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active])
  return active ? src : ''
}

function PanelFallback() {
  return <div className="ave-panel h-48 animate-pulse rounded-[1.4rem]" aria-hidden="true" />
}

/**
 * Éditeur d’avatar Moxt — deux styles :
 * « Portrait » (défaut) : bibliothèque de 60 portraits photoréalistes sur le CDN
 *   → profiles.avatar_url = URL du portrait, sans upload ;
 * « Illustré » : DiceBear Lorelei rendu localement → PNG → Yandex (media-api).
 * UI « light editorial » (thème clair) / « dark glass » (thème sombre).
 */
export function AvatarDicebearEditor({ open = true, onClose, onChoosePhoto, onSaved }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const tx = (key, vars) => t(`profile.avatarEditor.${key}`, vars)
  const user = useSelector((state) => state.auth.user)
  const prefs = useSelector((state) => (user?.id ? state.account.preferences?.[user.id] : null))
  // Styles, style par défaut et lien photo pilotés par le module Avatar de l’admin.
  const avatarModule = useAvatarModule()
  const [pickedStyle, setStyle] = useState(() =>
    initialAvatarStyle({
      prefs,
      avatarUrl: user?.avatarUrl,
      defaultStyle: avatarModule.defaultStyle,
      styles: avatarModule.styles,
    }),
  )
  // Style désactivé entre-temps par l’admin → style par défaut (toujours parmi les actifs).
  const style = avatarModule.styles.includes(pickedStyle) ? pickedStyle : avatarModule.defaultStyle
  const [choice, setChoice] = useState(() =>
    initialPortraitChoice({
      prefs: prefs?.avatarPortrait,
      avatarUrl: user?.avatarUrl,
      userId: user?.id,
    }),
  )
  const [options, setOptions] = useState(() =>
    preferencesToLoreleiOptions(prefs?.avatarDicebear, user?.id),
  )
  const [initialLoreleiKey] = useState(() => loreleiOptionsKey(options))
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef(null)
  const { progress, track } = useUploadProgress()
  const loreleiPreview = useLoreleiPreview(options, style === 'lorelei')

  if (!user || !avatarModule.editorAvailable) return null

  const busy = saving || photoUploading
  const portrait = findPortrait(choice)
  const currentBase = String(user.avatarUrl || '').split('?')[0]
  const loreleiApplied = Boolean(
    prefs?.avatarDicebear?.avatarUrl &&
    user.avatarUrl &&
    prefs.avatarDicebear.avatarUrl === user.avatarUrl,
  )
  const dirty =
    style === 'portrait'
      ? Boolean(portrait) && currentBase !== portrait.url
      : loreleiOptionsKey(options) !== initialLoreleiKey || !loreleiApplied
  const previewSrc = style === 'portrait' ? portrait?.url : loreleiPreview

  const close = () => {
    if (!busy) onClose?.()
  }

  function savePreferences(patch) {
    dispatch(
      updateAccountPreferences({
        userId: user.id,
        preferences: { ...patch, ...promptDonePreferences(user.id, prefs?.avatarPrompt) },
      }),
    )
  }

  async function persistProfile(details) {
    const result = await dispatch(updateProfile(details))
    if (updateProfile.fulfilled.match(result)) return true
    dispatch(setUser({ ...user, avatarUrl: details.avatarUrl }))
    return false
  }

  async function saveCurrentStyle() {
    if (style === 'portrait') {
      return savePortraitAvatar({
        user,
        choice,
        persistProfile,
        persistPreferences: async (avatarPortrait) => {
          savePreferences({ avatarPortrait, avatarStyle: 'portrait' })
        },
      })
    }
    const { loreleiToPngFile } = await import('./createLoreleiAvatar.js')
    return track((onProgress) =>
      saveDicebearAvatar({
        user,
        options,
        onProgress,
        renderPng: (opts) => loreleiToPngFile(opts, { size: 512 }),
        // Chemin dédié (avatars/{id}/lorelei.png) : l’avatar illustré reste reconnaissable (badge).
        uploadAvatar: (userId, file, extra) =>
          storageService.uploadAvatar(userId, file, { ...extra, name: 'lorelei' }),
        persistProfile,
        persistPreferences: async (avatarDicebear) => {
          savePreferences({ avatarDicebear, avatarStyle: 'lorelei' })
        },
      }),
    )
  }

  async function handleSave() {
    if (busy || !dirty) return
    setSaving(true)
    try {
      const result = await saveCurrentStyle()
      dispatch(
        addToast({
          title: tx('toastSavedTitle'),
          message: result.saved
            ? tx('toastSavedBody')
            : t('profile.personal.toastAvatarSaveFailBody'),
          tone: result.saved ? 'success' : 'warning',
        }),
      )
      onSaved?.(result.avatarUrl)
      onClose?.()
    } catch (err) {
      dispatch(
        addToast({
          title: tx('toastFailTitle'),
          message: err?.message || tx('toastFailBody'),
          tone: 'error',
        }),
      )
    } finally {
      setSaving(false)
    }
  }

  function handleRandom() {
    if (style === 'lorelei') {
      setOptions((prev) => randomizeLoreleiOptions(prev))
      return
    }
    setChoice((prev) => {
      // Toujours un portrait différent de l’actuel.
      for (let i = 0; i < 8; i += 1) {
        const next = randomPortraitChoice()
        if (portraitChoiceKey(next) !== portraitChoiceKey(prev)) return next
      }
      return prev
    })
  }

  function handlePhotoInstead() {
    if (busy) return
    if (onChoosePhoto) {
      // Clic synchrone : le sélecteur de fichier reste un geste utilisateur.
      onChoosePhoto()
      onClose?.()
      return
    }
    photoInputRef.current?.click()
  }

  async function handlePhotoFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoUploading(true)
    try {
      const url = await track((onProgress) =>
        storageService.uploadAvatar(user.id, file, { onProgress }),
      )
      const saved = await persistProfile(profileDetailsFromUser(user, { avatarUrl: url }))
      savePreferences({ avatarStyle: 'photo' })
      dispatch(
        addToast({
          title: t('profile.personal.toastAvatarTitle'),
          message: saved
            ? t('profile.personal.toastAvatarBody')
            : t('profile.personal.toastAvatarSaveFailBody'),
          tone: saved ? 'success' : 'warning',
        }),
      )
      onSaved?.(url)
      onClose?.()
    } catch (err) {
      dispatch(
        addToast({
          title: t('profile.personal.toastUploadFailTitle'),
          message: err?.message || t('profile.personal.toastUploadFailBody'),
          tone: 'error',
        }),
      )
    } finally {
      setPhotoUploading(false)
    }
  }

  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const showProgress = progress.active || progress.phase === 'error'

  return (
    <Modal
      open={open}
      onClose={close}
      title={tx('title')}
      bare
      panelClassName="ave-root flex h-[100dvh] w-full flex-col overflow-hidden sm:h-auto sm:max-h-[min(92dvh,56rem)] sm:max-w-xl sm:rounded-[2rem] lg:max-w-[66rem]"
    >
      {/* En-tête : marque + fermeture */}
      <header className="relative z-10 grid flex-none grid-cols-[2.5rem_1fr_2.5rem] items-center px-4 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
        <span aria-hidden="true" />
        <p className="ave-brand flex items-center justify-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.42em] lg:justify-start">
          <MoxtMark className="size-5" />
          <span className="-mr-[0.42em]">Moxt</span>
        </p>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          aria-label={t('common.close')}
          title={tx('cancel')}
          className="ave-iconbtn grid size-10 place-items-center rounded-full disabled:opacity-50"
        >
          <LuX aria-hidden="true" className="size-[1.1rem]" />
        </button>
      </header>

      {/* Zone défilante : la barre d’actions est hors flux défilant → ne recouvre jamais le contenu */}
      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:px-10 lg:pb-8">
        {/* Aperçu */}
        <div className="flex flex-col items-center pt-2 lg:sticky lg:top-0 lg:self-start lg:pt-4">
          <div className="text-center">
            <h2 className="ave-serif ave-title text-[2.05rem] leading-[1.05] sm:text-[2.5rem] lg:text-[3rem]">
              {tx('displayTitle')}
            </h2>
            <div aria-hidden="true" className="ave-rule mx-auto mt-3" />
            <p className="ave-muted mt-2.5 text-[0.82rem]">{tx('tagline')}</p>
          </div>

          <AvatarPreviewRing src={previewSrc} alt={tx('previewAlt')} className="mt-6" />
          {displayName ? (
            <p className="ave-serif ave-title relative mt-4 text-lg">{displayName}</p>
          ) : null}
        </div>

        {/* Réglages */}
        <div className="mt-5 grid min-w-0 content-start gap-3 lg:mt-4">
          {avatarModule.styles.length > 1 ? (
            <Segmented
              label={tx('styleAria')}
              value={style}
              onChange={setStyle}
              options={[
                { id: 'portrait', label: tx('stylePortrait'), icon: LuCamera },
                { id: 'lorelei', label: tx('styleIllustrated'), icon: LuPenTool },
              ].filter((option) => avatarModule.styles.includes(option.id))}
            />
          ) : null}
          {style === 'portrait' ? (
            <PortraitControls choice={choice} onChange={setChoice} />
          ) : (
            <Suspense fallback={<PanelFallback />}>
              <LoreleiControls options={options} onChange={setOptions} />
            </Suspense>
          )}
        </div>
      </div>

      {/* Barre d’actions verre (safe-area iOS) */}
      <footer className="ave-bar relative z-10 flex-none px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5">
        <div className="mx-auto max-w-md">
          {showProgress ? (
            <UploadProgress progress={progress} compact className="mb-2.5 w-full" />
          ) : null}
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={handleRandom}
              className="ave-btn ave-btn-secondary inline-flex h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-2xl px-3 text-[0.92rem] font-semibold"
            >
              <LuSparkles aria-hidden="true" className="size-[1.1rem] shrink-0" />
              <span className="truncate">{tx('random')}</span>
            </button>
            <button
              type="button"
              disabled={busy || !dirty}
              aria-busy={saving || undefined}
              onClick={() => void handleSave()}
              className="ave-btn ave-btn-primary inline-flex h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-2xl px-4 text-[0.95rem] font-semibold"
            >
              {saving ? (
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              ) : (
                <LuCheck aria-hidden="true" strokeWidth={2.75} className="size-[1.1rem] shrink-0" />
              )}
              <span className="truncate">{saving ? tx('saving') : tx('save')}</span>
            </button>
          </div>
          {avatarModule.photoEnabled ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handlePhotoInstead}
                className="ave-link mx-auto mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.8rem] font-medium disabled:opacity-50"
              >
                <LuImage aria-hidden="true" className="size-4" />
                {tx('photoInstead')}
                <LuChevronRight aria-hidden="true" className="size-3.5" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={handlePhotoFile}
              />
            </>
          ) : null}
        </div>
      </footer>
    </Modal>
  )
}

export default AvatarDicebearEditor
