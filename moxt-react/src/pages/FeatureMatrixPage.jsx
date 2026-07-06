import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { FEATURE_MATRIX, FEATURE_STATUS_META, featureMatrixSummary } from '../config/featureMatrix'

export function FeatureMatrixPage() {
  const summary = featureMatrixSummary()

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Pilotage"
        title="Couverture fonctionnelle"
        description="État réel des fonctions React, sans confondre démonstration locale et service connecté."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Fonctions', summary.total],
          ['Complètes', summary.complete],
          ['Partielles', summary.partial],
          ['Planifiées', summary.planned],
        ].map(([label, value]) => (
          <Card key={label}>
            <strong className="text-3xl">{value}</strong>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {FEATURE_MATRIX.map((section) => (
          <Card key={section.domain}>
            <h2 className="text-lg font-black">{section.domain}</h2>
            <div className="mt-4 grid gap-3">
              {section.features.map((feature) => {
                const meta = FEATURE_STATUS_META[feature.status]
                return (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] p-3"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-semibold">{feature.label}</span>
                      {feature.note ? (
                        <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
                          {feature.note}
                        </p>
                      ) : null}
                    </div>
                    <Badge className="shrink-0" tone={meta.tone}>
                      {meta.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
