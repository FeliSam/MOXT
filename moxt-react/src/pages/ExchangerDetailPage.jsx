import { FiClock, FiMapPin, FiRepeat, FiShield, FiStar } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { flagEmoji } from '../config/flags'
import { useLanguage } from '../contexts/useLanguage'
import { ContactButton } from '../features/communications/ContactButton'
import { ExchangerPickerAvatar } from '../features/transfers/ExchangerPickerAvatar'
import {
  EXCHANGER_DELAY_TO_CONFIRM,
  resolveExchangerForDetail,
} from '../features/transfers/exchangerListUtils'
import { FALLBACK_EXCHANGERS } from '../features/transfers/transferConfig'
import { phase3Text } from '../i18n/phase3I18n'

export function ExchangerDetailPage() {
  const { exchangerId } = useParams()
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const toConfirmLabel = p3('exchangers.toConfirm')
  const allowAllCountries = searchParams.get('scope') === 'all'
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items)
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')

  const resolved = useMemo(
    () =>
      resolveExchangerForDetail({
        businesses,
        exchangerId,
        user,
        originCountry,
        allowAllCountries,
        fallbackExchangers: FALLBACK_EXCHANGERS,
        toConfirmLabel,
      }),
    [allowAllCountries, businesses, exchangerId, originCountry, toConfirmLabel, user],
  )
  const business = resolved?.business || null
  const exchanger = resolved?.exchanger || null

  function delayLabel(value) {
    if (!value || value === EXCHANGER_DELAY_TO_CONFIRM || value === 'A confirmer') {
      return toConfirmLabel
    }
    return value
  }

  if (!exchanger) {
    return (
      <EmptyState
        title={p3('exchangers.detail.notFound')}
        description={p3('exchangers.detail.notFoundDesc')}
      />
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('exchangers.detail.eyebrow')}
        title={exchanger.name}
        description={exchanger.description || p3('exchangers.detail.fallbackDesc')}
        actions={<BackButton fallback="/exchangers" />}
      />
      <DetailMetrics
        items={[
          { icon: FiStar, label: p3('exchangers.detail.evaluation'), value: `${exchanger.rating || 0}/5` },
          {
            icon: FiClock,
            label: p3('exchangers.detail.avgDelay'),
            value: delayLabel(exchanger.averageDelay),
          },
          {
            icon: FiRepeat,
            label: p3('exchangers.detail.fees'),
            value: `${exchanger.feePercent ?? 2.5}%`,
          },
          {
            icon: FiMapPin,
            label: p3('exchangers.detail.country'),
            value: `${flagEmoji(exchanger.country)} ${exchanger.city || exchanger.country}`,
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-start gap-4">
            <ExchangerPickerAvatar exchanger={exchanger} />
            <div className="min-w-0 flex-1">
              <VerifiedDisplayName
                as="h2"
                name={exchanger.name}
                verified={['verified', 'approved', 'active'].includes(exchanger.status)}
                iconSize="md"
                className="text-lg font-black"
              />
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {flagEmoji(exchanger.country)} {exchanger.city || exchanger.country}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric icon={FiStar} value={`${exchanger.rating || 0}/5`} label={p3('exchangers.detail.evaluation')} />
            <Metric
              icon={FiClock}
              value={delayLabel(exchanger.averageDelay)}
              label={p3('exchangers.detail.avgDelay')}
            />
            <Metric
              icon={FiRepeat}
              value={`${exchanger.feePercent ?? 2.5}%`}
              label={p3('exchangers.detail.feesAnnounced')}
            />
          </div>
          {exchanger.methods?.length ? (
            <div className="mt-6">
              <h2 className="font-black">{p3('exchangers.detail.methods')}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {exchanger.methods.map((method) => (
                  <Badge key={method}>{method}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
        <Card>
          <FiShield className="text-3xl text-brand-600" />
          <h2 className="mt-4 font-black">{p3('exchangers.detail.startTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
            {p3('exchangers.detail.startBody')}
          </p>
          <div className="mt-5 grid gap-3">
            <Link to={`/transfers?exchangerId=${exchanger.id}`}>
              <Button className="w-full" icon={FiRepeat}>
                {p3('exchangers.detail.choose')}
              </Button>
            </Link>
            {business ? (
              <Link to={`/businesses/${business.id}`}>
                <Button className="w-full" variant="secondary" icon={HiOutlineBuildingOffice2}>
                  {p3('exchangers.detail.viewBusiness')}
                </Button>
              </Link>
            ) : null}
            {business ? (
              <ContactButton
                ownerId={business.ownerId}
                relatedEntity={business}
                relatedId={business.id}
                relatedPath={`/exchangers/${business.id}`}
                relatedTitle={business.name}
                relatedType="business"
                variant="secondary"
              />
            ) : null}
          </div>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title={p3('exchangers.detail.infoTitle')}>
          <DetailFacts
            items={[
              { label: p3('exchangers.detail.name'), value: exchanger.name },
              {
                label: p3('exchangers.detail.type'),
                value: business
                  ? p3('exchangers.detail.typeBusiness')
                  : p3('exchangers.detail.typePartner'),
              },
              { label: p3('exchangers.detail.availability'), value: p3('exchangers.available') },
              { label: p3('exchangers.detail.avgDelay'), value: delayLabel(exchanger.averageDelay) },
              {
                label: p3('exchangers.detail.feesAnnounced'),
                value: `${exchanger.feePercent ?? 2.5}%`,
              },
              {
                label: p3('exchangers.detail.methodsLabel'),
                value: exchanger.methods?.join(', ') || toConfirmLabel,
              },
            ]}
          />
        </DetailSection>
        <TrustPanel
          items={[
            business
              ? p3('exchangers.detail.trustBusiness')
              : p3('exchangers.detail.trustPartner'),
            p3('exchangers.detail.trustRates'),
            p3('exchangers.detail.trustNoReal'),
          ]}
        />
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-[var(--app-surface-muted)] p-4">
      <Icon className="text-brand-600" />
      <strong className="mt-3 block">{value}</strong>
      <span className="text-xs text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}
