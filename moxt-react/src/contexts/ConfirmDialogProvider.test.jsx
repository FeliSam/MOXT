import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialogProvider, useConfirm } from './ConfirmDialogProvider'

vi.mock('./useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))

function Harness({ options, onResult }) {
  const { confirm } = useConfirm()
  return (
    <button type="button" onClick={async () => onResult(await confirm(options))}>
      ouvrir
    </button>
  )
}

function setup(options) {
  const onResult = vi.fn()
  render(
    <ConfirmDialogProvider>
      <Harness options={options} onResult={onResult} />
    </ConfirmDialogProvider>,
  )
  fireEvent.click(screen.getByText('ouvrir'))
  return { onResult, dialog: () => screen.queryByRole('dialog') }
}

const BASE = {
  title: 'Supprimer cette publication ?',
  description: 'Elle disparaîtra définitivement de votre profil et du Marketplace.',
  subject: 'Casque audio sans fil',
  confirmLabel: 'Supprimer',
  tone: 'danger',
}

describe('ConfirmDialogProvider / useConfirm', () => {
  it('ouvre la modale avec le titre, la conséquence, la publication et un bouton explicite', () => {
    const { dialog } = setup({ ...BASE, onConfirm: vi.fn() })
    const modal = dialog()
    expect(modal).toBeTruthy()
    expect(within(modal).getByText(BASE.title)).toBeTruthy()
    expect(within(modal).getByText(BASE.description)).toBeTruthy()
    expect(within(modal).getByText(BASE.subject)).toBeTruthy()
    expect(within(modal).getByRole('button', { name: 'Supprimer' })).toBeTruthy()
    expect(modal.querySelector('[data-confirm-tone="danger"]')).toBeTruthy()
  })

  it('Annuler ferme sans rien exécuter et résout false', async () => {
    const onConfirm = vi.fn()
    const { onResult, dialog } = setup({ ...BASE, onConfirm })
    fireEvent.click(within(dialog()).getByRole('button', { name: 'common.cancel' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it('Échap et clic sur le fond annulent aussi', async () => {
    const onConfirm = vi.fn()
    const first = setup({ ...BASE, onConfirm })
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(first.onResult).toHaveBeenCalledWith(false))
    fireEvent.click(screen.getByText('ouvrir'))
    fireEvent.click(screen.getByRole('button', { name: 'common.closeWindow' }))
    await waitFor(() => expect(first.onResult).toHaveBeenCalledTimes(2))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Confirmer exécute une seule fois, même en double-cliquant, avec état de chargement', async () => {
    let finish
    const onConfirm = vi.fn(() => new Promise((resolve) => { finish = resolve }))
    const { onResult, dialog } = setup({ ...BASE, onConfirm })
    const button = within(dialog()).getByRole('button', { name: 'Supprimer' })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(button.disabled).toBe(true))
    expect(button.getAttribute('aria-busy')).toBe('true')
    // Pendant l'exécution, Échap ne ferme pas la modale.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(dialog()).toBeTruthy()
    finish()
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(dialog()).toBeNull()
  })

  it("affiche l'erreur dans la modale si l'action échoue, sans la fermer", async () => {
    const onConfirm = vi.fn().mockRejectedValueOnce(new Error('Réseau indisponible')).mockResolvedValueOnce()
    const { onResult, dialog } = setup({ ...BASE, onConfirm })
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Supprimer' }))
    expect(await within(dialog()).findByRole('alert')).toBeTruthy()
    expect(within(dialog()).getByText('Réseau indisponible')).toBeTruthy()
    expect(onResult).not.toHaveBeenCalled()
    // Nouvel essai : réussit, la modale se ferme.
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Supprimer' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('ton accent : prune pour un profil perso, vert (défaut) pour une entreprise', async () => {
    const perso = setup({ ...BASE, tone: 'accent', accent: 'personal', confirmLabel: 'Archiver' })
    expect(perso.dialog().querySelector('[data-confirm-tone="accent"][data-profile-kind="personal"]')).toBeTruthy()
    fireEvent.click(within(perso.dialog()).getByRole('button', { name: 'common.cancel' }))
    await waitFor(() => expect(perso.dialog()).toBeNull())
  })

  it('reste compatible avec requestConfirm (callback, sans promesse attendue)', async () => {
    function Legacy({ onConfirm }) {
      const { requestConfirm } = useConfirm()
      return (
        <button type="button" onClick={() => requestConfirm({ title: 'Ancien', description: 'x', onConfirm })}>
          legacy
        </button>
      )
    }
    const onConfirm = vi.fn()
    render(
      <ConfirmDialogProvider>
        <Legacy onConfirm={onConfirm} />
      </ConfirmDialogProvider>,
    )
    fireEvent.click(screen.getByText('legacy'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.confirm' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })
})