import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import { BannerEditor } from './BannerEditor'
import { COVER_STYLE_IDS } from './coverBannerCatalog'

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))

function renderEditor(props = {}) {
  const store = configureStore({ reducer: { ui: (state = {}) => state } })
  const onChange = vi.fn()
  const onClose = vi.fn()
  render(
    <Provider store={store}>
      <BannerEditor
        open
        onClose={onClose}
        onChange={onChange}
        previewName="Maison Ada"
        {...props}
      />
    </Provider>,
  )
  return { onChange, onClose }
}

const radios = () => screen.getAllByRole('radio').filter((el) => el.className.includes('ave-tile'))

describe('BannerEditor', () => {
  it('entreprise : 4 styles, pas d’onglets Femme/Homme, sélection courante cochée', () => {
    renderEditor({ category: 'business', value: COVER_STYLE_IDS.BUSINESS_C_GLASS })
    expect(screen.getByText('profile.bannerEditor.displayTitle')).toBeTruthy()
    expect(radios()).toHaveLength(4)
    expect(screen.queryByRole('radio', { name: 'profile.bannerEditor.woman' })).toBeNull()
    const selected = radios().filter((el) => el.getAttribute('aria-checked') === 'true')
    expect(selected).toHaveLength(1)
    expect(selected[0].getAttribute('aria-label')).toBe('Glass fintech')
    expect(screen.getAllByText('Maison Ada').length).toBeGreaterThan(0)
  })

  it('Enregistrer : désactivé sans changement, puis enregistre le style choisi', () => {
    const { onChange, onClose } = renderEditor({
      category: 'business',
      value: COVER_STYLE_IDS.BUSINESS_B_EDITORIAL,
    })
    const save = screen.getByRole('button', { name: /profile\.bannerEditor\.save/ })
    expect(save.disabled).toBe(true)
    fireEvent.click(screen.getByRole('radio', { name: 'Topo emerald' }))
    expect(save.disabled).toBe(false)
    fireEvent.click(save)
    expect(onChange).toHaveBeenCalledWith(COVER_STYLE_IDS.BUSINESS_D_TOPO)
    expect(onClose).toHaveBeenCalled()
  })

  it('perso : onglets Femme/Homme présélectionnés selon le genre, 3 styles par onglet', () => {
    renderEditor({ category: 'personal', gender: 'female', value: null })
    const woman = screen.getByRole('radio', { name: 'profile.bannerEditor.woman' })
    expect(woman.getAttribute('aria-checked')).toBe('true')
    expect(radios()).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Silk plum' }).getAttribute('aria-checked')).toBe(
      'true',
    )
    fireEvent.click(screen.getByRole('radio', { name: 'profile.bannerEditor.man' }))
    expect(screen.getByRole('radio', { name: 'Steel teal' }).getAttribute('aria-checked')).toBe(
      'true',
    )
  })

  it('Aléatoire change de style', () => {
    renderEditor({ category: 'business', value: COVER_STYLE_IDS.BUSINESS_A_MESH })
    fireEvent.click(screen.getByRole('button', { name: /profile\.bannerEditor\.random/ }))
    const selected = radios().find((el) => el.getAttribute('aria-checked') === 'true')
    expect(selected.getAttribute('aria-label')).not.toBe('Mesh teal')
  })

  it('« Photo à la place » : masqué sans handler, envoie le fichier sinon', async () => {
    const { unmount } = render(
      <Provider store={configureStore({ reducer: { ui: (s = {}) => s } })}>
        <BannerEditor open category="personal" value={null} />
      </Provider>,
    )
    expect(screen.queryByText('profile.bannerEditor.photoInstead')).toBeNull()
    unmount()

    const onUploadPhoto = vi.fn(async () => 'https://cdn/banner.jpg')
    const { onClose } = renderEditor({ category: 'business', onUploadPhoto })
    expect(screen.getByText('profile.bannerEditor.photoInstead')).toBeTruthy()
    const input = screen.getByLabelText('profile.bannerEditor.photoInstead', {
      selector: 'input',
    })
    const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onUploadPhoto.mock.calls[0][0]).toBe(file)
  })
})
