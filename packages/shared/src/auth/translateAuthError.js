export function translateAuthError(error) {
  const code = typeof error === 'object' && error !== null ? error.code : undefined
  const message = typeof error === 'string' ? error : error?.message || ''
  const status = typeof error === 'object' && error !== null ? error.status : undefined

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    code === 'phone_exists' ||
    code === 'identity_already_exists'
  ) {
    return 'ALREADY_REGISTERED'
  }
  if (code === 'signup_disabled') {
    return 'Les inscriptions sont temporairement désactivées. Réessayez plus tard.'
  }
  if (
    code === 'phone_provider_disabled' ||
    message.toLowerCase().includes('phone logins are disabled')
  ) {
    return 'La connexion par numéro est désactivée côté serveur. Utilisez votre e-mail, ou réessayez après activation Phone dans Supabase Auth.'
  }
  if (code === 'sms_send_failed' || code === 'over_sms_send_rate_limit') {
    return "L'envoi SMS est indisponible. Choisissez la vérification par e-mail ou réessayez plus tard."
  }
  if (code === 'unexpected_failure' && message.toLowerCase().includes('hook')) {
    return "L'envoi du code SMS a échoué. Sur SMS.ru, enregistrez un expéditeur (MOXT) : sms.ru → Отправители. Sinon utilisez l'e-mail."
  }
  if (code === 'email_provider_disabled' || code === 'over_email_send_rate_limit') {
    return "Le service d'inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard."
  }
  if (code === 'weak_password') {
    return 'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec majuscule, minuscule et chiffre.'
  }
  if (code === 'otp_expired' || code === 'mfa_verification_failed') {
    return "Le code est invalide ou a expiré. Recommencez le processus d'inscription."
  }
  if (code === 'user_not_found' || message.toLowerCase().includes('user not found')) {
    return 'Aucun compte MOXT associé à ce numéro. Créez un compte ou vérifiez le numéro saisi.'
  }
  if (code === 'bad_jwt' || message.toLowerCase().includes('invalid api key')) {
    return "Configuration du service d'authentification incorrecte. Réessayez plus tard ou contactez le support."
  }

  return translateSupabaseError(message, { code, status })
}

function translateSupabaseError(message, meta = {}) {
  if (!message) return 'Une erreur est survenue. Veuillez réessayer.'
  const m = message.toLowerCase()
  const { code, status } = meta

  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'ALREADY_REGISTERED'
  }
  if (m.includes('invalid otp') || m.includes('token has expired') || m.includes('otp expired')) {
    return "Le code est invalide ou a expiré. Recommencez le processus d'inscription."
  }
  if (m.includes('email not confirmed')) {
    return "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail."
  }
  if (m.includes('invalid login credentials')) {
    return 'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.'
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
    m.includes('email provider') ||
    m.includes('smtp') ||
    m.includes('unable to send')
  ) {
    return "Le service d'inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard."
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
