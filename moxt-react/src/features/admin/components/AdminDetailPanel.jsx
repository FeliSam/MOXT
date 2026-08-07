import { createElement, useMemo, useState } from 'react'
import { FiArrowRight, FiEye } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { CitySelector } from '../../../components/ui/CitySelector'
import { Select } from '../../../components/ui/Select'
import { flagEmoji } from '../../../config/flags'
import { useGeographyOptions } from '../../../hooks/useGeographyOptions'
import {
  updateUserCity,
  updateUserOriginCountry,
} from '../../administration/administrationSlice'
import {
  replySupportTicket,
  updateSupportStatus,
} from '../../communications/communicationSlice'
import { updateBusinessTransferPricing } from '../../businesses/businessSlice'
import { getPostImages } from '../../posts/postMediaUtils'
import { addToast } from '../../ui/uiSlice'
import { renderDetailActions, confirmedClick } from '../adminActions'
import { CARD } from '../adminConfig'
import {
  buildDetailFacts,
  countBusinessActivity,
  detailDescriptionFor,
  detailIconFor,
  detailLabelFor,
  detailLinkFor,
} from '../adminData'
import { adminText } from '../adminI18n'
import { AdminDocumentPreview } from './AdminDocumentPreview'
import { Empty, SectionTitle } from './AdminShared'

function useLiveSelectedItem(selected) {
  return useSelector((state) => {
    if (!selected?.item?.id) return selected?.item || null
    const { kind, item } = selected
    const id = item.id

    switch (kind) {
      case 'parcels':
        return state.parcels.items.find((entry) => entry.id === id) || item
      case 'verification':
        return state.account.verificationRequests.find((entry) => entry.id === id) || item
      case 'businessDocument':
        return state.businesses.documents.find((entry) => entry.id === id) || item
      case 'posts':
        return state.posts.items.find((entry) => entry.id === id) || item
      case 'listings':
        return state.marketplace.items.find((entry) => entry.id === id) || item
      case 'jobs':
        return state.jobs.items.find((entry) => entry.id === id) || item
      case 'events':
        return state.events.items.find((entry) => entry.id === id) || item
      case 'businesses':
        return state.businesses.items.find((entry) => entry.id === id) || item
      case 'transfer':
        return state.transfers.items.find((entry) => entry.id === id) || item
      case 'user':
        return state.administration.users.find((entry) => entry.id === id) || item
      case 'support':
        return state.communications.support.find((entry) => entry.id === id) || item
      case 'dispute':
        return state.disputes.items.find((entry) => entry.id === id) || item
      case 'review':
      case 'contestedReview':
        return state.reviews.items.find((entry) => entry.id === id) || item
      default:
        return item
    }
  })
}

