const TECHNICAL_AUTH_PATTERNS = [
  'npm run',
  'phase2.env',
  'setup:',
  'edge function',
  'sms.ru/?panel',
  'smsc.ru',
  'smsc',
  'p1sms',
  'mode test',
  'supabase auth',
  'phone auth',
  'dkim',
  'postbox',
  'expéditeur moxt',
  'configuration smsc',
]

function isTechnicalAuthMessage(lower = '') {
  return TECHNICAL_AUTH_PATTERNS.some((pattern) => lower.includes(pattern))
}

function translated(t, key, fallback) {
  if (typeof t !== 'function') return fallback
  const value = t(key)
  return value === key ? fallback : value
}

/** Messages d'erreur auth lisibles par l'utilisateur final (sans jargon technique). */
export function sanitizeAuthMessage(message = '', t) {
  const text = String(message || '').trim()
  if (!text) {
    return translated(t, 'errors.auth.generic', 'Une erreur est survenue. Réessayez dans un instant.')
  }
  if (text === 'ALREADY_REGISTERED') {
    return translated(
      t,
      'errors.auth.alreadyRegistered',
      'Un compte existe déjà avec cet identifiant. Connectez-vous ou utilisez un autre numéro ou e-mail.',
    )
  }
  if (text === 'IDENTITY_LIMIT_REACHED') {
    return translated(
      t,
      'errors.auth.identityLimitReached',
      'Cet e-mail ou ce numéro a déjà servi à deux comptes MOXT. Après suppression, une seule réinscription est possible avec les mêmes identifiants.',
    )
  }
  if (text === 'IDENTITY_CHECK_UNAVAILABLE') {
    return translated(
      t,
      'errors.auth.identityCheckUnavailable',
      'Vérification des identifiants indisponible. Réessayez dans un instant.',
    )
  }
  const cooldownMatch = text.match(/^Patientez (\d+) secondes/)
  if (cooldownMatch) {
    const seconds = Number(cooldownMatch[1])
    const fallback = text
    if (typeof t !== 'function') return fallback
    const value = t('errors.auth.otpCooldown', { seconds })
    return value === 'errors.auth.otpCooldown' ? fallback : value
  }

  const capMatch = text.match(
    /^Limite atteinte : maximum (\d+) codes par période de 3 heures\. Réessayez dans environ (\d+) minute/,
  )
  if (capMatch) {
    const max = Number(capMatch[1])
    const minutes = Number(capMatch[2])
    const fallback = text
    if (typeof t !== 'function') return fallback
    const value = t('errors.auth.otpCap', { max, minutes })
    return value === 'errors.auth.otpCap' ? fallback : value
  }

  const lower = text.toLowerCase()
  if (!isTechnicalAuthMessage(lower)) return text

  if (lower.includes('sms') || lower.includes('hook') || lower.includes('téléphone') || lower.includes('telephone')) {
    if (lower.includes('signature') || lower.includes('secret')) {
      return translated(t, 'errors.auth.smsConfig', "L'envoi du code SMS est indisponible (configuration). Réessayez dans quelques minutes ou contactez le support.")
    }
    if (lower.includes('solde') || lower.includes('insuffisant')) {
      return translated(t, 'errors.auth.smsBalance', "L'envoi SMS est temporairement indisponible. Réessayez plus tard ou contactez le support.")
    }
    if (lower.includes('timeout') || lower.includes('délai') || lower.includes('delai')) {
      return translated(t, 'errors.auth.smsTimeout', "L'opérateur SMS met trop longtemps à répondre. Attendez un instant puis renvoyez le code.")
    }
    if (lower.includes('telegram')) {
      return translated(
        t,
        'errors.auth.smsTelegram',
        "SMS refusé pour ce numéro. Ouvrez le bot Telegram SMSC (Start), puis renvoyez le code.",
      )
    }
    if (
      lower.includes('refusé') ||
      lower.includes('refuse') ||
      lower.includes('mode test') ||
      lower.includes('smsc_number_denied') ||
      lower.includes('message is denied')
    ) {
      return translated(
        t,
        'errors.auth.smsRejected',
        "Ce numéro n'a pas pu recevoir le SMS. Ouvrez le bot Telegram SMSC (Start) puis renvoyez le code, ou utilisez un autre numéro.",
      )
    }
    return translated(t, 'errors.auth.smsFailed', "L'envoi du code SMS a échoué. Renvoyez le code. Si rien n'arrive sous 2–3 minutes, contactez le support.")
  }
  if (lower.includes('e-mail') || lower.includes('email') || lower.includes('smtp')) {
    return translated(t, 'errors.auth.emailUnavailable', "L'envoi d'e-mail est temporairement indisponible. Choisissez la vérification par SMS ou réessayez plus tard.")
  }
  return translated(t, 'errors.auth.serviceUnavailable', 'Service temporairement indisponible. Réessayez plus tard ou contactez le support.')
}

