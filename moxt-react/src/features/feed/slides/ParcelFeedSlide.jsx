import { useState } from 'react'
import { FiArrowRight, FiCalendar, FiMapPin, FiPackage } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { resolveMediaDisplayUrl } from '../../../services/media/mediaUrlUtils.js'
import { formatMoney } from '../../transfers/transferUtils'
import { readParcelDepartureDate } from '../../parcels/parcelUtils'
import { phase3Text } from '../../../i18n/phase3I18n'
import { FeedMediaImage } from '../FeedMediaImage'
import { FeedSlideShell } from '../FeedSlideShell'

function formatFeedDate(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  try {
    return new Intl.DateTimeFormat(language || 'fr', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return String(value)
  }
}

function ParcelDateRow({ icon: Icon, label, className = '' }) {
  if (!label) return null
  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 rounded-2xl bg-white/10 px-2.5 py-2.5 ring-1 ring-inset ring-white/10 sm:gap-2 sm:px-3 ${className}`}
    >
      <Icon className="shrink-0 text-white/70" aria-hidden />
      <p className="min-w-0 truncate text-[12px] font-bold text-white sm:text-[13px]">{label}</p>
    </div>
  )
}

/**
 * Slide colis : sens d’envoi + dates (départ, arrivée, récupération).
 */
export function ParcelFeedSlide({ item, index, active = true }) {
  const { t, language } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const parcel = item.source || {}
  const origin = item.stats?.origin || parcel.origin || ''
  const destination = item.stats?.destination || parcel.destination || ''
  const departureRaw = item.stats?.departureDate || readParcelDepartureDate(parcel)
  const arrivalRaw =
    parcel.arrivalDate ||
    parcel.arrival_date ||
    item.stats?.distributionDate ||
    parcel.distributionDate ||
    parcel.distribution_date ||
    ''
  const pickupRaw =
    item.stats?.distributionDate || parcel.distributionDate || parcel.distribution_date || ''
  const departureLabel = departureRaw
    ? p3('feed.parcel.departure', { date: formatFeedDate(departureRaw, language) })
    : ''
  const arrivalLabel = arrivalRaw
    ? p3('feed.parcel.arrival', { date: formatFeedDate(arrivalRaw, language) })
    : ''
  const pickupLabel = pickupRaw
    ? p3('feed.parcel.pickup', { date: formatFeedDate(pickupRaw, language) })
    : ''
  const price =
    item.stats?.pricePerKg != null
      ? formatMoney(item.stats.pricePerKg, item.stats.currency)
      : null
  const remaining =
    item.stats?.remainingKg != null ? p3('feed.meta.remainingKg', { kg: item.stats.remainingKg }) : null
  const rawCover = item.media?.poster || item.media?.images?.[0] || ''
  const cover = resolveMediaDisplayUrl(rawCover, { legacyBucket: 'documents' }) || ''
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(cover) && !broken

  const metaLine = [
    departureLabel,
    arrivalLabel,
    pickupLabel,
    price ? p3('feed.meta.pricePerKg', { price }) : null,
    remaining,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <FeedSlideShell
      index={index}
      item={item}
      publisher={item.publisher}
      title={null}
      caption={item.caption}
      captionLines={1}
      active={active}
      ctaLabel={p3('feed.cta.parcel')}
      ctaTo={item.href}
      metaExtra={
        <div className="mt-2 space-y-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-[1.05rem] font-black leading-snug tracking-tight text-white">
              {origin || '—'}
            </span>
            <FiArrowRight className="shrink-0 text-white/70" aria-hidden />
            <span className="min-w-0 truncate text-[1.05rem] font-black leading-snug tracking-tight text-white">
              {destination || '—'}
            </span>
          </div>
          {metaLine ? (
            <p className="truncate text-[12px] font-semibold text-white/90">{metaLine}</p>
          ) : null}
        </div>
      }
    >
      <div className="relative h-full w-full bg-gradient-to-br from-sky-700 via-blue-900 to-indigo-950">
        {showImage ? <FeedMediaImage src={cover} onError={() => setBroken(true)} /> : null}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/25 via-transparent to-black/45" />

        <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+4.25rem)] z-10 px-5">
          <div className="relative mx-auto max-w-sm rounded-[1.5rem] border border-white/15 bg-black/35 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
            {(price || remaining) && (
              <div className="pointer-events-none absolute -top-3 right-3 z-20 flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1.5">
                {price ? (
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-black shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
                    {p3('feed.meta.pricePerKg', { price })}
                  </span>
                ) : null}
                {remaining ? (
                  <span className="rounded-full bg-black/80 px-3 py-1 text-[11px] font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] ring-1 ring-white/25 backdrop-blur-sm">
                    {remaining}
                  </span>
                ) : null}
              </div>
            )}

            <p className="pr-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
              {p3('feed.parcel.routeLabel')}
            </p>
            <div className="mt-3 grid gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/30">
                  <FiMapPin className="text-sm" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                    {p3('feed.parcel.from')}
                  </p>
                  <p className="truncate text-[1.15rem] font-black tracking-tight text-white">
                    {origin || '—'}
                  </p>
                </div>
              </div>
              <div className="ml-4 h-6 w-px bg-gradient-to-b from-white/35 to-white/10" aria-hidden />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-indigo-400/20 text-indigo-100 ring-1 ring-indigo-300/30">
                  <FiMapPin className="text-sm" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                    {p3('feed.parcel.to')}
                  </p>
                  <p className="truncate text-[1.15rem] font-black tracking-tight text-white">
                    {destination || '—'}
                  </p>
                </div>
              </div>
            </div>

            {(departureLabel || arrivalLabel || pickupLabel) && (
              <div className="mt-4 grid gap-2">
                {departureLabel && arrivalLabel ? (
                  <div className="grid grid-cols-2 gap-2">
                    <ParcelDateRow icon={FiCalendar} label={departureLabel} />
                    <ParcelDateRow icon={FiCalendar} label={arrivalLabel} />
                  </div>
                ) : (
                  <>
                    <ParcelDateRow icon={FiCalendar} label={departureLabel} />
                    <ParcelDateRow icon={FiCalendar} label={arrivalLabel} />
                  </>
                )}
                <ParcelDateRow icon={FiPackage} label={pickupLabel} />
              </div>
            )}

          </div>
        </div>
      </div>
    </FeedSlideShell>
  )
}
