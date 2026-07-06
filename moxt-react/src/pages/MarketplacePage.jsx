import { FiList, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { PillBadge } from '../components/ui/Badge'
import { RevealListItem } from '../components/ui/RevealListItem'
import { Select } from '../components/ui/Select'
import {
  categoriesForType,
  LISTING_TYPES_META,
  listingSpecificDetails,
} from '../config/listingConfig'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import {
  resetMarketplaceFilters,
  setMarketplaceFilters,
} from '../features/marketplace/marketplaceSlice'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

export function MarketplacePage() {
  useScrollToSecondSection()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const listings = useSelector((state) => state.marketplace.items)
  const filters = useSelector((state) => state.marketplace.filters)
  const categoryOptions = useMemo(
    () => (filters.type ? categoriesForType(filters.type) : []),
    [filters.type],
  )
  const visible = useMemo(
    () =>
      listings.filter((item) => {
        if (item.status !== 'active') return false
        const searchText = [
          item.title,
          item.description,
          item.city,
          item.district,
          item.address,
          item.category,
          item.type,
          item.brand,
          item.model,
          item.sellerName,
          ...listingSpecificDetails(item).map((detail) => `${detail.label} ${detail.value}`),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return (
          (!filters.query || searchText.includes(filters.query.toLowerCase())) &&
          (!filters.type || item.type === filters.type) &&
          (!filters.category || item.category === filters.category) &&
          (!filters.city ||
            `${item.city || ''} ${item.district || ''}`
              .toLowerCase()
              .includes(filters.city.toLowerCase())) &&
          (!filters.min || Number(item.price) >= Number(filters.min)) &&
          (!filters.max || Number(item.price) <= Number(filters.max))
        )
      }),
    [filters, listings],
  )

  return (
    <div className="community-warm-bg grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow="Marketplace"
        title="Marketplace"
        description="Produits, services, locations et offres publiés par la communauté."
        stats={[
          { label: 'Annonces actives', value: visible.length },
          { label: 'Categories', value: LISTING_TYPES_META.length },
        ]}
        actions={
          <>
            <Link to="/marketplace/mine">
              <Button variant="secondary" icon={FiList}>
                Mes annonces
              </Button>
            </Link>
            <Button icon={FiPlus} onClick={() => navigate('/marketplace/publish')}>
              Publier une annonce
            </Button>
          </>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <div className="scrollbar-hidden -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <PillBadge
            active={!filters.type}
            onClick={() => dispatch(setMarketplaceFilters({ type: '', category: '' }))}
          >
            Tout
          </PillBadge>
          {LISTING_TYPES_META.map((option) => (
            <PillBadge
              key={option.value}
              active={filters.type === option.value}
              onClick={() =>
                dispatch(setMarketplaceFilters({ type: option.value, category: '' }))
              }
              className="shrink-0"
            >
              {option.label}
            </PillBadge>
          ))}
        </div>

        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visible.length}
          activeFilterCount={[filters.category, filters.city, filters.min, filters.max].filter(Boolean).length}
          query={filters.query}
          onQueryChange={(query) => dispatch(setMarketplaceFilters({ query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={() => dispatch(resetMarketplaceFilters())}
          placeholder="Rechercher : iPhone, coiffure, appartement, électricien..."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              id="market-type"
              label="Type"
              value={filters.type}
              onChange={(event) =>
                dispatch(setMarketplaceFilters({ type: event.target.value, category: '' }))
              }
            >
              <option value="">Tous</option>
              {LISTING_TYPES_META.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              id="market-category"
              label="Categorie"
              value={filters.category || ''}
              disabled={!filters.type}
              onChange={(event) =>
                dispatch(setMarketplaceFilters({ category: event.target.value }))
              }
            >
              <option value="">{filters.type ? 'Toutes' : 'Choisissez un type d abord'}</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              id="market-city"
              label="Ville / quartier"
              value={filters.city}
              onChange={(event) => dispatch(setMarketplaceFilters({ city: event.target.value }))}
            />
            <Input
              id="market-min"
              label="Prix minimum"
              type="number"
              value={filters.min}
              onChange={(event) => dispatch(setMarketplaceFilters({ min: event.target.value }))}
            />
            <Input
              id="market-max"
              label="Prix maximum"
              type="number"
              value={filters.max}
              onChange={(event) => dispatch(setMarketplaceFilters({ max: event.target.value }))}
            />
          </div>
        </CatalogSearch>
        <section>
          {visible.length ? (
            <CatalogGrid lazy={false}>
              {visible.map((listing, index) => (
                <RevealListItem key={listing.id} index={index}>
                  <Link to={`/marketplace/${listing.id}`}>
                    <MarketplaceListingCard listing={listing} />
                  </Link>
                </RevealListItem>
              ))}
            </CatalogGrid>
          ) : (
            <EmptyState
              icon={FiShoppingBag}
              tone="warm"
              title="Aucune annonce trouvée"
              description="Essayez d'élargir votre recherche ou publiez la vôtre des maintenant."
              action={
                <Button icon={FiPlus} onClick={() => navigate('/marketplace/publish')}>
                  Publier une annonce
                </Button>
              }
            />
          )}
        </section>
      </ScrollSectionAnchor>
    </div>
  )
}
