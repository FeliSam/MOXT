import { OTP_RESEND_COOLDOWN_SECONDS } from './otpCooldown.js'

function otpResendHint() {
  if (OTP_RESEND_COOLDOWN_SECONDS > 0) {
    return `ou renvoyez un code après ${OTP_RESEND_COOLDOWN_SECONDS} secondes`
  }
  return 'ou renvoyez un code'
}

/**
 * SMSC / provider refused delivery for this MSISDN (operator block), not balance/timeout.
 * Used to switch registration to e-mail OTP.
 */
export function isSmsNumberProviderDenied(errorOrMessage) {
  const code =
    typeof errorOrMessage === 'object' && errorOrMessage !== null
      ? String(errorOrMessage.code || '')
      : ''
  const message = String(
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : errorOrMessage?.message || errorOrMessage?.error_description || '',
  )
  const lower = message.toLowerCase()

  if (
    lower.includes('solde insuffisant') ||
    lower.includes('insufficient balance') ||
    lower.includes('hook_timeout') ||
    lower.includes('failed to reach hook') ||
    lower.includes('rate limit') ||
    lower.includes('trop de tentatives') ||
    lower.includes('smsc_sender_invalid') ||
    code === 'hook_timeout' ||
    code === 'hook_timeout_after_retries' ||
    code === 'over_sms_send_rate_limit'
  ) {
    return false
  }

  if (
    lower.includes('smsc_number_denied') ||
    lower.includes('message is denied') ||
    lower.includes('envoi refusé pour ce numéro') ||
    lower.includes('envoi refuse pour ce numero')
  ) {
    return true
  }

  // Auth sms_send_failed only when the body points at a number/operator refusal.
  if (code === 'sms_send_failed') {
    return (
      lower.includes('denied') ||
      lower.includes('refusé') ||
      lower.includes('refuse') ||
      lower.includes('запрещ') ||
      lower.includes('fournisseur') ||
      lower.includes('operator') ||
      lower.includes('opérateur') ||
      lower.includes('operateur')
    )
  }

  return false
}

export const SMS_NUMBER_PROVIDER_DENIED = 'SMS_NUMBER_PROVIDER_DENIED'

