import { OTP_RESEND_COOLDOWN_SECONDS } from './otpCooldown.js'

export function translateAuthError(error, context = {}) {
  const code = typeof error === 'object' && error !== null ? error.code : undefined
  const name = typeof error === 'object' && error !== null ? error.name : undefined
  const message = typeof error === 'string' ? error : error?.message || ''
  const status = typeof error === 'object' && error !== null ? error.status : undefined
  const channel = context.channel === 'phone' || context.channel === 'email' ? context.channel : inferChannel(message, context)
  const verifyingOtp =
    context.intent === 'otp_verify' ||
    context.intent === 'phone_verify' ||
    context.intent === 'email_verification'

  if (/^Patientez \d+ secondes avant de renvoyer un code\./.test(message)) {
    return message
  }
  if (/^Limite atteinte : maximum \d+ codes par période/.test(message)) {
    return message
  }

  // Confirming an OTP must never look like a fresh SMS send failure.
  if (verifyingOtp) {
    const lower = message.toLowerCase()
    if (
      code === 'otp_expired' ||
      code === 'mfa_verification_failed' ||
      lower.includes('invalid otp') ||
      lower.includes('token has expired') ||
      lower.includes('otp expired') ||
      lower.includes('invalid token') ||
      lower.includes('code is invalid')
    ) {
      return 'Le code est invalide ou a expiré. Vérifiez les 6 chiffres ou renvoyez un code après 90 secondes.'
    }
    if (isTransientNetworkFailure({ message, name, status })) {
      return 'Connexion au serveur impossible. Réessayez de confirmer le code sans en redemander un nouveau.'
    }
    if (lower.includes('session') || lower.includes('profil') || lower.includes('profile')) {
      return 'Le code est valide mais la finalisation du compte a échoué. Réessayez « Confirmer » sans renvoyer de SMS.'
    }
    return 'Impossible de confirmer ce code. Vérifiez les 6 chiffres, ou renvoyez un code après 90 secondes.'
  }

  if (message.includes('MOXT_IDENTITY_LIMIT_REACHED')) {
    return 'IDENTITY_LIMIT_REACHED'
  }
  if (message.includes('MOXT_IDENTITY_ACTIVE')) {
    return duplicateIdentityMessage(context)
  }
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
    return 'La connexion par numéro est temporairement indisponible. Réessayez plus tard ou contactez le support.'
  }
  if (code === 'sms_send_failed' || code === 'over_sms_send_rate_limit') {
    return "L'envoi du code SMS a échoué. Réessayez dans quelques instants ou choisissez la connexion par e-mail."
  }
  if (
    code === 'hook_timeout' ||
    code === 'hook_timeout_after_retries' ||
    message.toLowerCase().includes('failed to reach hook') ||
    message.toLowerCase().includes('hook_timeout')
  ) {
    return "L'envoi SMS a pris trop de temps. Réessayez dans quelques instants."
  }
  if (message === 'IDENTITY_CHECK_UNAVAILABLE' || message.includes('IDENTITY_CHECK_UNAVAILABLE')) {
    return 'Vérification des identifiants indisponible. Réessayez dans un instant.'
  }
  // Undici/Chrome/Supabase often surface transient network as "TypeError: fetch failed"
  // or AuthRetryableFetchError with "{}" — never show the opaque generic toast.
  if (isTransientNetworkFailure({ message, name, status })) {
    return channel === 'phone'
      ? 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez sans demander un nouveau code.'
      : 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.'
  }
  if (code === 'unexpected_failure' && message.toLowerCase().includes('hook')) {
    return translateSmsHookFailure(message)
  }
  if (message.toLowerCase().includes('signups not allowed for otp')) {
    return 'Aucun compte MOXT associé à ce numéro. Créez un compte ou vérifiez le numéro saisi.'
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

  return translateSupabaseError(message, { code, status, name }, { channel, intent: context.intent })
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
  if (lower.includes('unexpected status code returned from hook')) {
    return "L'envoi SMS est temporairement bloqué. Réessayez dans quelques minutes ou connectez-vous par e-mail."
  }
  if (lower.includes('solde insuffisant') || lower.includes('insufficient balance')) {
    return "L'envoi du code SMS est temporairement indisponible. Réessayez plus tard ou contactez le support."
  }
  if (
    lower.includes('envoi refusé') ||
    lower.includes('message is denied') ||
    lower.includes('temporairement bloqué')
  ) {
    return "L'envoi SMS est temporairement bloqué. Réessayez dans quelques minutes ou connectez-vous par e-mail."
  }
  if (lower.includes('mode test') || lower.includes('запрещ') || lower.includes('тест')) {
    return "L'envoi SMS est temporairement bloqué. Réessayez dans quelques minutes ou connectez-vous par e-mail."
  }
  if (lower.includes('expéditeur') || lower.includes('sender') || lower.includes('smsc_sender_invalid')) {
    return "L'envoi du code SMS est temporairement indisponible. Réessayez dans quelques minutes."
  }
  if (lower.includes('secret de signature') || lower.includes('send_sms_hook_secret')) {
    return "L'envoi du code SMS est temporairement indisponible. Réessayez dans quelques minutes ou contactez le support."
  }
  if (lower.includes('rate limit') || lower.includes('trop de tentatives')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  }
  if (lower.includes('sms.ru') && (lower.includes('221') || lower.includes('204'))) {
    return "L'envoi SMS est temporairement bloqué. Réessayez dans quelques minutes ou connectez-vous par e-mail."
  }
  return "L'envoi du code SMS a échoué. Réessayez plus tard ou contactez le support."
}

