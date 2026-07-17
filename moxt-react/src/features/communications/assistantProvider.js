import { translate } from '@moxt/shared/i18n/translate.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function match(text, keywords) {
  return keywords.some((kw) => text.includes(kw))
}

const LOCALE_TAGS = { fr: 'fr', en: 'en', ru: 'ru', pt: 'pt' }

/** Resolve a user-visible string via `t`, falling back to French when `t` is absent. */
function assistantText(t, language, key) {
  if (typeof t === 'function') {
    const value = t(key)
    if (typeof value === 'string' && value !== key) return value
  }
  return translate(language || 'fr', key)
}

function listKeys(prefix, count) {
  return Array.from({ length: count }, (_, i) => `${prefix}.${i}`)
}

// ─── Domain metadata (paths + item counts; copy lives in i18n) ────────────────

const DOMAIN_META = {
  transfert: { actionPaths: ['/transfers/new', '/transfers'], actions: 2, suggestions: 4, texts: 2 },
  preuve: { actionPaths: ['/transfers'], actions: 1, suggestions: 3, texts: 1 },
  taux: { actionPaths: ['/transfers/new', '/p2p'], actions: 2, suggestions: 3, texts: 1 },
  pays: { actionPaths: ['/transfers/new'], actions: 1, suggestions: 3, texts: 1 },
  delai: { actionPaths: ['/transfers'], actions: 1, suggestions: 3, texts: 1 },
  frais: { actionPaths: ['/transfers/new'], actions: 1, suggestions: 3, texts: 1 },
  colis: { actionPaths: ['/parcels', '/parcels/publish'], actions: 2, suggestions: 4, texts: 2 },
  marketplace: { actionPaths: ['/marketplace', '/listings/new'], actions: 2, suggestions: 3, texts: 2 },
  emploi: { actionPaths: ['/jobs', '/jobs/publish'], actions: 2, suggestions: 3, texts: 1 },
  evenement: { actionPaths: ['/events', '/events/publish'], actions: 2, suggestions: 3, texts: 1 },
  entreprise: { actionPaths: ['/businesses', '/business/setup'], actions: 2, suggestions: 3, texts: 1 },
  verification: { actionPaths: ['/verification', '/documents'], actions: 2, suggestions: 3, texts: 2 },
  p2p: { actionPaths: ['/p2p', '/p2p/publish'], actions: 2, suggestions: 3, texts: 1 },
  litige: { actionPaths: ['/disputes', '/support'], actions: 2, suggestions: 3, texts: 1 },
  compte: { actionPaths: ['/profile', '/profile/personal-information'], actions: 2, suggestions: 3, texts: 1 },
  recu: { actionPaths: ['/transfers', '/finance'], actions: 2, suggestions: 3, texts: 1 },
  finance: { actionPaths: ['/finance'], actions: 1, suggestions: 3, texts: 1 },
  message: { actionPaths: ['/messages'], actions: 1, suggestions: 3, texts: 1 },
  fallback: { actionPaths: ['/discover', '/support'], actions: 2, suggestions: 4, texts: 2 },
}

// ─── Detection keywords per language ──────────────────────────────────────────

