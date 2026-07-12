import { FiAlertTriangle, FiCheckCircle, FiLock, FiShield, FiSmartphone } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { TRUST_PRINCIPLES } from '../config/publicContent'

export function TrustPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6">
      <div className="max-w-3xl">
        <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
          Confiance et sécurité
        </span>
        <h1 className="mt-2 text-4xl font-black">Utiliser MOXT avec les bons réflexes</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--app-text-muted)]">
          MOXT applique trois niveaux de vérification : numéro russe pour publier, identité pour les
          opérations sensibles, niveau renforcé pour les plafonds élevés. La messagerie reste ouverte
          à tous les membres connectés.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TRUST_PRINCIPLES.map(({ description, icon: Icon, title }) => (
          <Card key={title}>
            <Icon className="text-2xl text-brand-600" />
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
          </Card>
        ))}
      </div>

      <Card className="border-brand-200 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/20">
        <div className="flex gap-4">
          <FiSmartphone className="mt-1 shrink-0 text-2xl text-brand-600" />
          <div>
            <h2 className="font-black">Publication protégée</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              Annonces, colis, jobs et événements nécessitent un numéro russe unique confirmé par OTP.
              Les comptes créés par e-mail doivent aussi confirmer leur téléphone avant de publier.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex gap-4">
          <FiAlertTriangle className="mt-1 shrink-0 text-2xl text-amber-600" />
          <div>
            <h2 className="font-black">Délai de vérification identité</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              Si votre dossier d’identité reste en attente plus de 24 h, contactez l’administrateur via{' '}
              <Link className="font-bold text-brand-700 hover:underline" to="/support">
                le support
              </Link>
              .
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          [FiLock, 'Données personnelles', 'Vos documents sont traités pour la vérification et la sécurité du compte.'],
          [
            FiShield,
            'Entreprises et transferts',
            'Création d’entreprise et comptes de transfert réservés aux profils identité vérifiés.',
          ],
          [
            FiCheckCircle,
            'Badge vérifié',
            'Le badge vert indique une identité validée par l’équipe MOXT.',
          ],
          [
            FiAlertTriangle,
            'Signalements',
            'Signalez tout contenu suspect depuis les fiches concernées.',
          ],
        ].map(([Icon, title, description]) => (
          <Card key={title} className="flex gap-4">
            <Icon className="mt-1 shrink-0 text-xl text-brand-600" />
            <div>
              <h2 className="font-black">{title}</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
