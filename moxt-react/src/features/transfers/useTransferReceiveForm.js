import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { receiveTransfer } from './transferSlice'
import { canClientDeclareReception } from './transferActionUtils'
import { validateReceiveTransferForm, normalizeReceivedAmount } from './transferReceiveValidation'
import { storageService } from '../../services/storageService'
import { addToast } from '../ui/uiSlice'

const initialValues = {
  receivedAmount: '',
  receivedMethod: 'cash',
  proofFile: null,
}

export function useTransferReceiveForm({ transfer, user, onSuccess }) {
  const { t } = useLanguage()
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
    const nextErrors = validateReceiveTransferForm(values, t)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    let proofPayload = null
    try {
      if (values.proofFile) {
        const { url, path } = await storageService.uploadTransferProof(
          user.id,
          `${transfer.id}-receive`,
          values.proofFile,
        )
        proofPayload = {
          name: values.proofFile.name,
          size: values.proofFile.size,
          type: values.proofFile.type,
          url,
          path,
          uploadedAt: new Date().toISOString(),
        }
      }

      if (!canClientDeclareReception(transfer, transfer.userId === user.id)) {
        dispatch(
          addToast({
            title: t('transfers.receive.impossibleTitle'),
            message: t('transfers.receive.impossibleMessage'),
            tone: 'error',
          }),
        )
        setSubmitting(false)
        return
      }

      dispatch(
        receiveTransfer({
          id: transfer.id,
          actorId: user.id,
          receivedAmount: normalizeReceivedAmount(values.receivedAmount),
          receivedMethod: values.receivedMethod,
          receivedProof: proofPayload,
          receivedAt: new Date().toISOString(),
        }),
      )

      onSuccess?.()
    } catch {
      setErrors({ proofFile: t('transfers.receive.proofUploadFailed') })
    } finally {
      setSubmitting(false)
    }
  }, [dispatch, onSuccess, t, transfer, user, values])

  return { values, errors, setField, submit, submitting }
}
