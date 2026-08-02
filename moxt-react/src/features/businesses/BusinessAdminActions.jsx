import { ActionButton } from '../admin/AdminActionButton'
import { adminText } from '../admin/adminI18n'
import { confirmAction } from '../../contexts/confirmBridge'
import { moderateBusiness, setBusinessPinned } from './businessSlice'

/**
 * Actions admin entreprise — même jeu sur détail public et centre de contrôle.
 * Les actions déjà actives passent en état « done » (couleur différente).
 * Les bascules (indisponible, blocage, épingle) restent interactives.
 */
export function BusinessAdminActions({ business, dispatch, t, compact = false }) {
  if (!business) return null
  const status = business.status
  const approved = status === 'verified' || status === 'approved'
  const unavailable = status === 'unavailable'
  const blocked = status === 'suspended' || status === 'blocked'
  const rejected = status === 'rejected'
  const pinned = Boolean(business.pinnedAt)
  const name = business.name || business.id

  function run(title, description, action) {
    confirmAction({ title, description, onConfirm: action })
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : ''}`}>
      <ActionButton
        done={approved && !unavailable && !blocked}
        doneLabel={adminText(t, 'admin.actions.approved')}
        onClick={() =>
          run(
            adminText(t, 'admin.confirm.approveBusinessTitle'),
            adminText(t, 'admin.confirm.approveBusinessBody', { name }),
            () => dispatch(moderateBusiness({ id: business.id, status: 'verified' })),
          )
        }
      >
        {adminText(t, 'admin.actions.approve')}
      </ActionButton>
      <ActionButton
        done={status === 'active'}
        doneLabel={adminText(t, 'admin.actions.activated')}
        variant="secondary"
        onClick={() =>
          run(
            adminText(t, 'admin.confirm.activateBusinessTitle'),
            adminText(t, 'admin.confirm.activateBusinessBody', { name }),
            () => dispatch(moderateBusiness({ id: business.id, status: 'active' })),
          )
        }
      >
        {adminText(t, 'admin.actions.activate')}
      </ActionButton>
      <ActionButton
        done={unavailable}
        doneLabel={adminText(t, 'admin.actions.unavailableDone')}
        interactive
        variant="secondary"
        onClick={() =>
          run(
            unavailable
              ? adminText(t, 'admin.confirm.restoreBusinessTitle')
              : adminText(t, 'admin.confirm.unavailableBusinessTitle'),
            unavailable
              ? adminText(t, 'admin.confirm.restoreBusinessBody', { name })
              : adminText(t, 'admin.confirm.unavailableBusinessBody', { name }),
            () =>
              dispatch(
                moderateBusiness({
                  id: business.id,
                  status: unavailable ? 'verified' : 'unavailable',
                }),
              ),
          )
        }
      >
        {unavailable
          ? adminText(t, 'admin.actions.restoreAvailability')
          : adminText(t, 'admin.actions.makeUnavailable')}
      </ActionButton>
      <ActionButton
        done={blocked}
        doneLabel={adminText(t, 'admin.actions.blocked')}
        interactive
        variant="danger"
        onClick={() =>
          run(
            blocked
              ? adminText(t, 'admin.confirm.unblockBusinessTitle')
              : adminText(t, 'admin.confirm.blockBusinessTitle'),
            blocked
              ? adminText(t, 'admin.confirm.unblockBusinessBody', { name })
              : adminText(t, 'admin.confirm.blockBusinessBody', { name }),
            () =>
              dispatch(
                moderateBusiness({
                  id: business.id,
                  status: blocked ? 'verified' : 'suspended',
                }),
              ),
          )
        }
      >
        {blocked ? adminText(t, 'admin.actions.unblock') : adminText(t, 'admin.actions.block')}
      </ActionButton>
      <ActionButton
        done={rejected}
        doneLabel={adminText(t, 'admin.actions.rejected')}
        variant="danger"
        onClick={() =>
          run(
            adminText(t, 'admin.confirm.rejectBusinessTitle'),
            adminText(t, 'admin.confirm.rejectBusinessBody', { name }),
            () => dispatch(moderateBusiness({ id: business.id, status: 'rejected' })),
          )
        }
      >
        {adminText(t, 'admin.actions.reject')}
      </ActionButton>
      <ActionButton
        done={pinned}
        doneLabel={adminText(t, 'admin.actions.pinned')}
        interactive
        variant="secondary"
        onClick={() =>
          run(
            pinned
              ? adminText(t, 'admin.confirm.unpinBusinessTitle')
              : adminText(t, 'admin.confirm.pinBusinessTitle'),
            pinned
              ? adminText(t, 'admin.confirm.unpinBusinessBody', { name })
              : adminText(t, 'admin.confirm.pinBusinessBody', { name }),
            () => dispatch(setBusinessPinned({ id: business.id, pinned: !business.pinnedAt })),
          )
        }
      >
        {pinned ? adminText(t, 'admin.actions.unpin') : adminText(t, 'admin.actions.pin')}
      </ActionButton>
    </div>
  )
}
