import { Suspense, lazy } from 'react'

const Editor = lazy(() => import('./AvatarDicebearEditor.jsx'))

/** Charge DiceBear uniquement à l’ouverture (hors bundle principal). */
export function AvatarDicebearEditorLazy(props) {
  if (!props.open) return null
  return (
    <Suspense fallback={null}>
      <Editor {...props} />
    </Suspense>
  )
}
