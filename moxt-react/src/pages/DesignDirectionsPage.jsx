import { Link, useParams } from 'react-router-dom'
import { DesignDirectionMockup } from '../features/design-directions/DesignDirectionMockup'
import { DIRECTIONS } from '../features/design-directions/directionConfigs'

const PREVIEW_GRADIENTS = {
  a: 'linear-gradient(135deg, #F7F8FA 0%, #ECFDF8 50%, #E5E7EB 100%)',
  b: 'linear-gradient(135deg, #06080D 0%, #0A2E28 50%, #0E1117 100%)',
  c: 'linear-gradient(135deg, #FFFBF7 0%, #FFE4D6 50%, #E8FAF5 100%)',
}

export function DesignDirectionsIndexPage() {
  return (
    <div className="min-h-dvh bg-[var(--app-bg)] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">Design directions</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          3 pistes visuelles mOXT
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
          Mockups interactifs isolés — basculez clair/sombre dans chaque piste. Aucune logique métier modifiée.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {Object.values(DIRECTIONS).map((dir) => (
            <Link
              key={dir.id}
              to={`/design-directions/${dir.id}`}
              className="group overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div
                className="h-32"
                style={{ background: PREVIEW_GRADIENTS[dir.id] }}
              />
              <div className="p-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-700">Piste {dir.id.toUpperCase()}</p>
                <h2 className="mt-1 font-display text-lg font-extrabold">{dir.name.replace(/^Piste [ABC] — /, '')}</h2>
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">{dir.tagline}</p>
                <span className="mt-4 inline-flex text-xs font-bold text-brand-700 group-hover:underline">
                  Ouvrir le mockup →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DesignDirectionRoutePage() {
  const { directionId } = useParams()
  if (!DIRECTIONS[directionId]) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p>Piste introuvable. <Link to="/design-directions" className="text-brand-700">Retour</Link></p>
      </div>
    )
  }
  return <DesignDirectionMockup directionId={directionId} />
}
