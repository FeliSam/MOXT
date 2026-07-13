import { describe, expect, it } from 'vitest'
import {
  jobApplicationFromRemoteRow,
  jobApplicationToRemoteRow,
  jobFromRemoteRow,
  jobToRemoteRow,
} from './jobRemote'

describe('jobRemote', () => {
  it('mappe un job complet vers Supabase et retour', () => {
    const job = {
      id: 'JOB-1',
      ownerId: 'u1',
      title: 'Développeur',
      sector: 'tech',
      contractType: 'full_time',
      experienceLevel: 'mid',
      salaryPeriod: 'month',
      salary: '120000 RUB',
      description: 'Description longue du poste',
      requirements: 'React, Node',
      benefits: 'Assurance',
      location: 'Moscou',
      remote: true,
      startDate: '2026-08-01',
      applicationDeadline: '2026-07-31',
      language: 'fr_ru',
      images: ['https://cdn.example/job.jpg'],
      status: 'active',
    }

    const remote = jobToRemoteRow(job)
    expect(remote.experience_level).toBe('mid')
    expect(remote.salary_period).toBe('month')
    expect(remote.application_deadline).toBeUndefined()
    expect(remote.start_date).toBeUndefined()
    expect(remote.payload.applicationDeadline).toBe('2026-07-31')
    expect(remote.payload.startDate).toBe('2026-08-01')
    expect(remote.payload.images).toEqual(['https://cdn.example/job.jpg'])

    const restored = jobFromRemoteRow(remote)
    expect(restored.experienceLevel).toBe('mid')
    expect(restored.salaryPeriod).toBe('month')
    expect(restored.images).toEqual(['https://cdn.example/job.jpg'])
    expect(restored.remote).toBe(true)
  })

  it('récupère les champs texte depuis le payload si la colonne est vide', () => {
    const restored = jobFromRemoteRow({
      id: 'JOB-2',
      title: '',
      description: '',
      requirements: '',
      salary: '',
      payload: {
        title: 'Chef de projet',
        description: 'Description complète dans le payload',
        requirements: 'Gestion d’équipe',
        salary: '150 000 RUB',
        experienceLevel: 'senior',
        language: 'fr_ru',
      },
    })

    expect(restored.title).toBe('Chef de projet')
    expect(restored.description).toBe('Description complète dans le payload')
    expect(restored.requirements).toBe('Gestion d’équipe')
    expect(restored.salary).toBe('150 000 RUB')
    expect(restored.experienceLevel).toBe('senior')
    expect(restored.language).toBe('fr_ru')
  })

  it('mappe une candidature job_id ↔ jobId', () => {
    const remote = jobApplicationToRemoteRow({
      id: 'APP-1',
      jobId: 'JOB-1',
      userId: 'u2',
      applicantName: 'Alice Test',
      message: 'Je suis intéressée',
      status: 'submitted',
      createdAt: '2026-01-01',
    })

    expect(remote.job_id).toBe('JOB-1')
    expect(remote.applicant_name).toBe('Alice Test')

    const restored = jobApplicationFromRemoteRow({
      id: 'APP-1',
      job_id: 'JOB-1',
      user_id: 'u2',
      applicant_name: 'Alice Test',
      message: 'Je suis intéressée',
      status: 'submitted',
      created_at: '2026-01-01',
    })

    expect(restored.jobId).toBe('JOB-1')
    expect(restored.applicantName).toBe('Alice Test')
  })
})
