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
    hint: 'Objet physique à vendre',
    icon: FiShoppingBag,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    value: 'service',
    label: 'Service',
    hint: "Prestation, conseil, main d'œuvre",
    icon: FiBriefcase,
    color: 'from-violet-500 to-purple-500',
  },
  {
    value: 'rental',
    label: 'Location',
    hint: 'Bien mis en location',
    icon: FiHome,
    color: 'from-amber-500 to-orange-500',
  },
  {
    value: 'vehicle',
    label: 'Véhicule',
    hint: 'Voiture, moto, scooter',
    icon: FiTruck,
    color: 'from-slate-500 to-slate-700',
  },
  {
    value: 'digital',
    label: 'Numérique',
    hint: 'Fichier, logiciel, formation en ligne',
    icon: FiCpu,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'real_estate',
    label: 'Immobilier',
    hint: 'Appartement, maison, terrain',
    icon: FiGlobe,
    color: 'from-rose-500 to-pink-500',
  },
  {
    value: 'food',
    label: 'Alimentation',
    hint: 'Produit alimentaire, plat cuisiné',
    icon: FiDroplet,
    color: 'from-green-500 to-lime-500',
  },
  {
    value: 'other',
    label: 'Autre',
    hint: 'Tout ce qui ne rentre pas dans une catégorie',
    icon: FiPackage,
    color: 'from-stone-400 to-stone-600',
  },
]

// ── Catégories filtrées par type (cohérence sémantique) ───────────────────
export const CATEGORIES_BY_TYPE = {
  product: [
    { value: 'electronics', label: 'Électronique' },
    { value: 'fashion', label: 'Mode & vêtements' },
    { value: 'home', label: 'Maison & décoration' },
    { value: 'beauty', label: 'Beauté & hygiène' },
    { value: 'sport', label: 'Sport & loisirs' },
    { value: 'books', label: 'Livres & papeterie' },
    { value: 'other', label: 'Autre produit' },
  ],
  food: [
    { value: 'food_fresh', label: 'Produits frais' },
    { value: 'food_prepared', label: 'Plats cuisinés' },
    { value: 'food_dry', label: 'Épicerie sèche' },
    { value: 'food_drink', label: 'Boissons' },
    { value: 'food_other', label: 'Autre alimentaire' },
  ],
  service: [
    { value: 'services', label: 'Services à la personne' },
    { value: 'education', label: 'Cours & formation' },
    { value: 'it', label: 'Informatique & web' },
    { value: 'transport', label: 'Transport & déménagement' },
    { value: 'beauty_service', label: 'Coiffure & esthétique' },
    { value: 'repair', label: 'Réparation & bricolage' },
    { value: 'other', label: 'Autre service' },
  ],
  rental: [
    { value: 'rental_vehicle', label: 'Véhicule' },
    { value: 'rental_equipment', label: 'Matériel & équipement' },
    { value: 'rental_event', label: 'Matériel événementiel' },
    { value: 'other', label: 'Autre location' },
  ],
  vehicle: [
    { value: 'car', label: 'Voiture' },
    { value: 'moto', label: 'Moto / Scooter' },
    { value: 'truck', label: 'Camion / Utilitaire' },
    { value: 'bicycle', label: 'Vélo' },
    { value: 'other', label: 'Autre véhicule' },
  ],
  digital: [
    { value: 'digital_software', label: 'Logiciel / Appli' },
    { value: 'digital_course', label: 'Formation en ligne' },
    { value: 'digital_template', label: 'Template / Graphisme' },
    { value: 'digital_ebook', label: 'Ebook / Document' },
    { value: 'other', label: 'Autre numérique' },
  ],
  real_estate: [
    { value: 're_apartment', label: 'Appartement' },
    { value: 're_house', label: 'Maison' },
    { value: 're_studio', label: 'Studio' },
    { value: 're_land', label: 'Terrain' },
    { value: 're_office', label: 'Bureau / Commerce' },
    { value: 're_room', label: 'Chambre' },
  ],
  other: [{ value: 'other', label: 'Autre' }],
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
  weight: { label: 'Poids / Volume', placeholder: 'Ex : 500 g, 1 L', type: 'text' },
  expiryDate: { label: 'Date limite (optionnel)', placeholder: '', type: 'date' },
  ingredients: {
    label: 'Composition / Allergènes',
    placeholder: 'Ex : farine, œufs, sans gluten…',
    type: 'text',
  },
  // Service
  availability: {
    label: 'Disponibilité',
    placeholder: 'Ex : lun-ven 9h-18h, sur RDV',
    type: 'text',
  },
  duration: { label: 'Durée de la prestation', placeholder: 'Ex : 1h, demi-journée', type: 'text' },
  remote: { label: 'À distance possible', type: 'checkbox' },
  // Location
  deposit: { label: 'Caution (RUB)', placeholder: '0', type: 'number' },
  minDuration: { label: 'Durée minimale', placeholder: 'Ex : 1 mois', type: 'text' },
  availableFrom: { label: 'Disponible à partir du', placeholder: '', type: 'date' },
  // Véhicule
  year: { label: 'Année', placeholder: 'Ex : 2020', type: 'number' },
  mileage: { label: 'Kilométrage', placeholder: 'Ex : 45000', type: 'number' },
  fuel: {
    label: 'Carburant',
    type: 'select',
    options: [
      { value: 'gasoline', label: 'Essence' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'electric', label: 'Électrique' },
      { value: 'hybrid', label: 'Hybride' },
      { value: 'gas', label: 'GPL' },
    ],
  },
  transmission: {
    label: 'Boîte',
    type: 'select',
    options: [
      { value: 'manual', label: 'Manuelle' },
      { value: 'automatic', label: 'Automatique' },
    ],
  },
  // Numérique
  digitalFormat: {
    label: 'Format',
    placeholder: 'Ex : PDF, MP4, ZIP',
    type: 'text',
  },
  fileSize: { label: 'Taille du fichier', placeholder: 'Ex : 250 Mo', type: 'text' },
  // Immobilier
  reType: {
    label: 'Type de bien',
    type: 'select',
    options: [
      { value: 'apartment', label: 'Appartement' },
      { value: 'house', label: 'Maison' },
      { value: 'studio', label: 'Studio' },
      { value: 'land', label: 'Terrain' },
      { value: 'office', label: 'Bureau / Commerce' },
      { value: 'room', label: 'Chambre' },
    ],
  },
  surface: { label: 'Surface (m²)', placeholder: 'Ex : 45', type: 'number' },
  rooms: { label: 'Nombre de pièces', placeholder: 'Ex : 3', type: 'number' },
  floor: { label: 'Étage', placeholder: 'Ex : 2 (0 = RDC)', type: 'number' },
  furnished: {
    label: 'Meublé',
    type: 'select',
    options: [
      { value: 'yes', label: 'Meublé' },
      { value: 'no', label: 'Non meublé' },
      { value: 'partial', label: 'Partiellement meublé' },
    ],
  },
  reTransaction: {
    label: 'Transaction',
    type: 'select',
    options: [
      { value: 'sale', label: 'Vente' },
      { value: 'rent', label: 'Location' },
    ],
  },
  reState: {
    label: 'État du bien',
    type: 'select',
    options: [
      { value: 'new', label: 'Neuf / En construction' },
      { value: 'good', label: 'Bon état' },
      { value: 'renovated', label: 'Rénové' },
      { value: 'to_renovate', label: 'À rénover' },
    ],
  },
}

