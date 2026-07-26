import {
  FiCompass,
  FiMessageSquare,
  FiPackage,
  FiRepeat,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi'

/** Catégories des sessions « Comment utiliser Moxt » (/aide). */
export const PRODUCT_HELP_CATEGORIES = [
  { value: 'getting_started', labelKey: 'productHelp.categories.gettingStarted', icon: FiCompass },
  { value: 'transfers', labelKey: 'productHelp.categories.transfers', icon: FiRepeat },
  { value: 'marketplace', labelKey: 'productHelp.categories.marketplace', icon: FiShoppingBag },
  { value: 'parcels', labelKey: 'productHelp.categories.parcels', icon: FiPackage },
  { value: 'messages', labelKey: 'productHelp.categories.messages', icon: FiMessageSquare },
  { value: 'account', labelKey: 'productHelp.categories.account', icon: FiUser },
]

const PRODUCT_CATEGORY_SET = new Set(PRODUCT_HELP_CATEGORIES.map((item) => item.value))

export function isProductHelpCategory(value) {
  return PRODUCT_CATEGORY_SET.has(value)
}

export function productHelpCategoryMeta(value) {
  return PRODUCT_HELP_CATEGORIES.find((category) => category.value === value) || PRODUCT_HELP_CATEGORIES[0]
}
