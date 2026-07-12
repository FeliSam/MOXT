export function isProfileVerified(profile) {
  if (!profile) return false
  if (profile.verified === true) return true
  return profile.status === 'verified'
}
