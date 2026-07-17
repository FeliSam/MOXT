import {
  FiBriefcase,
  FiCpu,
  FiDroplet,
  FiGlobe,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiTruck,
} from 'react-icons/fi'

// ── Types d'annonce ────────────────────────────────────────────────────────
export const LISTING_TYPES_META = [
  {
    value: 'product',
    label: 'Produit',
    labelKey: 'marketplace.types.product.label',
    hint: 'Objet physique à vendre',
    hintKey: 'marketplace.types.product.hint',
    icon: FiShoppingBag,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    value: 'service',
    label: 'Service',
    labelKey: 'marketplace.types.service.label',
    hint: "Prestation, conseil, main d'œuvre",
    hintKey: 'marketplace.types.service.hint',
    icon: FiBriefcase,
    color: 'from-violet-500 to-purple-500',
  },
  {
    value: 'rental',
    label: 'Location',
    labelKey: 'marketplace.types.rental.label',
    hint: 'Bien mis en location',
    hintKey: 'marketplace.types.rental.hint',
    icon: FiHome,
    color: 'from-amber-500 to-orange-500',
  },
  {
    value: 'vehicle',
    label: 'Véhicule',
    labelKey: 'marketplace.types.vehicle.label',
    hint: 'Voiture, moto, scooter',
    hintKey: 'marketplace.types.vehicle.hint',
    icon: FiTruck,
    color: 'from-slate-500 to-slate-700',
  },
  {
    value: 'digital',
    label: 'Numérique',
    labelKey: 'marketplace.types.digital.label',
    hint: 'Fichier, logiciel, formation en ligne',
    hintKey: 'marketplace.types.digital.hint',
    icon: FiCpu,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'real_estate',
    label: 'Immobilier',
    labelKey: 'marketplace.types.realEstate.label',
    hint: 'Appartement, maison, terrain',
    hintKey: 'marketplace.types.realEstate.hint',
    icon: FiGlobe,
    color: 'from-rose-500 to-pink-500',
  },
  {
    value: 'food',
    label: 'Alimentation',
    labelKey: 'marketplace.types.food.label',
    hint: 'Produit alimentaire, plat cuisiné',
    hintKey: 'marketplace.types.food.hint',
    icon: FiDroplet,
    color: 'from-green-500 to-lime-500',
  },
  {
    value: 'other',
    label: 'Autre',
    labelKey: 'marketplace.types.other.label',
    hint: 'Tout ce qui ne rentre pas dans une catégorie',
    hintKey: 'marketplace.types.other.hint',
    icon: FiPackage,
    color: 'from-stone-400 to-stone-600',
  },
]

