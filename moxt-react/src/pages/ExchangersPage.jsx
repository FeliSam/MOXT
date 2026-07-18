import { useMemo, useState } from 'react'
import { FiClock, FiRepeat, FiStar } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { flagEmoji } from '../config/flags'
import { useLanguage } from '../contexts/useLanguage'
import { isStaffRole } from '../features/auth/roleUtils'
import { ExchangerPickerAvatar } from '../features/transfers/ExchangerPickerAvatar'
import {
  EXCHANGER_DELAY_TO_CONFIRM,
  listExchangersForTransfer,
  resolveUserPartnerCountry,
} from '../features/transfers/exchangerListUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'
import { phase3Text } from '../i18n/phase3I18n'

const COUNTRY_SCOPE_ALL = 'all'
const COUNTRY_SCOPE_MINE = 'mine'

export function ExchangersPage() {
  useScrollToSecondSection()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const toConfirmLabel = p3('exchangers.toConfirm')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const user = useSelector((state) => state.auth.user)
  const [countryScope, setCountryScope] = useState(
    isStaffRole(user) ? COUNTRY_SCOPE_ALL : COUNTRY_SCOPE_MINE,
  )
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const businesses = useSelector((state) => state.businesses.items)
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const userCountry = resolveUserPartnerCountry(user, originCountry)

  const exchangers = useMemo(
    () =>
      listExchangersForTransfer({
        businesses,
        user,
        originCountry,
        includeAllCountries: countryScope === COUNTRY_SCOPE_ALL,
        toConfirmLabel,
      }),
    [businesses, countryScope, originCountry, toConfirmLabel, user],
  )

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

  const activeFilterCount = Number(countryScope === COUNTRY_SCOPE_ALL) + Number(Boolean(city))

  function delayLabel(value) {
    if (!value || value === EXCHANGER_DELAY_TO_CONFIRM || value === 'A confirmer') {
      return toConfirmLabel
    }
    return value
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('exchangers.eyebrow')}
        title={p3('exchangers.title')}
        description={
          countryScope === COUNTRY_SCOPE_ALL
            ? p3('exchangers.description.all')
            : p3('exchangers.description.country')
        }
        stats={[{ label: p3('exchangers.stats.partners'), value: visibleExchangers.length }]}
        actions={
          <Link to="/transfers">
            <Button icon={FiRepeat}>{p3('exchangers.newTransfer')}</Button>
          </Link>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <CatalogSearch
          advancedOpen={advancedOpen}
          activeFilterCount={activeFilterCount}
          count={visibleExchangers.length}
          query={query}
          onQueryChange={setQuery}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={() => {
            setQuery('')
            setCity('')
            setCountryScope(COUNTRY_SCOPE_MINE)
          }}
          placeholder={p3('exchangers.searchPlaceholder')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              id="exchanger-filter-scope"
              label={p3('common.country')}
              value={countryScope}
              onChange={(event) => setCountryScope(event.target.value)}
            >
              <option value={COUNTRY_SCOPE_MINE}>
                {p3('exchangers.myCountry', {
                  flag: flagEmoji(userCountry),
                  code: userCountry,
                })}
              </option>
              <option value={COUNTRY_SCOPE_ALL}>{p3('exchangers.allExchangers')}</option>
            </Select>
            <Input
              id="exchanger-filter-city"
              label={p3('common.city')}
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
                  <ExchangerPickerAvatar exchanger={exchanger} />
                  <div className="min-w-0 flex-1">
                    <VerifiedDisplayName
                      as="strong"
                      name={exchanger.name}
                      verified={['verified', 'approved', 'active'].includes(exchanger.status)}
                      iconSize="sm"
                      className="block"
                      nameClassName="truncate"
                    />
                    <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                      {flagEmoji(exchanger.country)} {exchanger.city || exchanger.country}
                    </p>
                  </div>
                  <Badge tone="success" className="shrink-0">{p3('exchangers.available')}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-sm font-black tabular-nums">
                      <FiStar className="text-amber-500" /> {exchanger.rating || 0}
                    </p>
                    <span className="text-[10px] text-[var(--app-text-faint)]">{p3('exchangers.rating')}</span>
                  </div>
                  <div className="border-x border-[var(--app-border)] text-center">
                    <p className="text-sm font-black tabular-nums">{exchanger.feePercent ?? 2.5}%</p>
                    <span className="text-[10px] text-[var(--app-text-faint)]">{p3('exchangers.fees')}</span>
                  </div>
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-sm font-black">
                      <FiClock className="text-[var(--app-text-faint)]" />
                    </p>
                    <span className="text-[10px] text-[var(--app-text-faint)]">
                      {delayLabel(exchanger.averageDelay)}
                    </span>
                  </div>
                </div>

                <Link
                  className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-border-md)] py-2.5 text-sm font-bold text-brand-700 transition hover:bg-[var(--app-surface-muted)] dark:text-brand-300"
                  to={`/exchangers/${exchanger.id}${
                    countryScope === COUNTRY_SCOPE_ALL ? '?scope=all' : ''
                  }`}
                >
                  {p3('exchangers.viewProfile')}
                </Link>
              </Card>
            </RevealListItem>
          ))}
        </CatalogGrid>
        ) : (
          <EmptyState
            title={
              countryScope === COUNTRY_SCOPE_ALL
                ? p3('exchangers.empty.search')
                : p3('exchangers.empty.country')
            }
            description={
              countryScope === COUNTRY_SCOPE_ALL
                ? p3('exchangers.empty.searchDesc')
                : p3('exchangers.empty.countryDesc', { flag: flagEmoji(userCountry) })
            }
          />
        )}
      </ScrollSectionAnchor>
    </div>
  )
}
