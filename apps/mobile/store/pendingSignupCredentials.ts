/** Transient signup fields for SMS→email fallback on the verify screen (never persisted to disk). */
let pending = {
  password: '',
  firstName: '',
  lastName: '',
  originCountry: '',
  residenceCity: '',
}

type SignupCredentials = {
  password?: string
  firstName?: string
  lastName?: string
  originCountry?: string
  residenceCity?: string
}

export function stashSignupCredentials(next?: SignupCredentials | null) {
  pending = {
    password: String(next?.password || ''),
    firstName: String(next?.firstName || ''),
    lastName: String(next?.lastName || ''),
    originCountry: String(next?.originCountry || ''),
    residenceCity: String(next?.residenceCity || ''),
  }
}

export function peekSignupCredentials() {
  return { ...pending }
}

export function clearSignupCredentials() {
  pending = {
    password: '',
    firstName: '',
    lastName: '',
    originCountry: '',
    residenceCity: '',
  }
}

/** @deprecated use clearSignupCredentials */
export function clearSignupPassword() {
  clearSignupCredentials()
}

/** @deprecated use peekSignupCredentials */
export function peekSignupPassword() {
  return pending.password
}

/** @deprecated use stashSignupCredentials */
export function stashSignupPassword(value: string) {
  pending.password = String(value || '')
}
