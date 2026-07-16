const TECHNICAL_AUTH_PATTERNS = [
  'npm run',
  'phase2.env',
  'setup:',
  'edge function',
  'sms.ru/?panel',
  'smsc.ru',
  'smsc',
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

/** Messages d'erreur auth lisibles par l'utilisateur final (sans jargon technique). */
export function sanitizeAuthMessage(message = '') {
  const text = String(message || '').trim()
  if (!text) return 'Une erreur est survenue. Réessayez dans un instant.'
  if (text === 'ALREADY_REGISTERED') {
    return 'Un compte existe déjà avec cet identifiant. Connectez-vous ou utilisez un autre numéro ou e-mail.'
  }
  if (text === 'IDENTITY_LIMIT_REACHED') {
    return 'Cet e-mail ou ce numéro a déjà servi à deux comptes MOXT. Après suppression, une seule réinscription est possible avec les mêmes identifiants.'
  }
  if (text === 'IDENTITY_CHECK_UNAVAILABLE') {
    return 'Vérification des identifiants indisponible. Réessayez dans un instant.'
  }
  // Conserver les plafonds OTP locaux (90s / 3 par 3h) tels quels.
  if (/^Limite atteinte :|^Patientez \d+ secondes/.test(text)) {
    return text
  }

  const lower = text.toLowerCase()
  if (!isTechnicalAuthMessage(lower)) return text

  if (lower.includes('sms') || lower.includes('hook') || lower.includes('téléphone') || lower.includes('telephone')) {
    if (lower.includes('signature') || lower.includes('secret')) {
      return "L'envoi du code SMS est indisponible (configuration). Réessayez dans quelques minutes ou contactez le support."
    }
    if (lower.includes('solde') || lower.includes('insuffisant')) {
      return "L'envoi SMS est temporairement indisponible. Réessayez plus tard ou contactez le support."
    }
    if (lower.includes('timeout') || lower.includes('délai') || lower.includes('delai')) {
      return "L'opérateur SMS met trop longtemps à répondre. Attendez 1–2 minutes puis renvoyez le code (délai 90 s)."
    }
    if (lower.includes('refusé') || lower.includes('refuse') || lower.includes('mode test')) {
      return "Ce numéro n'a pas pu recevoir le SMS. Vérifiez le format +7… et réessayez, ou contactez le support."
    }
    return "L'envoi du code SMS a échoué. Attendez 90 secondes puis renvoyez le code. Si rien n'arrive sous 2–3 minutes, contactez le support."
  }
  if (lower.includes('e-mail') || lower.includes('email') || lower.includes('smtp')) {
    return "L'envoi d'e-mail est temporairement indisponible. Choisissez la vérification par SMS ou réessayez plus tard."
  }
  return 'Service temporairement indisponible. Réessayez plus tard ou contactez le support.'
}

export function authErrorToast(title, message, tone = 'error') {
  return {
    title,
    message: sanitizeAuthMessage(message),
    tone,
  }
}
