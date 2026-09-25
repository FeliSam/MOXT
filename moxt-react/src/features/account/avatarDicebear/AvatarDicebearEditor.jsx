import { useMemo, useRef, useState } from 'react'
import { FiCamera, FiCheck, FiShuffle } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { UploadProgress } from '../../../components/ui/UploadProgress'
import { useLanguage } from '../../../contexts/useLanguage'
import { useUploadProgress } from '../../../hooks/useUploadProgress'
import { storageService } from '../../../services/storageService'
import { setUser, updateProfile } from '../../auth/authSlice'
import { addToast } from '../../ui/uiSlice'
import { updateAccountPreferences } from '../accountSlice'
import { loreleiSvgDataUri, loreleiToPngFile } from './createLoreleiAvatar'
import {
  BACKGROUND_COLORS,
  EARRINGS_VARIANTS,
  EYE_VARIANTS,
  GLASSES_VARIANTS,
  HAIR_COLORS,
  HAIR_VARIANTS,
  SKIN_COLORS,
  loreleiOptionsKey,
  preferencesToLoreleiOptions,
  randomizeLoreleiOptions,
} from './loreleiOptions'
import { profileDetailsFromUser, saveDicebearAvatar } from './saveDicebearAvatar'

const PANEL =
  'rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-xl'

function SectionLabel({ children, hint }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">
        {children}
      </h3>
      {hint ? <span className="text-xs text-[var(--app-text-muted)]">{hint}</span> : null}
    </div>
  )
}

function Swatch({ color, selected, label, onSelect }) {
  const transparent = color === 'transparent'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`relative size-9 shrink-0 rounded-full border transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-surface)] ${
        selected
          ? 'scale-105 border-transparent ring-2 ring-[var(--app-accent)] ring-offset-2 ring-offset-[var(--app-surface)] dark:ring-[var(--app-teal)]'
          : 'border-black/10 dark:border-white/15'
      }`}
      style={
        transparent
          ? {
              backgroundImage:
                'linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%),linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0,5px 5px',
              backgroundColor: '#fafafa',
            }
          : { backgroundColor: `#${color}` }
      }
    >
      {selected ? (
        <FiCheck
          aria-hidden="true"
          className="absolute inset-0 m-auto size-4 text-white mix-blend-difference"
        />
      ) : null}
    </button>
  )
}

function SwatchRow({ colors, value, onChange, labelFor }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2.5">
      {colors.map((color, index) => (
        <Swatch
          key={color}
          color={color}
          selected={value === color}
          label={labelFor(color, index)}
          onSelect={() => onChange(color)}
        />
      ))}
    </div>
  )
}

function Thumb({ src, selected, label, onSelect, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`grid aspect-square place-items-center overflow-hidden rounded-2xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] ${
        selected
          ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] shadow-sm dark:border-[var(--app-teal)] dark:bg-white/10'
          : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] hover:border-[var(--app-border-md)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]'
      }`}
    >
      {src ? <img src={src} alt="" className="size-full object-contain" draggable="false" /> : children}
    </button>
  )
}

function ThumbGrid({ children }) {
  return (
    <div role="radiogroup" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {children}
    </div>
  )
}

