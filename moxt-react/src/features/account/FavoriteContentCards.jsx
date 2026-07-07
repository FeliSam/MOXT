import {
  FiBriefcase,
  FiCalendar,
  FiHeart,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiTrash2,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CatalogGrid } from '../../components/ui/CatalogGrid'
import { formatMoney } from '../transfers/transferUtils'
import { formatListingPrice } from './favoriteUtils'

function FavoriteRemoveButton({ item, onRemove }) {
  if (item.legacy) return null
  return (
    <Button className="w-full min-w-0" variant="ghost" icon={FiTrash2} onClick={() => onRemove(item)}>
      Retirer
    </Button>
  )
}

function ListingFavoriteCard({ item, onRemove }) {
  const { display, path } = item
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-44 bg-gradient-to-br from-cyan-700 to-blue-600">
        {display.image ? (
          <img src={display.image} alt={display.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-white">
            <FiShoppingBag className="text-3xl opacity-90" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="mb-1 flex flex-wrap gap-1">
            {display.typeLabel ? (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
                {display.typeLabel}
              </span>
            ) : null}
            {display.categoryLabel ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black text-white/80 backdrop-blur-sm">
                {display.categoryLabel}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-sm font-black text-white">{display.title}</h3>
          <div className="mt-1 flex items-end justify-between gap-2">
            <strong className="text-sm font-black text-white">
              {formatListingPrice(display.price, display.currency)}
            </strong>
            {display.city ? (
              <p className="flex min-w-0 items-center gap-1 text-[11px] text-white/75">
                <FiMapPin className="shrink-0" />
                <span className="truncate">{display.city}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid gap-2 p-3">
        <Link to={path}>
          <Button className="w-full" variant="secondary">
            Ouvrir
          </Button>
        </Link>
        <FavoriteRemoveButton item={item} onRemove={onRemove} />
      </div>
    </Card>
  )
}

function ParcelFavoriteCard({ item, onRemove }) {
  const { display, path } = item
  return (
    <Card className="grid min-w-0 content-start gap-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40">
          <FiPackage />
        </span>
        <Badge tone="info">Colis</Badge>
      </div>
      <div className="min-w-0">
        <h3 className="font-black">
          {display.origin} → {display.destination}
        </h3>
        {display.departureDate ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-[var(--app-text-muted)]">
            <FiCalendar className="shrink-0" />
            Départ le {display.departureDate}
          </p>
        ) : null}
      </div>
      <div className="grid gap-1 text-sm">
        {display.remainingKg != null ? (
          <p>
            <strong>{display.remainingKg} kg</strong> disponibles
          </p>
        ) : null}
        {display.pricePerKg != null ? (
          <p className="font-bold text-brand-700">
            {formatMoney(display.pricePerKg, display.currency)} / kg
          </p>
        ) : null}
      </div>
      <Link to={path}>
        <Button className="w-full" variant="secondary">
          Ouvrir
        </Button>
      </Link>
      <FavoriteRemoveButton item={item} onRemove={onRemove} />
    </Card>
  )
}

function JobFavoriteCard({ item, onRemove }) {
  const { display, path } = item
  return (
    <Card className="grid min-w-0 content-start gap-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40">
          <FiBriefcase />
        </span>
        {display.contractType ? <Badge>{display.contractType}</Badge> : null}
      </div>
      <div className="min-w-0">
        <h3 className="font-black">{display.title}</h3>
        {display.publisherName ? (
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{display.publisherName}</p>
        ) : null}
      </div>
      <div className="grid gap-1 text-sm">
        {display.location ? (
          <p className="flex items-center gap-1 text-[var(--app-text-muted)]">
            <FiMapPin className="shrink-0" />
            {display.location}
          </p>
        ) : null}
        {display.salary ? <p className="font-bold text-brand-700">{display.salary}</p> : null}
        {display.sector ? <p className="text-[var(--app-text-muted)]">{display.sector}</p> : null}
      </div>
      <Link to={path}>
        <Button className="w-full" variant="secondary">
          Ouvrir
        </Button>
      </Link>
      <FavoriteRemoveButton item={item} onRemove={onRemove} />
    </Card>
  )
}

function OtherFavoriteCard({ item, onRemove }) {
  const { display, path, relatedType } = item
  const isEvent = relatedType === 'event'
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900">
        {display.image ? (
          <img src={display.image} alt={display.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-white">
            {isEvent ? <FiCalendar className="text-3xl opacity-90" /> : <FiHeart className="text-3xl opacity-90" />}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <Badge tone={isEvent ? 'warning' : 'success'} className="mb-2">
            {isEvent ? 'Événement' : 'Entreprise'}
          </Badge>
          <h3 className="line-clamp-2 text-sm font-black text-white">{display.title}</h3>
          {display.subtitle ? (
            <p className="mt-1 text-xs text-white/80">{display.subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 p-3 text-sm">
        {isEvent && display.date ? (
          <p className="flex items-center gap-1 text-[var(--app-text-muted)]">
            <FiCalendar className="shrink-0" />
            {display.date}
          </p>
        ) : null}
        {display.location || display.city ? (
          <p className="flex items-center gap-1 text-[var(--app-text-muted)]">
            <FiMapPin className="shrink-0" />
            {display.location || display.city}
          </p>
        ) : null}
        {isEvent && display.price != null ? (
          <p className="font-bold text-brand-700">
            {display.price > 0 ? formatMoney(display.price, display.currency) : 'Gratuit'}
          </p>
        ) : null}
        <Link to={path}>
          <Button className="w-full" variant="secondary">
            Ouvrir
          </Button>
        </Link>
        <FavoriteRemoveButton item={item} onRemove={onRemove} />
      </div>
    </Card>
  )
}

function FavoriteCard({ item, onRemove }) {
  switch (item.relatedType) {
    case 'listing':
      return <ListingFavoriteCard item={item} onRemove={onRemove} />
    case 'parcel':
      return <ParcelFavoriteCard item={item} onRemove={onRemove} />
    case 'job':
      return <JobFavoriteCard item={item} onRemove={onRemove} />
    default:
      return <OtherFavoriteCard item={item} onRemove={onRemove} />
  }
}

export function FavoriteCategorySection({ category, items, onRemove }) {
  return (
    <section className="grid gap-4">
      <div>
        <h3 className="text-base font-black">{category.label}</h3>
        <p className="text-sm text-[var(--app-text-muted)]">
          {items.length} élément{items.length > 1 ? 's' : ''}
        </p>
      </div>
      <CatalogGrid lazy={false}>
        {items.map((item) => (
          <FavoriteCard key={item.id} item={item} onRemove={onRemove} />
        ))}
      </CatalogGrid>
    </section>
  )
}
