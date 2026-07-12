import {
  JOB_EXPERIENCE_LEVELS,
  JOB_LANGUAGES,
  JOB_SALARY_PERIODS,
  optionLabel,
} from '../../config/options'
import { formatShortDate } from '../../utils/formatters'

export const JOB_EMPTY_LABEL = 'Non renseigné'

export function hasJobText(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

export function displayJobField(value, fallback = JOB_EMPTY_LABEL) {
  return hasJobText(value) ? String(value).trim() : fallback
}

export function formatJobExperienceLabel(experienceLevel) {
  if (!hasJobText(experienceLevel)) return JOB_EMPTY_LABEL
  return optionLabel(JOB_EXPERIENCE_LEVELS, experienceLevel) || JOB_EMPTY_LABEL
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

export function formatJobLocationLabel(job) {
  const location = hasJobText(job?.location) ? String(job.location).trim() : ''
  if (!location) return job?.remote ? 'Télétravail' : null
  return job?.remote ? `${location} · Télétravail possible` : location
}

export function jobHeaderSubtitle(job) {
  return [job?.publisherName, job?.location].filter(hasJobText).join(' · ') || 'Offre d\'emploi'
}
