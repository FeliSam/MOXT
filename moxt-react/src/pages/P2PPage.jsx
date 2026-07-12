import { useFormik } from 'formik'
import { FiAlertTriangle, FiArrowRight, FiPlus, FiShield, FiUsers } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { PublicationModal } from '../components/ui/PublicationModal'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { p2pOfferSchema } from '../features/p2p/p2pSchemas'
import { acceptOffer, createOffer } from '../features/p2p/p2pSlice'
import { calculateP2PFee, p2pLimit } from '../features/p2p/p2pUtils'
import { transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { formatMoney } from '../features/transfers/transferUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'
import { useSecurityGate } from '../features/security/useSecurityGate'

export function P2PPage() {
  useScrollToSecondSection()
  const [publishOpen, setPublishOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [tab, setTab] = useState('active')
  const [filters, setFilters] = useState({
    query: '',
    fromCurrency: '',
    toCurrency: '',
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { requireP2PPublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const offers = useSelector((state) => state.p2p.offers)
  const orders = useSelector((state) => state.p2p.orders)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const availableCurrencies = transferCurrenciesForCountry(originCountry)
  const filteredOffers = useMemo(
    () =>
      offers.filter((offer) => {
        const haystack =
          `${offer.ownerName} ${offer.method} ${offer.comment} ${offer.fromCurrency} ${offer.toCurrency}`.toLowerCase()
        return (
          availableCurrencies.includes(offer.fromCurrency) &&
          availableCurrencies.includes(offer.toCurrency) &&
          (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
          (!filters.fromCurrency || offer.fromCurrency === filters.fromCurrency) &&
          (!filters.toCurrency || offer.toCurrency === filters.toCurrency)
        )
      }),
    [availableCurrencies, filters, offers],
  )

  const activeOffers = useMemo(
    () => filteredOffers.filter((offer) => offer.status === 'active'),
    [filteredOffers],
  )

  const archivedOffers = useMemo(
    () => filteredOffers.filter((offer) => offer.status !== 'active'),
    [filteredOffers],
  )

  const displayedOffers = tab === 'active' ? activeOffers : archivedOffers
  function clearFilters() {
    setFilters({ query: '', fromCurrency: '', toCurrency: '' })
  }
  const formik = useFormik({
    initialValues: {
      fromCurrency: availableCurrencies[0],
      toCurrency: availableCurrencies[1] || availableCurrencies[0],
      amount: '',
      rate: '',
      method: '',
      comment: '',
    },
    validationSchema: p2pOfferSchema,
    validate: (values) => {
      const errors = {}
      if (values.fromCurrency === values.toCurrency)
        errors.toCurrency = 'Choisissez une autre devise.'
      if (Number(values.amount) > p2pLimit(user, values.fromCurrency)) {
        errors.amount = `Votre plafond est ${formatMoney(p2pLimit(user, values.fromCurrency), values.fromCurrency)}.`
      }
      return errors
    },
    onSubmit: (values, helpers) => {
      if (!requireP2PPublish()) return
      dispatch(
        createOffer({
          ...values,
          ownerId: user.id,
          ownerName: business?.name || `${user.firstName} ${user.lastName}`,
          businessId: business?.id || null,
        }),
      )
      helpers.resetForm()
      setPublishOpen(false)
    },
  })

  function handleAccept(offer) {
    const action = dispatch(acceptOffer({ buyer: user, offer }))
    if (action.payload?.id) navigate(`/p2p/orders/${action.payload.id}`)
  }

  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Échanges communautaires"
        title="Échanges P2P"
        description="Publiez une offre après vérification de votre compte, ou acceptez une offre existante."
        stats={[{ label: 'Offres actives', value: activeOffers.length }]}
        actions={
          <Button
            icon={FiPlus}
            onClick={() => {
              if (requireP2PPublish()) setPublishOpen(true)
            }}
          >
            Proposer une offre
          </Button>
        }
      />

      <ScrollSectionAnchor
        className="scroll-mt-24 flex flex-col gap-3 rounded-[var(--radius-card-lg)] border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start lg:scroll-mt-28 dark:border-amber-900/40 dark:bg-amber-950/20"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <FiShield />
        </span>
        <div className="grid gap-1 text-sm text-amber-900 dark:text-amber-200">
          <strong className="flex items-center gap-1.5 font-black">
            <FiAlertTriangle className="text-xs" /> Echangez en toute securite
          </strong>
          <p className="text-xs leading-5 text-amber-800/90 dark:text-amber-300/80">
            Ne payez jamais en dehors de MOXT, conservez toutes vos preuves de paiement et verifiez
            l'identite de votre interlocuteur avant toute transaction.
          </p>
        </div>
      </ScrollSectionAnchor>

      <div className="grid gap-5">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={displayedOffers.length}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder="Devise, méthode, utilisateur ou condition..."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="p2p-filter-from"
              label="Devise proposée"
              value={filters.fromCurrency}
              onChange={(event) =>
                setFilters((current) => ({ ...current, fromCurrency: event.target.value }))
              }
            >
              <option value="">Toutes</option>
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
            <Select
              id="p2p-filter-to"
              label="Devise recherchée"
              value={filters.toCurrency}
              onChange={(event) =>
                setFilters((current) => ({ ...current, toCurrency: event.target.value }))
              }
            >
              <option value="">Toutes</option>
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>
        </CatalogSearch>
        <CatalogArchiveTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'active', label: 'Offres actives', count: activeOffers.length },
            { key: 'archived', label: 'Archives', count: archivedOffers.length },
          ]}
        />
        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {displayedOffers.length ? (
            displayedOffers.map((offer, index) => (
              <RevealListItem key={offer.id} index={index}>
                <Card
                  variant="interactive"
                  className={`group flex h-full flex-col overflow-hidden p-4 ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 sm:p-5 dark:hover:ring-brand-800 ${tab === 'archived' ? 'opacity-80' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                      <FiUsers />
                    </span>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      <Badge tone={offer.status === 'active' ? 'success' : 'warning'}>
                        {offer.status === 'active' ? 'Active' : 'Archivée'}
                      </Badge>
                      {offer.businessId ? (
                        <VerifiedBadge size="sm" label="Entreprise" />
                      ) : (
                        <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-black text-[var(--app-text-faint)]">
                          Particulier
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="mt-3.5 truncate text-sm font-black tabular-nums leading-snug sm:text-base">
                    {formatMoney(offer.amount, offer.fromCurrency)} vers {offer.toCurrency}
                  </h2>
                  <p className="mt-1.5 truncate text-xs text-[var(--app-text-faint)]">
                    {offer.ownerName}
                  </p>

                  {/* Bandeau devises, sur le modèle de la carte Colis */}
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                    <div className="min-w-0 flex-1 text-center">
                      <p className="truncate text-xs font-black uppercase tracking-wide text-[var(--app-text)]">
                        {offer.fromCurrency}
                      </p>
                    </div>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-white dark:bg-brand-600">
                      <FiArrowRight className="text-xs" />
                    </span>
                    <div className="min-w-0 flex-1 text-center">
                      <p className="truncate text-xs font-black uppercase tracking-wide text-[var(--app-text)]">
                        {offer.toCurrency}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid flex-1 content-start gap-2 sm:grid-cols-2">
                    <P2PMetric value={`Taux ${offer.rate}`} label={offer.method} />
                    <P2PMetric
                      value={formatMoney(
                        calculateP2PFee(offer.amount, offer.fromCurrency),
                        offer.fromCurrency,
                      )}
                      label="Frais estimés"
                    />
                  </div>

                  {offer.comment ? (
                    <p className="mt-3 line-clamp-2 text-xs text-[var(--app-text-muted)]">
                      {offer.comment}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2">
                    {tab === 'active' && offer.status === 'active' && offer.ownerId !== user.id ? (
                      <Button
                        size="sm"
                        className="min-h-10 flex-1 sm:min-h-11"
                        onClick={() => handleAccept(offer)}
                      >
                        Accepter
                      </Button>
                    ) : null}
                    <Link
                      to={`/p2p/${offer.id}`}
                      className={
                        tab === 'active' && offer.status === 'active' && offer.ownerId !== user.id
                          ? 'shrink-0'
                          : 'flex-1'
                      }
                    >
                      <span className="flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 text-center text-xs font-black text-white transition group-hover:bg-brand-800 sm:min-h-11 sm:text-sm dark:bg-brand-600">
                        Détail <FiArrowRight className="text-xs" />
                      </span>
                    </Link>
                  </div>
                </Card>
              </RevealListItem>
            ))
          ) : (
            <EmptyState
              className="col-span-full"
              icon={FiUsers}
              tone="search"
              title={tab === 'active' ? 'Aucune offre P2P active' : 'Aucune archive'}
              description={
                tab === 'active'
                  ? 'Proposez la premiere offre ou ajustez vos filtres.'
                  : 'Les offres acceptées ou clôturées apparaîtront ici.'
              }
              action={
                tab === 'active' ? (
                  <Button icon={FiPlus} onClick={() => setPublishOpen(true)}>
                    Proposer une offre
                  </Button>
                ) : undefined
              }
            />
          )}
          {orders.length ? (
            <div className="mt-3">
              <h2 className="mb-3 text-lg font-black">Mes transactions récentes</h2>
              <div className="grid gap-3">
                {orders
                  .filter((order) => [order.buyerId, order.sellerId].includes(user.id))
                  .map((order) => (
                    <Link key={order.id} to={`/p2p/orders/${order.id}`}>
                      <Card className="flex items-center justify-between gap-4">
                        <div>
                          <strong>{order.id}</strong>
                          <p className="mt-1 text-xs text-slate-500">
                            {order.sellerName} vers {order.buyerName}
                          </p>
                        </div>
                        <FiArrowRight className="text-brand-700" />
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          ) : null}
        </CatalogGrid>
        <PublicationModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          title="Proposer une offre P2P"
          description="Précisez les devises, le montant, le taux et les modalités de votre échange."
          icon={FiUsers}
        >
          <p className="mt-2 text-sm text-slate-500">
            Plafond actuel :{' '}
            {formatMoney(p2pLimit(user, formik.values.fromCurrency), formik.values.fromCurrency)}
          </p>
          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
            Vos échanges P2P sont limités aux devises disponibles pour votre profil :{' '}
            {availableCurrencies.join(', ')}.
          </p>
          <form className="mt-5 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="p2p-from" label="Je propose" {...formik.getFieldProps('fromCurrency')}>
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
              <Select
                id="p2p-to"
                label="Je recherche"
                {...formik.getFieldProps('toCurrency')}
                error={errorFor('toCurrency')}
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              id="p2p-amount"
              label="Montant"
              type="number"
              {...formik.getFieldProps('amount')}
              error={errorFor('amount')}
            />
            <Input
              id="p2p-rate"
              label="Taux proposé"
              type="number"
              step="0.0001"
              {...formik.getFieldProps('rate')}
              error={errorFor('rate')}
            />
            <Input
              id="p2p-method"
              label="Méthode"
              placeholder="Mobile Money, banque..."
              {...formik.getFieldProps('method')}
              error={errorFor('method')}
            />
            <Input
              id="p2p-comment"
              label="Conditions"
              {...formik.getFieldProps('comment')}
              error={errorFor('comment')}
            />
            {Number(formik.values.amount) > 0 ? (
              <Alert variant="info">
                Frais estimés :{' '}
                {formatMoney(
                  calculateP2PFee(formik.values.amount, formik.values.fromCurrency),
                  formik.values.fromCurrency,
                )}
              </Alert>
            ) : null}
            <Button type="submit" icon={FiPlus} loading={formik.isSubmitting}>
              Publier
            </Button>
          </form>
        </PublicationModal>
      </div>
    </div>
  )
}

function P2PMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
      <strong className="block truncate">{value}</strong>
      <span className="mt-1 block truncate text-xs text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}
