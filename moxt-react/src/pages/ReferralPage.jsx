import { useEffect, useMemo, useState } from 'react'
import { FiGift, FiShare2, FiUsers } from 'react-icons/fi'
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'
import { getMoxtSocialNetwork, MOXT_SOCIAL_NETWORKS } from '../config/socialLinks'
import { useLanguage } from '../contexts/useLanguage'
import { selectAccountPreferences } from '../features/account/accountSlice'
import { buildReferralCode, buildReferralLink } from '../features/referral/referralUtils'
import { loadInviteCount } from '../features/referral/referralService'
import { QrCameraScanner } from '../features/share/QrCameraScanner'
import { QrSharePanel } from '../features/share/QrSharePanel'
import { buildAbsoluteUrl } from '../utils/siteUrl'

const STEP_KEYS = [
  { icon: FiShare2, titleKey: 'share.steps.step1Title', descKey: 'share.steps.step1Desc' },
  { icon: FiUsers, titleKey: 'share.steps.step2Title', descKey: 'share.steps.step2Desc' },
  { icon: FiGift, titleKey: 'share.steps.step3Title', descKey: 'share.steps.step3Desc' },
]

const TAB_VALUES = ['invite', 'profile', 'reseaux', 'scan']

const NETWORK_ICONS = {
  instagram: FaInstagram,
  telegram: FaTelegramPlane,
  whatsapp: FaWhatsapp,
}

const NETWORK_SUBTITLE_KEYS = {
  instagram: 'share.instagramSubtitle',
  telegram: 'share.telegramSubtitle',
  whatsapp: 'share.whatsappSubtitle',
}

function resolveTab(value) {
  if (value === 'instagram') return 'reseaux'
  if (TAB_VALUES.includes(value)) return value
  return 'invite'
}

export function ReferralPage() {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) =>
    user ? selectAccountPreferences(state, user.id) : null,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab = resolveTab(rawTab)
  const [network, setNetwork] = useState('instagram')

  useEffect(() => {
    if (rawTab === 'instagram') {
      setSearchParams({ tab: 'reseaux' }, { replace: true })
    }
  }, [rawTab, setSearchParams])

  const tabs = useMemo(
    () => [
      { value: 'invite', label: t('share.inviteTab') },
      { value: 'profile', label: t('share.profileTab') },
      { value: 'reseaux', label: t('share.networksTab') },
      { value: 'scan', label: t('share.scanTab') },
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
  const selectedNetwork = getMoxtSocialNetwork(network)

  function setActiveTab(tab) {
    if (tab === 'invite') {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <div className="mx-auto grid max-w-xl gap-7">
      <PageHeader
        eyebrow={t('share.eyebrow')}
        title={t('share.title')}
        description={t('share.description')}
      />

      <Tabs items={tabs} active={activeTab} onChange={setActiveTab} label={t('share.tabTypeLabel')} />

      {activeTab === 'scan' ? (
        <QrCameraScanner active />
      ) : activeTab === 'invite' ? (
        <QrSharePanel
          variant="invite"
          title={displayName}
          firstName={user.firstName}
          lastName={user.lastName}
          subtitle={t('share.invitationSubtitle')}
          avatarUrl={user.avatarUrl}
          verified={user.verified}
          city={user.city}
          country={user.country || user.originCountry}
          shareUrl={referralLink}
          code={referralCode}
          inviteCount={inviteCount}
        />
      ) : activeTab === 'reseaux' ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {MOXT_SOCIAL_NETWORKS.map((item) => {
              const Icon = NETWORK_ICONS[item.id]
              const active = network === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNetwork(item.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-black transition ${
                    active
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]'
                  }`}
                  aria-pressed={active}
                >
                  {Icon ? <Icon className="text-base" aria-hidden /> : null}
                  {t(`share.networks.${item.id}`)}
                </button>
              )
            })}
          </div>
          <QrSharePanel
            variant={selectedNetwork.id}
            title="MOXT"
            subtitle={t(NETWORK_SUBTITLE_KEYS[selectedNetwork.id] || 'share.instagramSubtitle')}
            avatarUrl="/assets/brand/mark.png?v=20260714e"
            shareUrl={selectedNetwork.url}
            qrImageSrc={selectedNetwork.qrSrc}
          />
        </div>
      ) : (
        <QrSharePanel
          variant="profile"
          activityVisibility={preferences?.activityVisibility}
          title={displayName}
          firstName={user.firstName}
          lastName={user.lastName}
          subtitle={user.email}
          avatarUrl={user.avatarUrl || undefined}
          verified={user.verified}
          city={user.city}
          country={user.country || user.originCountry}
          shareUrl={profileLink}
          shareTitle={t('share.shareTitles.publications', { name: displayName })}
          shareText={t('share.shareTexts.profile', { name: displayName })}
        />
      )}

      {activeTab === 'scan' || activeTab === 'reseaux' ? null : (
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
      )}
    </div>
  )
}
