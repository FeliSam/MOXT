import {
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiFlag,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { formatDate } from '../transferUtils'

export function TransferDetailActionsPanel({
  canCancel,
  canDeclare,
  canReceive,
  onCancel,
  onDeclarePayment,
  onOpenClaim,
  onProofSelected,
  proof,
  transfer,
}) {
  return (
    <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
      <h2 className="flex items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiCheck className="text-sm" />
        </span>
        Actions
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        Chaque action est unique et la prochaine étape dépend du statut actuel de l’opération.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {canDeclare ? (
          <label className="grid w-full cursor-pointer gap-3 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 transition hover:border-brand-300">
            <span className="flex items-center gap-2 text-sm font-bold">
              <FiUpload className="text-brand-700 dark:text-brand-300" /> Preuve de paiement
            </span>
            {proof ? (
              <div className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] p-3">
                {proof.file?.type?.startsWith('image/') ? (
                  <img
                    src={proof.url || URL.createObjectURL(proof.file)}
                    alt={proof.file?.name}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                    <FiFileText />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">{proof.file?.name}</strong>
                  <span className="text-xs text-[var(--app-text-muted)]">
                    {proof.uploading ? 'Envoi...' : `${Math.ceil((proof.file?.size || 0) / 1024)} Ko`}
                  </span>
                </span>
                <FiCheck className="shrink-0 text-emerald-600" />
              </div>
            ) : (
              <span className="text-xs text-[var(--app-text-muted)]">
                Cliquez pour ajouter une image ou un PDF
              </span>
            )}
            <input
              className="sr-only"
              type="file"
              accept="image/*,.pdf"
              onChange={onProofSelected}
            />
          </label>
        ) : null}

        {transfer.receivedAt ? (
          <Card className="w-full border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <p className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">
              Réception déclarée
            </p>
            <p className="mt-2 text-sm">
              Montant :{' '}
              <strong>
                {transfer.receivedAmount} ({transfer.receivedMethod})
              </strong>
            </p>
            <p className="text-xs text-[var(--app-text-muted)]">
              Le {formatDate(transfer.receivedAt)}
            </p>
          </Card>
        ) : null}

        {canReceive ? (
          <Link to={`/transfers/${transfer.id}/receive`}>
            <Button icon={FiCheckCircle}>Déclarer la réception</Button>
          </Link>
        ) : null}

        {canDeclare ? (
          <Button
            disabled={!proof || proof.uploading}
            loading={proof?.uploading}
            icon={FiCheckCircle}
            onClick={onDeclarePayment}
          >
            Déclarer le paiement
          </Button>
        ) : null}

        {canCancel ? (
          <Button variant="danger" icon={FiXCircle} onClick={onCancel}>
            Annuler
          </Button>
        ) : null}

        {!canDeclare && !canCancel ? (
          <span className="text-sm text-[var(--app-text-muted)]">Aucune action disponible.</span>
        ) : null}

        <Button variant="secondary" icon={FiFlag} onClick={onOpenClaim}>
          Ouvrir une réclamation
        </Button>
      </div>
    </Card>
  )
}
