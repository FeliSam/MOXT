import {
  FiAlertCircle,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCompass,
  FiDollarSign,
  FiFileText,
  FiGift,
  FiGrid,
  FiLock,
  FiMessageSquare,
  FiPackage,
  FiRepeat,
  FiShoppingBag,
  FiUser,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'

/** Catégories des sessions « Comment utiliser Moxt » (/aide). */
export const PRODUCT_HELP_CATEGORIES = [
  { value: 'getting_started', labelKey: 'productHelp.categories.gettingStarted', icon: FiCompass },
  { value: 'transfers', labelKey: 'productHelp.categories.transfers', icon: FiRepeat },
  { value: 'marketplace', labelKey: 'productHelp.categories.marketplace', icon: FiShoppingBag },
  { value: 'parcels', labelKey: 'productHelp.categories.parcels', icon: FiPackage },
  { value: 'messages', labelKey: 'productHelp.categories.messages', icon: FiMessageSquare },
  { value: 'account', labelKey: 'productHelp.categories.account', icon: FiUser },
  { value: 'p2p', labelKey: 'productHelp.categories.p2p', icon: FiUsers },
  { value: 'exchangers', labelKey: 'productHelp.categories.exchangers', icon: FiDollarSign },
  { value: 'businesses', labelKey: 'productHelp.categories.businesses', icon: HiOutlineBuildingOffice2 },
  { value: 'professional', labelKey: 'productHelp.categories.professional', icon: FiGrid },
  { value: 'jobs', labelKey: 'productHelp.categories.jobs', icon: FiBriefcase },
  { value: 'events', labelKey: 'productHelp.categories.events', icon: FiCalendar },
  { value: 'news', labelKey: 'productHelp.categories.news', icon: FiFileText },
  { value: 'verification', labelKey: 'productHelp.categories.verification', icon: FiUserCheck },
  { value: 'security', labelKey: 'productHelp.categories.security', icon: FiLock },
  { value: 'disputes', labelKey: 'productHelp.categories.disputes', icon: FiAlertCircle },
  { value: 'subscriptions', labelKey: 'productHelp.categories.subscriptions', icon: FiBell },
  { value: 'referral', labelKey: 'productHelp.categories.referral', icon: FiGift },
]

const PRODUCT_CATEGORY_SET = new Set(PRODUCT_HELP_CATEGORIES.map((item) => item.value))

export function isProductHelpCategory(value) {
  return PRODUCT_CATEGORY_SET.has(value)
}

export function productHelpCategoryMeta(value) {
  return PRODUCT_HELP_CATEGORIES.find((category) => category.value === value) || PRODUCT_HELP_CATEGORIES[0]
}
