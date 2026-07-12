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

  const lower = text.toLowerCase()
  if (
    lower.includes('npm run') ||
    lower.includes('phase2.env') ||
    lower.includes('setup:') ||
    lower.includes('edge function') ||
    lower.includes('sms.ru/?panel')
  ) {
    if (lower.includes('sms') || lower.includes('hook')) {
      return "L'envoi du code SMS est temporairement indisponible. Réessayez plus tard ou choisissez la vérification par e-mail."
    }
    if (lower.includes('e-mail') || lower.includes('email') || lower.includes('postbox') || lower.includes('smtp')) {
      return "L'envoi d'e-mail est temporairement indisponible. Choisissez la vérification par SMS ou réessayez plus tard."
    }
    return 'Service temporairement indisponible. Réessayez plus tard ou contactez le support.'
  }

  return text
}

export function authErrorToast(title, message, tone = 'error') {
  return {
    title,
    message: sanitizeAuthMessage(message),
    tone,
  }
}
