import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Modal } from './Modal'

function ModalForm() {
  const [value, setValue] = useState('')

  return (
    <Modal open title="Formulaire" onClose={() => undefined}>
      <input aria-label="Nom" value={value} onChange={(event) => setValue(event.target.value)} />
    </Modal>
  )
}

describe('Modal', () => {
  it('conserve le focus pendant la saisie quand le parent est rendu a nouveau', () => {
    render(<ModalForm />)
    const input = screen.getByLabelText('Nom')

    input.focus()
    fireEvent.change(input, { target: { value: 'MOXT' } })

    expect(input).toHaveFocus()
    expect(input).toHaveValue('MOXT')
  })
})
