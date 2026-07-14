import { useMemo } from 'react'
import { FiBriefcase, FiPackage, FiRepeat } from 'react-icons/fi'
import { shallowEqual, useSelector } from 'react-redux'
import { selectActiveBusinessForOwner } from '../../businesses/businessVisibility'
import { applicationJobId } from '../../jobs/jobUtils'
import { TRANSFER_STATUS } from '../../transfers/transferConfig'

export function useDashboardStats(user) {
  const conversations = useSelector(
    (state) =>
      state.communications.conversations.filter((item) => item.participantIds.includes(user.id))
        .length,
  )
  const myTransfers = useSelector(
    (state) => state.transfers.items.filter((item) => item.userId === user.id),
    shallowEqual,
  )
  const parcelRequests = useSelector(
    (state) => state.parcels.requests.filter(
      (item) => item.ownerId === user.id && item.status === 'submitted',
    ),
    shallowEqual,
  )
  const receivedApplications = useSelector((state) => {
    const myJobIds = state.jobs.items
      .filter((item) => item.ownerId === user.id)
      .map((item) => item.id)
    return state.jobs.applications.filter(
      (item) => myJobIds.includes(applicationJobId(item)) && item.status === 'submitted',
    )
  }, shallowEqual)
  const business = useSelector((state) =>
    selectActiveBusinessForOwner(state.businesses.items, user.id),
  )

  return useMemo(() => {
    const pendingTransfers = myTransfers.filter((item) => item.status === TRANSFER_STATUS.PENDING)
    const activeTransfers = myTransfers.filter(
      (item) =>
        ![TRANSFER_STATUS.COMPLETED, TRANSFER_STATUS.CANCELLED, TRANSFER_STATUS.EXPIRED].includes(
          item.status,
        ),
    )

    const todoItems = [
      pendingTransfers.length && {
        icon: FiRepeat,
        label: `${pendingTransfers.length} transfert(s) à déclarer`,
        to: '/transfers/history',
      },
      parcelRequests.length && {
        icon: FiPackage,
        label: `${parcelRequests.length} demande(s) de colis à traiter`,
        to: `/parcels/${parcelRequests[0].parcelId}`,
      },
      receivedApplications.length && {
        icon: FiBriefcase,
        label: `${receivedApplications.length} candidature(s) reçue(s)`,
        to: `/jobs/${receivedApplications[0].jobId}`,
      },
    ].filter(Boolean)

    const profileFields = [
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.country,
      user.city,
    ]
    const profileCompletion = Math.round(
      (profileFields.filter((value) => String(value || '').trim()).length / profileFields.length) *
        100,
    )

    const onboardingSteps = [
      { label: 'Vérifier votre identité', done: Boolean(user.verified), to: '/verification' },
      {
        label: 'Renseigner votre profil',
        done: profileCompletion === 100,
        to: '/profile/information',
      },
      { label: 'Réaliser un premier transfert', done: myTransfers.length > 0, to: '/transfers' },
    ]
    const onboardingDone = onboardingSteps.filter((step) => step.done).length

    return {
      activeTransfers,
      business,
      conversations,
      myTransfers,
      onboardingDone,
      onboardingComplete: onboardingDone === onboardingSteps.length,
      onboardingSteps,
      profileCompletion,
      todoItems,
    }
  }, [myTransfers, parcelRequests, receivedApplications, business, conversations, user])
}