// ── Catégories filtrées par type (cohérence sémantique) ───────────────────
export const CATEGORIES_BY_TYPE = {
  product: [
    { value: 'electronics', label: 'Électronique', labelKey: 'marketplace.categories.product.electronics' },
    { value: 'fashion', label: 'Mode & vêtements', labelKey: 'marketplace.categories.product.fashion' },
    { value: 'home', label: 'Maison & décoration', labelKey: 'marketplace.categories.product.home' },
    { value: 'beauty', label: 'Beauté & hygiène', labelKey: 'marketplace.categories.product.beauty' },
    { value: 'sport', label: 'Sport & loisirs', labelKey: 'marketplace.categories.product.sport' },
    { value: 'books', label: 'Livres & papeterie', labelKey: 'marketplace.categories.product.books' },
    { value: 'other', label: 'Autre produit', labelKey: 'marketplace.categories.product.other' },
  ],
  food: [
    { value: 'food_fresh', label: 'Produits frais', labelKey: 'marketplace.categories.food.fresh' },
    { value: 'food_prepared', label: 'Plats cuisinés', labelKey: 'marketplace.categories.food.prepared' },
    { value: 'food_dry', label: 'Épicerie sèche', labelKey: 'marketplace.categories.food.dry' },
    { value: 'food_drink', label: 'Boissons', labelKey: 'marketplace.categories.food.drink' },
    { value: 'food_other', label: 'Autre alimentaire', labelKey: 'marketplace.categories.food.other' },
  ],
  service: [
    { value: 'services', label: 'Services à la personne', labelKey: 'marketplace.categories.service.personal' },
    { value: 'education', label: 'Cours & formation', labelKey: 'marketplace.categories.service.education' },
    { value: 'it', label: 'Informatique & web', labelKey: 'marketplace.categories.service.it' },
    { value: 'transport', label: 'Transport & déménagement', labelKey: 'marketplace.categories.service.transport' },
    { value: 'beauty_service', label: 'Coiffure & esthétique', labelKey: 'marketplace.categories.service.beauty' },
    { value: 'repair', label: 'Réparation & bricolage', labelKey: 'marketplace.categories.service.repair' },
    { value: 'other', label: 'Autre service', labelKey: 'marketplace.categories.service.other' },
  ],
  rental: [
    { value: 'rental_vehicle', label: 'Véhicule', labelKey: 'marketplace.categories.rental.vehicle' },
    { value: 'rental_equipment', label: 'Matériel & équipement', labelKey: 'marketplace.categories.rental.equipment' },
    { value: 'rental_event', label: 'Matériel événementiel', labelKey: 'marketplace.categories.rental.event' },
    { value: 'other', label: 'Autre location', labelKey: 'marketplace.categories.rental.other' },
  ],
  vehicle: [
    { value: 'car', label: 'Voiture', labelKey: 'marketplace.categories.vehicle.car' },
    { value: 'moto', label: 'Moto / Scooter', labelKey: 'marketplace.categories.vehicle.moto' },
    { value: 'truck', label: 'Camion / Utilitaire', labelKey: 'marketplace.categories.vehicle.truck' },
    { value: 'bicycle', label: 'Vélo', labelKey: 'marketplace.categories.vehicle.bicycle' },
    { value: 'other', label: 'Autre véhicule', labelKey: 'marketplace.categories.vehicle.other' },
  ],
  digital: [
    { value: 'digital_software', label: 'Logiciel / Appli', labelKey: 'marketplace.categories.digital.software' },
    { value: 'digital_course', label: 'Formation en ligne', labelKey: 'marketplace.categories.digital.course' },
    { value: 'digital_template', label: 'Template / Graphisme', labelKey: 'marketplace.categories.digital.template' },
    { value: 'digital_ebook', label: 'Ebook / Document', labelKey: 'marketplace.categories.digital.ebook' },
    { value: 'other', label: 'Autre numérique', labelKey: 'marketplace.categories.digital.other' },
  ],
  real_estate: [
    { value: 're_apartment', label: 'Appartement', labelKey: 'marketplace.categories.realEstate.apartment' },
    { value: 're_house', label: 'Maison', labelKey: 'marketplace.categories.realEstate.house' },
    { value: 're_studio', label: 'Studio', labelKey: 'marketplace.categories.realEstate.studio' },
    { value: 're_land', label: 'Terrain', labelKey: 'marketplace.categories.realEstate.land' },
    { value: 're_office', label: 'Bureau / Commerce', labelKey: 'marketplace.categories.realEstate.office' },
    { value: 're_room', label: 'Chambre', labelKey: 'marketplace.categories.realEstate.room' },
  ],
  other: [{ value: 'other', label: 'Autre', labelKey: 'marketplace.categories.other' }],
}

