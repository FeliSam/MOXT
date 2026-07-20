import { useFormik } from 'formik'
import { FiAlertTriangle, FiHelpCircle, FiImage, FiPlus, FiSend, FiX } from 'react-icons/fi'
import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { PublicationModal } from '../components/ui/PublicationModal'
import { Select } from '../components/ui/Select'
import { SUPPORT_PRIORITIES } from '../config/options'
import { useLanguage } from '../contexts/useLanguage'
import { messageSchema, supportSchema } from '../features/communications/communicationSchemas'
import {
  addNotification,
  createSupportTicket,
  replySupportTicket,
} from '../features/communications/communicationSlice'
import { addToast } from '../features/ui/uiSlice'
import { formatDate } from '../features/transfers/transferUtils'
import { phase3Text } from '../i18n/phase3I18n'
import { storageService } from '../services/storageService'

export function SupportPage() {
  const [requestOpen, setRequestOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const tickets = useSelector((state) =>
    state.communications.support.filter((item) => item.userId === user.id),
  )
  const formik = useFormik({
    initialValues: { subject: '', priority: 'normal', message: '' },
    validationSchema: supportSchema,
    onSubmit: (values, helpers) => {
      const action = dispatch(
        createSupportTicket({
          ...values,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
        }),
      )
      dispatch(
        addNotification({
          userId: user.id,
          title: p3('support.createdTitle'),
          message: p3('support.createdMessage', { id: action.payload.id }),
          type: 'support',
          link: '/support',
        }),
      )
      helpers.resetForm()
      setRequestOpen(false)
    },
  })
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  return (
    <div className="grid gap-7">
      <PageHeader
        title={p3('support.title')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={FiAlertTriangle} onClick={() => setReportOpen(true)}>
              {p3('support.reportBug')}
            </Button>
            <Button icon={FiPlus} onClick={() => setRequestOpen(true)}>
              {p3('support.newRequest')}
            </Button>
          </div>
        }
      />
      <ErrorReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        dispatch={dispatch}
        user={user}
      />
      <div>
        <PublicationModal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          title={p3('support.newRequest')}
          description={p3('support.newRequestDesc')}
          icon={FiHelpCircle}
        >
          <form className="mt-5 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
            <Input
              id="support-subject"
              label={p3('support.subject')}
              {...formik.getFieldProps('subject')}
              error={errorFor('subject')}
            />
            <Select
              id="support-priority"
              label={p3('support.priority.label')}
              {...formik.getFieldProps('priority')}
            >
              {SUPPORT_PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {p3(`support.priority.${option.value}`)}
                </option>
              ))}
            </Select>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">{p3('support.message')}</span>
              <textarea
                className="min-h-36 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-950"
                {...formik.getFieldProps('message')}
              />
              {errorFor('message') ? (
                <span className="text-xs text-red-600">{errorFor('message')}</span>
              ) : null}
            </label>
            <Button type="submit" icon={FiSend}>
              {p3('support.send')}
            </Button>
          </form>
        </PublicationModal>
        <section className="grid content-start gap-4 xl:grid-cols-2">
          <h2 className="text-lg font-black xl:col-span-2">{p3('support.myRequests')}</h2>
          {tickets.length ? (
            tickets.map((ticket) => <TicketCard ticket={ticket} user={user} dispatch={dispatch} />)
          ) : (
            <Card className="border-dashed text-center text-sm text-slate-500">
              {p3('support.empty')}
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}

function ErrorReportModal({ open, onClose, dispatch, user }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function pickFile(event) {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      dispatch(
        addToast({
          title: p3('support.invalidFormatTitle'),
          message: p3('support.invalidFormatMessage'),
          tone: 'error',
        }),
      )
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function close() {
    clearFile()
    setMessage('')
    onClose()
  }

  async function submit(event) {
    event.preventDefault()
    if (message.trim().length < 10) {
      dispatch(
        addToast({
          title: p3('support.tooShortTitle'),
          message: p3('support.tooShortMessage'),
          tone: 'error',
        }),
      )
      return
    }
    setSubmitting(true)
    try {
      let screenshotUrl = null
      if (file) {
        screenshotUrl = await storageService.uploadSupportScreenshot(user.id, file)
      }
      const action = dispatch(
        createSupportTicket({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          subject: p3('support.bugSubject'),
          priority: 'important',
          category: 'bug',
          message: message.trim(),
          screenshotUrl,
        }),
      )
      dispatch(
        addNotification({
          userId: user.id,
          title: p3('support.bugSentTitle'),
          message: p3('support.bugSentMessage', { id: action.payload.id }),
          type: 'support',
          link: '/support',
        }),
      )
      dispatch(
        addToast({
          title: p3('support.thanksTitle'),
          message: p3('support.thanksMessage'),
          tone: 'success',
        }),
      )
      close()
    } catch (error) {
      dispatch(
        addToast({
          title: p3('support.sendFailedTitle'),
          message: error.message || p3('common.retryLater'),
          tone: 'error',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicationModal
      open={open}
      onClose={close}
      title={p3('support.bugModalTitle')}
      description={p3('support.bugModalDesc')}
      icon={FiAlertTriangle}
    >
      <form className="mt-5 grid gap-4" onSubmit={submit} noValidate>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">{p3('support.bugDescription')}</span>
          <textarea
            className="min-h-32 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-950"
            placeholder={p3('support.bugPlaceholder')}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold">{p3('support.screenshotLabel')}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickFile}
          />
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-[var(--app-border)]">
              <img
                src={previewUrl}
                alt={p3('support.screenshotAlt')}
                className="max-h-64 w-full object-contain bg-[var(--app-surface-muted)]"
              />
              <button
                type="button"
                onClick={clearFile}
                aria-label={p3('support.removeScreenshot')}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"
              >
                <FiX />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] text-sm text-[var(--app-text-muted)] hover:border-[var(--app-accent)]"
            >
              <FiImage className="text-xl" />
              {p3('support.addScreenshot')}
            </button>
          )}
        </div>

        <Button type="submit" icon={FiSend} loading={submitting} disabled={submitting}>
          {p3('support.sendBug')}
        </Button>
      </form>
    </PublicationModal>
  )
}

function TicketCard({ dispatch, ticket, user }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const formik = useFormik({
    initialValues: { text: '' },
    validationSchema: messageSchema,
    onSubmit: (values, helpers) => {
      dispatch(
        replySupportTicket({
          ticketId: ticket.id,
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          role: 'user',
          text: values.text,
        }),
      )
      helpers.resetForm()
    },
  })
  return (
    <Card>
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <strong>{ticket.subject}</strong>
          <p className="mt-1 text-xs text-slate-500">
            {ticket.id} - {formatDate(ticket.createdAt)}
          </p>
        </div>
        <Badge tone={ticket.status === 'resolved' ? 'success' : 'warning'}>{ticket.status}</Badge>
      </div>
      <div className="mt-4 grid gap-2">
        {ticket.messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-xl p-3 text-sm ${message.role === 'agent' ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-slate-50 dark:bg-slate-950'}`}
          >
            <EntityVerifiedName
              as="strong"
              name={message.senderName}
              userId={message.senderId}
              className="block text-xs"
            />
            <p className="mt-1">{message.text}</p>
            {message.imageUrl ? (
              <a href={message.imageUrl} target="_blank" rel="noreferrer" className="mt-2 block">
                <img
                  src={message.imageUrl}
                  alt={p3('support.attachedAlt')}
                  className="max-h-56 w-full rounded-lg border border-[var(--app-border)] object-contain"
                  loading="lazy"
                />
              </a>
            ) : null}
          </div>
        ))}
      </div>
      {!['resolved', 'closed'].includes(ticket.status) ? (
        <form className="mt-4 flex gap-2" onSubmit={formik.handleSubmit}>
          <input
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950"
            placeholder={p3('support.replyPlaceholder')}
            {...formik.getFieldProps('text')}
          />
          <Button type="submit" icon={FiSend} aria-label={p3('support.sendAria')} />
        </form>
      ) : (
        <div className="mt-4">
          <Alert variant="success">{p3('support.closedAlert')}</Alert>
        </div>
      )}
    </Card>
  )
}
