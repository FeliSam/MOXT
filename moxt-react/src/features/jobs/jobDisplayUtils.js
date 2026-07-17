import {
  JOB_EXPERIENCE_LEVELS,
  JOB_LANGUAGES,
  JOB_SALARY_PERIODS,
  optionLabel,
} from '../../config/options'
import { formatShortDate, formatDateTime } from '../../utils/formatters'

export const JOB_EMPTY_LABEL_KEY = 'jobs.labels.empty'

/** Stored French sector strings → `jobs.sectors.<slug>` keys. */
const JOB_SECTOR_SLUGS = {
  'Technologie & informatique': 'tech',
  'Commerce & vente': 'commerce',
  'Transport & logistique': 'transport',
  'Restauration & hôtellerie': 'hospitality',
  'Enseignement & formation': 'education',
  'Santé & bien-être': 'health',
  'Bâtiment & travaux': 'construction',
  'Services à la personne': 'services',
  'Finance & comptabilité': 'finance',
  'Arts & communication': 'arts',
  Immobilier: 'realEstate',
  Autre: 'other',
}

/** Contract codes (and FR labels) → `jobs.contracts.<slug>` keys. */
const JOB_CONTRACT_SLUGS = {
  full_time: 'fullTime',
  part_time: 'partTime',
  contract: 'contract',
  internship: 'internship',
  freelance: 'freelance',
  'Temps plein': 'fullTime',
  'Temps partiel': 'partTime',
  Contrat: 'contract',
  Stage: 'internship',
  Freelance: 'freelance',
}

export function hasJobText(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

export function displayJobField(value, t, fallbackKey = JOB_EMPTY_LABEL_KEY) {
  const fallback = typeof t === 'function' ? t(fallbackKey) : fallbackKey
  return hasJobText(value) ? String(value).trim() : fallback
}

/**
 * Localized sector label. DB stores French strings as identifiers — do not change them.
 * Unknown/legacy values fall back to the raw string.
 */
export function jobSectorLabel(t, value) {
  if (!hasJobText(value)) {
    return typeof t === 'function' ? t(JOB_EMPTY_LABEL_KEY) : JOB_EMPTY_LABEL_KEY
  }
  const raw = String(value).trim()
  const slug = JOB_SECTOR_SLUGS[raw]
  if (slug && typeof t === 'function') return t(`jobs.sectors.${slug}`)
  return raw
}

/**
 * Localized contract label. Values are usually codes (`full_time`); FR labels are accepted as aliases.
 * Unknown/legacy values fall back to the raw string.
 */
export function jobContractLabel(t, value) {
  if (!hasJobText(value)) {
    return typeof t === 'function' ? t(JOB_EMPTY_LABEL_KEY) : JOB_EMPTY_LABEL_KEY
  }
  const raw = String(value).trim()
  const slug = JOB_CONTRACT_SLUGS[raw]
  if (slug && typeof t === 'function') return t(`jobs.contracts.${slug}`)
  return raw
}

export function formatJobExperienceLabel(experienceLevel, t) {
  if (!hasJobText(experienceLevel)) {
    return typeof t === 'function' ? t(JOB_EMPTY_LABEL_KEY) : JOB_EMPTY_LABEL_KEY
  }
  return (
    optionLabel(JOB_EXPERIENCE_LEVELS, experienceLevel) ||
    (typeof t === 'function' ? t(JOB_EMPTY_LABEL_KEY) : JOB_EMPTY_LABEL_KEY)
  )
}

export function formatJobSalaryLabel(job) {
  const salary = hasJobText(job?.salary) ? String(job.salary).trim() : ''
  if (!salary) return null
  const periodLabel = job?.salaryPeriod
    ? optionLabel(JOB_SALARY_PERIODS, job.salaryPeriod)
    : null
  return periodLabel ? `${salary} / ${periodLabel}` : salary
}

export function formatJobDate(value) {
  if (!hasJobText(value)) return null
  const formatted = formatShortDate(value)
  return formatted === 'Date indisponible' ? String(value).trim() : formatted
}

export function formatJobLanguageLabel(language) {
  if (!hasJobText(language)) return null
  return optionLabel(JOB_LANGUAGES, language) || String(language).trim()
}

export function formatJobLocationLabel(job, t) {
  const location = hasJobText(job?.location) ? String(job.location).trim() : ''
  const remoteLabel = typeof t === 'function' ? t('jobs.labels.remote') : 'Télétravail'
  const remotePossibleLabel =
    typeof t === 'function' ? t('jobs.labels.remotePossible') : 'Télétravail possible'
  if (!location) return job?.remote ? remoteLabel : null
  return job?.remote ? `${location} · ${remotePossibleLabel}` : location
}

export function jobHeaderSubtitle(job, t) {
  const fallback =
    typeof t === 'function' ? t('jobs.labels.offerFallback') : "Offre d'emploi"
  const base = [job?.publisherName, job?.location].filter(hasJobText).join(' · ') || fallback
  if (!hasJobText(job?.createdAt) || typeof t !== 'function') return base
  const published = t('jobs.detail.publishedOn', { date: formatDateTime(job.createdAt) })
  return `${base} · ${published}`
}
