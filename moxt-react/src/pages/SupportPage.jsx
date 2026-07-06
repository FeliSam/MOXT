import { useFormik } from 'formik'
import { FiHelpCircle, FiPlus, FiSend } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { PublicationModal } from '../components/ui/PublicationModal'
import { Select } from '../components/ui/Select'
import { SUPPORT_PRIORITIES } from '../config/options'
import { messageSchema, supportSchema } from '../features/communications/communicationSchemas'
import {
  addNotification,
  createSupportTicket,
  replySupportTicket,
} from '../features/communications/communicationSlice'
import { formatDate } from '../features/transfers/transferUtils'

export function SupportPage() {
  const [requestOpen, setRequestOpen] = useState(false)
  const dispatch = useDispatch()
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
          title: 'Demande support creee',
          message: `Votre demande ${action.payload.id} a ete enregistree.`,
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
        eyebrow="Assistance"
        title="Support MOXT"
        description="Demandes, reclamations et suivi avec l'equipe support."
        actions={
          <Button icon={FiPlus} onClick={() => setRequestOpen(true)}>
            Nouvelle demande
          </Button>
        }
      />
      <div>
        <PublicationModal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          title="Nouvelle demande"
          description="Décrivez votre situation avec précision pour permettre à l’équipe de vous répondre rapidement."
          icon={FiHelpCircle}
        >
          <form className="mt-5 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
            <Input
              id="support-subject"
              label="Sujet"
              {...formik.getFieldProps('subject')}
              error={errorFor('subject')}
            />
            <Select id="support-priority" label="Priorite" {...formik.getFieldProps('priority')}>
              {SUPPORT_PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Message</span>
              <textarea
                className="min-h-36 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-950"
                {...formik.getFieldProps('message')}
              />
              {errorFor('message') ? (
                <span className="text-xs text-red-600">{errorFor('message')}</span>
              ) : null}
            </label>
            <Button type="submit" icon={FiSend}>
              Envoyer
            </Button>
          </form>
        </PublicationModal>
        <section className="grid content-start gap-4 xl:grid-cols-2">
          <h2 className="text-lg font-black xl:col-span-2">Mes demandes</h2>
          {tickets.length ? (
            tickets.map((ticket) => <TicketCard ticket={ticket} user={user} dispatch={dispatch} />)
          ) : (
            <Card className="border-dashed text-center text-sm text-slate-500">
              Aucune demande support.
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}

function TicketCard({ dispatch, ticket, user }) {
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
            <strong className="block text-xs">{message.senderName}</strong>
            <p className="mt-1">{message.text}</p>
          </div>
        ))}
      </div>
      {!['resolved', 'closed'].includes(ticket.status) ? (
        <form className="mt-4 flex gap-2" onSubmit={formik.handleSubmit}>
          <input
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Répondre"
            {...formik.getFieldProps('text')}
          />
          <Button type="submit" icon={FiSend} aria-label="Envoyer" />
        </form>
      ) : (
        <div className="mt-4">
          <Alert variant="success">Cette demande est fermee.</Alert>
        </div>
      )}
    </Card>
  )
}
