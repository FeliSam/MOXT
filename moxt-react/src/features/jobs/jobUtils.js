export function applicationJobId(application) {
  return application?.jobId || application?.job_id || ''
}

export function applicationUserId(application) {
  return application?.userId || application?.user_id || ''
}

export function applicationsForJob(applications, jobId) {
  return (applications || []).filter(
    (item) => applicationJobId(item) === jobId && item.status !== 'withdrawn',
  )
}
