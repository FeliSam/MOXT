import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  LuCheck,
  LuChevronRight,
  LuDroplet,
  LuEye,
  LuGem,
  LuGlasses,
  LuImage,
  LuPalette,
  LuScissors,
  LuSmile,
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
import { addToast } from '../../ui/uiSlice'
import { updateAccountPreferences } from '../accountSlice'
import './avatarEditor.css'
import { AvatarPreviewRing } from './AvatarPreviewRing'
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

const TABS = [
  { id: 'face', icon: LuSmile, labelKey: 'tabFace' },
  { id: 'hair', icon: LuScissors, labelKey: 'tabHair' },
  { id: 'accessories', icon: LuGem, labelKey: 'tabAccessories' },
]

const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%),linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0,5px 5px',
  backgroundColor: '#fafafa',
}

/** Couleur claire → coche foncée (lisibilité sur les teints clairs / fonds pastel). */
function isLightColor(hex) {
  if (!hex || hex === 'transparent') return true
  const n = Number.parseInt(hex, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 165
}

function MoxtMark({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M3.5 19V5.5l8.5 8 8.5-8V19"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Panel({ icon: Icon, title, hint, children }) {
  return (
    <section className="ave-panel min-w-0 rounded-[1.4rem] p-4">
      <header className="mb-3 flex items-center gap-3">
        <span className="ave-panel-icon grid size-9 shrink-0 place-items-center rounded-xl">
          <Icon aria-hidden="true" className="size-[1.05rem]" />
        </span>
        <div className="min-w-0">
          <h3 className="ave-panel-title leading-tight">{title}</h3>
          {hint ? <p className="ave-muted mt-0.5 truncate text-xs">{hint}</p> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

function Scroller({ label, value, children }) {
  const ref = useRef(null)
  const mounted = useRef(false)
  // Garde l’option sélectionnée visible (ouverture d’onglet, tirage aléatoire).
  useLayoutEffect(() => {
    const row = ref.current
    const selected = row?.querySelector('[aria-checked="true"]')
    const wasMounted = mounted.current
    mounted.current = true
    if (!row || !selected) return
    const left = Math.max(0, selected.offsetLeft - (row.clientWidth - selected.offsetWidth) / 2)
    if (typeof row.scrollTo === 'function')
      row.scrollTo({ left, behavior: wasMounted ? 'smooth' : 'auto' })
    else row.scrollLeft = left
  }, [value])
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className="ave-scroller scrollbar-hidden relative -mx-4 flex snap-x gap-2.5 overflow-x-auto scroll-px-4 px-4 py-2"
    >
      {children}
    </div>
  )
}

function Swatch({ color, selected, label, onSelect, small = false }) {
  const transparent = color === 'transparent'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`ave-swatch relative grid shrink-0 snap-start place-items-center rounded-full ${
        small ? 'size-8' : 'size-[2.6rem]'
      } ${selected ? 'is-selected' : ''}`}
      style={transparent ? CHECKERBOARD : { backgroundColor: `#${color}` }}
    >
      {selected ? (
        <LuCheck
          aria-hidden="true"
          strokeWidth={3}
          className={`${small ? 'size-3.5' : 'size-4'} ${
            isLightColor(color) ? 'text-slate-900/75' : 'text-white'
          }`}
        />
      ) : null}
    </button>
  )
}

function SwatchRow({ colors, value, onChange, labelFor, groupLabel, small = false }) {
  return (
    <Scroller label={groupLabel} value={value}>
      {colors.map((color, index) => (
        <Swatch
          key={color}
          color={color}
          small={small}
          selected={value === color}
          label={labelFor(color, index)}
          onSelect={() => onChange(color)}
        />
      ))}
    </Scroller>
  )
}

function Tile({ src, selected, label, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`ave-tile relative grid size-[4.75rem] shrink-0 snap-start place-items-center overflow-hidden rounded-[1.15rem] ${
        selected ? 'is-selected' : ''
      }`}
    >
      <img src={src} alt="" className="size-[92%] object-contain" draggable="false" />
      {selected ? (
        <span className="ave-check absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full">
          <LuCheck aria-hidden="true" strokeWidth={3.5} className="size-3" />
        </span>
      ) : null}
    </button>
  )
}

function AccessoryToggle({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`ave-acc flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left ${
        checked ? 'is-on' : ''
      }`}
    >
      <Icon aria-hidden="true" className="ave-brand size-[1.1rem] shrink-0" />
      <span className="min-w-0 flex-1 text-[0.82rem] font-semibold leading-tight">{label}</span>
      <span
        aria-hidden="true"
        className={`ave-switch relative inline-flex h-6 w-10 shrink-0 items-center rounded-full ${
          checked ? 'is-on' : ''
        }`}
      >
        <span
          className={`ave-switch-knob inline-block size-[1.1rem] rounded-full bg-white shadow ${
            checked ? 'translate-x-[1.2rem]' : 'translate-x-[0.2rem]'
          }`}
        />
      </span>
    </button>
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
          { size: 96 },
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, field, variants],
  )
}

