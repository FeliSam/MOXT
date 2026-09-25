import { useRef, useState } from 'react'
import { LuCheck, LuChevronRight, LuImage, LuPalette, LuSparkles, LuX } from 'react-icons/lu'
import { Modal } from '../../../components/ui/Modal'
import { UploadProgress } from '../../../components/ui/UploadProgress'
import { useLanguage } from '../../../contexts/useLanguage'
import { useUploadProgress } from '../../../hooks/useUploadProgress'
import { resolveMediaDisplayUrl } from '../../../services/media/mediaUrlUtils'
import { avatarDisplayUrl } from '../../account/avatarDisplayUrl'
import '../../account/avatarDicebear/avatarEditor.css'
import { MoxtMark, Panel, Segmented } from '../../account/avatarDicebear/editorParts'
import './bannerEditor.css'
import {
  bannerStyleLabel,
  bannerStylesFor,
  initialBannerDraft,
  initialBannerGenderTab,
  randomBannerStyle,
} from './bannerEditorUtils'
import { COVER_STYLE_LABELS_FR } from './coverBannerCatalog'
import { MoxtCoverBanner } from './MoxtCoverBanner'
import { profileInitials } from '../profileInitials'

function PreviewAvatar({ src, initials, square }) {
  const [failed, setFailed] = useState(false)
  const shape = square ? 'rounded-[1.1rem]' : 'rounded-full'
  return (
    <span
      className={`bne-avatar relative grid size-16 shrink-0 place-items-center overflow-hidden sm:size-[4.5rem] ${shape}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          draggable="false"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-lg font-black text-white">{initials}</span>
      )}
    </span>
  )
}

function BannerTile({ styleId, category, selected, label, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`ave-tile relative flex w-full min-w-0 flex-col overflow-hidden rounded-[1.15rem] p-1.5 text-left ${
        selected ? 'is-selected' : ''
      }`}
    >
      <span className="relative block aspect-[16/7] w-full overflow-hidden rounded-[0.8rem]">
        <MoxtCoverBanner
          styleId={styleId}
          category={category}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        {selected ? (
          <span className="ave-check absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full">
            <LuCheck aria-hidden="true" strokeWidth={3.5} className="size-3" />
          </span>
        ) : null}
      </span>
      <span className="block truncate px-1 pb-0.5 pt-1.5 text-[0.76rem] font-semibold">
        {label}
      </span>
    </button>
  )
}

/**
 * Éditeur de bannière Moxt : même univers visuel que l’éditeur d’avatar
 * (« light editorial » en clair, « dark glass » en sombre).
 * Entreprise : 4 styles (vert) ; profil perso : onglets Femme / Homme (4 + 4), présélection selon le genre,
 * accent prune (classe `bne-personal`).
 * `onUploadPhoto(file, { onProgress })` (optionnel) active le lien « Photo à la place ».
 */
export function BannerEditor({
  open = true,
  onClose,
  category = 'business',
  value,
  gender,
  onChange,
  labels = COVER_STYLE_LABELS_FR,
  previewName = '',
  previewAvatarUrl = '',
  onUploadPhoto = null,
}) {
  const { t } = useLanguage()
  const tx = (key, vars) => t(`profile.bannerEditor.${key}`, vars)
  const isBusiness = category === 'business'
  const [genderTab, setGenderTab] = useState(() => initialBannerGenderTab(gender, value))
  const [draft, setDraft] = useState(() =>
    initialBannerDraft(category, initialBannerGenderTab(gender, value), value),
  )
  const [uploading, setUploading] = useState(false)
  const photoInputRef = useRef(null)
  const { progress, track } = useUploadProgress()

  const styles = bannerStylesFor(category, genderTab)
  const labelFor = (styleId) => bannerStyleLabel(t, styleId, labels)
  const dirty = Boolean(draft) && draft !== value
  const busy = uploading
  const rawAvatar = resolveMediaDisplayUrl(previewAvatarUrl) || previewAvatarUrl || ''
  const avatarSrc = rawAvatar ? avatarDisplayUrl(rawAvatar, { width: 160 }) : ''
  const initials = profileInitials(previewName)
  const showProgress = progress.active || progress.phase === 'error'

  function close() {
    if (!busy) onClose?.()
  }

  function switchTab(next) {
    setGenderTab(next)
    const nextStyles = bannerStylesFor(category, next)
    setDraft((current) => (nextStyles.includes(current) ? current : nextStyles[0]))
  }

  function handleSave() {
    if (!draft) return
    if (draft !== value) onChange?.(draft)
    onClose?.()
  }

  async function handlePhotoFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onUploadPhoto) return
    setUploading(true)
    try {
      await track((onProgress) => onUploadPhoto(file, { onProgress }))
      onClose?.()
    } catch {
      /* toast d’erreur affiché par onUploadPhoto */
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={tx('title')}
      bare
      panelClassName={`ave-root ${isBusiness ? '' : 'bne-personal'} flex h-[100dvh] w-full flex-col overflow-hidden sm:h-auto sm:max-h-[min(92dvh,56rem)] sm:max-w-xl sm:rounded-[2rem] lg:max-w-[66rem]`}
    >
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

      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-10 lg:px-10 lg:pb-8">
        {/* Aperçu */}
        <div className="flex flex-col items-center pt-2 lg:sticky lg:top-0 lg:self-start lg:pt-4">
          <div className="text-center">
            <h2 className="ave-serif ave-title text-[2.05rem] leading-[1.05] sm:text-[2.5rem] lg:text-[3rem]">
              {tx('displayTitle')}
            </h2>
            <div aria-hidden="true" className="ave-rule mx-auto mt-3" />
            <p className="ave-muted mt-2.5 text-[0.82rem]">{tx('tagline')}</p>
          </div>

          <div className="relative mt-6 w-full max-w-[34rem]">
            <div aria-hidden="true" className="ave-mesh" />
            <div className="bne-frame">
              <div
                role="img"
                aria-label={`${tx('previewAlt')} — ${labelFor(draft)}`}
                className="bne-media relative aspect-[16/8] w-full overflow-hidden rounded-[1.3rem]"
              >
                <MoxtCoverBanner
                  styleId={draft}
                  category={category}
                  gender={gender}
                  className="absolute inset-0 h-full w-full"
                />
                <div aria-hidden="true" className="bne-scrim absolute inset-0" />
                {/* À droite : les visuels portent leur propre typographie à gauche / au centre. */}
                <div className="absolute inset-x-4 bottom-4 flex flex-row-reverse items-end gap-3 sm:inset-x-5 sm:bottom-5">
                  <PreviewAvatar src={avatarSrc} initials={initials} square={isBusiness} />
                  {previewName ? (
                    <p className="ave-serif bne-name min-w-0 truncate pb-1 text-right text-xl sm:text-2xl">
                      {previewName}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Réglages */}
        <div className="mt-5 grid min-w-0 content-start gap-3 lg:mt-4">
          {isBusiness ? null : (
            <Segmented
              label={tx('genderAria')}
              value={genderTab}
              onChange={switchTab}
              options={[
                { id: 'woman', label: tx('woman') },
                { id: 'man', label: tx('man') },
              ]}
            />
          )}
          <Panel
            icon={LuPalette}
            title={tx('sectionStyle')}
            hint={draft ? labelFor(draft) : tx('hintStyle')}
          >
            <div
              role="radiogroup"
              aria-label={tx('sectionStyle')}
              className="grid grid-cols-2 gap-2.5"
            >
              {styles.map((styleId) => (
                <BannerTile
                  key={styleId}
                  styleId={styleId}
                  category={category}
                  selected={draft === styleId}
                  label={labelFor(styleId)}
                  onSelect={() => setDraft(styleId)}
                />
              ))}
            </div>
            <p className="ave-muted mt-3 text-xs">{tx('hint')}</p>
          </Panel>
        </div>
      </div>

      <footer className="ave-bar relative z-10 flex-none px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5">
        <div className="mx-auto max-w-md">
          {showProgress ? (
            <UploadProgress progress={progress} compact className="mb-2.5 w-full" />
          ) : null}
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => setDraft((current) => randomBannerStyle(styles, current))}
              className="ave-btn ave-btn-secondary inline-flex h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-2xl px-3 text-[0.92rem] font-semibold"
            >
              <LuSparkles aria-hidden="true" className="size-[1.1rem] shrink-0" />
              <span className="truncate">{tx('random')}</span>
            </button>
            <button
              type="button"
              disabled={busy || !dirty}
              onClick={handleSave}
              className="ave-btn ave-btn-primary inline-flex h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-2xl px-4 text-[0.95rem] font-semibold"
            >
              <LuCheck aria-hidden="true" strokeWidth={2.75} className="size-[1.1rem] shrink-0" />
              <span className="truncate">{tx('save')}</span>
            </button>
          </div>
          {onUploadPhoto ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => photoInputRef.current?.click()}
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
                aria-label={tx('photoInstead')}
                onChange={handlePhotoFile}
              />
            </>
          ) : null}
        </div>
      </footer>
    </Modal>
  )
}

export default BannerEditor