const DOMAIN_KEYWORDS = {
  fr: {
    preuve: ['preuve', 'paiement déclaré', 'déclarer paiement', 'justificatif de paiement'],
    pays: ['quel pays', 'pays couvert', 'pays disponible', 'afrique', 'bénin', 'togo', 'sénégal', 'cameroun', 'nigeria', 'côte d'],
    delai: ['délai', 'combien de temps', 'durée', 'rapide', 'temps de traitement'],
    frais: ['frais', 'commission', 'coût', 'combien ça coûte', 'tarif', 'combien prend'],
    taux: ['taux', 'change', 'cours', 'conversion', 'combien reçoi'],
    transfert: ['transfert', "envoyer de l'argent", 'envoyer argent', 'virement', 'mandat', 'envoyer de l'],
    colis: ['colis', 'trajet', 'bagage', 'voyageur', 'expédier', 'kilo', 'kg', 'transporter'],
    marketplace: ['annonce', 'marketplace', 'vendre', 'acheter', 'article', 'produit', 'vente'],
    emploi: ['emploi', 'job', 'travail', 'poste', 'recruter', 'candidature', "offre d'emploi", 'recrut'],
    evenement: ['événement', 'evenement', 'soirée', 'conférence', 'atelier', 'rencontre', 'inscription'],
    entreprise: ['entreprise', 'société', 'prestataire', 'changeur', 'professionnel', 'annuaire', 'business'],
    verification: ['vérification', 'vérifier', 'identité', 'kyc', 'document', "pièce d'identité", 'selfie', 'valider mon'],
    p2p: ['p2p', 'pair à pair', 'devise', 'acheter des euros', 'vendre des roubles', 'pair-à-pair'],
    litige: ['litige', 'réclamation', 'problème', 'plainte', 'conflit', 'remboursement', 'signaler', 'contestation'],
    compte: ['profil', 'compte', 'modifier', 'photo', 'avatar', 'paramètre', 'informations personnelles'],
    recu: ['reçu', 'historique', 'facture', 'preuve de transfert', 'archive'],
    finance: ['finance', 'portefeuille', 'wallet', 'solde', 'dépenses', 'bilan'],
    message: ['message', 'messagerie', 'chat', 'conversation', 'contacter'],
  },
  en: {
    preuve: ['proof', 'payment proof', 'declare payment', 'payment receipt', 'payment confirmation'],
    pays: ['which country', 'countries covered', 'available countries', 'africa', 'benin', 'togo', 'senegal', 'cameroon', 'nigeria', "cote d", 'ivory coast'],
    delai: ['deadline', 'how long', 'duration', 'fast', 'processing time', 'how much time'],
    frais: ['fee', 'fees', 'commission', 'cost', 'how much does it cost', 'tariff', 'charges'],
    taux: ['rate', 'rates', 'exchange', 'exchange rate', 'conversion', 'how much will i receive'],
    transfert: ['transfer', 'send money', 'sending money', 'wire', 'remittance', 'money transfer'],
    colis: ['parcel', 'package', 'trip', 'luggage', 'traveler', 'traveller', 'ship', 'kilo', 'kg', 'carry'],
    marketplace: ['listing', 'marketplace', 'sell', 'buy', 'item', 'product', 'sale'],
    emploi: ['job', 'jobs', 'employment', 'work', 'position', 'hire', 'recruit', 'application', 'job offer'],
    evenement: ['event', 'events', 'party', 'conference', 'workshop', 'meetup', 'registration', 'rsvp'],
    entreprise: ['business', 'company', 'provider', 'exchanger', 'professional', 'directory', 'enterprise'],
    verification: ['verification', 'verify', 'identity', 'kyc', 'document', 'id card', 'selfie', 'validate my'],
    p2p: ['p2p', 'peer to peer', 'peer-to-peer', 'currency', 'buy euros', 'sell rubles'],
    litige: ['dispute', 'claim', 'problem', 'complaint', 'conflict', 'refund', 'report', 'contest'],
    compte: ['profile', 'account', 'edit', 'photo', 'avatar', 'settings', 'personal information'],
    recu: ['receipt', 'history', 'invoice', 'transfer proof', 'archive'],
    finance: ['finance', 'wallet', 'balance', 'spending', 'expenses', 'statement'],
    message: ['message', 'messaging', 'chat', 'conversation', 'contact'],
  },
  ru: {
    preuve: ['подтверждение', 'доказательство оплаты', 'заявить об оплате', 'подтверждение оплаты', 'чек оплаты'],
    pays: ['какая страна', 'какие страны', 'страны', 'африка', 'бенин', 'того', 'сенегал', 'камерун', 'нигерия', 'кот-д'],
    delai: ['срок', 'сколько времени', 'длительность', 'быстро', 'время обработки', 'как долго'],
    frais: ['комиссия', 'комиссии', 'стоимость', 'сколько стоит', 'тариф', 'плата'],
    taux: ['курс', 'курсы', 'обмен', 'конвертация', 'сколько получу'],
    transfert: ['перевод', 'перевести', 'отправить деньги', 'денежный перевод', 'перевод денег'],
    colis: ['посылка', 'посылки', 'маршрут', 'багаж', 'путешественник', 'отправить', 'кило', 'кг', 'перевезти'],
    marketplace: ['объявление', 'маркетплейс', 'продать', 'купить', 'товар', 'продажа'],
    emploi: ['работа', 'вакансия', 'вакансии', 'трудоустройство', 'должность', 'нанять', 'отклик', 'работа'],
    evenement: ['событие', 'события', 'вечеринка', 'конференция', 'мастер-класс', 'встреча', 'запись', 'регистрация'],
    entreprise: ['компания', 'компании', 'предприятие', 'подрядчик', 'обменник', 'каталог', 'бизнес'],
    verification: ['верификация', 'проверка', 'личность', 'kyc', 'документ', 'удостоверение', 'селфи', 'подтвердить'],
    p2p: ['p2p', 'пир ту пир', 'валюта', 'купить евро', 'продать рубли', 'пир-ту-пир'],
    litige: ['спор', 'претензия', 'проблема', 'жалоба', 'конфликт', 'возврат', 'пожаловаться', 'оспорить'],
    compte: ['профиль', 'аккаунт', 'изменить', 'фото', 'аватар', 'настройки', 'личные данные'],
    recu: ['квитанция', 'история', 'счёт', 'подтверждение перевода', 'архив'],
    finance: ['финансы', 'кошелёк', 'кошелек', 'баланс', 'расходы', 'выписка'],
    message: ['сообщение', 'сообщения', 'чат', 'диалог', 'связаться', 'написать'],
  },
  pt: {
    preuve: ['comprovativo', 'comprovante', 'prova de pagamento', 'declarar pagamento', 'recibo de pagamento'],
    pays: ['que país', 'quais países', 'países cobertos', 'áfrica', 'benim', 'togo', 'senegal', 'camarões', 'nigéria', 'costa do marfim'],
    delai: ['prazo', 'quanto tempo', 'duração', 'rápido', 'tempo de processamento'],
    frais: ['taxa', 'taxas', 'comissão', 'custo', 'quanto custa', 'tarifa', 'encargos'],
    taux: ['taxa de câmbio', 'câmbio', 'curso', 'conversão', 'quanto recebo'],
    transfert: ['transferência', 'enviar dinheiro', 'envio de dinheiro', 'remessa', 'transferir'],
    colis: ['encomenda', 'encomendas', 'trajeto', 'bagagem', 'viajante', 'enviar', 'quilo', 'kg', 'transportar'],
    marketplace: ['anúncio', 'marketplace', 'vender', 'comprar', 'artigo', 'produto', 'venda'],
    emploi: ['emprego', 'empregos', 'trabalho', 'vaga', 'recrutar', 'candidatura', 'oferta de emprego'],
    evenement: ['evento', 'eventos', 'festa', 'conferência', 'workshop', 'encontro', 'inscrição'],
    entreprise: ['empresa', 'empresas', 'prestador', 'cambista', 'profissional', 'diretório', 'negócio'],
    verification: ['verificação', 'verificar', 'identidade', 'kyc', 'documento', 'bilhete de identidade', 'selfie', 'validar'],
    p2p: ['p2p', 'peer to peer', 'peer-to-peer', 'moeda', 'comprar euros', 'vender rublos'],
    litige: ['litígio', 'reclamação', 'problema', 'queixa', 'conflito', 'reembolso', 'denunciar', 'contestar'],
    compte: ['perfil', 'conta', 'alterar', 'foto', 'avatar', 'definições', 'informações pessoais'],
    recu: ['recibo', 'histórico', 'fatura', 'comprovativo de transferência', 'arquivo'],
    finance: ['finanças', 'carteira', 'wallet', 'saldo', 'despesas', 'extrato'],
    message: ['mensagem', 'mensagens', 'chat', 'conversa', 'contactar'],
  },
}

