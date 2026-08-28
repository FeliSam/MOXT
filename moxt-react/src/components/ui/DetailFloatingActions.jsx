import { useEffect, useState } from 'react'
import { FiArchive, FiEdit2, FiPlus, FiRotateCcw, FiShare2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { ContactButton } from '../../features/communications/ContactButton'
import { FavoriteButton } from '../../features/account/FavoriteButton'
import { useShareEntity } from '../../features/share/useShareEntity'
import { marketplaceText } from '../../features/marketplace/marketplaceI18n'
import { ReshareButton } from './ReshareButton'

const ICON_BUTTON_CLASS =
  'btn-press grid size-12 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-lg text-[var(--app-text)] shadow-[var(--shadow-float)] transition hover:border-brand-300 hover:text-brand-700'

/**
 * Menu d'actions flottant des pages détail (annonce, colis, job, événement,
 * P2P). Identique partout : icônes seules, libellé au survol.
 *
 * Le déclencheur utilise un « + » qui pivote en « × » à l'ouverture.
 * Les entrées apparaissent en cascade et se replient dans l'ordre inverse.
 */
export function DetailFloatingActions({
  entity,
  floatBottomClass = 'bottom-[var(--bottom-nav-clearance)]',
  isOwner = false,
  onContact,
  onShared,
  ownerId,
  relatedId,
  relatedPath,
  relatedType,
  title,
  autoHintMs = 0,
  sourceType,
  sourceId,
  editTo,
  editLabel,
  onArchive,
  archiveLabel,
  onReactivate,
  reactivateLabel,
}) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const [open, setOpen] = useState(false)
  const share = useShareEntity({ title, onShared })

  useEffect(() => {
    if (!autoHintMs) return undefined

    const openTimer = window.setTimeout(() => setOpen(true), 200)
    const closeTimer = window.setTimeout(() => setOpen(false), autoHintMs)

    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(closeTimer)
    }
  }, [autoHintMs, relatedId])

  const actions = [
    {
      key: 'share',
      label: mt('marketplace.detail.share'),
      node: (
        <button
          type="button"
          onClick={share}
          aria-label={mt('marketplace.detail.share')}
          className={ICON_BUTTON_CLASS}
        >
          <FiShare2 />
        </button>
      ),
    },
    isOwner && sourceType && sourceId
      ? {
          key: 'reshare',
          label: mt('marketplace.detail.republish'),
          node: (
            <ReshareButton
              sourceType={sourceType}
              sourceId={sourceId}
              sourceData={entity}
              iconOnly
            />
          ),
        }
      : null,
    isOwner && editTo
      ? {
          key: 'edit',
          label: editLabel || mt('marketplace.common.edit'),
          node: (
            <Link
              to={editTo}
              aria-label={editLabel || mt('marketplace.common.edit')}
              className={ICON_BUTTON_CLASS}
            >
              <FiEdit2 />
            </Link>
          ),
        }
      : null,
    isOwner && onArchive
      ? {
          key: 'archive',
          label: archiveLabel || mt('marketplace.common.archive'),
          node: (
            <button
              type="button"
              onClick={() => {
                onArchive()
                setOpen(false)
              }}
              aria-label={archiveLabel || mt('marketplace.common.archive')}
              className={ICON_BUTTON_CLASS}
            >
              <FiArchive />
            </button>
          ),
        }
      : null,
    isOwner && onReactivate
      ? {
          key: 'reactivate',
          label: reactivateLabel || mt('marketplace.common.republish'),
          node: (
            <button
              type="button"
              onClick={() => {
                onReactivate()
                setOpen(false)
              }}
              aria-label={reactivateLabel || mt('marketplace.common.republish')}
              className={ICON_BUTTON_CLASS}
            >
              <FiRotateCcw />
            </button>
          ),
        }
      : null,
    {
      key: 'favorite',
      label: mt('marketplace.detail.favorite'),
      node: (
        <FavoriteButton
          relatedId={relatedId}
          relatedType={relatedType}
          title={title}
          path={relatedPath}
          entity={entity}
          showLabel={false}
          className="!size-12 !w-12 shadow-[var(--shadow-float)]"
        />
      ),
    },
    !isOwner
      ? {
          key: 'contact',
          label: mt('marketplace.detail.contact'),
          node: (
            <ContactButton
              className="!size-12 !w-12 !p-0 shadow-[var(--shadow-float)]"
              variant="secondary"
              iconOnly
              ownerId={ownerId}
              relatedEntity={entity}
              relatedId={relatedId}
              relatedPath={relatedPath}
              relatedTitle={title}
              relatedType={relatedType}
              onContact={onContact}
            />
          ),
        }
      : null,
  ].filter(Boolean)

  const actionCount = actions.length

  return (
    <div
      className={`fixed ${floatBottomClass} right-4 z-[var(--z-page-float)] flex flex-col items-end gap-2`}
    >
      <div className="flex flex-col items-end gap-2" aria-hidden={!open}>
        {actions.map((action, index) => (
          <span
            key={action.key}
            className={`detail-action-item${open ? ' is-open' : ''}`}
            style={{
              transitionDelay: open
                ? `${index * 50}ms`
                : `${(actionCount - 1 - index) * 40}ms`,
            }}
          >
            <span className="detail-action-label">{action.label}</span>
            {action.node}
          </span>
        ))}
      </div>

      <button
        type="button"
        className={`btn-press detail-action-fab grid size-14 place-items-center rounded-full bg-brand-700 text-2xl text-white shadow-[0_12px_28px_rgb(8_112_95/0.35)] transition-[transform,background-color] duration-200 ease-out hover:bg-brand-800${
          open ? ' is-open' : ''
        }`}
        aria-expanded={open}
        aria-label={
          open
            ? mt('marketplace.detail.closeActionsMenu')
            : mt('marketplace.detail.openActionsMenu')
        }
        onClick={() => setOpen((current) => !current)}
      >
        <FiPlus
          className={`transition-transform duration-200 ease-out ${open ? 'rotate-45' : 'rotate-0'}`}
        />
      </button>
    </div>
  )
}
