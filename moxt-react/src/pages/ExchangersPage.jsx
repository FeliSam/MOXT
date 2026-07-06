import { FiClock, FiRepeat, FiStar } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { FALLBACK_EXCHANGERS } from '../features/transfers/transferConfig'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

export function ExchangersPage() {
  useScrollToSecondSection()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const businesses = useSelector((state) => state.businesses.items)
  const verified = businesses.filter(
    (business) =>
      business.services?.includes('Transfert') &&
      ['verified', 'approved', 'active'].includes(business.status),
  )
  const exchangers = verified.length ? verified : FALLBACK_EXCHANGERS
  const visibleExchangers = useMemo(
    () =>
      exchangers.filter((exchanger) => {
        const haystack =
          `${exchanger.name} ${exchanger.city || ''} ${exchanger.averageDelay || ''}`.toLowerCase()
        return (
          (!query || haystack.includes(query.toLowerCase())) &&
          (!city || exchanger.city?.toLowerCase().includes(city.toLowerCase()))
        )
      }),
    [city, exchangers, query],
  )

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Finances"
        title="Échangeurs"
        description="Comparez les partenaires disponibles avant de créer une opération."
        stats={[{ label: 'Partenaires', value: visibleExchangers.length }]}
        actions={
          <Link to="/transfers">
            <Button icon={FiRepeat}>Nouveau transfert</Button>
          </Link>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visibleExchangers.length}
          query={query}
          onQueryChange={setQuery}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={() => {
            setQuery('')
            setCity('')
          }}
          placeholder="Échangeur, ville ou délai..."
        >
          <div className="max-w-sm">
            <Input
              id="exchanger-filter-city"
              label="Ville"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
        </CatalogSearch>
        {visibleExchangers.length ? (
        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visibleExchangers.map((exchanger, index) => (
            <RevealListItem key={exchanger.id} index={index}>
              <Card variant="interactive" className="flex h-full flex-col">
                <div className="flex items-start gap-3">
                  <img
                    src="/assets/services/service-exchangers.svg"
                    alt=""
                    className="size-12 shrink-0 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate">{exchanger.name}</strong>
                    {['verified', 'approved', 'active'].includes(exchanger.status) ? (
                      <VerifiedBadge size="sm" className="mt-1" />
                    ) : null}
                  </div>
                  <Badge tone="success" className="shrink-0">Disponible</Badge>
                </div>

                {/* Comparaison rapide */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-sm font-black tabular-nums">
                      <FiStar className="text-amber-500" /> {exchanger.rating || 0}
                    </p>
                    <span className="text-[10px] text-[var(--app-text-faint)]">Note</span>
                  </div>
                  <div className="border-x border-[var(--app-border)] text-center">
                    <p className="text-sm font-black tabular-nums">{exchanger.feePercent ?? 2.5}%</p>
                    <span className="text-[10px] text-[var(--app-text-faint)]">Frais</span>
                  </div>
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-sm font-black">
                      <FiClock className="text-[var(--app-text-faint)]" />
                    </p>
                    <span className="text-[10px] text-[var(--app-text-faint)]">
                      {exchanger.averageDelay || 'A confirmer'}
                    </span>
                  </div>
                </div>

                <Link
                  className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-border-md)] py-2.5 text-sm font-bold text-brand-700 transition hover:bg-[var(--app-surface-muted)] dark:text-brand-300"
                  to={`/exchangers/${exchanger.id}`}
                >
                  Voir la fiche
                </Link>
              </Card>
            </RevealListItem>
          ))}
        </CatalogGrid>
        ) : (
          <EmptyState title="Aucun échangeur disponible" />
        )}
      </ScrollSectionAnchor>
    </div>
  )
}
