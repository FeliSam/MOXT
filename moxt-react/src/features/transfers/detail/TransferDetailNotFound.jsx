import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'

export function TransferDetailNotFound() {
  const { t } = useLanguage()
  return (
    <Card className="grid min-h-72 place-items-center text-center">
      <div>
        <h1 className="text-xl font-black">{t('transfers.detail.notFound.title')}</h1>
        <Link className="mt-5 inline-block" to="/transfers">
          <Button>{t('transfers.detail.notFound.back')}</Button>
        </Link>
      </div>
    </Card>
  )
}
