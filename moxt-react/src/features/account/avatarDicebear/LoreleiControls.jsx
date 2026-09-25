import { useId, useMemo, useRef, useState } from 'react'
import {
  LuDroplet,
  LuEye,
  LuGem,
  LuGlasses,
  LuImage,
  LuPalette,
  LuScissors,
  LuSmile,
} from 'react-icons/lu'
import { useLanguage } from '../../../contexts/useLanguage'
import { loreleiSvgDataUri } from './createLoreleiAvatar'
import { AccessoryToggle, Panel, Scroller, SwatchRow, Tile } from './editorParts'
import {
  BACKGROUND_COLORS,
  EARRINGS_VARIANTS,
  EYE_VARIANTS,
  GLASSES_VARIANTS,
  HAIR_COLORS,
  HAIR_VARIANTS,
  SKIN_COLORS,
  loreleiOptionsKey,
} from './loreleiOptions'

const TABS = [
  { id: 'face', icon: LuSmile, labelKey: 'profile.avatarEditor.tabFace' },
  { id: 'hair', icon: LuScissors, labelKey: 'profile.avatarEditor.tabHair' },
  { id: 'accessories', icon: LuGem, labelKey: 'profile.avatarEditor.tabAccessories' },
]

function useThumbs(options, field, variants, extra = {}) {
  const key = loreleiOptionsKey(options)
  return useMemo(
    () =>
      variants.map((variant) => ({
        variant,
        src: loreleiSvgDataUri(
          { ...options, ...extra, [field]: variant, backgroundColor: 'transparent' },
          { size: 96 },
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, field, variants],
  )
}

/**
 * Réglages du style « Illustré » (DiceBear Lorelei, rendu local) — chargé à la demande
 * pour garder DiceBear hors du premier affichage (style « Portrait » par défaut).
 */
export default function LoreleiControls({ options, onChange }) {
  const { t } = useLanguage()
  const tx = (key, vars) => t(`profile.avatarEditor.${key}`, vars)
  const uid = useId()
  const [tab, setTab] = useState('face')
  const tabRefs = useRef({})
  const hairThumbs = useThumbs(options, 'hair', HAIR_VARIANTS)
  const eyeThumbs = useThumbs(options, 'eyes', EYE_VARIANTS)
  const glassesThumbs = useThumbs(options, 'glasses', GLASSES_VARIANTS, { glassesOn: true })
  const earringThumbs = useThumbs(options, 'earrings', EARRINGS_VARIANTS, { earringsOn: true })
  const set = (patch) => onChange((prev) => ({ ...prev, ...patch }))
  const numbered = (key) => (_value, index) => tx(key, { index: index + 1 })

  function handleTabKeyDown(event) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const index = TABS.findIndex((item) => item.id === tab)
    const next = TABS[(index + step + TABS.length) % TABS.length].id
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="min-w-0">
      <div
        role="tablist"
        aria-label={tx('tabsAria')}
        className="ave-tabs grid grid-cols-3 gap-1 rounded-2xl p-1"
        onKeyDown={handleTabKeyDown}
      >
        {TABS.map(({ id, icon: Icon, labelKey }) => {
          const active = tab === id
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${id}`}
              aria-selected={active}
              aria-controls={`${uid}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(id)}
              className={`ave-tab flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[0.76rem] font-semibold sm:flex-row sm:gap-1.5 sm:px-2 sm:py-2.5 sm:text-[0.82rem] ${
                active ? 'is-active' : ''
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{t(labelKey)}</span>
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${tab}`}
        className="mt-4 grid gap-3"
      >
        {tab === 'face' ? (
          <>
            <Panel icon={LuDroplet} title={tx('sectionSkin')} hint={tx('hintSkin')}>
              <SwatchRow
                groupLabel={tx('sectionSkin')}
                colors={SKIN_COLORS}
                value={options.skinColor}
                onChange={(skinColor) => set({ skinColor })}
                labelFor={numbered('skinOption')}
              />
            </Panel>
            <Panel icon={LuEye} title={tx('sectionEyes')} hint={tx('hintEyes')}>
              <Scroller label={tx('sectionEyes')} value={options.eyes}>
                {eyeThumbs.map(({ variant, src }, index) => (
                  <Tile
                    key={variant}
                    src={src}
                    selected={options.eyes === variant}
                    label={tx('eyesOption', { index: index + 1 })}
                    onSelect={() => set({ eyes: variant })}
                  />
                ))}
              </Scroller>
            </Panel>
          </>
        ) : null}

        {tab === 'hair' ? (
          <>
            <Panel icon={LuScissors} title={tx('sectionHair')} hint={tx('hintHair')}>
              <Scroller label={tx('sectionHair')} value={options.hair}>
                {hairThumbs.map(({ variant, src }, index) => (
                  <Tile
                    key={variant}
                    src={src}
                    selected={options.hair === variant}
                    label={tx('hairOption', { index: index + 1 })}
                    onSelect={() => set({ hair: variant })}
                  />
                ))}
              </Scroller>
            </Panel>
            <Panel icon={LuPalette} title={tx('sectionHairColor')} hint={tx('hintHairColor')}>
              <SwatchRow
                groupLabel={tx('sectionHairColor')}
                colors={HAIR_COLORS}
                value={options.hairColor}
                onChange={(hairColor) => set({ hairColor })}
                labelFor={numbered('colorOption')}
              />
            </Panel>
          </>
        ) : null}

        {tab === 'accessories' ? (
          <>
            <Panel icon={LuGem} title={tx('sectionAccessories')} hint={tx('hintAccessories')}>
              <div className="grid grid-cols-2 gap-2">
                <AccessoryToggle
                  icon={LuGlasses}
                  label={tx('glasses')}
                  checked={options.glassesOn}
                  onChange={(glassesOn) => set({ glassesOn })}
                />
                <AccessoryToggle
                  icon={LuGem}
                  label={tx('earrings')}
                  checked={options.earringsOn}
                  onChange={(earringsOn) => set({ earringsOn })}
                />
              </div>
              {options.glassesOn ? (
                <div className="mt-3">
                  <p className="ave-sublabel">{tx('glasses')}</p>
                  <Scroller label={tx('glasses')} value={options.glasses}>
                    {glassesThumbs.map(({ variant, src }, index) => (
                      <Tile
                        key={variant}
                        src={src}
                        selected={options.glasses === variant}
                        label={`${tx('glasses')} ${index + 1}`}
                        onSelect={() => set({ glassesOn: true, glasses: variant })}
                      />
                    ))}
                  </Scroller>
                </div>
              ) : null}
              {options.earringsOn ? (
                <div className="mt-3">
                  <p className="ave-sublabel">{tx('earrings')}</p>
                  <Scroller label={tx('earrings')} value={options.earrings}>
                    {earringThumbs.map(({ variant, src }, index) => (
                      <Tile
                        key={variant}
                        src={src}
                        selected={options.earrings === variant}
                        label={`${tx('earrings')} ${index + 1}`}
                        onSelect={() => set({ earringsOn: true, earrings: variant })}
                      />
                    ))}
                  </Scroller>
                </div>
              ) : null}
            </Panel>
            <Panel icon={LuImage} title={tx('sectionBackground')} hint={tx('hintBackground')}>
              <SwatchRow
                small
                groupLabel={tx('sectionBackground')}
                colors={BACKGROUND_COLORS}
                value={options.backgroundColor}
                onChange={(backgroundColor) => set({ backgroundColor })}
                labelFor={(color, index) =>
                  color === 'transparent'
                    ? tx('transparent')
                    : tx('colorOption', { index: index + 1 })
                }
              />
            </Panel>
          </>
        ) : null}
      </div>
    </div>
  )
}
