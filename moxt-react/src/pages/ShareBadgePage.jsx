import { FiArrowLeft, FiShare2 } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ShareBadgeCard } from '../components/share/ShareBadgeCard'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

export function ShareBadgePage() {
  const user = useSelector((state) => state.auth.user)
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://moxt.local'

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Mon profil"
        title="Mon badge partageable"
        description="Téléchargez ou partagez votre carte MOXT personnelle."
        actions={
          <Link
            to="/profile"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm"
          >
            <FiArrowLeft /> Retour au profil
          </Link>
        }
      />
      <Card className="grid gap-4">
        <div className="flex items-center gap-3">
          <FiShare2 className="text-xl text-brand-700" />
          <p className="text-sm text-[var(--app-text-muted)]">
            Cette carte peut être téléchargée en image et partagée sur vos réseaux.
          </p>
        </div>
        <ShareBadgeCard
          type="user"
          name={`${user.firstName} ${user.lastName}`}
          avatarUrl={user.avatarUrl || ''}
          city={user.city || 'Russie'}
          phone={user.phone || ''}
          email={user.email || ''}
          verified={user.verified}
          userId={user.id}
          siteUrl={siteUrl}
          filename={`moxt-membre-${user.id || 'profil'}.svg`}
        />
      </Card>
    </div>
  )
}
