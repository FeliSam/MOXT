import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { en } from '@moxt/shared/i18n/locales/en.js'
import { es } from '@moxt/shared/i18n/locales/es.js'
import { fr } from '@moxt/shared/i18n/locales/fr.js'
import { pt } from '@moxt/shared/i18n/locales/pt.js'
import { ru } from '@moxt/shared/i18n/locales/ru.js'
import { LanguageContext } from '../../../contexts/language-context'
import { COVER_BANNER_LABELS_FR, coverBannerLabels } from './coverBannerLabels'
import { COVER_STYLE_IDS } from './coverBannerCatalog'
import { MoxtCoverBanner } from './MoxtCoverBanner'

const tFrom = (dict) => (key) => key.split('.').reduce((node, part) => node?.[part], dict) ?? key

describe('libellés des bannières', () => {
  it.each([['fr', fr], ['en', en], ['es', es], ['pt', pt], ['ru', ru]])('%s : toutes les clés coverBanner existent', (lang, dict) => {
    for (const key of Object.keys(COVER_BANNER_LABELS_FR)) {
      expect(typeof dict.coverBanner?.[key], `${lang} coverBanner.${key}`).toBe('string')
    }
  })

  it('« Profil » passe par l’i18n (anglais) et retombe en français hors LanguageProvider', () => {
    const { container, unmount } = render(
      <LanguageContext.Provider value={{ language: 'en', t: tFrom(en) }}>
        <MoxtCoverBanner styleId={COVER_STYLE_IDS.MAN_D_PRUNE} category="personal" />
      </LanguageContext.Provider>,
    )
    expect(container.textContent).toContain('Profile')
    expect(container.textContent).not.toContain('Profil ')
    unmount()
    const fallback = render(<MoxtCoverBanner styleId={COVER_STYLE_IDS.MAN_D_PRUNE} category="personal" />)
    expect(fallback.container.textContent).toContain('Profil')
    expect(coverBannerLabels(tFrom(ru)).profile).toBe('Профиль')
  })
})