export function translateAuthError(error, context = {}) {
  const code = typeof error === 'object' && error !== null ? error.code : undefined
  const name = typeof error === 'object' && error !== null ? error.name : undefined
  const message = typeof error === 'string' ? error : error?.message || ''
  const status = typeof error === 'object' && error !== null ? error.status : undefined
  const cause = typeof error === 'object' && error !== null ? error.cause : undefined
  const channel = context.channel === 'phone' || context.channel === 'email' ? context.channel : inferChannel(message, context)
  // Only confirm/verify paths — never map *send* (email_verification) to « confirmer ce code ».
  const verifyingOtp =
    context.intent === 'otp_verify' || context.intent === 'phone_verify'

  if (/^Patientez \d+ secondes avant de renvoyer un code\./.test(message)) {
    return message
  }
  if (/^Limite atteinte : maximum \d+ codes par période/.test(message)) {
    return message
  }

  // Identity / finalize codes — handle before OTP heuristics.
  if (message.includes('MOXT_IDENTITY_LIMIT_REACHED') || message === 'IDENTITY_LIMIT_REACHED') {
    return 'IDENTITY_LIMIT_REACHED'
  }
  if (message.includes('MOXT_IDENTITY_ACTIVE')) {
    return duplicateIdentityMessage(context)
  }
  if (message.includes('MOXT_FINALIZE_FAILED')) {
    return verifyingOtp
      ? 'La finalisation du profil a échoué. Réessayez « Confirmer » sans renvoyer de SMS.'
      : 'La finalisation du compte a échoué. Réessayez dans un instant.'
  }
  if (
    message.includes('MOXT_SESSION_REQUIRED') ||
    /session invalide|session non établie|session expirée|session missing|auth session/i.test(
      message,
    )
  ) {
    return verifyingOtp
      ? 'Session perdue après le code SMS. Réessayez « Confirmer » sans renvoyer de SMS.'
      : 'Session expirée. Reconnectez-vous ou renvoyez un code.'
  }
  if (message.includes('MOXT_PHONE_NOT_CONFIRMED')) {
    return verifyingOtp
      ? `Le numéro n’est pas encore confirmé. Vérifiez les 6 chiffres ${otpResendHint()}.`
      : 'Le numéro n’est pas confirmé. Renvoyez un code puis confirmez.'
  }
  if (message.includes('MOXT_EMAIL_NOT_CONFIRMED')) {
    return verifyingOtp
      ? `L’e-mail n’est pas encore confirmé. Vérifiez les 6 chiffres ${otpResendHint()}.`
      : 'L’e-mail n’est pas confirmé. Renvoyez un code puis confirmez.'
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
      return `Le code est invalide ou a expiré. Vérifiez les 6 chiffres ${otpResendHint()}.`
    }
    if (isTransientNetworkFailure({ message, name, status, cause })) {
      return 'Connexion au serveur impossible. Réessayez de confirmer le code sans en redemander un nouveau.'
    }
    if (
      lower.includes('duplicate key') ||
      lower.includes('profiles_verified_phone') ||
      lower.includes('unique constraint')
    ) {
      return 'Ce numéro est déjà lié à un autre compte. Connectez-vous ou contactez le support.'
    }
    if (/profil est momentanément|profil indisponible/i.test(message)) {
      return 'La finalisation du profil a échoué. Réessayez « Confirmer » sans renvoyer de SMS.'
    }
    return `Impossible de confirmer ce code. Vérifiez les 6 chiffres, ${otpResendHint()}.`
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
  // Auth maps a broken send_sms hook (HTTP ≠ 200) to AuthRetryableFetchError + "{}" / 500.
  // That is an SMS provider/hook failure — not a client VPN/network outage.
  if (isAuthHookOpaqueFailure({ message, name, status, code })) {
    return translateSmsHookFailure(
      message && message !== '{}'
        ? message
        : 'Unexpected status code returned from hook: 500',
    )
  }
  if (code === 'unexpected_failure' && message.toLowerCase().includes('hook')) {
    return translateSmsHookFailure(message)
  }
  // Undici/Chrome/Supabase often surface transient network as "TypeError: fetch failed".
  // OTP-specific wording only while confirming a code — not during signup/login.
  // VPN hint only for real connect timeouts — never for Auth 500 / empty "{}".
  if (isTransientNetworkFailure({ message, name, status, cause })) {
    if (verifyingOtp) {
      return 'Connexion au serveur impossible. Réessayez de confirmer le code sans en redemander un nouveau.'
    }
    if (context.intent === 'register' && isLikelyConnectTimeout({ message, cause })) {
      return "Impossible de joindre le serveur d'inscription. Vérifiez votre connexion réseau, puis réessayez."
    }
    return 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.'
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

  return translateSupabaseError(
    message,
    { code, status, name, cause },
    { channel, intent: context.intent },
  )
}

function duplicateIdentityMessage(context = {}) {
  if (context.intent === 'phone_verification') {
    return 'Ce numéro est déjà associé à un autre compte MOXT. Connectez-vous avec ce numéro ou utilisez un autre numéro.'
  }
  if (context.channel === 'email' || context.intent === 'email_verification') {
    return 'Cet e-mail est déjà lié à un compte MOXT. Connectez-vous ou utilisez une autre adresse.'
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
  if (lower.includes('telegram') && (lower.includes('bot') || lower.includes('start') || lower.includes('tg'))) {
    return "SMS refusé pour ce numéro. Ouvrez le bot Telegram SMSC (Start), puis renvoyez le code — il arrivera sur Telegram."
  }
  if (
    lower.includes('smsc_number_denied') ||
    lower.includes('envoi refusé') ||
    lower.includes('message is denied')
  ) {
    // Machine code when registering — UI switches to e-mail OTP.
    // Elsewhere keep a human SMS fallback hint.
    return "Ce numéro n'a pas pu recevoir le SMS (opérateur). Utilisez la confirmation par e-mail ou un autre numéro."
  }
  if (lower.includes('temporairement bloqué')) {
    return "L'envoi SMS est temporairement bloqué. Réessayez dans quelques minutes ou contactez le support."
  }
  if (lower.includes('mode test') || lower.includes('запрещ') || lower.includes('тест')) {
    return "Ce numéro n'a pas pu recevoir le SMS. Vérifiez le format +7… ou réessayez avec un autre numéro."
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

/** Opaque Auth 500 when the send_sms hook returned a non-2xx status (body discarded by GoTrue). */
function isAuthHookOpaqueFailure({ message = '', name, status, code } = {}) {
  const m = String(message || '').trim()
  const emptyPayload = !m || m === '{}'
  if (code === 'unexpected_failure' && String(message).toLowerCase().includes('hook')) {
    return true
  }
  if (name === 'AuthRetryableFetchError' && emptyPayload && (status === undefined || status >= 500)) {
    return true
  }
  if (emptyPayload && status >= 500 && code === 'unexpected_failure') {
    return true
  }
  return false
}

function isLikelyConnectTimeout({ message = '', cause } = {}) {
  const combined = `${message} ${cause?.message || ''} ${cause?.code || ''}`.toLowerCase()
  return (
    combined.includes('und_err_connect_timeout') ||
    combined.includes('connect timeout') ||
    combined.includes('connecttimeout') ||
    combined.includes('etimedout')
  )
}

function isTransientNetworkFailure({ message = '', name, status, cause } = {}) {
  const m = String(message || '').toLowerCase()
  const causeMessage = String(cause?.message || cause?.code || '').toLowerCase()
  const combined = `${m} ${causeMessage}`
  // AuthRetryableFetchError also wraps Auth HTTP 5xx (hook failures) — those are handled above.
  if (name === 'AuthRetryableFetchError') {
    return (
      combined.includes('failed to fetch') ||
      combined.includes('fetch failed') ||
      combined.includes('networkerror') ||
      combined.includes('network request failed') ||
      combined.includes('load failed') ||
      combined.includes('econnreset') ||
      combined.includes('enotfound') ||
      combined.includes('etimedout') ||
      combined.includes('connecttimeout') ||
      combined.includes('und_err_connect_timeout') ||
      combined.includes('connect timeout') ||
      combined.includes('socket hang up') ||
      combined.includes('typeerror: fetch')
    )
  }
  return (
    combined.includes('failed to fetch') ||
    combined.includes('fetch failed') ||
    combined.includes('networkerror') ||
    combined.includes('network request failed') ||
    combined.includes('load failed') ||
    combined.includes('econnreset') ||
    combined.includes('enotfound') ||
    combined.includes('etimedout') ||
    combined.includes('connecttimeout') ||
    combined.includes('und_err_connect_timeout') ||
    combined.includes('connect timeout') ||
    combined.includes('socket hang up') ||
    combined.includes('typeerror: fetch')
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
    isTransientNetworkFailure({ message, name, status, cause: meta.cause }) ||
    m.includes('connexion au serveur') ||
    m.includes('base de données') ||
    m.includes('database') ||
    m.includes('pgrst') ||
    m.includes('connect timeout') ||
    m.includes('econnreset') ||
    (m.includes('connection') && (m.includes('reset') || m.includes('refused') || m.includes('timeout')))
  ) {
    const verifyingOtp =
      context.intent === 'otp_verify' || context.intent === 'phone_verify'
    if (verifyingOtp) {
      return 'Connexion au serveur impossible. Réessayez de confirmer le code sans en redemander un nouveau.'
    }
    if (context.intent === 'register' && isLikelyConnectTimeout({ message, cause: meta.cause })) {
      return "Impossible de joindre le serveur d'inscription. Vérifiez votre connexion réseau, puis réessayez."
    }
    return 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.'
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
    return OTP_RESEND_COOLDOWN_SECONDS > 0
      ? `Trop de tentatives. Patientez au moins ${OTP_RESEND_COOLDOWN_SECONDS} secondes avant de réessayer.`
      : 'Trop de tentatives. Réessayez dans un instant.'
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
    return `Impossible de confirmer ce code. Vérifiez les 6 chiffres, ${otpResendHint()}.`
  }
  if (context.intent === 'email_verification') {
    return "Impossible d'envoyer le code e-mail. Réessayez dans quelques instants ou vérifiez l'adresse."
  }
  return phoneContext
    ? "L'envoi du code SMS a échoué. Réessayez dans quelques instants ou contactez le support."
    : 'Une erreur est survenue. Veuillez réessayer.'
}
