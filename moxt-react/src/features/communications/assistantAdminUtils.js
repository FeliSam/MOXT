const ADMIN_CONTACT_PATTERNS = {
  fr: /administrateur|admin\b|parler avec (un )?(humain|agent)|contacter (un )?admin|besoin d.?un (humain|agent)|support humain/i,
  en: /administrator|\badmin\b|speak with (a |an )?(human|agent|person)|contact (an? )?admin|human support|talk to (a )?(person|agent)/i,
  ru: /администратор|админ|поговорить с (человеком|оператором|агентом)|связаться с админ|живой поддерж/i,
  pt: /administrador|\badmin\b|falar com (um )?(humano|agente)|contactar (um )?admin|suporte humano/i,
}

export function wantsAdminContact(text, language = 'fr') {
  if (!text?.trim()) return false
  const normalized = text.trim()
  const patterns = [
    ADMIN_CONTACT_PATTERNS[language],
    ADMIN_CONTACT_PATTERNS.fr,
    ADMIN_CONTACT_PATTERNS.en,
  ].filter(Boolean)
  return patterns.some((pattern) => pattern.test(normalized))
}

export function buildAssistantTicketMessage(recentMessages = [], explicitText, fallbackText) {
  const recent = recentMessages
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => message.text)
    .join('\n\n')
  const base = explicitText?.trim() || fallbackText
  return recent ? `${base}\n\n--- Contexte assistant ---\n${recent}` : base
}
