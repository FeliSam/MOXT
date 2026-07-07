import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { VERIFICATION_GUIDES } from './verificationGuides'
import { VerificationIllustration } from './VerificationIllustrations'

function GuideCard({ variant, title, description, illustration }) {
  const good = variant === 'accepted'
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-[var(--app-surface)] ${
        good
          ? 'border-emerald-200/80 dark:border-emerald-900/50'
          : 'border-red-200/80 dark:border-red-900/50'
      }`}
    >
      <div className="aspect-[16/11] bg-[var(--app-surface-muted)] p-3">
        <VerificationIllustration name={illustration} />
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-start gap-2">
          {good ? (
            <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <FiXCircle className="mt-0.5 shrink-0 text-red-500" />
          )}
          <strong className="text-sm leading-5">{title}</strong>
        </div>
        <p className="text-xs leading-5 text-[var(--app-text-muted)]">{description}</p>
      </div>
    </article>
  )
}

export function VerificationGuidePanel({ type }) {
  const guide = VERIFICATION_GUIDES[type]
  if (!guide) return null

  return (
    <section className="grid gap-5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/40 p-4 sm:p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
          Guide photo
        </p>
        <h3 className="mt-1 font-black">{guide.title}</h3>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">{guide.intro}</p>
      </div>

      <div className="grid gap-4">
        <div>
          <h4 className="mb-3 text-sm font-black text-emerald-700 dark:text-emerald-300">
            Exemples acceptés
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {guide.accepted.map((item) => (
              <GuideCard key={item.id} variant="accepted" {...item} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-black text-red-600 dark:text-red-300">À éviter</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guide.rejected.map((item) => (
              <GuideCard key={item.id} variant="rejected" {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
