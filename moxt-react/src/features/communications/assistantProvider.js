import { translate } from '@moxt/shared/i18n/translate.js'
import { buildAssistantContextPack } from './assistantContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function match(text, keywords) {
  return keywords.some((kw) => text.includes(kw))
}

const LOCALE_TAGS = { fr: 'fr', en: 'en', ru: 'ru', pt: 'pt', es: 'es' }

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
  admin: { actionPaths: ['/support'], actions: 1, suggestions: 2, texts: 1 },
  compte: { actionPaths: ['/profile', '/profile/personal-information'], actions: 2, suggestions: 3, texts: 1 },
  recu: { actionPaths: ['/transfers', '/finance'], actions: 2, suggestions: 3, texts: 1 },
  finance: { actionPaths: ['/finance'], actions: 1, suggestions: 3, texts: 1 },
  message: { actionPaths: ['/messages'], actions: 1, suggestions: 3, texts: 1 },
  contribuer: { actionPaths: ['/contribute', '/support'], actions: 2, suggestions: 2, texts: 1 },
  expedition: { actionPaths: ['/marketplace/publish', '/marketplace'], actions: 2, suggestions: 2, texts: 1 },
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
    expedition: ['expédition', 'cdek', 'pochta', 'почта', 'livraison russie', 'transporteur', 'boxberry'],
    emploi: ['emploi', 'job', 'travail', 'poste', 'recruter', 'candidature', "offre d'emploi", 'recrut'],
    evenement: ['événement', 'evenement', 'soirée', 'conférence', 'atelier', 'rencontre', 'inscription'],
    entreprise: ['entreprise', 'société', 'prestataire', 'changeur', 'professionnel', 'annuaire', 'business'],
    verification: ['vérification', 'vérifier', 'identité', 'kyc', 'document', "pièce d'identité", 'selfie', 'valider mon'],
    p2p: ['p2p', 'pair à pair', 'devise', 'acheter des euros', 'vendre des roubles', 'pair-à-pair'],
    litige: ['litige', 'réclamation', 'problème', 'plainte', 'conflit', 'remboursement', 'signaler', 'contestation'],
    admin: ['administrateur', 'admin', 'parler avec un humain', 'parler avec un agent', 'contacter un admin', 'support humain'],
    compte: ['profil', 'compte', 'modifier', 'photo', 'avatar', 'paramètre', 'informations personnelles'],
    recu: ['reçu', 'historique', 'facture', 'preuve de transfert', 'archive'],
    finance: ['finance', 'portefeuille', 'wallet', 'solde', 'dépenses', 'bilan'],
    contribuer: ['contribuer', 'donation', 'don', 'soutenir', 'volontaire', 'financer le projet', 'contribution'],
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
    expedition: ['shipping', 'cdek', 'pochta', 'russian post', 'carrier', 'boxberry', 'delivery russia'],
    emploi: ['job', 'jobs', 'employment', 'work', 'position', 'hire', 'recruit', 'application', 'job offer'],
    evenement: ['event', 'events', 'party', 'conference', 'workshop', 'meetup', 'registration', 'rsvp'],
    entreprise: ['business', 'company', 'provider', 'exchanger', 'professional', 'directory', 'enterprise'],
    verification: ['verification', 'verify', 'identity', 'kyc', 'document', 'id card', 'selfie', 'validate my'],
    p2p: ['p2p', 'peer to peer', 'peer-to-peer', 'currency', 'buy euros', 'sell rubles'],
    litige: ['dispute', 'claim', 'problem', 'complaint', 'conflict', 'refund', 'report', 'contest'],
    admin: ['administrator', 'admin', 'speak with a human', 'speak with an agent', 'contact admin', 'human support'],
    compte: ['profile', 'account', 'edit', 'photo', 'avatar', 'settings', 'personal information'],
    recu: ['receipt', 'history', 'invoice', 'transfer proof', 'archive'],
    finance: ['finance', 'wallet', 'balance', 'spending', 'expenses', 'statement'],
    contribuer: ['contribute', 'donation', 'donate', 'support the project', 'volunteer', 'fund'],
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
    admin: ['администратор', 'админ', 'поговорить с человеком', 'поговорить с оператором', 'связаться с админ'],
    compte: ['профиль', 'аккаунт', 'изменить', 'фото', 'аватар', 'настройки', 'личные данные'],
    recu: ['квитанция', 'история', 'счёт', 'подтверждение перевода', 'архив'],
    finance: ['финансы', 'кошелёк', 'кошелек', 'баланс', 'расходы', 'выписка'],
    contribuer: ['внести вклад', 'пожертвование', 'донат', 'поддержать проект', 'волонтёр', 'финансировать', 'контрибьюция'],
    expedition: ['доставка', 'экспедиция', 'cdek', 'pochta', 'почта россии', 'boxberry', 'перевозчик', 'доставка в россии'],
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
    admin: ['administrador', 'admin', 'falar com um humano', 'falar com um agente', 'contactar admin', 'suporte humano'],
    compte: ['perfil', 'conta', 'alterar', 'foto', 'avatar', 'definições', 'informações pessoais'],
    recu: ['recibo', 'histórico', 'fatura', 'comprovativo de transferência', 'arquivo'],
    finance: ['finanças', 'carteira', 'wallet', 'saldo', 'despesas', 'extrato'],
    contribuer: ['contribuir', 'doação', 'doar', 'apoiar o projeto', 'voluntário', 'financiar'],
    expedition: ['expedição', 'envio', 'cdek', 'pochta', 'correios da rússia', 'boxberry', 'transportadora', 'entrega na rússia'],
    message: ['mensagem', 'mensagens', 'chat', 'conversa', 'contactar'],
  },
  es: {
    preuve: ['comprobante', 'prueba de pago', 'declarar pago', 'recibo de pago', 'confirmación de pago'],
    pays: ['qué país', 'países cubiertos', 'países disponibles', 'áfrica', 'benín', 'togo', 'senegal', 'camerún', 'nigeria', 'costa de marfil'],
    delai: ['plazo', 'cuánto tiempo', 'duración', 'rápido', 'tiempo de procesamiento'],
    frais: ['comisión', 'comisiones', 'coste', 'cuánto cuesta', 'tarifa', 'cargos'],
    taux: ['tipo de cambio', 'cambio', 'conversión', 'cuánto recibo'],
    transfert: ['transferencia', 'enviar dinero', 'envío de dinero', 'remesa', 'transferir'],
    colis: ['paquete', 'paquetes', 'trayecto', 'equipaje', 'viajero', 'enviar', 'kilo', 'kg', 'transportar'],
    marketplace: ['anuncio', 'marketplace', 'vender', 'comprar', 'artículo', 'producto', 'venta'],
    expedition: ['envío', 'expedición', 'cdek', 'pochta', 'correo ruso', 'boxberry', 'transportista', 'entrega en rusia'],
    emploi: ['empleo', 'empleos', 'trabajo', 'puesto', 'contratar', 'candidatura', 'oferta de empleo'],
    evenement: ['evento', 'eventos', 'fiesta', 'conferencia', 'taller', 'encuentro', 'inscripción'],
    entreprise: ['empresa', 'empresas', 'prestador', 'cambista', 'profesional', 'directorio', 'negocio'],
    verification: ['verificación', 'verificar', 'identidad', 'kyc', 'documento', 'documento de identidad', 'selfie', 'validar'],
    p2p: ['p2p', 'peer to peer', 'peer-to-peer', 'divisa', 'comprar euros', 'vender rublos'],
    litige: ['disputa', 'reclamación', 'problema', 'queja', 'conflicto', 'reembolso', 'denunciar', 'impugnar'],
    admin: ['administrador', 'admin', 'hablar con un humano', 'hablar con un agente', 'contactar admin', 'soporte humano'],
    compte: ['perfil', 'cuenta', 'editar', 'foto', 'avatar', 'ajustes', 'información personal'],
    recu: ['recibo', 'historial', 'factura', 'comprobante de transferencia', 'archivo'],
    finance: ['finanzas', 'cartera', 'wallet', 'saldo', 'gastos', 'extracto'],
    contribuer: ['contribuir', 'donación', 'donar', 'apoyar el proyecto', 'voluntario', 'financiar'],
    message: ['mensaje', 'mensajes', 'chat', 'conversación', 'contactar'],
  },
}

