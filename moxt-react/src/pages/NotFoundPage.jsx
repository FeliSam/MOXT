import { Link, Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'

/**
 * Supabase renvoie parfois le jeton de confirmation sur une URL que le routeur
 * ne connaît pas (variante de `redirect_to`, jeton posé à la racine dans le
 * fragment, lien réécrit par une application mail). On atterrissait alors sur
 * « page introuvable » alors que la confirmation était valide. Si l'URL porte
 * un jeton d'authentification, on la réoriente vers le callback qui sait le
 * consommer, au lieu d'afficher une 404.
 */
function hasAuthToken(location) {
  const hash = location.hash || ''
  const search = location.search || ''
  return (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('type=signup') ||
    hash.includes('type=recovery') ||
    hash.includes('type=email_change') ||
    /[?&]code=/.test(search) ||
    /[?&]token_hash=/.test(search)
  )
}

export function NotFoundPage() {
  const location = useLocation()

  if (hasAuthToken(location)) {
    return <Navigate to={`/auth/callback${location.search}${location.hash}`} replace />
  }

  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-black text-brand-700">Erreur 404</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Page introuvable</h1>
        <p className="mt-3 text-slate-500">Cette route n'existe pas dans le nouveau projet.</p>
        <Link className="mt-6 inline-block" to="/dashboard">
          <Button>Retour a l'accueil</Button>
        </Link>
      </div>
    </main>
  )
}