// ── Règles dynamiques par type ─────────────────────────────────────────────
// showCondition: afficher le champ "état" ?
// showStock: afficher la quantité ?
// showBrandModel: marque et modèle ?
// extraFields: champs supplémentaires spécifiques
export const TYPE_RULES = {
  product: {
    showCondition: true,
    showStock: true,
    showBrandModel: true,
    extraFields: [],
    requiredFields: [],
  },
  food: {
    showCondition: false, // un aliment n'a pas d'"état" Neuf/Occasion
    showStock: true,
    showBrandModel: false,
    extraFields: ['weight', 'expiryDate', 'ingredients'],
    requiredFields: ['weight', 'ingredients'],
  },
  service: {
    showCondition: false,
    showStock: false, // un service est illimité
    showBrandModel: false,
    extraFields: ['availability', 'duration', 'remote'],
    requiredFields: ['availability', 'duration'],
  },
  rental: {
    showCondition: true,
    showStock: false,
    showBrandModel: false,
    extraFields: ['deposit', 'minDuration', 'availableFrom'],
    requiredFields: ['minDuration', 'availableFrom'],
  },
  vehicle: {
    showCondition: true,
    showStock: false,
    showBrandModel: true,
    extraFields: ['year', 'mileage', 'fuel', 'transmission'],
    requiredFields: ['year', 'mileage', 'fuel', 'transmission'],
  },
  digital: {
    showCondition: false, // un fichier numérique est toujours neuf
    showStock: false,
    showBrandModel: false,
    extraFields: ['digitalFormat', 'fileSize'],
    requiredFields: ['digitalFormat'],
  },
  real_estate: {
    showCondition: false, // l'état s'exprime autrement (rénové, neuf…)
    showStock: false,
    showBrandModel: false,
    extraFields: ['reType', 'surface', 'rooms', 'floor', 'furnished', 'reTransaction', 'reState'],
    requiredFields: ['reType', 'surface', 'reTransaction', 'reState'],
  },
  other: {
    showCondition: true,
    showStock: true,
    showBrandModel: false,
    extraFields: [],
    requiredFields: [],
  },
}

