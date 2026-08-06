import { forwardRef } from 'react'
import { linkifyParts } from '../../utils/linkify'

const WHITESPACE_CLASS = {
  'pre-wrap': 'whitespace-pre-wrap',
  'pre-line': 'whitespace-pre-line',
  false: '',
  none: '',
}

export function linkifyChildren(
  text,
  { linkClassName = 'underline underline-offset-2', stopPropagation = false, keyPrefix = '' } = {},
) {
  return linkifyParts(text).map((part, index) =>
    part.type === 'link' ? (
      <a
        key={`${keyPrefix}${part.href}-${index}`}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        onClick={stopPropagation ? (event) => event.stopPropagation() : undefined}
      >
        {part.value}
      </a>
    ) : (
      <span key={`${keyPrefix}t-${index}`}>{part.value}</span>
    ),
  )
}

/**
 * Renders plain text with http(s) and www. URLs as clickable links.
 */
export const LinkifiedText = forwardRef(function LinkifiedText(
  {
    text,
    as: Tag = 'span',
    className = '',
    preserveWhitespace = 'pre-wrap',
    linkClassName = 'underline underline-offset-2',
    stopPropagation = false,
    breakWords = true,
  },
  ref,
) {
  const whitespaceClass = WHITESPACE_CLASS[preserveWhitespace] ?? WHITESPACE_CLASS['pre-wrap']
  const rootClassName = [whitespaceClass, breakWords ? 'break-words' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag ref={ref} className={rootClassName || undefined}>
      {linkifyChildren(text, { linkClassName, stopPropagation })}
    </Tag>
  )
})
