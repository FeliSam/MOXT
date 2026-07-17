import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

vi.mock('../../contexts/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) =>
      ({ 'common.close': 'Fermer', 'common.closeWindow': 'Fermer la fenêtre' })[key] || key,
  }),
}))

function ModalForm() {
  const [value, setValue] = useState('')

  return (
    <Modal open title="Formulaire" onClose={() => undefined}>
      <input aria-label="Nom" value={value} onChange={(event) => setValue(event.target.value)} />
    </Modal>
  )
}

describe('Modal', () => {
  it('rend le dialogue dans document.body pour passer au-dessus du header', () => {
    const { container } = render(
      <Modal open title="QR code profil" onClose={() => undefined}>
        <p>Contenu</p>
      </Modal>,
    )

    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    const overlay = document.body.querySelector('[role="presentation"]')
    expect(overlay).not.toBeNull()
    expect(overlay.className).toContain('z-[var(--z-modal)]')
  })

  it('conserve le focus pendant la saisie quand le parent est rendu a nouveau', () => {
    render(<ModalForm />)
    const input = screen.getByLabelText('Nom')

    input.focus()
    fireEvent.change(input, { target: { value: 'MOXT' } })

    expect(input).toHaveFocus()
    expect(input).toHaveValue('MOXT')
  })
})
