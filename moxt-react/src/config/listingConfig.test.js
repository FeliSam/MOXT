import { describe, expect, it } from 'vitest'
import {
  isCategoryAllowed,
  listingSpecificDetails,
  sanitizeListingByType,
  validateListingBusinessRules,
} from './listingConfig'

describe('listingConfig', () => {
  it('refuse une catégorie incompatible avec le type', () => {
    expect(isCategoryAllowed('real_estate', 'food_fresh')).toBe(false)
    expect(isCategoryAllowed('real_estate', 're_house')).toBe(true)
  })

  it("retire l'état et les champs produit d'une annonce alimentaire", () => {
    const listing = sanitizeListingByType({
      type: 'food',
      condition: 'used',
      brand: 'Marque',
      model: 'Modèle',
      stock: 2,
      weight: '500 g',
      ingredients: 'Farine',
      deliveryOptions: ['shipping', 'pickup'],
    })

    expect(listing.condition).toBeNull()
    expect(listing.brand).toBe('')
    expect(listing.model).toBe('')
    expect(listing.deliveryOptions).toEqual(['pickup'])
  })

  it('exige les caractéristiques propres à une maison', () => {
    const errors = validateListingBusinessRules({
      type: 'real_estate',
      category: 're_house',
      reType: 'house',
      surface: 90,
      rooms: '',
      reTransaction: 'sale',
      reState: 'good',
    })

    expect(errors.rooms).toBe('Indiquez le nombre de pièces.')
  })

  it('prépare les caractéristiques lisibles pour la fiche détail', () => {
    expect(
      listingSpecificDetails({
        type: 'service',
        availability: 'Du lundi au vendredi',
        duration: '2 heures',
        remote: true,
      }),
    ).toEqual([
      { label: 'Disponibilité', value: 'Du lundi au vendredi' },
      { label: 'Durée de la prestation', value: '2 heures' },
      { label: 'À distance possible', value: 'Oui' },
    ])
  })
})
