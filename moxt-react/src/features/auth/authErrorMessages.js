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

  const lower = text.toLowerCase()
  if (!isTechnicalAuthMessage(lower)) return text

  if (lower.includes('sms') || lower.includes('hook') || lower.includes('téléphone') || lower.includes('telephone')) {
    return "L'envoi du code SMS a échoué. Réessayez plus tard ou contactez le support."
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