// ── Libellés des champs extra ──────────────────────────────────────────────
export const EXTRA_FIELD_META = {
  // Alimentation
  weight: {
    label: 'Poids / Volume',
    labelKey: 'marketplace.extra.weight.label',
    placeholder: 'Ex : 500 g, 1 L',
    placeholderKey: 'marketplace.extra.weight.placeholder',
    type: 'text',
  },
  expiryDate: {
    label: 'Date limite (optionnel)',
    labelKey: 'marketplace.extra.expiryDate.label',
    placeholder: '',
    type: 'date',
  },
  ingredients: {
    label: 'Composition / Allergènes',
    labelKey: 'marketplace.extra.ingredients.label',
    placeholder: 'Ex : farine, œufs, sans gluten…',
    placeholderKey: 'marketplace.extra.ingredients.placeholder',
    type: 'text',
  },
  // Service
  availability: {
    label: 'Disponibilité',
    labelKey: 'marketplace.extra.availability.label',
    placeholder: 'Ex : lun-ven 9h-18h, sur RDV',
    placeholderKey: 'marketplace.extra.availability.placeholder',
    type: 'text',
  },
  duration: {
    label: 'Durée de la prestation',
    labelKey: 'marketplace.extra.duration.label',
    placeholder: 'Ex : 1h, demi-journée',
    placeholderKey: 'marketplace.extra.duration.placeholder',
    type: 'text',
  },
  remote: { label: 'À distance possible', labelKey: 'marketplace.extra.remote.label', type: 'checkbox' },
  // Location
  deposit: {
    label: 'Caution (RUB)',
    labelKey: 'marketplace.extra.deposit.label',
    placeholder: '0',
    placeholderKey: 'marketplace.extra.deposit.placeholder',
    type: 'number',
  },
  minDuration: {
    label: 'Durée minimale',
    labelKey: 'marketplace.extra.minDuration.label',
    placeholder: 'Ex : 1 mois',
    placeholderKey: 'marketplace.extra.minDuration.placeholder',
    type: 'text',
  },
  availableFrom: {
    label: 'Disponible à partir du',
    labelKey: 'marketplace.extra.availableFrom.label',
    placeholder: '',
    type: 'date',
  },
  // Véhicule
  year: {
    label: 'Année',
    labelKey: 'marketplace.extra.year.label',
    placeholder: 'Ex : 2020',
    placeholderKey: 'marketplace.extra.year.placeholder',
    type: 'number',
  },
  mileage: {
    label: 'Kilométrage',
    labelKey: 'marketplace.extra.mileage.label',
    placeholder: 'Ex : 45000',
    placeholderKey: 'marketplace.extra.mileage.placeholder',
    type: 'number',
  },
  fuel: {
    label: 'Carburant',
    labelKey: 'marketplace.extra.fuel.label',
    type: 'select',
    options: [
      { value: 'gasoline', label: 'Essence', labelKey: 'marketplace.extra.fuel.gasoline' },
      { value: 'diesel', label: 'Diesel', labelKey: 'marketplace.extra.fuel.diesel' },
      { value: 'electric', label: 'Électrique', labelKey: 'marketplace.extra.fuel.electric' },
      { value: 'hybrid', label: 'Hybride', labelKey: 'marketplace.extra.fuel.hybrid' },
      { value: 'gas', label: 'GPL', labelKey: 'marketplace.extra.fuel.gas' },
    ],
  },
  transmission: {
    label: 'Boîte',
    labelKey: 'marketplace.extra.transmission.label',
    type: 'select',
    options: [
      { value: 'manual', label: 'Manuelle', labelKey: 'marketplace.extra.transmission.manual' },
      { value: 'automatic', label: 'Automatique', labelKey: 'marketplace.extra.transmission.automatic' },
    ],
  },
  // Numérique
  digitalFormat: {
    label: 'Format',
    labelKey: 'marketplace.extra.digitalFormat.label',
    placeholder: 'Ex : PDF, MP4, ZIP',
    placeholderKey: 'marketplace.extra.digitalFormat.placeholder',
    type: 'text',
  },
  fileSize: {
    label: 'Taille du fichier',
    labelKey: 'marketplace.extra.fileSize.label',
    placeholder: 'Ex : 250 Mo',
    placeholderKey: 'marketplace.extra.fileSize.placeholder',
    type: 'text',
  },
  // Immobilier
  reType: {
    label: 'Type de bien',
    labelKey: 'marketplace.extra.reType.label',
    type: 'select',
    options: [
      { value: 'apartment', label: 'Appartement', labelKey: 'marketplace.extra.reType.apartment' },
      { value: 'house', label: 'Maison', labelKey: 'marketplace.extra.reType.house' },
      { value: 'studio', label: 'Studio', labelKey: 'marketplace.extra.reType.studio' },
      { value: 'land', label: 'Terrain', labelKey: 'marketplace.extra.reType.land' },
      { value: 'office', label: 'Bureau / Commerce', labelKey: 'marketplace.extra.reType.office' },
      { value: 'room', label: 'Chambre', labelKey: 'marketplace.extra.reType.room' },
    ],
  },
  surface: {
    label: 'Surface (m²)',
    labelKey: 'marketplace.extra.surface.label',
    placeholder: 'Ex : 45',
    placeholderKey: 'marketplace.extra.surface.placeholder',
    type: 'number',
  },
  rooms: {
    label: 'Nombre de pièces',
    labelKey: 'marketplace.extra.rooms.label',
    placeholder: 'Ex : 3',
    placeholderKey: 'marketplace.extra.rooms.placeholder',
    type: 'number',
  },
  floor: {
    label: 'Étage',
    labelKey: 'marketplace.extra.floor.label',
    placeholder: 'Ex : 2 (0 = RDC)',
    placeholderKey: 'marketplace.extra.floor.placeholder',
    type: 'number',
  },
  furnished: {
    label: 'Meublé',
    labelKey: 'marketplace.extra.furnished.label',
    type: 'select',
    options: [
      { value: 'yes', label: 'Meublé', labelKey: 'marketplace.extra.furnished.yes' },
      { value: 'no', label: 'Non meublé', labelKey: 'marketplace.extra.furnished.no' },
      { value: 'partial', label: 'Partiellement meublé', labelKey: 'marketplace.extra.furnished.partial' },
    ],
  },
  reTransaction: {
    label: 'Transaction',
    labelKey: 'marketplace.extra.reTransaction.label',
    type: 'select',
    options: [
      { value: 'sale', label: 'Vente', labelKey: 'marketplace.extra.reTransaction.sale' },
      { value: 'rent', label: 'Location', labelKey: 'marketplace.extra.reTransaction.rent' },
    ],
  },
  reState: {
    label: 'État du bien',
    labelKey: 'marketplace.extra.reState.label',
    type: 'select',
    options: [
      { value: 'new', label: 'Neuf / En construction', labelKey: 'marketplace.extra.reState.new' },
      { value: 'good', label: 'Bon état', labelKey: 'marketplace.extra.reState.good' },
      { value: 'renovated', label: 'Rénové', labelKey: 'marketplace.extra.reState.renovated' },
      { value: 'to_renovate', label: 'À rénover', labelKey: 'marketplace.extra.reState.toRenovate' },
    ],
  },
}

