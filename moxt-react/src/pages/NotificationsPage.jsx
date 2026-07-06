import { FiArchive, FiBell, FiCheck, FiMessageSquare } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import {
  archiveNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '../features/communications/communicationSlice'
import { selectUserConversations } from '../features/selectors'
import { formatDate } from '../features/transfers/transferUtils'
import {
  isMessageNotification,
  resolveNotificationTarget,
} from './messages/messageUtils'

export function NotificationsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector(selectUserConversations)
  const notifications = useSelector((state) =>
    state.communications.notifications.filter((item) => item.userId === user.id && !item.archived),
  )
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
        eyebrow="Alertes"
        title="Notifications"
        description={`${unreadCount} notification(s) non lue(s).`}
        actions={
          <Button
            className="w-full sm:w-auto"
            size="sm"
            variant="secondary"
            icon={FiCheck}
            onClick={() => dispatch(markAllNotificationsRead(user.id))}
          >
            Tout lire
          </Button>
        }
      />
      <div className="grid min-w-0 gap-3">
        {notifications.length ? (
          notifications.map((notification) => {
            const messageAlert = isMessageNotification(notification)
            const target = resolveNotificationTarget(notification, conversations)
            const canOpen = Boolean(target)

            return (
              <Card
                key={notification.id}
                className={`min-w-0 overflow-hidden transition hover:shadow-[var(--shadow-card-lg)] ${
                  !notification.read
                    ? 'border-brand-300 bg-gradient-to-r from-brand-50/70 via-[var(--app-surface)] to-[var(--app-surface)] dark:from-brand-950/20'
                    : ''
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
                        : 'bg-brand-50 text-brand-700 dark:bg-brand-900'
                    }`}
                  >
                    {messageAlert ? <FiMessageSquare /> : <FiBell />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <strong className="min-w-0 break-words leading-snug">{notification.title}</strong>
                      <Badge className="shrink-0 self-start" tone={notification.read ? 'info' : 'warning'}>
                        {notification.read ? 'Lue' : 'Nouvelle'}
                      </Badge>
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
                          {messageAlert ? 'Ouvrir la conversation' : 'Ouvrir'}
                        </Button>
                      ) : null}
                      {!notification.read ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="max-w-full"
                          onClick={() => dispatch(markNotificationRead(notification.id))}
                        >
                          Marquer lue
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
                        Archiver
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="border-dashed text-center text-sm text-slate-500">
            Aucune notification.
          </Card>
        )}
      </div>
    </div>
  )
}
