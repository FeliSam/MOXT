import { Link, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'

export function GuestPreviewBanner() {
  const location = useLocation()
  const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)

  return (
    <Alert variant="info" title="Aperçu public MOXT" className="mb-6">
      <p className="text-sm">
        Vous consultez un profil ou une entreprise sans être connecté. Créez un compte pour
        contacter, favoriser, s&apos;abonner ou publier.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={`/register?returnTo=${returnTo}`}>
          <Button>Créer un compte</Button>
        </Link>
        <Link to={`/login?returnTo=${returnTo}`}>
          <Button variant="secondary">Se connecter</Button>
        </Link>
      </div>
    </Alert>
  )
}
