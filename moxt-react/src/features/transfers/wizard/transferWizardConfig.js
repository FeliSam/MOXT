import { FiShield, FiSliders, FiUsers } from 'react-icons/fi'

export const TRANSFER_WIZARD_STEPS = [
  { key: 'amount', labelKey: 'transfers.wizard.steps.amount', icon: FiSliders },
  { key: 'sender', labelKey: 'transfers.wizard.steps.sender', icon: FiUsers },
  { key: 'recipient', labelKey: 'transfers.wizard.steps.recipient', icon: FiUsers },
  { key: 'confirm', labelKey: 'transfers.wizard.steps.confirm', icon: FiShield },
]

export const TRANSFER_DRAFT_KEY = 'moxt-transfer-draft-v1'

export function readTransferDraft() {
  try {
    return JSON.parse(localStorage.getItem(TRANSFER_DRAFT_KEY) || 'null')
  } catch {
    return null
  }
}

export function clearTransferDraft() {
  localStorage.removeItem(TRANSFER_DRAFT_KEY)
}

export function writeTransferDraft(userId, step, values) {
  localStorage.setItem(
    TRANSFER_DRAFT_KEY,
    JSON.stringify({
      userId,
      step,
      values,
      updatedAt: new Date().toISOString(),
    }),
  )
}
