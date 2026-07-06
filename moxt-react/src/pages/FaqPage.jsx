import { FiHelpCircle } from 'react-icons/fi'
import { Card } from '../components/ui/Card'
import { FAQ_ITEMS } from '../config/publicContent'

export function FaqPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-2xl text-[var(--app-accent)]">
          <FiHelpCircle />
        </span>
        <h1 className="mt-5 text-4xl font-black">Questions fréquentes</h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          Comprendre les limites et le fonctionnement actuel de MOXT.
        </p>
      </div>
      <Card className="divide-y divide-[var(--app-border)] p-0">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group p-5 open:bg-[var(--app-surface-muted)]">
            <summary className="cursor-pointer list-none pr-8 font-black">{item.question}</summary>
            <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">{item.answer}</p>
          </details>
        ))}
      </Card>
    </div>
  )
}
