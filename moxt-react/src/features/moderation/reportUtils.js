const REPORT_FOREIGN_KEYS = {
  'marketplace/reportListing': 'listingId',
  'jobs/reportJob': 'jobId',
  'events/reportEvent': 'eventId',
}

export function reportForeignKeyForAction(actionType) {
  return REPORT_FOREIGN_KEYS[actionType] || null
}

export function isSameActiveReport(report, payload, foreignKey) {
  if (!report || !payload || !foreignKey) return false
  return (
    report[foreignKey] === payload[foreignKey] &&
    report.reporterId === payload.reporterId &&
    report.status === 'new'
  )
}

export function findActiveReport(reports = [], payload, foreignKey) {
  return reports.find((report) => isSameActiveReport(report, payload, foreignKey)) || null
}

export function wasActiveReportAdded(beforeReports = [], afterReports = [], payload, foreignKey) {
  if (!foreignKey || !payload) return false
  if (afterReports.length <= beforeReports.length) return false
  return Boolean(findActiveReport(afterReports, payload, foreignKey))
}

export function wasActiveReportDuplicate(beforeReports = [], afterReports = [], payload, foreignKey) {
  if (!foreignKey || !payload) return false
  if (afterReports.length > beforeReports.length) return false
  return Boolean(findActiveReport(beforeReports, payload, foreignKey))
}
