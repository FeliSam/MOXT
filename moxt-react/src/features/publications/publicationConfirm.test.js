import { describe, expect, it } from 'vitest'
import { en } from '@moxt/shared/i18n/locales/en.js'
import { es } from '@moxt/shared/i18n/locales/es.js'
import { fr } from '@moxt/shared/i18n/locales/fr.js'
import { pt } from '@moxt/shared/i18n/locales/pt.js'
import { ru } from '@moxt/shared/i18n/locales/ru.js'
import {
  buildPublicationConfirm,
  buildSubscriptionConfirm,
  PUBLICATION_CONFIRM_ACTIONS,
  publicationConfirmAccent,
  publicationConfirmSubject,
  settleDispatchResult,
  SUBSCRIPTION_CONFIRM_ACTIONS,
} from './publicationConfirm'

function makeT(dict) {
  return (key, vars = {}) => {
    const value = key.split('.').reduce((node, part) => (node == null ? node : node[part]), dict)
    if (typeof value !== 'string') return key
    return value.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m))
  }
}

const tFr = makeT(fr)
const LISTING = { id: 'ANN-1', title: 'Casque audio sans fil' }

describe('publicationConfirm', () => {
  it('suppression : titre, conséquence Marketplace, libellé explicite et style danger', () => {
    const opts = buildPublicationConfirm(tFr, 'delete', { type: 'listing', item: LISTING })
    expect(opts).toMatchObject({
      title: 'Supprimer cette publication ?',
      description: 'Elle disparaîtra définitivement de votre profil et du Marketplace.',
      confirmLabel: 'Supprimer',
      subject: 'Casque audio sans fil',
      tone: 'danger',
    })
    expect(buildPublicationConfirm(tFr, 'delete', { type: 'job', item: LISTING }).description).toContain('MOXT')
  })

  it('actions réversibles : accent prune (perso) ou vert (entreprise)', () => {
    const archive = buildPublicationConfirm(tFr, 'archive', { type: 'listing', item: LISTING, scope: 'personal' })
    expect(archive).toMatchObject({ tone: 'accent', accent: 'personal', confirmLabel: 'Archiver' })
    const sold = buildPublicationConfirm(tFr, 'markSold', { type: 'listing', item: { ...LISTING, businessId: 'BIZ-1' } })
    expect(sold).toMatchObject({ tone: 'accent', accent: 'business', confirmLabel: 'Marquer comme vendu' })
    expect(publicationConfirmAccent({}, 'business')).toBe('business')
    const boost = buildPublicationConfirm(tFr, 'boost', { type: 'video', item: LISTING, duration: '24 h' })
    expect(boost.description).toContain('24 h')
  })

  it('nom de la publication selon le type', () => {
    expect(publicationConfirmSubject('parcel', { origin: 'Moscou', destination: 'Abidjan' })).toBe('Moscou \u2192 Abidjan')
    expect(publicationConfirmSubject('other', { amount: 100, fromCurrency: 'EUR', toCurrency: 'RUB' })).toBe('100 EUR \u00b7 EUR \u2192 RUB')
    const long = 'a'.repeat(200)
    expect(publicationConfirmSubject('post', { message: long }).length).toBeLessThanOrEqual(80)
    expect(publicationConfirmSubject('listing', null)).toBe('')
  })

  it('abonnements : nom interpolé et accent transmis', () => {
    const opts = buildSubscriptionConfirm(tFr, 'unsubscribe', { name: 'Awa', accent: 'business' })
    expect(opts).toMatchObject({ title: 'Se désabonner ?', confirmLabel: 'Se désabonner', tone: 'accent', accent: 'business' })
    expect(opts.description).toContain('Awa')
  })

  it.each([
    ['fr', fr],
    ['en', en],
    ['es', es],
    ['pt', pt],
    ['ru', ru],
  ])('%s : tous les libellés des modales existent', (lang, dict) => {
    const t = makeT(dict)
    for (const key of ['cancel', 'confirm', 'error', 'subjectLabel']) {
      expect(t(`confirmDialog.${key}`)).not.toBe(`confirmDialog.${key}`)
    }
    for (const action of PUBLICATION_CONFIRM_ACTIONS) {
      for (const field of ['title', 'description', 'confirm']) {
        const key = `confirmDialog.publication.${action}.${field}`
        expect(t(key), `${lang} ${key}`).not.toBe(key)
      }
    }
    expect(t('confirmDialog.publication.delete.descriptionListing')).not.toBe('confirmDialog.publication.delete.descriptionListing')
    for (const action of SUBSCRIPTION_CONFIRM_ACTIONS) {
      const fields = action === 'removeSubscriber' ? ['confirm'] : ['title', 'description', 'confirm']
      for (const field of fields) {
        const key = `confirmDialog.subscription.${action}.${field}`
        expect(t(key), `${lang} ${key}`).not.toBe(key)
      }
    }
  })

  it('settleDispatchResult attend les thunks (unwrap) et laisse passer les actions synchrones', async () => {
    await expect(settleDispatchResult({ type: 'x' })).resolves.toEqual({ type: 'x' })
    await expect(settleDispatchResult({ unwrap: () => Promise.reject(new Error('boom')) })).rejects.toThrow('boom')
  })
})