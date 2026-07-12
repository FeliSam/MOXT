export const COUNTRIES = [
  { value: 'BJ', label: 'Benin' },
  { value: 'RU', label: 'Russie' },
  { value: 'BJ_RU', label: 'Benin et Russie' },
]

export const CURRENCIES = [
  { value: 'XOF', label: 'Franc CFA (XOF)' },
  { value: 'RUB', label: 'Rouble (RUB)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar (USD)' },
]

export const BUSINESS_SERVICES = [
  { value: 'Transfert', label: 'Transfert' },
  { value: 'Colis', label: 'Colis' },
  { value: 'P2P', label: 'P2P' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'Jobs', label: 'Jobs' },
  { value: 'Events', label: 'Evenements' },
]

export const BUSINESS_SECTORS = [
  { value: 'finance', label: 'Finance' },
  { value: 'logistics', label: 'Logistique' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'technology', label: 'Technologie' },
  { value: 'education', label: 'Education' },
  { value: 'services', label: 'Services' },
]

export const LISTING_TYPES = [
  { value: 'product', label: 'Produit' },
  { value: 'service', label: 'Service' },
  { value: 'rental', label: 'Location' },
  { value: 'vehicle', label: 'Vehicule' },
  { value: 'digital', label: 'Digital' },
  { value: 'real_estate', label: 'Immobilier' },
  { value: 'other', label: 'Autre' },
]

export const LISTING_CATEGORIES = [
  { value: 'electronics', label: 'Électronique' },
  { value: 'fashion', label: 'Mode' },
  { value: 'food', label: 'Alimentation' },
  { value: 'home', label: 'Maison' },
  { value: 'real_estate', label: 'Immobilier' },
  { value: 'vehicles', label: 'Véhicules' },
  { value: 'services', label: 'Services' },
  { value: 'education', label: 'Formation' },
  { value: 'digital', label: 'Produits digitaux' },
  { value: 'other', label: 'Autre' },
]

export const LISTING_CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'used', label: 'Occasion' },
  { value: 'refurbished', label: 'Reconditionné' },
]

export const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Retrait sur place' },
  { value: 'local_delivery', label: 'Livraison locale' },
  { value: 'shipping', label: 'Expédition' },
]

export const JOB_EXPERIENCE_LEVELS = [
  { value: 'none', label: 'Débutant accepté' },
  { value: 'junior', label: 'Junior (1-2 ans)' },
  { value: 'mid', label: 'Confirmé (3-5 ans)' },
  { value: 'senior', label: 'Senior (5+ ans)' },
]

export const JOB_SALARY_PERIODS = [
  { value: 'hour', label: 'Heure' },
  { value: 'day', label: 'Jour' },
  { value: 'month', label: 'Mois' },
  { value: 'project', label: 'Projet' },
]

export const JOB_CONTRACTS = [
  { value: 'full_time', label: 'Temps plein' },
  { value: 'part_time', label: 'Temps partiel' },
  { value: 'contract', label: 'Contrat' },
  { value: 'internship', label: 'Stage' },
  { value: 'freelance', label: 'Freelance' },
]

export const EVENT_CATEGORIES = [
  { value: 'networking', label: 'Networking' },
  { value: 'training', label: 'Formation' },
  { value: 'culture', label: 'Culture' },
  { value: 'business', label: 'Business' },
  { value: 'community', label: 'Communauté' },
]

export const SUPPORT_PRIORITIES = [
  { value: 'normal', label: 'Normale' },
  { value: 'important', label: 'Importante' },
  { value: 'critical', label: 'Critique' },
]

export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value
}
