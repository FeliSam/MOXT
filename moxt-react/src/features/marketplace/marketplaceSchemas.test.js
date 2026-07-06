import { describe, expect, it } from 'vitest'
import { listingSchemaFor } from './marketplaceSchemas'

const base = {
  type: 'food',
  category: 'food_prepared',
  title: 'Repas africain maison',
  description: 'Un plat cuisiné maison avec une composition détaillée.',
  price: 900,
  currency: 'RUB',
  country: 'RU',
  city: 'Moscou',
  district: 'Centre',
  address: 'Tverskaya 12, appartement 4',
  contact: '+79991234567',
  whatsapp: '',
  stock: 2,
  weight: '500 g',
  ingredients: 'Riz, légumes',
}

describe('listingSchemaFor', () => {
  it("accepte l'alimentation sans état neuf ou occasion", async () => {
    await expect(
      listingSchemaFor('RU').validate({ ...base, condition: null }),
    ).resolves.toBeTruthy()
  })

  it('refuse une catégorie incohérente', async () => {
    await expect(
      listingSchemaFor('RU').validate({ ...base, category: 're_house' }),
    ).rejects.toMatchObject({ path: 'category' })
  })

  it("exige les informations propres à l'immobilier", async () => {
    await expect(
      listingSchemaFor('RU').validate({
        ...base,
        type: 'real_estate',
        category: 're_house',
        reType: 'house',
        surface: 80,
        rooms: '',
        reTransaction: 'sale',
        reState: 'good',
      }),
    ).rejects.toMatchObject({ path: 'rooms' })
  })
})
