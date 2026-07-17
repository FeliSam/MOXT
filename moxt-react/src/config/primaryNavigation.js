import { FiBox, FiBriefcase, FiFileText, FiHome, FiMessageSquare, FiRepeat, FiShoppingBag } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'

/** Sidebar — ordre complet (messagerie + entreprise owner + actualité en fin desktop) */
export const primaryNavigationItems = [
  { id: 'home', label: 'Accueil', labelKey: 'nav.home', path: '/dashboard', icon: FiHome },
  { id: 'transfers', label: 'Transfert', labelKey: 'nav.transfer', path: '/transfers', icon: FiRepeat },
  { id: 'marketplace', label: 'Marketplace', labelKey: 'nav.marketplace', path: '/marketplace', icon: FiShoppingBag },
  { id: 'parcels', label: 'Colis', labelKey: 'nav.parcels', path: '/parcels', icon: FiBox },
  { id: 'jobs', label: 'Jobs', labelKey: 'nav.jobs', path: '/jobs', icon: FiBriefcase },
  {
    id: 'messages',
    label: 'Messagerie',
    labelKey: 'nav.messages',
    path: '/messages',
    icon: FiMessageSquare,
    badgeSelector: 'messages',
  },
  {
    id: 'businesses',
    label: 'Entreprise',
    labelKey: 'nav.business',
    path: '/professional',
    icon: HiOutlineBuildingOffice2,
    desktopOnly: true,
    requiresOwnedBusiness: true,
  },
  { id: 'news', label: 'Actualités', labelKey: 'nav.news', path: '/news', icon: FiFileText, desktopOnly: true },
]

const primaryById = Object.fromEntries(primaryNavigationItems.map((item) => [item.id, item]))

/** Bottom nav mobile — ordre dédié (fréquence / usage) ; "Moxt" reste la marque, jamais traduite */
export const bottomNavigationItems = [
  primaryById.transfers,
  { ...primaryById.home, label: 'Moxt', labelKey: null },
  primaryById.marketplace,
  primaryById.parcels,
]

export const bottomNavigationPaths = new Set(bottomNavigationItems.map((item) => item.path))

export const primaryNavigationPaths = new Set(primaryNavigationItems.map((item) => item.path))

export {
  moreServicesExcludedPaths,
  sidebarMobileHiddenPaths,
} from '@moxt/shared/config/navigation.js'
