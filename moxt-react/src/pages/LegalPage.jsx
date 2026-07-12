import { Link, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { LEGAL_SECTIONS } from '../config/publicContent'

export function LegalPage() {
  const { sectionId } = useParams()
  const active = LEGAL_SECTIONS.find((item) => item.id === sectionId) || LEGAL_SECTIONS[0]

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 sm:px-6">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
          Informations légales
        </span>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{active.title}</h1>
        <p className="mt-3 text-sm text-[var(--app-text-muted)]">
          © {new Date().getFullYear()} MOXT. Tous droits réservés.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {LEGAL_SECTIONS.map((item) => (
          <Link
            key={item.id}
            to={`/legal/${item.id}`}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              item.id === active.id
                ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <Card>
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">{active.content}</p>
      </Card>

      <p className="text-xs text-[var(--app-text-faint)]">
        Plateforme MOXT — diaspora afro-russe. Utilisez les services avec vigilance et vérifiez vos
        interlocuteurs.
      </p>
    </div>
  )
}