function isTransientNetworkFailure({ message = '', name, status } = {}) {
  const m = String(message || '').toLowerCase()
  if (name === 'AuthRetryableFetchError') return true
  if (message === '{}' || String(message || '').trim() === '') {
    return status >= 500 || status === undefined
  }
  return (
    m.includes('failed to fetch') ||
    m.includes('fetch failed') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('load failed') ||
    m.includes('econnreset') ||
    m.includes('enotfound') ||
    m.includes('etimedout') ||
    m.includes('socket hang up') ||
    m.includes('typeerror: fetch')
  )
}

function translateSupabaseError(message, meta = {}, context = {}) {
  const m = String(message || '').toLowerCase()
  const { code, status, name } = meta
  const channel = context.channel
  const phoneContext = channel === 'phone' || isSmsRelated(message, meta)

  if (!message) {
    return phoneContext
      ? "L'envoi du code SMS a échoué. Réessayez dans quelques instants."
      : 'Une erreur est survenue. Veuillez réessayer.'
  }

  if (
    isTransientNetworkFailure({ message, name, status }) ||
    m.includes('connexion au serveur') ||
    m.includes('base de données') ||
    m.includes('database') ||
    m.includes('pgrst') ||
    m.includes('connection')
  ) {
    return phoneContext
      ? 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez sans demander un nouveau code.'
      : 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.'
  }

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
  if (
    m.includes('for security purposes') ||
    m.includes('only request this after') ||
    m.includes('email rate limit') ||
    m.includes('rate limit') ||
    code === 'over_request_rate_limit'
  ) {
    return `Trop de tentatives. Patientez au moins ${OTP_RESEND_COOLDOWN_SECONDS} secondes avant de réessayer.`
  }
  if (
    status >= 500 ||
    m.includes('500') ||
    m.includes('internal server') ||
    m.includes('unexpected_failure') ||
    m.includes('error sending confirmation') ||
    m.includes('unable to send') ||
    m.includes('error creating user') ||
    m.includes('database error saving')
  ) {
    if (phoneContext || m.includes('sms') || m.includes('hook') || m.includes('smsc')) {
      return translateSmsHookFailure(message)
    }
    if (m.includes('email provider') || m.includes('smtp')) {
      return "Le service d'inscription par e-mail est indisponible. Choisissez la vérification par téléphone ou réessayez plus tard."
    }
    return phoneContext
      ? "L'envoi du code SMS a échoué. Réessayez dans quelques instants."
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
  // Phone signup must never end on an opaque generic toast.
  // Keep send-path wording only when we are not verifying an OTP.
  if (context.intent === 'otp_verify' || context.intent === 'phone_verify') {
    return 'Impossible de confirmer ce code. Vérifiez les 6 chiffres, ou renvoyez un code après 90 secondes.'
  }
  return phoneContext
    ? "L'envoi du code SMS a échoué. Réessayez dans quelques instants ou contactez le support."
    : 'Une erreur est survenue. Veuillez réessayer.'
}
