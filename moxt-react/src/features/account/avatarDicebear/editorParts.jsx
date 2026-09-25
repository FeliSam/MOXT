import { useLayoutEffect, useRef } from 'react'
import { LuCheck } from 'react-icons/lu'
import { isLightColor } from './editorUtils'

/** Briques UI partagées de l’éditeur d’avatar (portraits + illustré). */

export function MoxtMark({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M3.5 19V5.5l8.5 8 8.5-8V19"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Panel({ icon: Icon, title, hint, children }) {
  return (
    <section className="ave-panel min-w-0 rounded-[1.4rem] p-4">
      <header className="mb-3 flex items-center gap-3">
        <span className="ave-panel-icon grid size-9 shrink-0 place-items-center rounded-xl">
          <Icon aria-hidden="true" className="size-[1.05rem]" />
        </span>
        <div className="min-w-0">
          <h3 className="ave-panel-title leading-tight">{title}</h3>
          {hint ? <p className="ave-muted mt-0.5 truncate text-xs">{hint}</p> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

/** Rangée horizontale défilante ; garde l’option sélectionnée visible quand `value` change. */
export function Scroller({ label, value, children }) {
  const ref = useRef(null)
  const mounted = useRef(false)
  useLayoutEffect(() => {
    const row = ref.current
    const selected = row?.querySelector('[aria-checked="true"]')
    const wasMounted = mounted.current
    mounted.current = true
    if (!row || !selected) return
    const left = Math.max(0, selected.offsetLeft - (row.clientWidth - selected.offsetWidth) / 2)
    if (typeof row.scrollTo === 'function') {
      row.scrollTo({ left, behavior: wasMounted ? 'smooth' : 'auto' })
    } else {
      row.scrollLeft = left
    }
  }, [value])
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className="ave-scroller scrollbar-hidden relative -mx-4 flex snap-x gap-2.5 overflow-x-auto scroll-px-4 px-4 py-2"
    >
      {children}
    </div>
  )
}

/** Segmented control (styles / genres) — radios accessibles. */
export function Segmented({ label, options, value, onChange, className = '' }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`ave-tabs grid gap-1 rounded-2xl p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ id, label: optionLabel, icon: Icon }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`ave-tab flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[0.86rem] font-semibold ${
              active ? 'is-active' : ''
            }`}
          >
            {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
            <span className="truncate">{optionLabel}</span>
          </button>
        )
      })}
    </div>
  )
}

const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%),linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0,5px 5px',
  backgroundColor: '#fafafa',
}

export function Swatch({ color, selected, label, onSelect, small = false }) {
  const transparent = color === 'transparent'
  const css = transparent ? null : String(color).startsWith('#') ? color : `#${color}`
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`ave-swatch relative grid shrink-0 snap-start place-items-center rounded-full ${
        small ? 'size-8' : 'size-[2.6rem]'
      } ${selected ? 'is-selected' : ''}`}
      style={transparent ? CHECKERBOARD : { backgroundColor: css }}
    >
      {selected ? (
        <LuCheck
          aria-hidden="true"
          strokeWidth={3}
          className={`${small ? 'size-3.5' : 'size-4'} ${
            isLightColor(color) ? 'text-slate-900/75' : 'text-white'
          }`}
        />
      ) : null}
    </button>
  )
}

export function SwatchRow({ colors, value, onChange, labelFor, groupLabel, small = false }) {
  return (
    <Scroller label={groupLabel} value={value}>
      {colors.map((color, index) => (
        <Swatch
          key={color}
          color={color}
          small={small}
          selected={value === color}
          label={labelFor(color, index)}
          onSelect={() => onChange(color)}
        />
      ))}
    </Scroller>
  )
}

function CheckBadge() {
  return (
    <span className="ave-check absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full">
      <LuCheck aria-hidden="true" strokeWidth={3.5} className="size-3" />
    </span>
  )
}

/** Vignette : `cover` = photo plein cadre (portraits), sinon illustration centrée. */
export function Tile({ src, selected, label, onSelect, cover = false }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`ave-tile relative grid shrink-0 snap-start place-items-center overflow-hidden rounded-[1.15rem] ${
        cover ? 'size-[5.25rem]' : 'size-[4.75rem]'
      } ${selected ? 'is-selected' : ''}`}
    >
      <img
        src={src}
        alt=""
        className={cover ? 'size-full object-cover' : 'size-[92%] object-contain'}
        draggable="false"
        decoding="async"
      />
      {selected ? <CheckBadge /> : null}
    </button>
  )
}

export function AccessoryToggle({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`ave-acc flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left ${
        checked ? 'is-on' : ''
      }`}
    >
      <Icon aria-hidden="true" className="ave-brand size-[1.1rem] shrink-0" />
      <span className="min-w-0 flex-1 text-[0.82rem] font-semibold leading-tight">{label}</span>
      <span
        aria-hidden="true"
        className={`ave-switch relative inline-flex h-6 w-10 shrink-0 items-center rounded-full ${
          checked ? 'is-on' : ''
        }`}
      >
        <span
          className={`ave-switch-knob inline-block size-[1.1rem] rounded-full bg-white shadow ${
            checked ? 'translate-x-[1.2rem]' : 'translate-x-[0.2rem]'
          }`}
        />
      </span>
    </button>
  )
}
