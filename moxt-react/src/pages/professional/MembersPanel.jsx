import { useState } from 'react'
import { FiUsers } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import {
  addBusinessMember,
  removeBusinessMember,
  updateBusinessMember,
} from '../../features/businesses/businessSlice'

export function MembersPanel({ business, dispatch, members }) {
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
        <h2 className="font-black">Ajouter un membre</h2>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Input
            id="member-name"
            label="Nom"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            id="member-email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <Select
            id="member-role"
            label="Rôle"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option value="manager">Gestionnaire</option>
            <option value="support">Support</option>
            <option value="editor">Éditeur</option>
          </Select>
          <Button type="submit">Ajouter</Button>
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
                label="Rôle"
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
                <option value="manager">Gestionnaire</option>
                <option value="support">Support</option>
                <option value="editor">Éditeur</option>
              </Select>
              <Button
                variant="danger"
                onClick={() =>
                  dispatch(removeBusinessMember({ id: member.id, businessId: business.id }))
                }
              >
                Retirer
              </Button>
            </Card>
          ))
        ) : (
          <EmptyState title="Aucun membre" />
        )}
      </div>
    </div>
  )
}
