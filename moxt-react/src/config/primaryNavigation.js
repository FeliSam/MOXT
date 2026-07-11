import { FiBox, FiBriefcase, FiFileText, FiHome, FiMessageSquare, FiRepeat, FiShoppingBag } from 'react-icons/fi'

/** Sidebar — ordre complet (8 entrées desktop, messagerie + entreprise + actualité en fin) */
export const primaryNavigationItems = [
  { id: 'home', label: 'Accueil', path: '/dashboard', icon: FiHome },
  { id: 'transfers', label: 'Transfert', path: '/transfers', icon: FiRepeat },
  { id: 'marketplace', label: 'Marketplace', path: '/marketplace', icon: FiShoppingBag },
  { id: 'parcels', label: 'Colis', path: '/parcels', icon: FiBox },
  { id: 'jobs', label: 'Jobs', path: '/jobs', icon: FiBriefcase },
  { id: 'messages', label: 'Messagerie', path: '/messages', icon: FiMessageSquare, badgeSelector: 'messages' },
  { id: 'businesses', label: 'Entreprise', path: '/businesses', icon: FiBriefcase, desktopOnly: true },
  { id: 'news', label: 'Actualité', path: '/news', icon: FiFileText, desktopOnly: true },
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
