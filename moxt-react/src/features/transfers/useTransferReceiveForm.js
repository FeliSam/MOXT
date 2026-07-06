import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { receiveTransfer } from './transferSlice'
import { validateReceiveTransferForm, normalizeReceivedAmount } from './transferReceiveValidation'
import { storageService } from '../../services/storageService'

const initialValues = {
  receivedAmount: '',
  receivedMethod: 'cash',
  proofFile: null,
}

export function useTransferReceiveForm({ transfer, user, onSuccess }) {
  const dispatch = useDispatch()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const submit = useCallback(async () => {
    if (!transfer || !user) return
    const nextErrors = validateReceiveTransferForm(values)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    let proofPayload = null
    try {
      if (values.proofFile) {
        const url = await storageService.uploadTransferProof(
          user.id,
          `${transfer.id}-receive`,
          values.proofFile,
        )
        proofPayload = {
          name: values.proofFile.name,
          size: values.proofFile.size,
          type: values.proofFile.type,
          url,
          uploadedAt: new Date().toISOString(),
        }
      }

      dispatch(
        receiveTransfer({
          id: transfer.id,
          receivedAmount: normalizeReceivedAmount(values.receivedAmount),
          receivedMethod: values.receivedMethod,
          receivedProof: proofPayload,
          receivedAt: new Date().toISOString(),
        }),
      )

      onSuccess?.()
    } catch {
      setErrors({ proofFile: "La preuve n'a pas pu être envoyée." })
    } finally {
      setSubmitting(false)
    }
  }, [dispatch, onSuccess, transfer, user, values])

  return { values, errors, setField, submit, submitting }
}
