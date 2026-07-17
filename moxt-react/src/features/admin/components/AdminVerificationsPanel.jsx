import { useMemo, useState } from 'react'
import { FiCheckCircle, FiUserCheck, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../../contexts/useLanguage'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { updateVerificationStatus } from '../../account/accountSlice'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { formatDate } from '../../transfers/transferUtils'
import { Empty, SectionTitle } from './AdminShared'

function statusTone(status) {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

function userLabel(user, fallbackId) {
  if (!user) return fallbackId || '—'
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name || user.email || fallbackId
}

export function AdminVerificationsPanel({
  adminId,
  dispatch,
  query = '',
  setSelected,
  statusFilter = 'all',
  verifications = [],
}) {
  const { t } = useLanguage()
  const users = useSelector((state) => state.administration.users || [])
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const items = useMemo(() => {
    let list = [...verifications]
    if (statusFilter === 'pending') {
      list = list.filter((item) => ['pending_review', 'pending'].includes(item.status))
    } else if (statusFilter !== 'all') {
      list = list.filter((item) => item.status === statusFilter)
    }
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((item) => {
        const user = users.find((entry) => entry.id === item.userId)
        const haystack = `${item.id} ${item.userId} ${item.level} ${item.status} ${item.note || ''} ${userLabel(user, '')} ${user?.email || ''}`
        return haystack.toLowerCase().includes(q)
      })
    }
    return list.sort((a, b) => {
      const pendingRank = (status) => (['pending_review', 'pending'].includes(status) ? 0 : 1)
      const rank = pendingRank(a.status) - pendingRank(b.status)
      if (rank !== 0) return rank
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    })
  }, [query, statusFilter, users, verifications])

  function approve(item) {
    dispatch(
      updateVerificationStatus({
        id: item.id,
        status: 'verified',
        reviewedBy: adminId,
      }),
    )
  }

  function reject(item) {
    dispatch(
      updateVerificationStatus({
        id: item.id,
        status: 'rejected',
        reviewedBy: adminId,
        reviewNote: rejectReason,
      }),
    )
    setRejectId(null)
    setRejectReason('')
  }

  return (
    <div className={`${CARD} grid gap-4 p-5`}>
      <SectionTitle
        icon={FiUserCheck}
        label={t('verification.admin.title')}
        count={items.length}
        tone={items.some((item) => ['pending_review', 'pending'].includes(item.status)) ? 'warning' : 'success'}
      />
      <p className="text-sm text-[var(--app-text-muted)]">
        {t('verification.admin.description')}
      </p>

      {items.length ? (
        items.map((item) => {
          const user = users.find((entry) => entry.id === item.userId)
          const pending = ['pending_review', 'pending'].includes(item.status)
          return (
            <div key={item.id} className={`${ITEM} grid min-w-0 gap-3 overflow-hidden`}>
              <div className="flex min-w-0 flex-wrap items-start gap-3">
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'verification', item })}
                  className="min-w-0 flex-1 text-left hover:text-brand-700"
                >
                  <strong className="block truncate text-sm">{userLabel(user, item.userId)}</strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">
                    {adminText(t, 'admin.verifications.meta', {
                      level: item.level,
                      count: item.documentIds?.length || 0,
                      date: formatDate(item.createdAt),
                    })}
                  </p>
                  {item.note ? (
                    <p className="mt-1 line-clamp-2 break-words text-xs text-[var(--app-text-muted)]">
                      {adminText(t, 'admin.verifications.noteLabel', { note: item.note })}
                    </p>
                  ) : null}
                  {item.reviewNote ? (
                    <p className="mt-1 line-clamp-2 break-words text-xs text-rose-700 dark:text-rose-300">
                      {adminText(t, 'admin.verifications.rejectNoteLabel', { note: item.reviewNote })}
                    </p>
                  ) : null}
                </button>
                <Badge tone={statusTone(item.status)} className="shrink-0">{item.status}</Badge>
              </div>

              {rejectId === item.id ? (
                <div className="grid gap-2 rounded-xl bg-[var(--app-surface)] p-3 ring-1 ring-[var(--app-border)]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
                    {t('verification.admin.rejectReasonLabel')}
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={3}
                    placeholder={t('verification.admin.rejectReasonPlaceholder')}
                    className="w-full rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm outline-none ring-1 ring-[var(--app-border)] focus:ring-brand-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="danger" icon={FiX} onClick={() => reject(item)}>
                      {t('verification.admin.rejectConfirm')}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setRejectId(null)
                        setRejectReason('')
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setSelected({ kind: 'verification', item })}>
                    {t('verification.admin.examine')}
                  </Button>
                  {pending ? (
                    <>
                      <Button icon={FiCheckCircle} onClick={() => approve(item)}>
                        {t('verification.admin.approve')}
                      </Button>
                      <Button
                        variant="danger"
                        icon={FiX}
                        onClick={() => {
                          setRejectId(item.id)
                          setRejectReason('')
                        }}
                      >
                        {t('verification.admin.reject')}
                      </Button>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )
        })
      ) : (
        <Empty label={t('verification.admin.empty')} icon={FiUserCheck} />
      )}
    </div>
  )
}