export function AdminDetailPanel({
  admin,
  dispatch,
  onSuspendUser,
  onPurgeUser,
  selected,
  setSelected,
  supportReply,
  setSupportReply,
}) {
  const { t } = useLanguage()
  const { countries } = useGeographyOptions()
  const [originOverride, setOriginOverride] = useState(null)
  const [cityOverride, setCityOverride] = useState(null)
  const liveItem = useLiveSelectedItem(selected)
  const kind = selected?.kind
  const item = liveItem || selected?.item
  const p2pOrderForDispute = useSelector((state) => {
    if (selected?.kind !== 'dispute' || liveItem?.relatedType !== 'p2p_order') return null
    return state.p2p.orders.find((order) => order.id === liveItem.relatedId) || null
  })
  const businessActivity = useSelector((state) => {
    if (kind !== 'businesses' || !item?.id) return null
    return countBusinessActivity(state, item.id)
  })
  const detailItem =
    kind === 'businesses' && businessActivity
      ? { ...item, activity: businessActivity }
      : item

  const selectedUserId = kind === 'user' ? item?.id : null
  const selectedUserOrigin = kind === 'user' ? item?.originCountry || '' : ''
  const selectedUserCity = kind === 'user' ? item?.city || '' : ''
  const originDraft =
    originOverride?.userId === selectedUserId ? originOverride.value : selectedUserOrigin
  const cityDraft =
    cityOverride?.userId === selectedUserId ? cityOverride.value : selectedUserCity

  const detailImages = useMemo(() => {
    if (!kind || !item) return []
    if (kind === 'listings' && Array.isArray(item.images)) {
      return item.images.filter(Boolean)
    }
    if (kind === 'posts') return getPostImages(item)
    if (kind === 'events' && Array.isArray(item.images)) {
      return item.images.filter(Boolean)
    }
    return []
  }, [kind, item])

  if (!selected || !item) {
    return (
      <aside className={`${CARD} grid min-w-0 content-start gap-4 overflow-x-hidden overflow-y-auto p-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start`}>
        <SectionTitle icon={FiEye} label={adminText(t, 'admin.detail.title')} />
        <Empty
          label={adminText(t, 'admin.detail.emptyLabel')}
          sub={adminText(t, 'admin.detail.emptySub')}
          icon={FiEye}
        />
      </aside>
    )
  }

  const link = detailLinkFor(kind, item)
  const itemName = item.title || item.name || item.subject || item.userName || item.id

  return (
    <aside className={`${CARD} grid min-w-0 content-start gap-4 overflow-x-hidden overflow-y-auto p-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start`}>
      <div className="flex min-w-0 items-start gap-3 border-b border-[var(--app-border)] pb-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          {createElement(detailIconFor(kind), { className: 'text-sm' })}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-brand-700">{detailLabelFor(kind, t)}</p>
          <h2 className="mt-0.5 break-words font-black leading-snug">{itemName}</h2>
          <p className="mt-0.5 break-words text-xs text-[var(--app-text-muted)]">{detailDescriptionFor(kind, item, t)}</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {buildDetailFacts(kind, detailItem, t, { p2pOrder: p2pOrderForDispute }).map(([label, value]) => (
          <div key={label} className="min-w-0 overflow-hidden rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">{label}</p>
            <strong className="mt-0.5 block break-words text-sm leading-snug [overflow-wrap:anywhere]">
              {String(value ?? '—')}
            </strong>
          </div>
        ))}
      </div>

      {detailImages.length ? (
        <div className="grid min-w-0 gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
            {adminText(t, 'admin.detail.imagesTitle')}
          </p>
          <div className="flex flex-wrap gap-2">
            {detailImages.slice(0, 6).map((src) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="size-16 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]"
              >
                <img src={src} alt="" className="size-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {kind === 'verification' ? (
        <div className="grid min-w-0 gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
            {t('verification.admin.documentsTitle')}
          </p>
          <AdminDocumentPreview
            documentIds={item.documentIds || []}
            userId={item.userId}
          />
        </div>
      ) : null}

      {kind === 'businessDocument' ? (
        <div className="grid min-w-0 gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
            {adminText(t, 'admin.businessDocuments.previewTitle')}
          </p>
          <AdminDocumentPreview documents={[item]} />
        </div>
      ) : null}

      {kind === 'parcels' && (item.passportProofUrl || item.travelProofUrl) ? (
        <div className="grid min-w-0 gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
            {adminText(t, 'admin.detail.proofPreviewTitle')}
          </p>
          <AdminDocumentPreview
            documents={[
              item.passportProofUrl
                ? {
                    id: `${item.id}-passport`,
                    name: item.passportProofName || adminText(t, 'admin.facts.passport'),
                    url: item.passportProofUrl,
                    type: item.passportProofType,
                    size: item.passportProofSize,
                    status: item.passportStatus || 'pending_review',
                  }
                : null,
              item.travelProofUrl
                ? {
                    id: item.id,
                    name: item.travelProofName || adminText(t, 'admin.detail.proofPreviewTitle'),
                    url: item.travelProofUrl,
                    type: item.travelProofType,
                    size: item.travelProofSize,
                    status: item.proofStatus || 'pending_review',
                  }
                : null,
            ].filter(Boolean)}
          />
        </div>
      ) : null}

      {kind === 'parcels' && !item.travelProofUrl && !item.passportProofUrl ? (
        <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {adminText(t, 'admin.facts.proofMissing')}
          {item.proofStatus || item.passportStatus
            ? ` · billet ${item.proofStatus || 'missing'} · passeport ${item.passportStatus || 'missing'}`
            : ''}
        </div>
      ) : null}

      {kind === 'user' ? (
        <div className="grid min-w-0 gap-4 rounded-xl bg-[var(--app-surface-muted)] p-3">
          <div className="grid min-w-0 gap-2">
            <Select
              id="admin-user-origin"
              label={adminText(t, 'admin.users.editOrigin')}
              value={originDraft}
              onChange={(event) =>
                setOriginOverride({ userId: selectedUserId, value: event.target.value })
              }
            >
              <option value="">{adminText(t, 'admin.filters.all')}</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {flagEmoji(country.code)} {country.name}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              disabled={!originDraft || originDraft === item.originCountry}
              onClick={confirmedClick(t, adminText(t, 'admin.actions.save'), () => {
                dispatch(updateUserOriginCountry({ id: item.id, originCountry: originDraft }))
                setSelected?.({ kind: 'user', item: { ...item, originCountry: originDraft } })
                setOriginOverride(null)
                dispatch(
                  addToast({
                    title: adminText(t, 'admin.users.originSaved'),
                    message: `${item.firstName || ''} · ${originDraft}`,
                    tone: 'success',
                  }),
                )
              })}
            >
              {adminText(t, 'admin.actions.save')}
            </Button>
          </div>

          <div className="grid min-w-0 gap-2 border-t border-[var(--app-border)] pt-3">
            <CitySelector
              id="admin-user-city"
              label={adminText(t, 'admin.users.editCity')}
              value={cityDraft}
              onChange={(city) => setCityOverride({ userId: selectedUserId, value: city })}
              placeholder={adminText(t, 'admin.users.editCity')}
            />
            <Button
              variant="secondary"
              disabled={!cityDraft.trim() || cityDraft.trim() === (item.city || '')}
              onClick={confirmedClick(t, adminText(t, 'admin.actions.save'), () => {
                const city = cityDraft.trim()
                dispatch(updateUserCity({ id: item.id, city }))
                setSelected?.({ kind: 'user', item: { ...item, city } })
                setCityOverride(null)
                dispatch(
                  addToast({
                    title: adminText(t, 'admin.users.citySaved'),
                    message: `${item.firstName || ''} · ${city}`,
                    tone: 'success',
                  }),
                )
              })}
            >
              {adminText(t, 'admin.actions.save')}
            </Button>
          </div>
        </div>
      ) : null}

      {kind === 'businesses' && item?.id ? (
        <div className="grid min-w-0 gap-3 border-t border-[var(--app-border)] pt-3">
          <div className="grid gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
              {adminText(t, 'admin.business.acceptanceTitle')}
            </p>
            <p className="text-xs text-[var(--app-text-muted)]">
              {adminText(t, 'admin.business.acceptanceHint')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                {item.transferAcceptanceRequired === true
                  ? adminText(t, 'admin.business.acceptanceOn')
                  : adminText(t, 'admin.business.acceptanceOff')}
              </span>
              <Button
                variant={item.transferAcceptanceRequired === true ? 'danger' : 'primary'}
                onClick={confirmedClick(
                  t,
                  item.transferAcceptanceRequired === true
                    ? adminText(t, 'admin.business.acceptanceDisable')
                    : adminText(t, 'admin.business.acceptanceEnable'),
                  () => {
                    const enabled = item.transferAcceptanceRequired === true
                    dispatch(
                      updateBusinessTransferPricing({
                        businessId: item.id,
                        ownerId: item.ownerId,
                        actorRole: admin?.role || 'admin',
                        transferAcceptanceRequired: !enabled,
                      }),
                    )
                    setSelected?.({
                      kind: 'businesses',
                      item: { ...item, transferAcceptanceRequired: !enabled },
                    })
                    dispatch(
                      addToast({
                        title: adminText(t, 'admin.transfers.acceptanceUpdatedTitle'),
                        message: adminText(t, 'admin.transfers.acceptanceUpdatedBody', {
                          name: item.name,
                          state: !enabled
                            ? adminText(t, 'admin.transfers.acceptanceOn')
                            : adminText(t, 'admin.transfers.acceptanceOff'),
                        }),
                        tone: 'success',
                      }),
                    )
                  },
                )}
              >
                {item.transferAcceptanceRequired === true
                  ? adminText(t, 'admin.business.acceptanceDisable')
                  : adminText(t, 'admin.business.acceptanceEnable')}
              </Button>
            </div>
          </div>
          <Link to={`/admin?view=transfers&businessId=${item.id}`}>
            <Button variant="secondary" icon={FiArrowRight}>
              {adminText(t, 'admin.business.viewTransfers')}
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
          {adminText(t, 'admin.detail.actionsLabel')}
        </p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {renderDetailActions({
            actorId: admin?.id,
            actorRole: admin?.role,
            dispatch,
            item,
            kind,
            onSuspendUser,
            onPurgeUser,
            t,
          })}
        </div>
      </div>

      {kind === 'support' && (
        <div className="grid min-w-0 gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
            {adminText(t, 'admin.detail.replyLabel')}
          </p>
          <textarea
            value={supportReply}
            onChange={(e) => setSupportReply(e.target.value)}
            placeholder={adminText(t, 'admin.detail.replyPlaceholder')}
            rows={4}
            className="w-full max-w-full rounded-xl bg-[var(--app-surface)] p-3 text-sm outline-none ring-1 ring-[var(--app-border)] focus:ring-brand-500"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={confirmedClick(t, adminText(t, 'admin.detail.send'), () => {
                if (!supportReply.trim()) return
                dispatch(replySupportTicket({
                  ticketId: item.id,
                  senderId: admin.id,
                  senderName: `${admin.firstName} ${admin.lastName} - Support`,
                  role: 'agent',
                  text: supportReply,
                }))
                setSupportReply('')
              })}
            >
              {adminText(t, 'admin.detail.send')}
            </Button>
            <Button
              variant="secondary"
              onClick={confirmedClick(t, adminText(t, 'admin.actions.close'), () =>
                dispatch(updateSupportStatus({ id: item.id, status: 'resolved' })),
              )}
            >
              {adminText(t, 'admin.actions.close')}
            </Button>
          </div>
        </div>
      )}

      {link && (
        <Link to={link} className="block min-w-0">
          <Button variant="secondary" icon={FiArrowRight} className="w-full max-w-full justify-center">
            {adminText(t, 'admin.detail.openFull')}
          </Button>
        </Link>
      )}
    </aside>
  )
}
