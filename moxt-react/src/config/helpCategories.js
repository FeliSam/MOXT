import { FiAlertTriangle, FiBookOpen, FiDollarSign, FiFileText, FiShield } from 'react-icons/fi'

export const HELP_CATEGORIES = [
  { value: 'documents', labelKey: 'help.categories.documents', icon: FiFileText },
  { value: 'student_life', labelKey: 'help.categories.studentLife', icon: FiBookOpen },
  { value: 'money', labelKey: 'help.categories.money', icon: FiDollarSign },
  { value: 'safety', labelKey: 'help.categories.safety', icon: FiAlertTriangle },
  { value: 'laws', labelKey: 'help.categories.laws', icon: FiShield },
]

export function helpCategoryMeta(value) {
  return HELP_CATEGORIES.find((category) => category.value === value) || HELP_CATEGORIES[0]
}
