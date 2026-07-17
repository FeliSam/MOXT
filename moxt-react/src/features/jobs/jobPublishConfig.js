import {
  FiBook,
  FiBriefcase,
  FiCheckCircle,
  FiCode,
  FiCoffee,
  FiDollarSign,
  FiGlobe,
  FiHeart,
  FiHome,
  FiMapPin,
  FiMic,
  FiShoppingBag,
  FiTool,
  FiTrendingUp,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'

export const JOB_PUBLISH_STEPS = [
  { key: 'basics', labelKey: 'publish.job.steps.offer', icon: FiBriefcase },
  { key: 'details', labelKey: 'publish.job.steps.details', icon: FiDollarSign },
  { key: 'location', labelKey: 'publish.job.steps.location', icon: FiMapPin },
  { key: 'review', labelKey: 'publish.job.steps.review', icon: FiCheckCircle },
]

/** `value` is the stored sector string (French); keep unchanged for data compatibility. */
export const JOB_SECTOR_OPTIONS = [
  {
    value: 'Technologie & informatique',
    labelKey: 'publish.job.sectors.tech.label',
    icon: FiCode,
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'Commerce & vente',
    labelKey: 'publish.job.sectors.commerce.label',
    icon: FiShoppingBag,
    color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  },
  {
    value: 'Transport & logistique',
    labelKey: 'publish.job.sectors.transport.label',
    icon: FiTruck,
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    value: 'Restauration & hôtellerie',
    labelKey: 'publish.job.sectors.hospitality.label',
    icon: FiCoffee,
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
  {
    value: 'Enseignement & formation',
    labelKey: 'publish.job.sectors.education.label',
    icon: FiBook,
    color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
  {
    value: 'Santé & bien-être',
    labelKey: 'publish.job.sectors.health.label',
    icon: FiHeart,
    color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  {
    value: 'Bâtiment & travaux',
    labelKey: 'publish.job.sectors.construction.label',
    icon: FiTool,
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300',
  },
  {
    value: 'Services à la personne',
    labelKey: 'publish.job.sectors.services.label',
    icon: FiUsers,
    color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  },
  {
    value: 'Finance & comptabilité',
    labelKey: 'publish.job.sectors.finance.label',
    icon: FiTrendingUp,
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    value: 'Arts & communication',
    labelKey: 'publish.job.sectors.arts.label',
    icon: FiMic,
    color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  },
  {
    value: 'Immobilier',
    labelKey: 'publish.job.sectors.realEstate.label',
    icon: FiHome,
    color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  },
  {
    value: 'Autre',
    labelKey: 'publish.job.sectors.other.label',
    icon: FiGlobe,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  },
]

export const JOB_EXPERIENCE_OPTIONS = [
  {
    value: 'none',
    labelKey: 'publish.job.experience.none.label',
    subKey: 'publish.job.experience.none.sub',
    optionKey: 'publish.job.experience.none.option',
    dot: 'bg-emerald-500',
  },
  {
    value: 'junior',
    labelKey: 'publish.job.experience.junior.label',
    subKey: 'publish.job.experience.junior.sub',
    optionKey: 'publish.job.experience.junior.option',
    dot: 'bg-blue-500',
  },
  {
    value: 'mid',
    labelKey: 'publish.job.experience.mid.label',
    subKey: 'publish.job.experience.mid.sub',
    optionKey: 'publish.job.experience.mid.option',
    dot: 'bg-violet-500',
  },
  {
    value: 'senior',
    labelKey: 'publish.job.experience.senior.label',
    subKey: 'publish.job.experience.senior.sub',
    optionKey: 'publish.job.experience.senior.option',
    dot: 'bg-amber-500',
  },
]

export const JOB_LANGUAGE_OPTIONS = [
  { value: 'fr', labelKey: 'publish.job.languages.fr' },
  { value: 'ru', labelKey: 'publish.job.languages.ru' },
  { value: 'en', labelKey: 'publish.job.languages.en' },
  { value: 'fr_ru', labelKey: 'publish.job.languages.frRu' },
]

export const JOB_CONTRACT_OPTIONS = [
  { value: 'full_time', labelKey: 'publish.job.contracts.fullTime' },
  { value: 'part_time', labelKey: 'publish.job.contracts.partTime' },
  { value: 'contract', labelKey: 'publish.job.contracts.contract' },
  { value: 'internship', labelKey: 'publish.job.contracts.internship' },
  { value: 'freelance', labelKey: 'publish.job.contracts.freelance' },
]

export const JOB_SALARY_PERIOD_OPTIONS = [
  { value: 'hour', labelKey: 'publish.job.salaryPeriods.hour' },
  { value: 'day', labelKey: 'publish.job.salaryPeriods.day' },
  { value: 'month', labelKey: 'publish.job.salaryPeriods.month' },
  { value: 'project', labelKey: 'publish.job.salaryPeriods.project' },
]
