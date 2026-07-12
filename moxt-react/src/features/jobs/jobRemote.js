import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js'
import { supabase } from '../../services/supabaseClient'

const COLUMN_MAP = {
  ownerId: 'owner_id',
  businessId: 'business_id',
  publisherName: 'publisher_name',
  contractType: 'contract_type',
  experienceLevel: 'experience_level',
  salaryPeriod: 'salary_period',
  publisherType: 'publisher_type',
  startDate: 'start_date',
  applicationDeadline: 'application_deadline',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  expiresAt: 'expires_at',
}

export function jobToRemoteRow(job) {
  if (!job?.id) throw new Error('Job invalide.')
  const images = job.images || []
  const row = {
    id: job.id,
    title: job.title || '',
    sector: job.sector || '',
    description: job.description || '',
    requirements: job.requirements || '',
    benefits: job.benefits || '',
    location: job.location || '',
    salary: job.salary || '',
    language: job.language || '',
    remote: Boolean(job.remote),
    status: job.status || 'active',
    payload: { ...job, images },
  }

  for (const [camel, snake] of Object.entries(COLUMN_MAP)) {
    row[snake] = job[camel] ?? null
  }

  return row
}

export function jobFromRemoteRow(row) {
  if (!row) return null

  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {}
  const mapped = fromRow(row)

  return {
    ...payload,
    ...mapped,
    id: mapped.id || row.id,
    images: payload.images || [],
    ownerId: mapped.ownerId ?? payload.ownerId ?? null,
    businessId: mapped.businessId ?? payload.businessId ?? null,
    publisherName: mapped.publisherName ?? payload.publisherName ?? '',
    publisherType: mapped.publisherType ?? payload.publisherType ?? 'personal',
    title: mapped.title ?? payload.title ?? '',
    sector: mapped.sector ?? payload.sector ?? '',
    contractType: mapped.contractType ?? payload.contractType ?? '',
    experienceLevel: mapped.experienceLevel ?? payload.experienceLevel ?? 'none',
    salaryPeriod: mapped.salaryPeriod ?? payload.salaryPeriod ?? 'month',
    language: mapped.language ?? payload.language ?? '',
    salary: mapped.salary ?? payload.salary ?? '',
    description: mapped.description ?? payload.description ?? '',
    requirements: mapped.requirements ?? payload.requirements ?? '',
    benefits: mapped.benefits ?? payload.benefits ?? '',
    location: mapped.location ?? payload.location ?? '',
    remote: mapped.remote ?? payload.remote ?? false,
    startDate: mapped.startDate ?? payload.startDate ?? '',
    applicationDeadline: mapped.applicationDeadline ?? payload.applicationDeadline ?? '',
    status: mapped.status ?? payload.status ?? 'active',
    createdAt: mapped.createdAt ?? payload.createdAt ?? null,
    updatedAt: mapped.updatedAt ?? payload.updatedAt ?? null,
    expiresAt: mapped.expiresAt ?? payload.expiresAt ?? null,
  }
}

export function jobsFromRemoteRows(rows = []) {
  return (rows || []).map(jobFromRemoteRow).filter(Boolean)
}

export function jobApplicationToRemoteRow(application) {
  return {
    id: application.id,
    job_id: application.jobId,
    user_id: application.userId,
    applicant_name: application.applicantName || '',
    message: application.message || '',
    status: application.status || 'submitted',
    created_at: application.createdAt,
    updated_at: application.updatedAt,
  }
}

export function jobApplicationFromRemoteRow(row) {
  if (!row) return null

  return {
    id: row.id,
    jobId: row.job_id || row.jobId,
    userId: row.user_id || row.userId,
    applicantName: row.applicant_name || row.applicantName || '',
    message: row.message || '',
    status: row.status || 'submitted',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  }
}

export function jobApplicationsFromRemoteRows(rows = []) {
  return (rows || []).map(jobApplicationFromRemoteRow).filter(Boolean)
}

export async function saveJobRemote(job) {
  const { error } = await supabase.from('jobs').upsert(jobToRemoteRow(job), { onConflict: 'id' })
  if (error) throw error
}

export async function saveJobApplicationRemote(application) {
  const { error } = await supabase
    .from('job_applications')
    .upsert(jobApplicationToRemoteRow(application), { onConflict: 'id' })
  if (error) throw error
}
