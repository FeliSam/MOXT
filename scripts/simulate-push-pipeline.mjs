#!/usr/bin/env node
/**
 * Simule le pipeline push (préférences → payload → format service worker).
 */
import {
  buildWebPushPayload,
  shouldDispatchWebPush,
} from '../packages/shared/src/utils/pushNotificationUtils.js'

const notification = {
  id: 'NOT-TEST-1',
  title: 'Nouveau transfert',
  message: 'Votre transfert est en cours de traitement.',
  type: 'transfer',
  link: '/transfers/TR-123',
  priority: 'high',
}

const preferences = {
  pushNotifications: true,
  notifTransfers: 'high',
}

const payload = buildWebPushPayload(notification)
const allowed = shouldDispatchWebPush(preferences, notification)

console.log('\n▸ Simulation pipeline push MOXT\n')
console.log('Notification:', notification)
console.log('Préférences:', preferences)
console.log('Dispatch autorisé:', allowed)
console.log('Payload Web Push:', JSON.stringify(payload, null, 2))

if (!allowed) {
  console.error('\n✗ Simulation échouée : dispatch refusé par les préférences')
  process.exit(1)
}

if (!payload.data?.url?.startsWith('/transfers/')) {
  console.error('\n✗ Simulation échouée : URL de navigation invalide')
  process.exit(1)
}

console.log('\n✓ Simulation réussie')
