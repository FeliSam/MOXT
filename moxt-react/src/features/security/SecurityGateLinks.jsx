import { Link } from 'react-router-dom'

export function SecurityGateLinks({ kind = 'publish' }) {
  const profileLink = kind === 'publish' ? '/profile' : '/verification'
  return (
    <span className="text-sm">
      <Link className="font-bold text-brand-700 hover:underline" to={profileLink}>
        {kind === 'publish' ? 'Vérifier mon numéro' : 'Vérification MOXT'}
      </Link>
      {' · '}
      <Link className="font-bold text-brand-700 hover:underline" to="/verification">
        Centre de vérification
      </Link>
    </span>
  )
}
