import { useEffect, useMemo } from 'react'
import { LuDroplet, LuScissors } from 'react-icons/lu'
import { useLanguage } from '../../../contexts/useLanguage'
import { Panel, Scroller, Segmented, Swatch, Tile } from './editorParts'
import { usePortraitLabels } from './usePortraitLabels'
import { GENDERS, TONES, findPortrait, hairstylesFor, withGender } from './portraitOptions'

/** Précharge des images (vignettes / portraits) sans bloquer le rendu. */
function preload(urls) {
  if (typeof Image === 'undefined') return
  for (const url of urls) {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
  }
}

/** Réglages du style « Portrait » : genre, teint (6), coiffure (5 vignettes CDN). */
export function PortraitControls({ choice, onChange }) {
  const { t } = useLanguage()
  const tx = (key, vars) => t(`profile.avatarEditor.${key}`, vars)
  const { toneLabel, hairLabel } = usePortraitLabels()
  const { gender, tone, hair } = choice

  const tiles = useMemo(
    () =>
      hairstylesFor(gender).map((style) => ({
        style,
        portrait: findPortrait({ gender, tone, hair: style.id }),
      })),
    [gender, tone],
  )

  // Vignettes du genre / teint courant tout de suite, portraits 512 px juste après.
  useEffect(() => {
    const items = tiles.map((entry) => entry.portrait).filter(Boolean)
    preload(items.map((item) => item.thumbUrl))
    const timer = setTimeout(() => preload(items.map((item) => item.url)), 400)
    return () => clearTimeout(timer)
  }, [tiles])

  const currentTone = TONES.find((item) => item.id === tone)
  const currentHair = hairstylesFor(gender).find((item) => item.id === hair)

  return (
    <div className="grid min-w-0 gap-3">
      <Segmented
        label={tx('sectionGender')}
        value={gender}
        onChange={(next) => onChange((prev) => withGender(prev, next))}
        options={GENDERS.map((id) => ({ id, label: tx(id === 'f' ? 'genderF' : 'genderM') }))}
      />

      <Panel
        icon={LuDroplet}
        title={tx('sectionSkin')}
        hint={currentTone ? toneLabel(currentTone) : tx('hintSkin')}
      >
        <Scroller label={tx('sectionSkin')} value={tone}>
          {TONES.map((item) => (
            <Swatch
              key={item.id}
              color={item.swatch_hex}
              selected={tone === item.id}
              label={toneLabel(item)}
              onSelect={() => onChange((prev) => ({ ...prev, tone: item.id }))}
            />
          ))}
        </Scroller>
      </Panel>

      <Panel
        icon={LuScissors}
        title={tx('sectionHair')}
        hint={currentHair ? hairLabel(currentHair) : tx('hintHair')}
      >
        <Scroller label={tx('sectionHair')} value={`${gender}|${hair}`}>
          {tiles.map(({ style, portrait }) =>
            portrait ? (
              <Tile
                key={style.id}
                cover
                src={portrait.thumbUrl}
                selected={hair === style.id}
                label={hairLabel(style)}
                onSelect={() => onChange((prev) => ({ ...prev, hair: style.id }))}
              />
            ) : null,
          )}
        </Scroller>
      </Panel>
    </div>
  )
}