/**
 * Éditeur d’avatar Lorelei (DiceBear 9, rendu local) — « light editorial » en thème clair,
 * « dark glass » en thème sombre. Enregistrer : PNG → Yandex (media-api) → profiles.avatar_url.
 */
export function AvatarDicebearEditor({ open = true, onClose, onChoosePhoto, onSaved }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const tx = (key, vars) => t(`profile.avatarEditor.${key}`, vars)
  const uid = useId()
  const user = useSelector((state) => state.auth.user)
  const storedPrefs = useSelector((state) =>
    user?.id ? state.account.preferences?.[user.id]?.avatarDicebear : null,
  )
  const [options, setOptions] = useState(() => preferencesToLoreleiOptions(storedPrefs, user?.id))
  const [initialKey] = useState(() => loreleiOptionsKey(options))
  const [tab, setTab] = useState('face')
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef(null)
  const tabRefs = useRef({})
  const { progress, track } = useUploadProgress()

  const busy = saving || photoUploading
  const alreadyApplied = Boolean(
    storedPrefs?.avatarUrl && user?.avatarUrl && storedPrefs.avatarUrl === user.avatarUrl,
  )
  const dirty = loreleiOptionsKey(options) !== initialKey || !alreadyApplied
  const optionsKey = loreleiOptionsKey(options)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewSrc = useMemo(() => loreleiSvgDataUri(options, { size: 360 }), [optionsKey])

  const hairThumbs = useThumbs(options, 'hair', HAIR_VARIANTS)
  const eyeThumbs = useThumbs(options, 'eyes', EYE_VARIANTS)
  const glassesThumbs = useThumbs(options, 'glasses', GLASSES_VARIANTS, { glassesOn: true })
  const earringThumbs = useThumbs(options, 'earrings', EARRINGS_VARIANTS, { earringsOn: true })

  const set = (patch) => setOptions((prev) => ({ ...prev, ...patch }))
  const numbered = (key) => (_value, index) => tx(key, { index: index + 1 })

  if (!user) return null

  const close = () => {
    if (!busy) onClose?.()
  }

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
            dispatch(
              updateAccountPreferences({
                userId: user.id,
                preferences: { avatarDicebear: preferences },
              }),
            )
          },
        }),
      )
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

  function handleTabKeyDown(event) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const index = TABS.findIndex((item) => item.id === tab)
    const next = TABS[(index + step + TABS.length) % TABS.length].id
    setTab(next)
    tabRefs.current[next]?.focus()
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

        {/* Réglages : un groupe à la fois */}
        <div className="mt-5 min-w-0 lg:mt-4">
          <div
            role="tablist"
            aria-label={tx('tabsAria')}
            className="ave-tabs grid grid-cols-3 gap-1 rounded-2xl p-1"
            onKeyDown={handleTabKeyDown}
          >
            {TABS.map(({ id, icon: Icon, labelKey }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[id] = el
                  }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${id}`}
                  aria-selected={active}
                  aria-controls={`${uid}-panel`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={`ave-tab flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[0.76rem] font-semibold sm:flex-row sm:gap-1.5 sm:px-2 sm:py-2.5 sm:text-[0.82rem] ${
                    active ? 'is-active' : ''
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{tx(labelKey)}</span>
                </button>
              )
            })}
          </div>

          <div
            role="tabpanel"
            id={`${uid}-panel`}
            aria-labelledby={`${uid}-tab-${tab}`}
            className="mt-4 grid gap-3"
          >
            {tab === 'face' ? (
              <>
                <Panel icon={LuDroplet} title={tx('sectionSkin')} hint={tx('hintSkin')}>
                  <SwatchRow
                    groupLabel={tx('sectionSkin')}
                    colors={SKIN_COLORS}
                    value={options.skinColor}
                    onChange={(skinColor) => set({ skinColor })}
                    labelFor={numbered('skinOption')}
                  />
                </Panel>
                <Panel icon={LuEye} title={tx('sectionEyes')} hint={tx('hintEyes')}>
                  <Scroller label={tx('sectionEyes')} value={options.eyes}>
                    {eyeThumbs.map(({ variant, src }, index) => (
                      <Tile
                        key={variant}
                        src={src}
                        selected={options.eyes === variant}
                        label={tx('eyesOption', { index: index + 1 })}
                        onSelect={() => set({ eyes: variant })}
                      />
                    ))}
                  </Scroller>
                </Panel>
              </>
            ) : null}

            {tab === 'hair' ? (
              <>
                <Panel icon={LuScissors} title={tx('sectionHair')} hint={tx('hintHair')}>
                  <Scroller label={tx('sectionHair')} value={options.hair}>
                    {hairThumbs.map(({ variant, src }, index) => (
                      <Tile
                        key={variant}
                        src={src}
                        selected={options.hair === variant}
                        label={tx('hairOption', { index: index + 1 })}
                        onSelect={() => set({ hair: variant })}
                      />
                    ))}
                  </Scroller>
                </Panel>
                <Panel icon={LuPalette} title={tx('sectionHairColor')} hint={tx('hintHairColor')}>
                  <SwatchRow
                    groupLabel={tx('sectionHairColor')}
                    colors={HAIR_COLORS}
                    value={options.hairColor}
                    onChange={(hairColor) => set({ hairColor })}
                    labelFor={numbered('colorOption')}
                  />
                </Panel>
              </>
            ) : null}

            {tab === 'accessories' ? (
              <>
                <Panel icon={LuGem} title={tx('sectionAccessories')} hint={tx('hintAccessories')}>
                  <div className="grid grid-cols-2 gap-2">
                    <AccessoryToggle
                      icon={LuGlasses}
                      label={tx('glasses')}
                      checked={options.glassesOn}
                      onChange={(glassesOn) => set({ glassesOn })}
                    />
                    <AccessoryToggle
                      icon={LuGem}
                      label={tx('earrings')}
                      checked={options.earringsOn}
                      onChange={(earringsOn) => set({ earringsOn })}
                    />
                  </div>
                  {options.glassesOn ? (
                    <div className="mt-3">
                      <p className="ave-sublabel">{tx('glasses')}</p>
                      <Scroller label={tx('glasses')} value={options.glasses}>
                        {glassesThumbs.map(({ variant, src }, index) => (
                          <Tile
                            key={variant}
                            src={src}
                            selected={options.glasses === variant}
                            label={`${tx('glasses')} ${index + 1}`}
                            onSelect={() => set({ glassesOn: true, glasses: variant })}
                          />
                        ))}
                      </Scroller>
                    </div>
                  ) : null}
                  {options.earringsOn ? (
                    <div className="mt-3">
                      <p className="ave-sublabel">{tx('earrings')}</p>
                      <Scroller label={tx('earrings')} value={options.earrings}>
                        {earringThumbs.map(({ variant, src }, index) => (
                          <Tile
                            key={variant}
                            src={src}
                            selected={options.earrings === variant}
                            label={`${tx('earrings')} ${index + 1}`}
                            onSelect={() => set({ earringsOn: true, earrings: variant })}
                          />
                        ))}
                      </Scroller>
                    </div>
                  ) : null}
                </Panel>
                <Panel icon={LuImage} title={tx('sectionBackground')} hint={tx('hintBackground')}>
                  <SwatchRow
                    small
                    groupLabel={tx('sectionBackground')}
                    colors={BACKGROUND_COLORS}
                    value={options.backgroundColor}
                    onChange={(backgroundColor) => set({ backgroundColor })}
                    labelFor={(color, index) =>
                      color === 'transparent'
                        ? tx('transparent')
                        : tx('colorOption', { index: index + 1 })
                    }
                  />
                </Panel>
              </>
            ) : null}
          </div>
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
              onClick={() => setOptions((prev) => randomizeLoreleiOptions(prev))}
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
        </div>
      </footer>
    </Modal>
  )
}

export default AvatarDicebearEditor
