import { FiHelpCircle } from 'react-icons/fi'
import { Card } from '../components/ui/Card'
import { FAQ_ITEMS } from '../config/publicContent'
import { useLanguage } from '../contexts/useLanguage'
import { phase3Text } from '../i18n/phase3I18n'

export function FaqPage() {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-2xl text-[var(--app-accent)]">
          <FiHelpCircle />
        </span>
        <h1 className="mt-5 text-4xl font-black">{p3('faq.title')}</h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          {p3('faq.description')}
        </p>
      </div>
      <Card className="divide-y divide-[var(--app-border)] p-0">
        {FAQ_ITEMS.map(({ id }) => (
          <details key={id} className="group p-5 open:bg-[var(--app-surface-muted)]">
            <summary className="cursor-pointer list-none pr-8 font-black">
              {p3(`faq.${id}.question`)}
            </summary>
            <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
              {p3(`faq.${id}.answer`)}
            </p>
          </details>
        ))}
      </Card>
    </div>
  )
}
