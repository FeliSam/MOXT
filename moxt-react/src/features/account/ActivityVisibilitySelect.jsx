import { Select } from '../../components/ui/Select'

export function ActivityVisibilitySelect({
  className = '',
  hint,
  id = 'activity-visibility',
  label = 'Visibilité de l’activité',
  onChange,
  value,
}) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <Select id={id} label={label} value={value} onChange={onChange}>
        <option value="private">Privée — vous seul</option>
        <option value="contacts">Mes contacts — interlocuteurs messagerie</option>
        <option value="public">Publique — toute la communauté</option>
      </Select>
      {hint ? <p className="text-xs text-[var(--app-text-muted)]">{hint}</p> : null}
    </div>
  )
}
