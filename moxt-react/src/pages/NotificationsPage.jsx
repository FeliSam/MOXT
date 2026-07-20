import { FiArchive, FiBell, FiCheck, FiMessageSquare, FiStar, FiZap } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import {
  archiveNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '../features/communications/communicationSlice'
import { selectUserConversations, selectVisibleNotifications } from '../features/selectors'
import { formatDate } from '../features/transfers/transferUtils'
import { phase3Text } from '../i18n/phase3I18n'
import {
  isMessageNotification,
  resolveNotificationTarget,
} from './messages/messageUtils'

const PRIORITY_STYLES = {
  high: {
    unread:
      'border-rose-300 bg-gradient-to-r from-rose-50/80 via-[var(--app-surface)] to-[var(--app-surface)] dark:from-rose-950/25',
    icon: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
    badge: 'warning',
    labelKey: 'notifications.priority.urgent',
  },
  normal: {
    unread:
      'border-brand-300 bg-gradient-to-r from-brand-50/70 via-[var(--app-surface)] to-[var(--app-surface)] dark:from-brand-950/20',
    icon: 'bg-brand-50 text-brand-700 dark:bg-brand-900',
    badge: 'info',
    labelKey: 'notifications.priority.standard',
  },
  low: {
    unread: 'border-slate-200 bg-[var(--app-surface-muted)]/60',
    icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    badge: 'neutral',
    labelKey: 'notifications.priority.low',
  },
}

function notificationPriority(notification) {
  if (notification.type === 'subscription' && notification.priority) return notification.priority
  if (notification.priority) return notification.priority
  return 'normal'
}

function PriorityIcon({ priority }) {
  if (priority === 'high') return <FiZap />
  if (priority === 'low') return <FiBell />
  return <FiStar className="opacity-80" />
}

export function NotificationsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector(selectUserConversations)
  const notifications = useSelector(selectVisibleNotifications)
  const unreadCount = notifications.filter((item) => !item.read).length

  function openNotification(notification) {
    if (!notification.read) {
      dispatch(markNotificationRead(notification.id))
    }

    const target = resolveNotificationTarget(notification, conversations)
    if (target) {
      navigate(target)
    }
  }

  return (
    <div className="grid w-full min-w-0 max-w-full gap-7 overflow-x-hidden">
      <PageHeader
        eyebrow={p3('notifications.eyebrow')}
        title={p3('notifications.title')}
        description={p3('notifications.description', { count: unreadCount })}
        actions={
          <Button
            className="w-full sm:w-auto"
            size="sm"
            variant="secondary"
            icon={FiCheck}
            onClick={() => dispatch(markAllNotificationsRead(user.id))}
          >
            {p3('notifications.markAllRead')}
          </Button>
        }
      />
      <div className="grid min-w-0 gap-3">
        {notifications.length ? (
          notifications.map((notification) => {
            const messageAlert = isMessageNotification(notification)
            const target = resolveNotificationTarget(notification, conversations)
            const canOpen = Boolean(target)
            const priority = notificationPriority(notification)
            const styles = PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal

            return (
              <Card
                key={notification.id}
                className={`min-w-0 overflow-hidden transition hover:shadow-[var(--shadow-card-lg)] ${
                  !notification.read ? styles.unread : ''
                } ${canOpen ? 'cursor-pointer' : ''}`}
                onClick={canOpen ? () => openNotification(notification) : undefined}
                role={canOpen ? 'button' : undefined}
                tabIndex={canOpen ? 0 : undefined}
                onKeyDown={
                  canOpen
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openNotification(notification)
                        }
                      }
                    : undefined
                }
              >
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      messageAlert
                        ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                        : styles.icon
                    }`}
                  >
                    {messageAlert ? <FiMessageSquare /> : <PriorityIcon priority={priority} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <strong className="min-w-0 break-words leading-snug">{notification.title}</strong>
                      <div className="flex shrink-0 flex-wrap gap-2 self-start">
                        {!notification.read ? (
                          <Badge tone={styles.badge}>{p3(styles.labelKey)}</Badge>
                        ) : null}
                        <Badge tone={notification.read ? 'info' : 'warning'}>
                          {notification.read
                            ? p3('notifications.badge.read')
                            : p3('notifications.badge.new')}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 break-words text-sm leading-5 text-slate-500">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(notification.createdAt)}</p>
                    <div
                      className="mt-3 flex min-w-0 flex-wrap gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {canOpen ? (
                        <Button
                          size="sm"
                          variant={messageAlert ? 'primary' : 'secondary'}
                          className="max-w-full"
                          icon={messageAlert ? FiMessageSquare : undefined}
                          onClick={() => openNotification(notification)}
                        >
                          {messageAlert
                            ? p3('notifications.openConversation')
                            : p3('notifications.open')}
                        </Button>
                      ) : null}
                      {!notification.read ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="max-w-full"
                          onClick={() => dispatch(markNotificationRead(notification.id))}
                        >
                          {p3('notifications.markRead')}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="max-w-full"
                        icon={FiArchive}
                        onClick={() =>
                          dispatch(archiveNotification({ id: notification.id, userId: user.id }))
                        }
                      >
                        {p3('notifications.archive')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="border-dashed text-center text-sm text-slate-500">
            {p3('notifications.empty')}
          </Card>
        )}
      </div>
    </div>
  )
}
