/** Types et catégories d'annonces, repris du web (config/listingConfig.js : LISTING_TYPES_META, CATEGORIES_BY_TYPE). */
import { Briefcase, Coffee, Cpu, House, MapPin, Package, ShoppingBag, Truck, type LucideIcon } from 'lucide-react-native';

export type ListingTypeMeta = { value: string; label: string; icon: LucideIcon; colors: [string, string] };

/** Dégradés Tailwind `from-… to-…` du web. */
export const LISTING_TYPES_META: ListingTypeMeta[] = [
  { value: 'product', label: 'Produit', icon: ShoppingBag, colors: ['#3b82f6', '#06b6d4'] },
  { value: 'service', label: 'Service', icon: Briefcase, colors: ['#8b5cf6', '#a855f7'] },
  { value: 'rental', label: 'Location', icon: House, colors: ['#f59e0b', '#f97316'] },
  { value: 'vehicle', label: 'Véhicule', icon: Truck, colors: ['#64748b', '#334155'] },
  { value: 'digital', label: 'Numérique', icon: Cpu, colors: ['#10b981', '#14b8a6'] },
  { value: 'real_estate', label: 'Immobilier', icon: MapPin, colors: ['#f43f5e', '#ec4899'] },
  { value: 'food', label: 'Alimentation', icon: Coffee, colors: ['#22c55e', '#84cc16'] },
  { value: 'other', label: 'Autre', icon: Package, colors: ['#a8a29e', '#57534e'] },
];

export const CATEGORIES_BY_TYPE: Record<string, { value: string; label: string }[]> = {
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
  other: [
  ],
};

export function listingTypeLabel(type?: string) {
  return LISTING_TYPES_META.find((t) => t.value === type)?.label || type || '';
}

export function listingCategoryLabel(type?: string, category?: string) {
  return (CATEGORIES_BY_TYPE[type || ''] || []).find((c) => c.value === category)?.label || category || '';
}
