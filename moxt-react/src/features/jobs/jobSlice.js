import { createSlice } from '@reduxjs/toolkit'
import { createLocalStorage } from '../../services/createLocalStorage'

const jobsStorage = createLocalStorage('moxt-jobs-v1')
const applicationsStorage = createLocalStorage('moxt-job-applications-v1')
const reportsStorage = createLocalStorage('moxt-job-reports-v1')

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    items: jobsStorage.read(),
    applications: applicationsStorage.read(),
    reports: reportsStorage.read(),
  },
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },
    createJob: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: `JOB-${Date.now().toString(36).toUpperCase()}`,
            status: 'active',
            createdAt: new Date().toISOString(),
            expiresAt:
              values.expiresAt || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      },
    },
    applyToJob: {
      reducer(state, action) {
        const activeApplication = state.applications.some(
          (item) =>
            item.jobId === action.payload.jobId &&
            item.userId === action.payload.userId &&
            item.status !== 'withdrawn',
        )
        if (!activeApplication) state.applications.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: `APP-${Date.now().toString(36).toUpperCase()}`,
            status: 'submitted',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateJob(state, action) {
      const job = state.items.find((item) => item.id === action.payload.id)
      if (!job || job.ownerId !== action.payload.ownerId) return
      const { id: _id, ownerId: _o, createdAt: _c, ...changes } = action.payload
      Object.assign(job, changes, { updatedAt: new Date().toISOString() })
    },
    moderateJob(state, action) {
      const job = state.items.find((item) => item.id === action.payload.id)
      if (!job) return
      job.status = action.payload.status
    },
    updateApplicationStatus(state, action) {
      const application = state.applications.find((item) => item.id === action.payload.id)
      if (!application) return
      application.status = action.payload.status
      application.updatedAt = new Date().toISOString()
    },
    withdrawApplication(state, action) {
      const application = state.applications.find(
        (item) => item.id === action.payload.id && item.userId === action.payload.userId,
      )
      if (!application || application.status !== 'submitted') return
      application.status = 'withdrawn'
      application.updatedAt = new Date().toISOString()
    },
    reportJob: {
      reducer(state, action) {
        const duplicate = state.reports.some(
          (item) =>
            item.jobId === action.payload.jobId &&
            item.reporterId === action.payload.reporterId &&
            item.status === 'new',
        )
        if (!duplicate) state.reports.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: `JREP-${Date.now().toString(36).toUpperCase()}`,
            status: 'new',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateJobReportStatus(state, action) {
      const report = state.reports.find((item) => item.id === action.payload.id)
      if (report) report.status = action.payload.status
    },
    expireJobs(state, action) {
      const now = new Date(action.payload || Date.now())
      state.items.forEach((job) => {
        if (job.status === 'active' && job.expiresAt && new Date(job.expiresAt) <= now) {
          job.status = 'expired'
        }
      })
    },
  },
})

export const {
  applyToJob,
  createJob,
  expireJobs,
  moderateJob,
  updateJob,
  reportJob,
  updateApplicationStatus,
  withdrawApplication,
  updateJobReportStatus,
  setAll,
} = jobSlice.actions
export default jobSlice.reducer