// ── Options de livraison par type ─────────────────────────────────────────
export const DELIVERY_BY_TYPE = {
  product: [
    { value: 'pickup', label: 'Retrait sur place', labelKey: 'marketplace.delivery.pickup' },
    { value: 'local_delivery', label: 'Livraison locale', labelKey: 'marketplace.delivery.local' },
    { value: 'shipping', label: 'Expédition', labelKey: 'marketplace.delivery.shipping' },
  ],
  food: [
    { value: 'pickup', label: 'Retrait sur place', labelKey: 'marketplace.delivery.pickup' },
    { value: 'local_delivery', label: 'Livraison à domicile', labelKey: 'marketplace.delivery.home' },
  ],
  service: [
    { value: 'on_site', label: 'Sur site client', labelKey: 'marketplace.delivery.onSite' },
    { value: 'remote', label: 'À distance', labelKey: 'marketplace.delivery.remote' },
    { value: 'pickup', label: 'En atelier / boutique', labelKey: 'marketplace.delivery.workshop' },
  ],
  rental: [
    { value: 'pickup', label: 'Remise en main propre', labelKey: 'marketplace.delivery.handDelivery' },
    { value: 'local_delivery', label: 'Livraison possible', labelKey: 'marketplace.delivery.possible' },
  ],
  vehicle: [{ value: 'pickup', label: 'Remise en main propre', labelKey: 'marketplace.delivery.handDelivery' }],
  digital: [{ value: 'online', label: 'Téléchargement en ligne', labelKey: 'marketplace.delivery.online' }],
  real_estate: [{ value: 'visit', label: 'Visite sur rendez-vous', labelKey: 'marketplace.delivery.visit' }],
  other: [
    { value: 'pickup', label: 'Retrait sur place', labelKey: 'marketplace.delivery.pickup' },
    { value: 'local_delivery', label: 'Livraison locale', labelKey: 'marketplace.delivery.local' },
    { value: 'shipping', label: 'Expédition', labelKey: 'marketplace.delivery.shipping' },
  ],
}

export const LISTING_TYPE_VALUES = LISTING_TYPES_META.map(({ value }) => value)

export function categoriesForType(type) {
  return CATEGORIES_BY_TYPE[type] ?? []
}

export function listingRulesFor(type) {
  return TYPE_RULES[type] ?? TYPE_RULES.other
}

export function isCategoryAllowed(type, category) {
  return categoriesForType(type).some((option) => option.value === category)
}

