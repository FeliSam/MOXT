import { FiChevronDown } from 'react-icons/fi'
import { useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { LinkifiedText } from './LinkifiedText'

const LINE_CLAMP_CLASS = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
}

export function ExpandableLinkifiedText({
  text,
  maxLines = 4,
  as = 'p',
  className = '',
  preserveWhitespace = 'pre-line',
  buttonClassName = '',
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const [expanded, setExpanded] = useState(false)
  const [canToggle, setCanToggle] = useState(false)
  const textRef = useRef(null)
  const clampClass = LINE_CLAMP_CLASS[maxLines] || LINE_CLAMP_CLASS[4]

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el || expanded) return
    setCanToggle(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded, maxLines])

  if (!String(text || '').trim()) return null

  return (
    <div className="min-w-0">
      <LinkifiedText
        ref={textRef}
        as={as}
        text={text}
        preserveWhitespace={preserveWhitespace}
        className={`${className} ${expanded ? '' : clampClass}`.trim()}
      />
      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={`group mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[var(--app-accent)] transition hover:opacity-80 ${buttonClassName}`.trim()}
        >
          <span>{expanded ? p3('news.seeLess') : p3('news.seeMore')}</span>
          <FiChevronDown
            aria-hidden
            className={`size-4 shrink-0 transition-transform duration-200 ease-out ${
              expanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
      ) : null}
    </div>
  )
}
