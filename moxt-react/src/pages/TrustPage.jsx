import { FiAlertTriangle, FiCheckCircle, FiLock, FiShield } from 'react-icons/fi'
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
          La version actuelle prépare les parcours et la modération. Elle ne remplace pas une
          validation bancaire, juridique ou administrative.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TRUST_PRINCIPLES.map(({ description, icon: Icon, title }) => (
          <Card key={title}>
            <Icon className="text-2xl text-brand-600" />
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
          </Card>
        ))}
      </div>

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex gap-4">
          <FiAlertTriangle className="mt-1 shrink-0 text-2xl text-amber-600" />
          <div>
            <h2 className="font-black">Ce que la démonstration ne garantit pas</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              Aucun solde, paiement, reçu, badge de présence ou statut local ne constitue une preuve
              réelle. Le futur backend devra contrôler chaque opération sensible.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          [FiLock, 'Données locales', 'Vos données restent dans ce navigateur jusqu’au backend.'],
          [
            FiShield,
            'Permissions',
            'Les contrôles visuels seront reproduits et renforcés côté serveur.',
          ],
          [
            FiCheckCircle,
            'Profils vérifiés',
            'Le statut vérifié reste démonstratif tant qu’aucun contrôle externe n’existe.',
          ],
          [
            FiAlertTriangle,
            'Signalements',
            'Les signalements locaux préparent la future file de modération.',
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
