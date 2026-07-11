import { useMemo } from 'react'
import { FiGift, FiShare2, FiUsers } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'
import { buildReferralCode, buildReferralLink } from '../features/referral/referralUtils'
import { QrSharePanel } from '../features/share/QrSharePanel'
import { buildAbsoluteUrl } from '../utils/siteUrl'

const TABS = [
  { value: 'invite', label: 'Inviter' },
  { value: 'profile', label: 'Mon profil' },
]

const STEPS = [
  {
    icon: FiShare2,
    title: 'Partagez votre QR',
    description: 'Montrez le code ou envoyez le lien à vos proches.',
  },
  {
    icon: FiUsers,
    title: 'Ils rejoignent MOXT',
    description: 'Inscription rapide depuis le lien ou le scan.',
  },
  {
    icon: FiGift,
    title: 'Tout au même endroit',
    description: 'Transferts, colis, marketplace et services diaspora.',
  },
]

export function ReferralPage() {
  const user = useSelector((state) => state.auth.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'profile' ? 'profile' : 'invite'

  const displayName = `${user.firstName} ${user.lastName}`.trim()
  const referralCode = useMemo(() => buildReferralCode(user), [user])
  const referralLink = useMemo(() => buildReferralLink(user), [user])
  const profileLink = useMemo(
    () => buildAbsoluteUrl(`/users/${user.id}/publications`),
    [user.id],
  )

  function setActiveTab(tab) {
    if (tab === 'invite') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ tab }, { replace: true })
    }
  }

  return (
    <div className="mx-auto grid max-w-xl gap-7">
      <PageHeader
        eyebrow="Partage"
        title="QR code & invitation"
        description="Un seul endroit pour inviter vos proches ou partager votre profil MOXT."
      />

      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} label="Type de partage" />

      {activeTab === 'invite' ? (
        <QrSharePanel
          variant="invite"
          title={displayName}
          subtitle="Invitation MOXT"
          avatarUrl={user.avatarUrl}
          verified={user.verified}
          city={user.city}
          shareUrl={referralLink}
          code={referralCode}
        />
      ) : (
        <QrSharePanel
          variant="profile"
          title={displayName}
          subtitle={user.email}
          avatarUrl={user.avatarUrl || undefined}
          verified={user.verified}
          city={user.city}
          shareUrl={profileLink}
          shareTitle={`Publications de ${displayName}`}
          shareText={`Consultez les publications de ${displayName} sur MOXT.`}
        />
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ description, icon: Icon, title }) => (
          <Card key={title} className="!p-4">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <Icon className="text-sm" />
            </span>
            <h3 className="mt-3 text-sm font-black">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{description}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
