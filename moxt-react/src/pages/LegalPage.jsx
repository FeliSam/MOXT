import { Link, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useLanguage } from '../contexts/useLanguage'
import { resolveLocale } from '../i18n/translate'

const SECTION_IDS = ['mentions', 'cgu', 'privacy']

export function LegalPage() {
  const { sectionId } = useParams()
  const { language, t } = useLanguage()
  const activeId = SECTION_IDS.includes(sectionId) ? sectionId : 'mentions'
  const section = resolveLocale(language, `legal.sections.${activeId}`)
  const paragraphs = Array.isArray(section?.paragraphs) ? section.paragraphs : []
  const year = new Date().getFullYear()

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 sm:px-6">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
          {t('legal.pageEyebrow')}
        </span>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{section?.title || t('legal.pageEyebrow')}</h1>
        <p className="mt-3 text-sm text-[var(--app-text-muted)]">{t('legal.copyright', { year })}</p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {SECTION_IDS.map((id) => (
          <Link
            key={id}
            to={`/legal/${id}`}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              id === activeId
                ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
            }`}
          >
            {t(`legal.nav.${id}`)}
          </Link>
        ))}
      </nav>

      <Card className="grid gap-5">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="text-sm leading-7 text-[var(--app-text-muted)]">
            {paragraph}
          </p>
        ))}
      </Card>

      <p className="text-xs text-[var(--app-text-faint)]">{t('legal.footer')}</p>
    </div>
  )
}