function useThumbs(options, field, variants, extra = {}) {
  const key = loreleiOptionsKey(options)
  return useMemo(
    () =>
      variants.map((variant) => ({
        variant,
        src: loreleiSvgDataUri(
          { ...options, ...extra, [field]: variant, backgroundColor: 'transparent' },
          { size: 72 },
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, field, variants],
  )
}

/**
 * Éditeur d’avatar Lorelei (DiceBear 9, rendu local) — éditorial clair / verre sombre
 * selon le thème de l’app. Enregistrer : PNG → Yandex (media-api) → profiles.avatar_url.
 */
export function AvatarDicebearEditor({ open = true, onClose, onChoosePhoto, onSaved }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const tx = (key, vars) => t(`profile.avatarEditor.${key}`, vars)
  const user = useSelector((state) => state.auth.user)
  const storedPrefs = useSelector((state) =>
    user?.id ? state.account.preferences?.[user.id]?.avatarDicebear : null,
  )
  const [options, setOptions] = useState(() => preferencesToLoreleiOptions(storedPrefs, user?.id))
  const [initialKey] = useState(() => loreleiOptionsKey(options))
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef(null)
  const { progress, track } = useUploadProgress()

  const busy = saving || photoUploading
  const alreadyApplied = Boolean(
    storedPrefs?.avatarUrl && user?.avatarUrl && storedPrefs.avatarUrl === user.avatarUrl,
  )
  const dirty = loreleiOptionsKey(options) !== initialKey || !alreadyApplied
  const optionsKey = loreleiOptionsKey(options)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewSrc = useMemo(() => loreleiSvgDataUri(options, { size: 320 }), [optionsKey])

  const hairThumbs = useThumbs(options, 'hair', HAIR_VARIANTS)
  const eyeThumbs = useThumbs(options, 'eyes', EYE_VARIANTS)
  const glassesThumbs = useThumbs(options, 'glasses', GLASSES_VARIANTS, { glassesOn: true })
  const earringThumbs = useThumbs(options, 'earrings', EARRINGS_VARIANTS, { earringsOn: true })

  const set = (patch) => setOptions((prev) => ({ ...prev, ...patch }))
  const numbered = (key) => (_value, index) => tx(key, { index: index + 1 })

  if (!user) return null

  async function persistProfile(details) {
    const result = await dispatch(updateProfile(details))
    if (updateProfile.fulfilled.match(result)) return true
    dispatch(setUser({ ...user, avatarUrl: details.avatarUrl }))
    return false
  }

  async function handleSave() {
    if (busy) return
    setSaving(true)
    try {
      const result = await track((onProgress) =>
        saveDicebearAvatar({
          user,
          options,
          onProgress,
          renderPng: (opts) => loreleiToPngFile(opts, { size: 512 }),
          uploadAvatar: (userId, file, extra) => storageService.uploadAvatar(userId, file, extra),
          persistProfile,
          persistPreferences: async (preferences) => {
            dispatch(updateAccountPreferences({ userId: user.id, preferences: { avatarDicebear: preferences } }))
          },
        }),
      )
      dispatch(
        addToast({
          title: tx('toastSavedTitle'),
          message: result.saved ? tx('toastSavedBody') : t('profile.personal.toastAvatarSaveFailBody'),
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
      const url = await track((onProgress) => storageService.uploadAvatar(user.id, file, { onProgress }))
      const saved = await persistProfile(profileDetailsFromUser(user, { avatarUrl: url }))
      dispatch(
        addToast({
          title: t('profile.personal.toastAvatarTitle'),
          message: saved ? t('profile.personal.toastAvatarBody') : t('profile.personal.toastAvatarSaveFailBody'),
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
    <Modal open={open} onClose={busy ? () => {} : onClose} size="wide" title={tx('title')}>
      <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* Aperçu — éditorial (clair) / verre (sombre) */}
        <aside className="lg:sticky lg:top-0 lg:self-start">
          <div
            className={`${PANEL} relative overflow-hidden text-center`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f4efe6] to-transparent dark:from-[var(--app-teal)]/15"
            />
            <p className="relative text-[0.65rem] font-black uppercase tracking-[0.22em] text-[var(--app-accent)] dark:text-[var(--app-teal)]">
              {tx('eyebrow')}
            </p>
            <div className="relative mx-auto mt-4 grid size-44 place-items-center rounded-full bg-[var(--app-surface)] p-1.5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] ring-1 ring-[var(--app-border)] sm:size-52 dark:bg-white/[0.06] dark:shadow-[0_18px_50px_-20px_rgba(18,191,163,0.45)] dark:ring-white/15">
              <img
                src={previewSrc}
                alt={tx('previewAlt')}
                className="size-full rounded-full object-cover"
                draggable="false"
              />
            </div>
            {displayName ? (
              <p className="relative mt-4 font-display text-lg font-extrabold tracking-[-0.01em] text-[var(--app-text)]">
                {displayName}
              </p>
            ) : null}
            <p className="relative mt-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
              {tx('subtitle')}
            </p>
            <div className="relative mt-4 grid gap-2">
              <Button
                variant="secondary"
                icon={FiShuffle}
                disabled={busy}
                onClick={() => setOptions((prev) => randomizeLoreleiOptions(prev))}
                className="w-full"
              >
                {tx('random')}
              </Button>
              <button
                type="button"
                disabled={busy}
                onClick={handlePhotoInstead}
                className="inline-flex items-center justify-center gap-2 py-1.5 text-sm font-semibold text-[var(--app-accent)] underline-offset-4 hover:underline disabled:opacity-50 dark:text-[var(--app-teal)]"
              >
                <FiCamera aria-hidden="true" />
                {tx('photoInstead')}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={handlePhotoFile}
              />
            </div>
          </div>
        </aside>

        {/* Réglages */}
        <div className="grid min-w-0 content-start gap-4">
          <section className={PANEL}>
            <SectionLabel>{tx('sectionSkin')}</SectionLabel>
            <SwatchRow
              colors={SKIN_COLORS}
              value={options.skinColor}
              onChange={(skinColor) => set({ skinColor })}
              labelFor={numbered('skinOption')}
            />
          </section>

          <section className={PANEL}>
            <SectionLabel>{tx('sectionHair')}</SectionLabel>
            <ThumbGrid>
              {hairThumbs.map(({ variant, src }, index) => (
                <Thumb
                  key={variant}
                  src={src}
                  selected={options.hair === variant}
                  label={tx('hairOption', { index: index + 1 })}
                  onSelect={() => set({ hair: variant })}
                />
              ))}
            </ThumbGrid>
            <div className="mt-4">
              <SectionLabel>{tx('sectionHairColor')}</SectionLabel>
              <SwatchRow
                colors={HAIR_COLORS}
                value={options.hairColor}
                onChange={(hairColor) => set({ hairColor })}
                labelFor={numbered('colorOption')}
              />
            </div>
          </section>

          <section className={PANEL}>
            <SectionLabel>{tx('sectionEyes')}</SectionLabel>
            <ThumbGrid>
              {eyeThumbs.map(({ variant, src }, index) => (
                <Thumb
                  key={variant}
                  src={src}
                  selected={options.eyes === variant}
                  label={tx('eyesOption', { index: index + 1 })}
                  onSelect={() => set({ eyes: variant })}
                />
              ))}
            </ThumbGrid>
          </section>

          <section className={PANEL}>
            <SectionLabel>{tx('sectionAccessories')}</SectionLabel>
            <p className="mb-2 text-sm font-semibold text-[var(--app-text)]">{tx('glasses')}</p>
            <ThumbGrid>
              <Thumb
                selected={!options.glassesOn}
                label={tx('none')}
                onSelect={() => set({ glassesOn: false })}
              >
                <span className="text-xs font-bold text-[var(--app-text-muted)]">{tx('none')}</span>
              </Thumb>
              {glassesThumbs.map(({ variant, src }, index) => (
                <Thumb
                  key={variant}
                  src={src}
                  selected={options.glassesOn && options.glasses === variant}
                  label={`${tx('glasses')} ${index + 1}`}
                  onSelect={() => set({ glassesOn: true, glasses: variant })}
                />
              ))}
            </ThumbGrid>
            <p className="mb-2 mt-4 text-sm font-semibold text-[var(--app-text)]">{tx('earrings')}</p>
            <ThumbGrid>
              <Thumb
                selected={!options.earringsOn}
                label={tx('none')}
                onSelect={() => set({ earringsOn: false })}
              >
                <span className="text-xs font-bold text-[var(--app-text-muted)]">{tx('none')}</span>
              </Thumb>
              {earringThumbs.map(({ variant, src }, index) => (
                <Thumb
                  key={variant}
                  src={src}
                  selected={options.earringsOn && options.earrings === variant}
                  label={`${tx('earrings')} ${index + 1}`}
                  onSelect={() => set({ earringsOn: true, earrings: variant })}
                />
              ))}
            </ThumbGrid>
          </section>

          <section className={PANEL}>
            <SectionLabel>{tx('sectionBackground')}</SectionLabel>
            <SwatchRow
              colors={BACKGROUND_COLORS}
              value={options.backgroundColor}
              onChange={(backgroundColor) => set({ backgroundColor })}
              labelFor={(color, index) =>
                color === 'transparent' ? tx('transparent') : tx('colorOption', { index: index + 1 })
              }
            />
          </section>
        </div>
      </div>

      <footer className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex flex-col gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)]/95 px-5 py-4 backdrop-blur-md sm:-mx-7 sm:-mb-7 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-white/10">
        <div className="min-w-0 flex-1">
          {showProgress ? (
            <UploadProgress progress={progress} compact className="w-full" />
          ) : (
            <p className="text-xs text-[var(--app-text-muted)]">{tx('cdnHint')}</p>
          )}
        </div>
        <div className="flex gap-2 sm:justify-end">
          <Button variant="ghost" disabled={busy} onClick={onClose} className="flex-1 sm:flex-none">
            {tx('cancel')}
          </Button>
          <Button
            icon={FiCheck}
            loading={saving}
            disabled={busy || !dirty}
            onClick={() => void handleSave()}
            className="flex-1 sm:flex-none"
          >
            {saving ? tx('saving') : tx('save')}
          </Button>
        </div>
      </footer>
    </Modal>
  )
}

export default AvatarDicebearEditor