/** Remplace le jargon technique (JWT, RLS, PGRST, fetch…) par un message compréhensible. */
export function sanitizeUserFacingMessage(message = '', t) {
  const authSanitized = sanitizeAuthMessage(message, t)
  const lower = String(authSanitized || '').toLowerCase()
  if (!lower) {
    return translated(t, 'errors.app.technical', 'Une erreur technique est survenue. Réessayez ou contactez le support.')
  }

  if (
    /failed to fetch|networkerror|network request failed|err_internet|err_connection|offline|connexion impossible|load failed/.test(
      lower,
    )
  ) {
    return translated(t, 'errors.app.network', 'Connexion impossible. Vérifiez votre réseau puis réessayez.')
  }
  if (/jwt|session.*expir|token.*expir|not authenticated|invalid refresh/.test(lower)) {
    return translated(t, 'errors.app.sessionExpired', 'Votre session a expiré. Reconnectez-vous pour continuer.')
  }
  if (
    /row-level security|rls|permission denied|not authorized|403|forbidden|violates policy/.test(lower)
  ) {
    return translated(t, 'errors.app.permissionDenied', "Vous n’avez pas l’autorisation pour cette action.")
  }
  if (/pgrst116|0 rows|not found|404|no rows/.test(lower)) {
    return translated(t, 'errors.app.notFound', 'Élément introuvable ou déjà supprimé.')
  }
  if (/duplicate key|unique constraint|23505|already exists|conflit/.test(lower)) {
    return translated(
      t,
      'errors.app.conflict',
      'Cette action entre en conflit avec une donnée existante. Actualisez puis réessayez.',
    )
  }
  if (/timeout|timed out|57014|canceling statement/.test(lower)) {
    return translated(t, 'errors.app.timeout', 'Le serveur met trop longtemps à répondre. Réessayez dans un instant.')
  }
  if (
    /pgrst|postgres|sqlstate|column|relation |schema cache|undefined column|npm run|edge function|vapid|supabase/.test(
      lower,
    )
  ) {
    return translated(t, 'errors.app.technical', 'Une erreur technique est survenue. Réessayez ou contactez le support.')
  }

  return authSanitized
}

export function authErrorToast(title, message, tone = 'error', t) {
  return {
    title,
    message: sanitizeAuthMessage(message, t),
    tone,
  }
}

/**
 * Transient network blips while confirming OTP — muted under « Vérification impossible ».
 * (Messages 3 & 4: confirm without new SMS / without redemanding code.)
 * SMS send failures are NOT muted — user asked toasts back.
 */
export function isOtpConfirmNetworkFailureMessage(message = '', t) {
  const raw = String(message || '').trim()
  if (!raw) return false
  const sanitized = sanitizeAuthMessage(raw, t)
  const haystack = `${raw}\n${sanitized}`.toLowerCase()
  return (
    haystack.includes('connexion au serveur impossible') &&
    (haystack.includes('confirmer le code') ||
      (haystack.includes('confirmer') &&
        (haystack.includes('sans en redemander') ||
          haystack.includes('sans redemander') ||
          haystack.includes('sans renvoyer'))))
  )
}

/** Only OTP-confirm network blips stay muted; SMS errors toast again. */
export function shouldMuteRegisterErrorToast(message = '', t) {
  return isOtpConfirmNetworkFailureMessage(message, t)
}
