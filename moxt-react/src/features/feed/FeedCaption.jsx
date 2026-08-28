import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

/** Légende unifiée du fil : 1 ligne + « Voir plus » inline. */
export function FeedCaption({ text, lines = 1 }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const textRef = useRef(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset expansion when caption changes
    setExpanded(false)
  }, [text])

  useEffect(() => {
    const el = textRef.current
    if (!el) return undefined
    function measure() {
      if (expanded) return
      setCanExpand(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [text, lines, expanded])

  function toggle(event) {
    event.preventDefault()
    event.stopPropagation()
    setExpanded((value) => !value)
  }

  if (expanded) {
    return (
      <div className="mt-1 min-w-0">
        <p className="whitespace-pre-wrap text-[13px] font-medium leading-snug text-white/90">{text}</p>
        <button
          type="button"
          onClick={toggle}
          className="mt-0.5 text-[12px] font-black tracking-tight text-white"
        >
          {p3('feed.seeLess')}
        </button>
      </div>
    )
  }

  if (lines <= 1) {
    return (
      <p className="mt-1 flex min-w-0 items-baseline gap-1.5 text-[13px] leading-snug">
        <span ref={textRef} className="min-w-0 truncate font-medium text-white/88">
          {text}
        </span>
        {canExpand ? (
          <button
            type="button"
            onClick={toggle}
            className="shrink-0 text-[12px] font-black tracking-tight text-white"
          >
            {p3('feed.seeMore')}
          </button>
        ) : null}
      </p>
    )
  }

  const clampClass = lines === 2 ? 'line-clamp-2' : 'line-clamp-3'

  return (
    <div className="mt-1 min-w-0">
      <p ref={textRef} className={`text-[13px] font-medium leading-snug text-white/88 ${clampClass}`}>
        {text}
      </p>
      {canExpand ? (
        <button
          type="button"
          onClick={toggle}
          className="mt-0.5 text-[12px] font-black tracking-tight text-white"
        >
          {p3('feed.seeMore')}
        </button>
      ) : null}
    </div>
  )
}
