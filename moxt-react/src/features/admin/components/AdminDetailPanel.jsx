import { createElement, useEffect, useState } from 'react'
import { FiArrowRight, FiEye } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { flagEmoji } from '../../../config/flags'
import { useGeographyOptions } from '../../../hooks/useGeographyOptions'
import { updateUserOriginCountry } from '../../administration/administrationSlice'
import {
  replySupportTicket,
  updateSupportStatus,
} from '../../communications/communicationSlice'
import { addToast } from '../../ui/uiSlice'
import { renderDetailActions } from '../adminActions'
import { CARD } from '../adminConfig'
import {
  buildDetailFacts,
  detailDescriptionFor,
  detailIconFor,
  detailLabelFor,
  detailLinkFor,
} from '../adminData'
import { adminText } from '../adminI18n'
import { AdminDocumentPreview } from './AdminDocumentPreview'
import { Empty, SectionTitle } from './AdminShared'

export function AdminDetailPanel({
  admin,
  dispatch,
  onSuspendUser,
  selected,
  setSelected,
  supportReply,
  setSupportReply,
}) {
  const { t } = useLanguage()
  const { countries } = useGeographyOptions()
  const [originDraft, setOriginDraft] = useState('')

  useEffect(() => {
    if (selected?.kind === 'user') {
      setOriginDraft(selected.item?.originCountry || '')
    }
  }, [selected])

  if (!selected) {
    return (
      <aside className={`${CARD} grid min-w-0 content-start gap-4 overflow-hidden p-5 xl:sticky xl:top-24 xl:self-start`}>
        <SectionTitle icon={FiEye} label={adminText(t, 'admin.detail.title')} />
        <Empty
          label={adminText(t, 'admin.detail.emptyLabel')}
          sub={adminText(t, 'admin.detail.emptySub')}
          icon={FiEye}
        />
      </aside>
    )
  }

  const { kind, item } = selected
  const link = detailLinkFor(kind, item)
  const itemName = item.title || item.name || item.subject || item.userName || item.id

  return (
    <aside className={`${CARD} grid min-w-0 content-start gap-4 overflow-hidden p-5 xl:sticky xl:top-24 xl:self-start`}>
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
        {buildDetailFacts(kind, item, t).map(([label, value]) => (
          <div key={label} className="min-w-0 overflow-hidden rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">{label}</p>
            <strong className="mt-0.5 block break-words text-sm leading-snug [overflow-wrap:anywhere]">
              {String(value ?? '—')}
            </strong>
          </div>
        ))}
      </div>

      {kind === 'verification' ? (
        <div className="grid min-w-0 gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
            {t('verification.admin.documentsTitle')}
          </p>
          <AdminDocumentPreview documentIds={item.documentIds || []} />
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

      {kind === 'user' ? (
        <div className="grid min-w-0 gap-2 rounded-xl bg-[var(--app-surface-muted)] p-3">
          <Select
            id="admin-user-origin"
            label={adminText(t, 'admin.users.editOrigin')}
            value={originDraft}
            onChange={(event) => setOriginDraft(event.target.value)}
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
            onClick={() => {
              dispatch(updateUserOriginCountry({ id: item.id, originCountry: originDraft }))
              setSelected?.({ kind: 'user', item: { ...item, originCountry: originDraft } })
              dispatch(
                addToast({
                  title: adminText(t, 'admin.users.originSaved'),
                  message: `${item.firstName || ''} · ${originDraft}`,
                  tone: 'success',
                }),
              )
            }}
          >
            {adminText(t, 'admin.actions.save')}
          </Button>
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
              onClick={() => {
                if (!supportReply.trim()) return
                dispatch(replySupportTicket({
                  ticketId: item.id,
                  senderId: admin.id,
                  senderName: `${admin.firstName} ${admin.lastName} - Support`,
                  role: 'agent',
                  text: supportReply,
                }))
                setSupportReply('')
              }}
            >
              {adminText(t, 'admin.detail.send')}
            </Button>
            <Button variant="secondary" onClick={() => dispatch(updateSupportStatus({ id: item.id, status: 'resolved' }))}>
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