export function validateListingBusinessRules(values, t) {
  const errors = {}
  const rules = listingRulesFor(values.type)
  const msg = (key, fallback, vars) => {
    if (typeof t !== 'function') {
      return fallback.replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars || {}, name) ? String(vars[name]) : match,
      )
    }
    const translated = t(key, vars)
    if (translated == null || translated === key) {
      return fallback.replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars || {}, name) ? String(vars[name]) : match,
      )
    }
    return translated
  }

  if (!LISTING_TYPE_VALUES.includes(values.type)) {
    errors.type = msg(
      'marketplaceValidation.invalidType',
      "Choisissez un type d'annonce valide.",
    )
  }
  if (!isCategoryAllowed(values.type, values.category)) {
    errors.category = msg(
      'marketplaceValidation.categoryMismatch',
      "Cette catégorie n'est pas compatible avec le type d'annonce.",
    )
  }
  if (rules.showCondition && !values.condition) {
    errors.condition = msg(
      'marketplaceValidation.conditionRequired',
      "Indiquez l'état du bien.",
    )
  }
  if (rules.showStock && Number(values.stock) < 1) {
    errors.stock = msg(
      'marketplaceValidation.stockMin',
      'La quantité disponible doit être supérieure à zéro.',
    )
  }

  rules.requiredFields.forEach((field) => {
    const value = values[field]
    if (value === undefined || value === null || String(value).trim() === '') {
      const fieldLabel = resolveConfiguredText(
        t,
        EXTRA_FIELD_META[field]?.labelKey,
        EXTRA_FIELD_META[field]?.label ?? field,
      )
      errors[field] = msg(
        'marketplaceValidation.fieldRequired',
        '{field} est obligatoire.',
        { field: fieldLabel },
      )
    }
  })

  if (
    values.type === 'real_estate' &&
    values.reType !== 'land' &&
    (!values.rooms || Number(values.rooms) < 1)
  ) {
    errors.rooms = msg(
      'marketplaceValidation.roomsRequired',
      'Indiquez le nombre de pièces.',
    )
  }
  if (values.type === 'vehicle') {
    const year = Number(values.year)
    if (year < 1900 || year > new Date().getFullYear() + 1) {
      errors.year = msg(
        'marketplaceValidation.invalidVehicleYear',
        "L'année du véhicule est invalide.",
      )
    }
  }

  return errors
}

export function sanitizeListingByType(values) {
  const rules = listingRulesFor(values.type)
  const deliveryChoices = DELIVERY_BY_TYPE[values.type] ?? DELIVERY_BY_TYPE.other
  const allowedDelivery = new Set(deliveryChoices.map(({ value }) => value))
  const allowedExtras = new Set(rules.extraFields)
  const allExtraFields = Object.keys(EXTRA_FIELD_META)
  const selectedDelivery = (values.deliveryOptions ?? []).filter((value) =>
    allowedDelivery.has(value),
  )
  const sanitized = {
    ...values,
    condition: rules.showCondition ? values.condition || 'used' : null,
    stock: rules.showStock ? Math.max(1, Number(values.stock || 1)) : null,
    brand: rules.showBrandModel ? values.brand || '' : '',
    model: rules.showBrandModel ? values.model || '' : '',
    deliveryOptions: selectedDelivery.length ? selectedDelivery : [deliveryChoices[0].value],
  }

  allExtraFields.forEach((field) => {
    if (!allowedExtras.has(field)) sanitized[field] = field === 'remote' ? false : ''
  })

  return sanitized
}

function resolveConfiguredText(t, key, fallback) {
  if (!t || !key) return fallback
  const translated = t(key)
  return translated === key ? fallback : translated
}

export function listingSpecificDetails(listing, t) {
  const rules = listingRulesFor(listing.type)
  return rules.extraFields
    .map((field) => {
      const meta = EXTRA_FIELD_META[field]
      const rawValue = listing[field]
      if (!meta || rawValue === '' || rawValue === null || rawValue === undefined) return null
      const label = resolveConfiguredText(t, meta.labelKey, meta.label)
      if (meta.type === 'checkbox') {
        return {
          label,
          value: rawValue
            ? resolveConfiguredText(t, 'marketplace.common.yes', 'Oui')
            : resolveConfiguredText(t, 'marketplace.common.no', 'Non'),
        }
      }
      const option = meta.options?.find(({ value }) => value === rawValue)
      return {
        label,
        value: option
          ? resolveConfiguredText(t, option.labelKey, option.label)
          : String(rawValue),
      }
    })
    .filter(Boolean)
}
