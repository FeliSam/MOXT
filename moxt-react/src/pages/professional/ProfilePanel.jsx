import { activityByValue } from '../../config/businessActivities'
import { buildAbsoluteUrl } from '../../utils/siteUrl'
import { QrSharePanel } from '../../features/share/QrSharePanel'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { statusMeta } from '../../config/statuses'

export function ProfilePanel({ activity, business, secondaryActivity }) {
  const businessShareUrl = buildAbsoluteUrl(
    `/businesses/${business.id}/publications/listings`,
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        {business.bannerUrl ? (
          <div className="relative mb-10">
            <img
              src={business.bannerUrl}
              alt={`Bannière ${business.name}`}
              className="h-44 w-full rounded-[1.8rem] object-cover"
            />
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={`${business.name} logo`}
                className="absolute -bottom-8 left-4 size-16 rounded-3xl border-4 border-[var(--app-surface)] object-cover shadow-md"
              />
            ) : null}
          </div>
        ) : business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={`${business.name} logo`}
            className="mb-4 size-16 rounded-3xl object-cover shadow-md"
          />
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">
              Profil professionnel
            </p>
            <h2 className="mt-1 text-2xl font-black">{business.name}</h2>
            <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-[var(--app-text-muted)]">
              {business.description}
            </p>
          </div>
          <Badge tone={statusMeta(business.status).tone}>{statusMeta(business.status).label}</Badge>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Info label="Domaine principal" value={activity?.label || business.sector} />
          <Info
            label="Activité secondaire"
            value={secondaryActivity?.label || 'Aucune activité secondaire'}
          />
          <Info label="Ville" value={business.city} />
          <Info label="Adresse" value={business.address || 'Adresse à compléter'} />
          <Info label="Téléphone russe" value={business.phone} />
          <Info label="Numéro pays d'origine" value={business.originPhone || 'Non renseigné'} />
          <Info label="Email" value={business.email || 'Non renseigné'} />
          <Info label="Horaires" value={business.scheduleSummary || business.hours} />
          <Info label="Zones" value={business.serviceZones || 'Russie'} />
        </div>
      </Card>

      <QrSharePanel
        variant="business"
        title={business.name}
        subtitle={activityByValue(business.primaryActivity)?.label || business.sector}
        avatarUrl={business.logoUrl}
        verified={['verified', 'approved', 'active'].includes(business.status)}
        city={business.city}
        sector={activity?.label || business.sector}
        shareUrl={businessShareUrl}
        shareTitle={`${business.name} sur MOXT`}
        shareText={`Découvrez ${business.name} sur MOXT.`}
      />
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
