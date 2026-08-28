import { useSelector } from 'react-redux'
import { selectDevModuleFlags } from '../platform/devModuleAccess'

/** Économie Stars visible / active seulement si le flag module est on (pas le bypass admin). */
export function selectStarsModuleEnabled(state) {
  return Boolean(selectDevModuleFlags(state).stars)
}

export function useStarsModuleEnabled() {
  return useSelector(selectStarsModuleEnabled)
}
