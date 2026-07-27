import { useState } from 'react'
import { FiPlus, FiShare2 } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { ContactButton } from '../../features/communications/ContactButton'
import { FavoriteButton } from '../../features/account/FavoriteButton'
import { useShareEntity } from '../../features/share/useShareEntity'
import { marketplaceText } from '../../features/marketplace/marketplaceI18n'

/**
 * Menu d'actions flottant des pages détail (annonce, colis, job, événement,
 * P2P). Identique partout : icônes seules, sans libellé, même disposition.
 *
 * Le déclencheur utilise un « + » qui pivote en « × » à l'ouverture — plus
 * parlant que trois points, et l'animation rend l'état courant évident.
 * Les entrées apparaissent en cascade et se replient dans l'ordre inverse.
 */
export function DetailFloatingActions({
  entity,
  floatBottomClass = 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]',
  isOwner = false,
  onContact,
  onShared,
  ownerId,
  relatedId,
  relatedPath,
  relatedType,
  title,
}) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const [open, setOpen] = useState(false)
  const share = useShareEntity({ title, onShared })

  // Partage + favori pour tout le monde ; contacter seulement si l'on n'est
  // pas le propriétaire de la fiche.
  const actions = [
    <button
      key="share"
      type="button"
      onClick={share}
      aria-label={mt('marketplace.detail.share')}
      title={mt('marketplace.detail.share')}
      className="btn-press grid size-12 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-lg text-[var(--app-text)] shadow-[var(--shadow-float)] transition hover:border-brand-300 hover:text-brand-700"
    >
      <FiShare2 />
    </button>,
    <FavoriteButton
      key="favorite"
      relatedId={relatedId}
      relatedType={relatedType}
      title={title}
      path={relatedPath}
      entity={entity}
      showLabel={false}
      className="!size-12 !w-12 shadow-[var(--shadow-float)]"
    />,
  ]

  if (!isOwner) {
    actions.push(
      <ContactButton
        key="contact"
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
      />,
    )
  }

  return (
    <div
      className={`fixed ${floatBottomClass} right-4 z-[var(--z-page-float)] flex flex-col items-end gap-2 xl:hidden`}
    >
      <div
        className={`flex flex-col items-end gap-2 transition-[opacity,transform] duration-200 ease-out ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        }`}
        aria-hidden={!open}
      >
        {actions.map((action, index) => (
          <span
            key={action.key}
            className="detail-action-item"
            style={{
              // Cascade à l'ouverture, repli instantané à la fermeture.
              transitionDelay: open ? `${index * 45}ms` : '0ms',
            }}
          >
            {action}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="btn-press grid size-14 place-items-center rounded-full bg-brand-700 text-2xl text-white shadow-[0_12px_28px_rgb(8_112_95/0.35)] transition-transform duration-200 ease-out hover:bg-brand-800"
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
