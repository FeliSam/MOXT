import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export function TransferDetailNotFound() {
  return (
    <Card className="grid min-h-72 place-items-center text-center">
      <div>
        <h1 className="text-xl font-black">Transfert introuvable</h1>
        <Link className="mt-5 inline-block" to="/transfers">
          <Button>Retour aux transferts</Button>
        </Link>
      </div>
    </Card>
  )
}
