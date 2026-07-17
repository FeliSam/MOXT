import { useState } from 'react'
import { FiUsers } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useLanguage } from '../../contexts/useLanguage'
import {
  addBusinessMember,
  removeBusinessMember,
  updateBusinessMember,
} from '../../features/businesses/businessSlice'
import { professionalText } from '../../features/businesses/professionalI18n'

const ROLE_OPTIONS = [
  { value: 'manager', labelKey: 'professional.members.roles.manager' },
  { value: 'support', labelKey: 'professional.members.roles.support' },
  { value: 'editor', labelKey: 'professional.members.roles.editor' },
]

export function MembersPanel({ business, dispatch, members }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' })

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    dispatch(addBusinessMember({ ...form, businessId: business.id }))
    setForm({ name: '', email: '', role: 'editor' })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <h2 className="font-black">{pt('professional.members.addTitle')}</h2>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Input
            id="member-name"
            label={pt('professional.members.name')}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            id="member-email"
            label={pt('professional.members.email')}
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <Select
            id="member-role"
            label={pt('professional.members.role')}
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {pt(option.labelKey)}
              </option>
            ))}
          </Select>
          <Button type="submit">{pt('professional.members.add')}</Button>
        </form>
      </Card>
      <div className="grid content-start gap-3">
        {members.length ? (
          members.map((member) => (
            <Card key={member.id} className="flex flex-wrap items-center gap-3">
              <FiUsers className="text-xl text-brand-600" />
              <div className="min-w-0 flex-1">
                <strong className="block">{member.name}</strong>
                <span className="text-xs text-[var(--app-text-muted)]">{member.email}</span>
              </div>
              <Select
                id={`member-role-${member.id}`}
                label={pt('professional.members.role')}
                value={member.role}
                onChange={(event) =>
                  dispatch(
                    updateBusinessMember({
                      id: member.id,
                      businessId: business.id,
                      role: event.target.value,
                    }),
                  )
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {pt(option.labelKey)}
                  </option>
                ))}
              </Select>
              <Button
                variant="danger"
                onClick={() =>
                  dispatch(removeBusinessMember({ id: member.id, businessId: business.id }))
                }
              >
                {pt('professional.members.remove')}
              </Button>
            </Card>
          ))
        ) : (
          <EmptyState title={pt('professional.members.empty')} />
        )}
      </div>
    </div>
  )
}
