import { useEffect, useMemo, useState } from 'react'
import { FiGift, FiShare2, FiUsers } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'
import { useLanguage } from '../contexts/useLanguage'
import { buildReferralCode, buildReferralLink } from '../features/referral/referralUtils'
import { loadInviteCount } from '../features/referral/referralService'
import { QrSharePanel } from '../features/share/QrSharePanel'
import { buildAbsoluteUrl } from '../utils/siteUrl'

const STEP_KEYS = [
  { icon: FiShare2, titleKey: 'share.steps.step1Title', descKey: 'share.steps.step1Desc' },
  { icon: FiUsers, titleKey: 'share.steps.step2Title', descKey: 'share.steps.step2Desc' },
  { icon: FiGift, titleKey: 'share.steps.step3Title', descKey: 'share.steps.step3Desc' },
]

export function ReferralPage() {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'profile' ? 'profile' : 'invite'

  const tabs = useMemo(
    () => [
      { value: 'invite', label: t('share.inviteTab') },
      { value: 'profile', label: t('share.profileTab') },
    ],
    [t],
  )

  const [inviteCount, setInviteCount] = useState(null)

  useEffect(() => {
    if (!user?.id) return undefined
    let cancelled = false
    loadInviteCount(user.id).then((count) => {
      if (!cancelled) setInviteCount(count)
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

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
        eyebrow={t('share.eyebrow')}
        title={t('share.title')}
        description={t('share.description')}
      />

      <Tabs items={tabs} active={activeTab} onChange={setActiveTab} label={t('share.tabTypeLabel')} />

      {activeTab === 'invite' ? (
        <QrSharePanel
          variant="invite"
          title={displayName}
          subtitle={t('share.invitationSubtitle')}
          avatarUrl={user.avatarUrl}
          verified={user.verified}
          city={user.city}
          shareUrl={referralLink}
          code={referralCode}
          inviteCount={inviteCount}
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
          shareTitle={t('share.shareTitles.publications', { name: displayName })}
          shareText={t('share.shareTexts.profile', { name: displayName })}
        />
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {STEP_KEYS.map(({ descKey, icon: Icon, titleKey }) => (
          <Card key={titleKey} className="!p-4">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <Icon className="text-sm" />
            </span>
            <h3 className="mt-3 text-sm font-black">{t(titleKey)}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{t(descKey)}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