const DOMAIN_ORDER = [
  'admin',
  'preuve',
  'pays',
  'delai',
  'frais',
  'taux',
  'transfert',
  'colis',
  'expedition',
  'marketplace',
  'emploi',
  'evenement',
  'entreprise',
  'verification',
  'p2p',
  'litige',
  'contribuer',
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
  const suggestions = listKeys(`${base}.suggestions`, meta.suggestions)
    .map((key) => assistantText(t, language, key))
    .filter((label, index, arr) => label && label !== `${base}.suggestions.${index}` && arr.indexOf(label) === index)
  const actionCount = Math.min(meta.actions ?? meta.actionPaths.length, meta.actionPaths.length)
  const actions = meta.actionPaths.slice(0, actionCount).map((path, index) => {
    const key = `${base}.actions.${index}`
    const label = assistantText(t, language, key)
    return { label, path, key }
  }).filter((action) => action.label && action.label !== action.key)
    .map(({ label, path }) => ({ label, path }))
  return { texts, actions, suggestions }
}

function cleanQueryStr(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const localAssistantProvider = {
  async respond({ question = '', searchIndex = [], t, language = 'fr', state = null, user = null } = {}) {
    const lang = LOCALE_TAGS[language] ? language : 'fr'
    const localeTag = LOCALE_TAGS[lang]
    const normalized = question.toLocaleLowerCase(localeTag)
    const qClean = cleanQueryStr(question)

    // Construction du pack de contexte riche si l'état Redux est fourni
    const contextPack = state
      ? buildAssistantContextPack({ state, question, user, searchIndex })
      : { toolsUsed: [], searchHits: [], transfers: [], marketplaceListings: [], posts: [], exchangers: [], jobs: [], parcels: [], cards: [] }

    // 1. Détection : Articles / Annonces avec le même nom (Doublons ou variantes)
    const isDuplicateQuery =
      qClean.includes('meme nom') ||
      qClean.includes('meme titre') ||
      qClean.includes('en double') ||
      qClean.includes('doublon') ||
      ((qClean.includes('identique') || qClean.includes('pareil') || qClean.includes('similaire')) &&
        (qClean.includes('article') || qClean.includes('annonce') || qClean.includes('produit') || qClean.includes('item')))

    if (isDuplicateQuery) {
      const listings = state?.marketplace?.items || []
      const titleGroups = {}
      for (const item of listings) {
        const norm = cleanQueryStr(item.title)
        if (!norm) continue
        if (!titleGroups[norm]) titleGroups[norm] = []
        titleGroups[norm].push(item)
      }
      const duplicates = Object.entries(titleGroups).filter(([_, items]) => items.length > 1)
      if (duplicates.length > 0) {
        const total = duplicates.reduce((acc, [_, items]) => acc + items.length, 0)
        let text = `J'ai analysé le catalogue Marketplace : **${duplicates.length} groupe(s)** d'articles partagent exactement le même nom (total de ${total} annonces).\n\n`
        const actions = []
        for (const [_title, items] of duplicates) {
          text += `• **${items[0].title}** : ${items.length} annonces disponibles\n`
          for (const it of items.slice(0, 3)) {
            actions.push({
              label: `${it.title} (${it.price ? `${it.price} ${it.currency || '₽'}` : 'Sur demande'})`,
              path: `/marketplace/${it.id}`,
            })
          }
        }
        return {
          text,
          cards: contextPack.cards?.filter((c) => c.type === 'listing') || [],
          actions: actions.slice(0, 6),
          suggestions: ['Voir le Marketplace', 'Publier une annonce', 'Mes transferts'],
          sources: duplicates.map(([_, items]) => `Marketplace: ${items[0].title}`),
        }
      } else {
        return {
          text: "Après vérification dans la base Marketplace, il n'y a actuellement aucun article portant le même nom. Toutes les annonces publiées ont des titres distincts.",
          cards: [],
          actions: [{ label: 'Marketplace', path: '/marketplace' }],
          suggestions: ['Voir le Marketplace', 'Publier une annonce', 'Mes transferts'],
          sources: ['Catalogue Marketplace'],
        }
      }
    }

    // 2. Détection : Recherche directe du dernier transfert ou de l'historique des transferts
    const isDirectTransferQuery =
      (qClean.includes('transfert') || qClean.includes('virement') || qClean.includes('mandat') || qClean.includes('mxt') || qClean.includes('perevod')) &&
      (qClean.includes('dernier') || qClean.includes('effectue') || qClean.includes('liste') || qClean.includes('mes') || qClean.includes('mon') || qClean.includes('trouve') || qClean.includes('historique') || qClean.includes('statut') || qClean.includes('en est'))

    if (isDirectTransferQuery) {
      const allTransfers = state?.transfers?.items || []
      const userTransfers = user?.id
        ? allTransfers.filter((t) => !t.userId || t.userId === user.id)
        : allTransfers

      const isAskingForLast =
        qClean.includes('dernier') ||
        qClean.includes('statut') ||
        qClean.includes('ou en est') ||
        qClean.includes('en est')

      if (userTransfers.length > 0) {
        if (isAskingForLast) {
          const t = contextPack.latestTransfer || userTransfers[0]
          const status = t.status === 'completed' || t.status === 'paid_out' ? 'Payé' : t.status === 'pending' || t.status === 'processing' ? 'En cours' : t.status || 'Initié'
          const amount = t.amount || `${t.amountSent ?? t.amount ?? ''} ${t.currencyFrom || 'RUB'}`
          const ref = t.id || 'N/A'
          const direction = t.direction || 'Afrique'
          const origin = t.originCountry || 'Russie'

          let text = `J'ai trouvé **${userTransfers.length} transfert(s)** dans votre historique :\n\n`
          text += `Votre dernier transfert **${amount}** (${status}) :\n`
          text += `• Référence : \`${ref}\`\n`
          if (t.amount && t.received) text += `• Montant : ${t.amount} ➔ **${t.received}**\n`
          text += `• Trajet : ${origin} ➔ ${direction}\n`
          text += `• Statut : **${t.statusFriendly || status}**\n`
          if (t.exchanger) text += `• Changeur : ${t.exchanger}\n`
          text += `\nRetrouvez le reçu officiel et les preuves associées ci-dessous :`

          const transferCards = contextPack.cards?.filter((c) => c.type === 'transfer') || []
          return {
            text,
            cards: transferCards.length ? transferCards : [
              {
                id: `card-${t.id}`,
                type: 'transfer',
                title: `Transfert #${t.id}`,
                subtitle: `${origin} ➔ ${direction}`,
                description: t.amount && t.received ? `${t.amount} ➔ ${t.received}` : t.amount,
                badgeText: t.statusFriendly || status,
                badgeColor: status === 'Payé' ? 'emerald' : 'brand',
                meta: t.exchanger ? `Partenaire : ${t.exchanger}` : null,
                path: `/transfers/${t.id}`,
                actionLabel: 'Détails du transfert',
              },
            ],
            actions: [
              {
                label: `Transfert ${amount} (${status})`,
                path: `/transfers/${t.id}`,
              },
              { label: 'Tous mes transferts', path: '/transfers' },
            ],
            suggestions: ['Suivi de mon transfert', 'Nouveau transfert', 'Voir les changeurs'],
            sources: userTransfers.slice(0, 4).map((tr) => `Transfert: ${tr.id}`),
          }
        }

        let text = `J'ai trouvé **${userTransfers.length} transfert(s)** dans votre historique :\n\n`
        const actions = []
        for (const t of userTransfers.slice(0, 5)) {
          const status = t.status === 'completed' || t.status === 'paid_out' ? 'Payé' : t.status === 'pending' || t.status === 'processing' ? 'En cours' : t.status || 'Initié'
          const amount = t.amountSent ?? t.amount
          const cur = t.currencyFrom || 'RUB'
          text += `• Transfert **${amount ? `${amount} ${cur}` : t.id}** (${status})\n`
          actions.push({
            label: `Transfert ${amount ? `${amount} ${cur}` : t.id.slice(0, 8)} (${status})`,
            path: `/transfers/${t.id}`,
          })
        }
        text += `\nCliquez sur un transfert pour ouvrir la timeline de validation et les preuves de paiement :`
        return {
          text,
          cards: contextPack.cards?.filter((c) => c.type === 'transfer') || [],
          actions,
          suggestions: ['Nouveau transfert', 'Voir les changeurs', 'Reçu de transfert'],
          sources: userTransfers.slice(0, 4).map((t) => `Transfert: ${t.id}`),
        }
      } else {
        return {
          text: "Vous n'avez aucun transfert récent enregistré sur ce compte. Vous pouvez effectuer un nouveau transfert Afrique ↔ Russie dès maintenant.",
          cards: [],
          actions: [{ label: 'Nouveau transfert', path: '/transfers/new' }],
          suggestions: ['Nouveau transfert', 'Voir les taux de change', 'Changeurs vérifiés'],
          sources: ['Historique des transferts'],
        }
      }
    }

    // 3. Détection : Articles, posts et fil d'actualité
    const isPostQuery =
      qClean.includes('article') ||
      qClean.includes('publication') ||
      qClean.includes('post') ||
      qClean.includes('actualite') ||
      qClean.includes('news') ||
      qClean.includes('fil d') ||
      qClean.includes('quoi de neuf') ||
      qClean.includes('nouvelle')

    if (isPostQuery && contextPack.posts?.length > 0) {
      const posts = contextPack.posts
      let text = `Voici **${posts.length} article(s) et publication(s)** récents sur MOXT :\n\n`
      for (const p of posts.slice(0, 4)) {
        text += `• **${p.title}** (par *${p.authorName}*)\n`
        if (p.snippet && p.snippet !== p.title) {
          text += `  *${p.snippet}*\n`
        }
      }
      text += `\nConsultez les articles complets, visuels et commentaires ci-dessous :`
      return {
        text,
        cards: contextPack.cards?.filter((c) => c.type === 'post') || [],
        actions: posts.slice(0, 4).map((p) => ({
          label: p.title,
          path: p.path,
        })),
        suggestions: ['Voir le fil d’actualité', 'Publier un article', 'Explorer les annonces'],
        sources: posts.slice(0, 4).map((p) => `Article: ${p.title}`),
      }
    }

    // 4. Détection : Annonces & Marketplace
    const isMarketplaceQuery =
      qClean.includes('annonce') ||
      qClean.includes('marketplace') ||
      qClean.includes('produit') ||
      qClean.includes('vendre') ||
      qClean.includes('acheter') ||
      qClean.includes('achat') ||
      qClean.includes('vente') ||
      qClean.includes('prix') ||
      qClean.includes('telephone') ||
      qClean.includes('iphone') ||
      qClean.includes('voiture') ||
      qClean.includes('appartement') ||
      qClean.includes('ordinateur')

    if (isMarketplaceQuery && contextPack.marketplaceListings?.length > 0) {
      const listings = contextPack.marketplaceListings
      let text = `J'ai trouvé **${listings.length} annonce(s)** sur la Marketplace :\n\n`
      for (const it of listings.slice(0, 4)) {
        text += `• **${it.title}** : **${it.price}** (${it.city || 'Disponible'})\n`
      }
      text += `\nDécouvrez les photos, prix et fiches détaillées ci-dessous :`
      return {
        text,
        cards: contextPack.cards?.filter((c) => c.type === 'listing') || [],
        actions: listings.slice(0, 4).map((it) => ({
          label: `${it.title} (${it.price})`,
          path: it.path,
        })),
        suggestions: ['Voir le Marketplace', 'Publier une annonce', 'Rechercher un produit'],
        sources: listings.slice(0, 4).map((it) => `Marketplace: ${it.title}`),
      }
    }

    // 5. Détection : Changeurs et partenaires vérifiés
    const isExchangerQuery =
      qClean.includes('changeur') ||
      qClean.includes('echangeur') ||
      qClean.includes('partenaire') ||
      qClean.includes('qui peut changer') ||
      qClean.includes('meilleur taux')

    if (isExchangerQuery && contextPack.exchangers?.length > 0) {
      const exchangers = contextPack.exchangers
      let text = `Voici les **changeurs partenaires vérifiés** disponibles sur MOXT :\n\n`
      for (const ex of exchangers.slice(0, 4)) {
        text += `• **${ex.name}** (${ex.city || ex.country || 'Russie'})${ex.rating ? ` · Note : ★ ${Number(ex.rating).toFixed(1)}` : ''}${ex.feePercent != null ? ` · Commission : ${ex.feePercent}%` : ''}\n`
      }
      text += `\nTous nos partenaires sont certifiés pour garantir la sécurité et la rapidité de vos virements.`
      return {
        text,
        cards: contextPack.cards?.filter((c) => c.type === 'exchanger') || [],
        actions: exchangers.slice(0, 4).map((ex) => ({
          label: ex.name,
          path: ex.path,
        })),
        suggestions: ['Faire un transfert', 'Taux de change en direct', 'Garantie de sécurité'],
        sources: exchangers.slice(0, 4).map((ex) => `Changeur: ${ex.name}`),
      }
    }

    // 6. Détection : Emplois / Jobs
    const isDirectJobQuery =
      qClean.includes('job') ||
      qClean.includes('emploi') ||
      qClean.includes('travail') ||
      qClean.includes('recrutement') ||
      qClean.includes('stage')

    if (isDirectJobQuery && state?.jobs?.items?.length) {
      const jobs = state.jobs.items
      let text = `Voici **${jobs.length} offre(s) d’emploi** actuellement disponibles sur MOXT :\n\n`
      const actions = []
      for (const j of jobs.slice(0, 5)) {
        text += `• **${j.title || 'Offre d’emploi'}** (${j.company || 'Entreprise'} · ${j.city || 'Russie'})\n`
        actions.push({
          label: `${j.title} (${j.city || 'Moscou'})`,
          path: `/jobs/${j.id}`,
        })
      }
      return {
        text,
        cards: contextPack.cards?.filter((c) => c.type === 'job') || [],
        actions,
        suggestions: ['Voir tous les jobs', 'Publier une offre', 'Entreprises'],
        sources: jobs.slice(0, 3).map((j) => `Emploi: ${j.title}`),
      }
    }

    // 7. Détection : Colis et transport
    const isDirectParcelQuery =
      qClean.includes('colis') ||
      qClean.includes('bagage') ||
      qClean.includes('kilo') ||
      qClean.includes('voyageur')

    if (isDirectParcelQuery && state?.parcels?.items?.length) {
      const parcels = state.parcels.items.filter((p) => !p.status || p.status === 'active')
      if (parcels.length > 0) {
        let text = `Voici **${parcels.length} voyage(s)** disponible(s) pour transporter vos colis :\n\n`
        const actions = []
        for (const p of parcels.slice(0, 5)) {
          const route = `${p.origin || 'Afrique'} → ${p.destination || 'Russie'}`
          text += `• **${route}** (reste ${p.remainingKg ?? p.capacityKg ?? 10} kg)\n`
          actions.push({
            label: route,
            path: `/parcels/${p.id}`,
          })
        }
        return {
          text,
          cards: contextPack.cards?.filter((c) => c.type === 'parcel') || [],
          actions,
          suggestions: ['Voir tous les colis', 'Publier un voyage', 'Tarifs colis'],
          sources: parcels.slice(0, 3).map((p) => `Colis: ${p.origin} → ${p.destination}`),
        }
      }
    }

    // Fallback standard par domaine
    const entityMatches = (searchIndex || [])
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
      cards: contextPack.cards?.slice(0, 4) || [],
      actions: allActions,
      suggestions,
      sources: entityMatches.map((item) => `${item.typeLabel}: ${item.title}`),
    }
  },
}

export function createAssistantProvider(provider = localAssistantProvider) {
  return provider
}