const DOMAIN_ORDER = [
  'preuve',
  'pays',
  'delai',
  'frais',
  'taux',
  'transfert',
  'colis',
  'marketplace',
  'emploi',
  'evenement',
  'entreprise',
  'verification',
  'p2p',
  'litige',
  'compte',
  'recu',
  'finance',
  'message',
]

function keywordsFor(language, domain) {
  const active = DOMAIN_KEYWORDS[language]?.[domain] || []
  const french = DOMAIN_KEYWORDS.fr[domain] || []
  if (language === 'fr') return french
  return [...active, ...french]
}

function detectDomain(text, language = 'fr') {
  for (const domain of DOMAIN_ORDER) {
    if (match(text, keywordsFor(language, domain))) return domain
  }
  return 'fallback'
}

function resolveDomainContent(domain, t, language) {
  const meta = DOMAIN_META[domain] || DOMAIN_META.fallback
  const base = `assistant.responses.${domain}`
  const texts = listKeys(`${base}.texts`, meta.texts).map((key) => assistantText(t, language, key))
  const suggestions = listKeys(`${base}.suggestions`, meta.suggestions).map((key) =>
    assistantText(t, language, key),
  )
  const actions = meta.actionPaths.map((path, index) => ({
    label: assistantText(t, language, `${base}.actions.${index}`),
    path,
  }))
  return { texts, actions, suggestions }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const localAssistantProvider = {
  async respond({ question, searchIndex, t, language } = {}) {
    const lang = LOCALE_TAGS[language] ? language : 'fr'
    const localeTag = LOCALE_TAGS[lang]
    const normalized = question.toLocaleLowerCase(localeTag)

    const entityMatches = searchIndex
      .filter((item) => {
        const haystack = `${item.title} ${item.subtitle} ${item.typeLabel}`.toLocaleLowerCase(localeTag)
        return normalized.split(/\s+/).some((word) => word.length > 3 && haystack.includes(word))
      })
      .slice(0, 3)

    const domain = detectDomain(normalized, lang)
    const { texts, actions, suggestions } = resolveDomainContent(domain, t, lang)
    const text = pick(texts)

    const personalActions = entityMatches.map((item) => ({ label: item.title, path: item.path }))
    const allActions = [...personalActions, ...actions].slice(0, 4)

    return {
      text,
      actions: allActions,
      suggestions,
      sources: entityMatches.map((item) => `${item.typeLabel}: ${item.title}`),
    }
  },
}

export function createAssistantProvider(provider = localAssistantProvider) {
  return provider
}
