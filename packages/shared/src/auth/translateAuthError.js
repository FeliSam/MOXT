export function translateAuthError(error, context = {}) {
  const code = typeof error === 'object' && error !== null ? error.code : undefined
  const message = typeof error === 'string' ? error : error?.message || ''
  const status = typeof error === 'object' && error !== null ? error.status : undefined
  const channel = context.channel === 'phone' || context.channel === 'email' ? context.channel : inferChannel(message, context)

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    code === 'phone_exists' ||
    code === 'identity_already_exists'
  ) {
    return duplicateIdentityMessage(context)
  }
  if (code === 'signup_disabled') {
    return 'Les inscriptions sont temporairement désactivées. Réessayez plus tard.'
  }
  if (
    code === 'phone_provider_disabled' ||
    message.toLowerCase().includes('phone logins are disabled') ||
    message.toLowerCase().includes('phone provider disabled')
  ) {
    return 'La connexion par numéro est désactivée côté serveur. Relancez npm run setup:supabase pour réactiver Phone Auth.'
  }
  if (code === 'sms_send_failed' || code === 'over_sms_send_rate_limit') {
    return "L'envoi du code SMS a échoué. Vérifiez le mode test SMSC, le solde et l'expéditeur MOXT, ou réessayez plus tard."
  }
  if (code === 'unexpected_failure' && message.toLowerCase().includes('hook')) {
    return translateSmsHookFailure(message)
  }
  if (code === 'email_provider_disabled' || code === 'over_email_send_rate_limit') {
    return "Le service d'inscription par e-mail est indisponible. Choisissez la vérification par téléphone ou réessayez plus tard."
  }
  if (code === 'weak_password') {
    return 'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec majuscule, minuscule et chiffre.'
  }
  if (code === 'otp_expired' || code === 'mfa_verification_failed') {
    return "Le code est invalide ou a expiré. Recommencez le processus d'inscription."
  }
  if (code === 'user_not_found' || message.toLowerCase().includes('user not found')) {
    return channel === 'phone'
      ? 'Aucun compte MOXT associé à ce numéro. Créez un compte ou vérifiez le numéro saisi.'
      : 'Aucun compte MOXT associé à cet e-mail. Créez un compte ou vérifiez l’adresse saisie.'
  }
  if (code === 'bad_jwt' || message.toLowerCase().includes('invalid api key')) {
    return "Configuration du service d'authentification incorrecte. Réessayez plus tard ou contactez le support."
  }

  return translateSupabaseError(message, { code, status }, { channel })
}

function duplicateIdentityMessage(context = {}) {
  if (context.intent === 'phone_verification') {
    return 'Ce numéro est déjà associé à un autre compte MOXT. Connectez-vous avec ce numéro ou utilisez un autre numéro.'
  }
  return 'ALREADY_REGISTERED'
}

function inferChannel(message = '', context = {}) {
  if (context.channel) return context.channel
  const lower = String(message).toLowerCase()
  if (
    lower.includes('sms') ||
    lower.includes('smsc') ||
    lower.includes('phone') ||
    lower.includes('hook') ||
    lower.includes('телефон')
  ) {
    return 'phone'
  }
  if (lower.includes('email') || lower.includes('smtp') || lower.includes('postbox')) {
    return 'email'
  }
  return undefined
}

function isSmsRelated(message = '', meta = {}) {
  const lower = String(message).toLowerCase()
  return (
    lower.includes('sms') ||
    lower.includes('smsc') ||
    lower.includes('hook') ||
    lower.includes('phone') ||
    meta.code === 'sms_send_failed' ||
    meta.code === 'unexpected_failure'
  )
}

function translateSmsHookFailure(message = '') {
  const lower = message.toLowerCase()
  if (lower.includes('smsc') || lower.includes('solde')) {
    return "L'envoi du code SMS a échoué. Vérifiez le solde et l'expéditeur MOXT sur smsc.ru."
  }
  if (lower.includes('mode test') || lower.includes('test') || lower.includes('запрещ')) {
    return "L'envoi SMS est bloqué pour ce numéro. Sur smsc.ru, désactivez le mode test ou autorisez l'envoi vers tous les numéros russes."
  }
  return "L'envoi du code SMS a échoué. Vérifiez la configuration SMSC (solde, expéditeur MOXT, mode test désactivé)."
}

function translateSupabaseError(message, meta = {}, context = {}) {
  if (!message) return 'Une erreur est survenue. Veuillez réessayer.'
  const m = message.toLowerCase()
  const { code, status } = meta
  const channel = context.channel
  const phoneContext = channel === 'phone' || isSmsRelated(message, meta)

  if (m.includes('user already registered') || m.includes('already been registered')) {
    return duplicateIdentityMessage(context)
  }
  if (m.includes('invalid otp') || m.includes('token has expired') || m.includes('otp expired')) {
    return "Le code est invalide ou a expiré. Recommencez le processus d'inscription."
  }
  if (m.includes('email not confirmed')) {
    return "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail."
  }
  if (m.includes('phone not confirmed') || m.includes('phone provider')) {
    return 'Votre numéro n’est pas encore confirmé. Terminez l’inscription avec le code SMS reçu.'
  }
  if (m.includes('invalid login credentials')) {
    return phoneContext
      ? 'Identifiants incorrects. Vérifiez votre numéro russe (+7) et votre mot de passe, ou confirmez d’abord votre inscription par SMS.'
      : 'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.'
  }
  if (m.includes('email rate limit') || m.includes('rate limit') || code === 'over_request_rate_limit') {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  }
  if (
    status >= 500 ||
    m.includes('500') ||
    m.includes('internal server') ||
    m.includes('unexpected_failure') ||
    m.includes('error sending confirmation') ||
    m.includes('unable to send')
  ) {
    if (phoneContext || m.includes('sms') || m.includes('hook') || m.includes('smsc')) {
      return translateSmsHookFailure(message)
    }
    if (m.includes('email provider') || m.includes('smtp')) {
      return "Le service d'inscription par e-mail est indisponible. Choisissez la vérification par téléphone ou réessayez plus tard."
    }
    return phoneContext
      ? "L'envoi du code SMS a échoué. Vérifiez le mode test SMSC, le solde et réessayez."
      : "Le service d'inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard."
  }
  if (m.includes('password should be')) {
    return 'Le mot de passe doit contenir au moins 8 caractères, avec majuscule, minuscule et chiffre.'
  }
  if (
    m.includes('invalid phone') ||
    m.includes('unable to validate phone') ||
    m.includes('phone number is invalid') ||
    code === 'validation_failed'
  ) {
    return 'Numéro de téléphone invalide. Vérifiez le format (+7XXXXXXXXXX).'
  }
  if (m.includes('redirect') || m.includes('invalid redirect')) {
    return 'Configuration du service incorrecte. Utilisez la vérification par téléphone.'
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}