// ── Options de livraison par type ─────────────────────────────────────────
export const DELIVERY_BY_TYPE = {
  product: [
    { value: 'pickup', label: 'Retrait sur place' },
    { value: 'local_delivery', label: 'Livraison locale' },
    { value: 'shipping', label: 'Expédition' },
  ],
  food: [
    { value: 'pickup', label: 'Retrait sur place' },
    { value: 'local_delivery', label: 'Livraison à domicile' },
  ],
  service: [
    { value: 'on_site', label: 'Sur site client' },
    { value: 'remote', label: 'À distance' },
    { value: 'pickup', label: 'En atelier / boutique' },
  ],
  rental: [
    { value: 'pickup', label: 'Remise en main propre' },
    { value: 'local_delivery', label: 'Livraison possible' },
  ],
  vehicle: [{ value: 'pickup', label: 'Remise en main propre' }],
  digital: [{ value: 'online', label: 'Téléchargement en ligne' }],
  real_estate: [{ value: 'visit', label: 'Visite sur rendez-vous' }],
  other: [
    { value: 'pickup', label: 'Retrait sur place' },
    { value: 'local_delivery', label: 'Livraison locale' },
    { value: 'shipping', label: 'Expédition' },
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

export function validateListingBusinessRules(values) {
  const errors = {}
  const rules = listingRulesFor(values.type)

  if (!LISTING_TYPE_VALUES.includes(values.type)) {
    errors.type = "Choisissez un type d'annonce valide."
  }
  if (!isCategoryAllowed(values.type, values.category)) {
    errors.category = "Cette catégorie n'est pas compatible avec le type d'annonce."
  }
  if (rules.showCondition && !values.condition) {
    errors.condition = "Indiquez l'état du bien."
  }
  if (rules.showStock && Number(values.stock) < 1) {
    errors.stock = 'La quantité disponible doit être supérieure à zéro.'
  }

  rules.requiredFields.forEach((field) => {
    const value = values[field]
    if (value === undefined || value === null || String(value).trim() === '') {
      errors[field] = `${EXTRA_FIELD_META[field]?.label ?? field} est obligatoire.`
    }
  })

  if (
    values.type === 'real_estate' &&
    values.reType !== 'land' &&
    (!values.rooms || Number(values.rooms) < 1)
  ) {
    errors.rooms = 'Indiquez le nombre de pièces.'
  }
  if (values.type === 'vehicle') {
    const year = Number(values.year)
    if (year < 1900 || year > new Date().getFullYear() + 1) {
      errors.year = "L'année du véhicule est invalide."
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

export function listingSpecificDetails(listing) {
  const rules = listingRulesFor(listing.type)
  return rules.extraFields
    .map((field) => {
      const meta = EXTRA_FIELD_META[field]
      const rawValue = listing[field]
      if (!meta || rawValue === '' || rawValue === null || rawValue === undefined) return null
      if (meta.type === 'checkbox') {
        return { label: meta.label, value: rawValue ? 'Oui' : 'Non' }
      }
      const option = meta.options?.find(({ value }) => value === rawValue)
      return { label: meta.label, value: option?.label ?? String(rawValue) }
    })
    .filter(Boolean)
}
