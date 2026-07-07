import { FiBox, FiBriefcase, FiHome, FiMessageSquare, FiRepeat, FiShoppingBag } from 'react-icons/fi'

/** Sidebar — ordre complet (6 entrées) */
export const primaryNavigationItems = [
  { id: 'home', label: 'Accueil', path: '/dashboard', icon: FiHome },
  { id: 'transfers', label: 'Transfert', path: '/transfers', icon: FiRepeat },
  { id: 'marketplace', label: 'Marketplace', path: '/marketplace', icon: FiShoppingBag },
  { id: 'parcels', label: 'Colis', path: '/parcels', icon: FiBox },
  { id: 'jobs', label: 'Jobs', path: '/jobs', icon: FiBriefcase },
  { id: 'messages', label: 'Messagerie', path: '/messages', icon: FiMessageSquare },
]

const primaryById = Object.fromEntries(primaryNavigationItems.map((item) => [item.id, item]))

/** Bottom nav mobile — ordre dédié (fréquence / usage) */
export const bottomNavigationItems = [
  primaryById.transfers,
  { ...primaryById.home, label: 'Moxt' },
  primaryById.marketplace,
  primaryById.parcels,
]

export const bottomNavigationPaths = new Set(bottomNavigationItems.map((item) => item.path))

export const primaryNavigationPaths = new Set(primaryNavigationItems.map((item) => item.path))

export {
  moreServicesExcludedPaths,
  sidebarMobileHiddenPaths,
} from '@moxt/shared/config/navigation.js'
