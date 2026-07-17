import { activityByValue } from '../../config/businessActivities'
import { BusinessActivityVisibilitySection } from '../../features/businesses/BusinessActivityVisibilitySection'
import { BusinessVerificationProgress } from '../../features/businesses/BusinessVerificationProgress'
import { professionalText } from '../../features/businesses/professionalI18n'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../../features/share/businessShareUtils'
import { QrSharePanel } from '../../features/share/QrSharePanel'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'

export function ProfilePanel({ activity, business, documents = [], secondaryActivity }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const businessShareUrl = buildBusinessShareUrl(business)
  const shareText = buildBusinessShareText(business)
  const sectorLabel = activity?.label || business.sector

  return (
    <div className="grid gap-5">
      <BusinessVerificationProgress business={business} documents={documents} />
      <BusinessActivityVisibilitySection business={business} />
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        {business.bannerUrl ? (
          <div className="relative mb-10">
            <img
              src={business.bannerUrl}
              alt={pt('professional.profile.bannerAlt', { name: business.name })}
              className="h-44 w-full rounded-[1.8rem] object-cover"
            />
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={pt('professional.profile.logoAlt', { name: business.name })}
                className="absolute -bottom-8 left-4 size-16 rounded-3xl border-4 border-[var(--app-surface)] object-cover shadow-md"
              />
            ) : null}
          </div>
        ) : business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={pt('professional.profile.logoAlt', { name: business.name })}
            className="mb-4 size-16 rounded-3xl object-cover shadow-md"
          />
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">
              {pt('professional.profile.eyebrow')}
            </p>
            <h2 className="mt-1 text-2xl font-black">{business.name}</h2>
            <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-[var(--app-text-muted)]">
              {business.description}
            </p>
          </div>
          <Badge tone={statusMeta(business.status).tone}>{statusMeta(business.status).label}</Badge>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Info label={pt('professional.profile.primaryDomain')} value={activity?.label || business.sector} />
          <Info
            label={pt('professional.profile.secondaryActivity')}
            value={secondaryActivity?.label || pt('professional.profile.noSecondary')}
          />
          <Info label={pt('professional.profile.city')} value={business.city} />
          <Info
            label={pt('professional.profile.address')}
            value={business.address || pt('professional.profile.addressMissing')}
          />
          <Info label={pt('professional.profile.russianPhone')} value={business.phone} />
          <Info
            label={pt('professional.profile.originPhone')}
            value={business.originPhone || pt('professional.profile.notProvided')}
          />
          <Info
            label={pt('professional.profile.email')}
            value={business.email || pt('professional.profile.notProvided')}
          />
          <Info label={pt('professional.profile.hours')} value={business.scheduleSummary || business.hours} />
          <Info
            label={pt('professional.profile.zones')}
            value={business.serviceZones || pt('professional.profile.russia')}
          />
        </div>
      </Card>

      <QrSharePanel
        key={businessShareVersion(business)}
        variant="business"
        title={business.name}
        subtitle={activityByValue(business.primaryActivity)?.label || business.sector}
        avatarUrl={business.logoUrl}
        verified={['verified', 'approved', 'active'].includes(business.status)}
        city={businessCityLabel(business)}
        sector={sectorLabel}
        shareUrl={businessShareUrl}
        shareTitle={pt('professional.profile.shareTitle', { name: business.name })}
        shareText={shareText}
      />
    </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
        {label}
      </p>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  )
}
