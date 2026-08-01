import { FiAlertTriangle, FiBookOpen, FiDollarSign, FiFileText, FiShield } from 'react-icons/fi'
import {
  isProductHelpCategory,
  PRODUCT_HELP_CATEGORIES,
  productHelpCategoryMeta,
} from './productHelpCategories'

export { isProductHelpCategory, PRODUCT_HELP_CATEGORIES }

/** Catégories du guide pratique « vivre en Russie » (/guide). */
export const HELP_CATEGORIES = [
  { value: 'documents', labelKey: 'help.categories.documents', icon: FiFileText },
  { value: 'student_life', labelKey: 'help.categories.studentLife', icon: FiBookOpen },
  { value: 'money', labelKey: 'help.categories.money', icon: FiDollarSign },
  { value: 'safety', labelKey: 'help.categories.safety', icon: FiAlertTriangle },
  { value: 'laws', labelKey: 'help.categories.laws', icon: FiShield },
]

/** Toutes les catégories (guide + aide produit) pour l’admin. */
export const ALL_HELP_CATEGORIES = [...HELP_CATEGORIES, ...PRODUCT_HELP_CATEGORIES]

export function helpCategoryMeta(value) {
  if (isProductHelpCategory(value)) return productHelpCategoryMeta(value)
  return HELP_CATEGORIES.find((category) => category.value === value) || HELP_CATEGORIES[0]
}
