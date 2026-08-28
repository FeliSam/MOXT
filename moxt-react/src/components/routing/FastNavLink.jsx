import { forwardRef, startTransition } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { preloadRoute } from '../../config/navigation'

function shouldHijackClick(event) {
  if (event.defaultPrevented) return false
  if (event.button !== 0) return false
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return false
  if (event.currentTarget?.getAttribute('target') === '_blank') return false
  return true
}

/**
 * NavLink qui précharge le chunk au doigt et navigue en transition React :
 * l’écran actuel reste visible, sans overlay de chargement.
 */
export const FastNavLink = forwardRef(function FastNavLink(
  {
    to,
    replace,
    state,
    preventScrollReset,
    relative,
    onClick,
    onPointerDown,
    onTouchStart,
    onFocus,
    onMouseEnter,
    ...rest
  },
  ref,
) {
  const navigate = useNavigate()

  function warm() {
    preloadRoute(to)
  }

  return (
    <NavLink
      ref={ref}
      to={to}
      replace={replace}
      state={state}
      preventScrollReset={preventScrollReset}
      relative={relative}
      {...rest}
      onPointerDown={(event) => {
        warm()
        onPointerDown?.(event)
      }}
      onTouchStart={(event) => {
        warm()
        onTouchStart?.(event)
      }}
      onFocus={(event) => {
        warm()
        onFocus?.(event)
      }}
      onMouseEnter={(event) => {
        warm()
        onMouseEnter?.(event)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (!shouldHijackClick(event)) return
        event.preventDefault()
        warm()
        startTransition(() => {
          navigate(to, { replace, state, preventScrollReset, relative })
        })
      }}
    />
  )
})
