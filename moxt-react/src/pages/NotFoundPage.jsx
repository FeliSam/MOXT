import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
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
