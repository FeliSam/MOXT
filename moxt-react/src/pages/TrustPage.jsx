import { FiAlertTriangle, FiCheckCircle, FiLock, FiShield, FiSmartphone } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { TRUST_PRINCIPLES } from '../config/publicContent'
import { useLanguage } from '../contexts/useLanguage'

export function TrustPage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6">
      <div className="max-w-3xl">
        <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
          {t('public.trustPage.eyebrow')}
        </span>
        <h1 className="mt-2 text-4xl font-black">{t('public.trustPage.title')}</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--app-text-muted)]">
          {t('public.trustPage.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TRUST_PRINCIPLES.map(({ icon: Icon, id }) => (
          <Card key={id}>
            <Icon className="text-2xl text-brand-600" />
            <h2 className="mt-4 font-black">{t(`public.trust.${id}.title`)}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              {t(`public.trust.${id}.description`)}
            </p>
          </Card>
        ))}
      </div>

      <Card className="border-brand-200 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/20">
        <div className="flex gap-4">
          <FiSmartphone className="mt-1 shrink-0 text-2xl text-brand-600" />
          <div>
            <h2 className="font-black">{t('public.trustPage.publishTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              {t('public.trustPage.publishBody')}
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex gap-4">
          <FiAlertTriangle className="mt-1 shrink-0 text-2xl text-amber-600" />
          <div>
            <h2 className="font-black">{t('public.trustPage.delayTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              {t('public.trustPage.delayBefore')}{' '}
              <Link className="font-bold text-brand-700 hover:underline" to="/support">
                {t('public.trustPage.supportLink')}
              </Link>
              {t('public.trustPage.delayAfter')}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          [FiLock, 'data'],
          [FiShield, 'business'],
          [FiCheckCircle, 'badge'],
          [FiAlertTriangle, 'reports'],
        ].map(([Icon, id]) => (
          <Card key={id} className="flex gap-4">
            <Icon className="mt-1 shrink-0 text-xl text-brand-600" />
            <div>
              <h2 className="font-black">{t(`public.trustPage.cards.${id}.title`)}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                {t(`public.trustPage.cards.${id}.description`)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
