import {
  JOB_EXPERIENCE_LEVELS,
  JOB_LANGUAGES,
  JOB_SALARY_PERIODS,
  optionLabel,
} from '../../config/options'
import { formatShortDate } from '../../utils/formatters'

export const JOB_EMPTY_LABEL_KEY = 'jobs.labels.empty'

export function hasJobText(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

export function displayJobField(value, t, fallbackKey = JOB_EMPTY_LABEL_KEY) {
  const fallback = typeof t === 'function' ? t(fallbackKey) : fallbackKey
  return hasJobText(value) ? String(value).trim() : fallback
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
  return [job?.publisherName, job?.location].filter(hasJobText).join(' · ') || fallback
}
