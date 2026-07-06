import { FiBriefcase, FiMessageSquare, FiPackage } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function MessagesEmptyState() {
  return (
    <div className="mx-2 mt-2 rounded-[1.35rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center shadow-sm">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-xl text-[var(--app-accent)]">
        <FiMessageSquare />
      </span>
      <h2 className="mt-4 font-display text-base font-extrabold">Aucune conversation pour l’instant</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        Contactez un vendeur, un voyageur ou un professionnel depuis une fiche MOXT pour démarrer un échange.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to="/marketplace">
          <Button variant="secondary" className="gap-2">
            <FiBriefcase /> Marketplace
          </Button>
        </Link>
        <Link to="/parcels">
          <Button variant="secondary" className="gap-2">
            <FiPackage /> Colis
          </Button>
        </Link>
        <Link to="/activities">
          <Button>Mes activités</Button>
        </Link>
      </div>
    </div>
  )
}
