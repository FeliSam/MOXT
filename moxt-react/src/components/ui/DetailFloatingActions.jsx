import { useState } from 'react'
import { FiMoreHorizontal } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { ContactButton } from '../../features/communications/ContactButton'
import { FavoriteButton } from '../../features/account/FavoriteButton'
import { marketplaceText } from '../../features/marketplace/marketplaceI18n'

/**
 * Bouton flottant "..." (mobile + tablette, masqué à partir de xl où les CTA
 * restent visibles en ligne) qui déplie Contacter + Favoris. Le menu reste
 * ouvert après un clic sur Favoris — seul un nouveau clic sur "..." le ferme.
 */
export function DetailFloatingActions({
  entity,
  floatBottomClass = 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]',
  isOwner = false,
  onContact,
  ownerId,
  relatedId,
  relatedPath,
  relatedType,
  title,
}) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const [open, setOpen] = useState(false)

  if (isOwner) {
    return (
      <div className={`fixed ${floatBottomClass} right-4 z-[var(--z-page-float)] flex xl:hidden`}>
        <FavoriteButton
          relatedId={relatedId}
          relatedType={relatedType}
          title={title}
          path={relatedPath}
          entity={entity}
          className="shadow-[var(--shadow-float)]"
        />
      </div>
    )
  }

  return (
    <div
      className={`fixed ${floatBottomClass} right-4 z-[var(--z-page-float)] flex flex-col items-end gap-1 xl:hidden`}
    >
      {open ? (
        <div className="flex flex-col items-end gap-1">
          <ContactButton
            className="shadow-[var(--shadow-float)]"
            variant="secondary"
            ownerId={ownerId}
            relatedEntity={entity}
            relatedId={relatedId}
            relatedPath={relatedPath}
            relatedTitle={title}
            relatedType={relatedType}
            onContact={onContact}
          />
          <FavoriteButton
            relatedId={relatedId}
            relatedType={relatedType}
            title={title}
            path={relatedPath}
            entity={entity}
            className="shadow-[var(--shadow-float)]"
          />
        </div>
      ) : null}
      <button
        type="button"
        className="btn-press grid size-14 place-items-center rounded-full bg-brand-700 text-2xl text-white shadow-[0_12px_28px_rgb(8_112_95/0.35)] transition hover:bg-brand-800"
        aria-expanded={open}
        aria-label={open ? mt('marketplace.detail.closeActionsMenu') : mt('marketplace.detail.openActionsMenu')}
        onClick={() => setOpen((current) => !current)}
      >
        <FiMoreHorizontal />
      </button>
    </div>
  )
}
