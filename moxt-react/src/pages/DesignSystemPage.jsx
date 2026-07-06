import { FiCheck, FiDownload, FiPlus, FiTrash2 } from 'react-icons/fi'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'

export function DesignSystemPage() {
  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Fondations UI"
        title="Design system MOXT"
        description="Premiers composants reutilisables. Les domaines futurs doivent les employer avant de creer de nouvelles variantes."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="font-black">Boutons</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button icon={FiPlus}>Action principale</Button>
            <Button icon={FiDownload} variant="secondary">
              Secondaire
            </Button>
            <Button icon={FiTrash2} variant="danger">
              Supprimer
            </Button>
            <Button variant="ghost">Discret</Button>
          </div>
        </Card>
        <Card>
          <h2 className="font-black">Badges et statuts</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Badge>MOXT</Badge>
            <Badge tone="success">Valide</Badge>
            <Badge tone="warning">En attente</Badge>
            <Badge tone="info">Information</Badge>
          </div>
        </Card>
        <Card>
          <h2 className="font-black">Champs de formulaire</h2>
          <div className="mt-5 grid gap-4">
            <Input
              id="sample-email"
              label="Adresse email"
              placeholder="vous@email.com"
              hint="Nous ne partagerons pas cette adresse."
            />
            <Input
              id="sample-error"
              label="Téléphone"
              value="+229"
              readOnly
              error="Le numero est incomplet."
            />
          </div>
        </Card>
        <Card>
          <h2 className="font-black">Retour utilisateur</h2>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <div className="flex gap-3">
              <FiCheck className="mt-0.5 shrink-0 text-xl" />
              <div>
                <strong className="block text-sm">Operation terminee</strong>
                <p className="mt-1 text-sm leading-5 opacity-80">
                  Les composants respectent les themes clair et sombre.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
