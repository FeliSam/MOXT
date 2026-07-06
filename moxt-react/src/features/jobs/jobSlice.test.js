import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  applyToJob,
  createJob,
  reportJob,
  updateApplicationStatus,
  withdrawApplication,
} from './jobSlice'

describe('jobSlice', () => {
  beforeEach(() => localStorage.clear())

  it('separe le job de sa candidature', () => {
    const jobs = reducer(
      { items: [], applications: [] },
      createJob({ ownerId: 'o1', title: 'Assistant', sector: 'Support' }),
    )
    const state = reducer(
      jobs,
      applyToJob({ jobId: jobs.items[0].id, userId: 'u1', message: 'Je souhaite postuler.' }),
    )
    expect(state.items).toHaveLength(1)
    expect(state.applications[0].jobId).toBe(state.items[0].id)
  })
  it('traite une candidature et évite les signalements en double', () => {
    const jobs = reducer(
      { items: [], applications: [], reports: [] },
      createJob({ ownerId: 'o1', title: 'Assistant', sector: 'Support' }),
    )
    const applied = reducer(
      jobs,
      applyToJob({ jobId: jobs.items[0].id, userId: 'u1', message: 'Bonjour' }),
    )
    const accepted = reducer(
      applied,
      updateApplicationStatus({ id: applied.applications[0].id, status: 'accepted' }),
    )
    const report = { jobId: jobs.items[0].id, reporterId: 'u2', reason: 'Vérifier' }
    const reported = reducer(accepted, reportJob(report))
    const duplicate = reducer(reported, reportJob(report))
    expect(accepted.applications[0].status).toBe('accepted')
    expect(duplicate.reports).toHaveLength(1)
  })
  it('interdit les doublons actifs et permet de postuler apres un retrait', () => {
    const jobs = reducer(
      { items: [], applications: [], reports: [] },
      createJob({ ownerId: 'o1', title: 'Assistant', sector: 'Support' }),
    )
    const payload = { jobId: jobs.items[0].id, userId: 'u1', message: 'Bonjour' }
    const applied = reducer(jobs, applyToJob(payload))
    const duplicate = reducer(applied, applyToJob(payload))
    const withdrawn = reducer(
      duplicate,
      withdrawApplication({ id: applied.applications[0].id, userId: 'u1' }),
    )
    const reapplied = reducer(withdrawn, applyToJob(payload))

    expect(duplicate.applications).toHaveLength(1)
    expect(withdrawn.applications[0].status).toBe('withdrawn')
    expect(reapplied.applications).toHaveLength(2)
    expect(reapplied.applications[0].status).toBe('submitted')
  })
})
