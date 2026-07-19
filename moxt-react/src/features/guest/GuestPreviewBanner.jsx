import { Link, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'

export function GuestPreviewBanner() {
  const { t } = useLanguage()
  const location = useLocation()
  const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)

  return (
    <Alert variant="info" title={t('guest.previewBanner.title')} className="mb-6">
      <p className="text-sm">{t('guest.previewBanner.body')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={`/register?returnTo=${returnTo}`}>
          <Button>{t('guest.previewBanner.createAccount')}</Button>
        </Link>
        <Link to={`/login?returnTo=${returnTo}`}>
          <Button variant="secondary">{t('guest.previewBanner.login')}</Button>
        </Link>
      </div>
    </Alert>
  )
}
