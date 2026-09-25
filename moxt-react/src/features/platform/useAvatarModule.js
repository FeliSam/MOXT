import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { resolveAvatarModule } from '../../config/avatarSettings'

/** Vue dérivée du module Avatar depuis le store (tolère un store sans ces slices : tests). */
export function selectAvatarModule(state) {
  return resolveAvatarModule({
    moduleEnabled: state?.platformModules?.flags?.avatar !== false,
    settings: state?.avatarSettings?.config,
  })
}

export function useAvatarModule() {
  const moduleFlag = useSelector((state) => state.platformModules?.flags?.avatar)
  const config = useSelector((state) => state.avatarSettings?.config)
  return useMemo(
    () => resolveAvatarModule({ moduleEnabled: moduleFlag !== false, settings: config }),
    [moduleFlag, config],
  )
}
