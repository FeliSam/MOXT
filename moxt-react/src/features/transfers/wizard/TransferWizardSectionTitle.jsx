export function TransferWizardSectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <Icon className="text-base" />
      </span>
      <h2 className="font-black">{label}</h2>
    </div>
  )
}
