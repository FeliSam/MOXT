import { FiFileText, FiPlus } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { statusMeta } from '../../config/statuses'
import { addBusinessDocument } from '../../features/businesses/businessSlice'
import { addToast } from '../../features/ui/uiSlice'

export function DocumentsPanel({ business, dispatch, documents }) {
  function add(file) {
    if (!file) return
    dispatch(
      addBusinessDocument({
        businessId: business.id,
        ownerId: business.ownerId,
        category: 'company',
        name: file.name,
        size: file.size,
        type: file.type,
      }),
    )
    dispatch(
      addToast({
        title: 'Document ajouté',
        message: 'Le document sera synchronisé avec votre espace entreprise.',
        tone: 'success',
      }),
    )
  }
  return (
    <div className="grid gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-black">Documents de l’entreprise</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            Ajoutez les métadonnées des justificatifs professionnels.
          </p>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white">
          <FiPlus /> Ajouter
          <input
            className="sr-only"
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => add(event.target.files?.[0])}
          />
        </label>
      </Card>
      {documents.length ? (
        documents.map((document) => (
          <Card key={document.id} className="flex items-center gap-4">
            <FiFileText className="text-xl text-brand-600" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{document.name}</strong>
              <span className="text-xs text-[var(--app-text-muted)]">
                {Math.ceil(document.size / 1024)} Ko
              </span>
            </div>
            <Badge tone={statusMeta(document.status).tone}>
              {statusMeta(document.status).label}
            </Badge>
          </Card>
        ))
      ) : (
        <EmptyState title="Aucun document professionnel" />
      )}
    </div>
  )
}
