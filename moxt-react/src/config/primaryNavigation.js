import { FiBox, FiBriefcase, FiFileText, FiHome, FiMessageSquare, FiRepeat, FiShoppingBag } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'

/** Sidebar — ordre complet (messagerie + entreprise owner + actualité en fin desktop) */
export const primaryNavigationItems = [
  { id: 'home', label: 'Accueil', path: '/dashboard', icon: FiHome },
  { id: 'transfers', label: 'Transfert', path: '/transfers', icon: FiRepeat },
  { id: 'marketplace', label: 'Marketplace', path: '/marketplace', icon: FiShoppingBag },
  { id: 'parcels', label: 'Colis', path: '/parcels', icon: FiBox },
  { id: 'jobs', label: 'Jobs', path: '/jobs', icon: FiBriefcase },
  { id: 'messages', label: 'Messagerie', path: '/messages', icon: FiMessageSquare, badgeSelector: 'messages' },
  {
    id: 'businesses',
    label: 'Entreprise',
    path: '/professional',
    icon: HiOutlineBuildingOffice2,
    desktopOnly: true,
    requiresOwnedBusiness: true,
  },
  { id: 'news', label: 'Actualités', path: '/news', icon: FiFileText, desktopOnly: true },
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
