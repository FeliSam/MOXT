/** French source strings for messages.* / communications.* until locale files are filled. */
export const MESSAGES_FR_SOURCES = {
  'messages.statusBadge': 'Statut',
  // ── list / empty / not found ─────────────────────────────────────────────
  'messages.empty.title': 'Aucune conversation pour l’instant',
  'messages.empty.description':
    'Contactez un vendeur, un voyageur ou un professionnel depuis une fiche MOXT pour démarrer un échange.',
  'messages.empty.marketplace': 'Marketplace',
  'messages.empty.parcels': 'Colis',
  'messages.empty.activities': 'Mes activités',
  'messages.notFound.title': 'Conversation indisponible',
  'messages.notFound.description':
    'Ce fil de discussion n’existe pas ou n’est plus accessible depuis ce lien.',
  'messages.notFound.back': 'Retour aux conversations',
  'messages.exchangeCount': '{count} échange(s)',
  'messages.unreadCount': ' · {count} non lu',
  'messages.unreadCountPlural': ' · {count} non lus',
  'messages.actives': 'Actives',
  'messages.archive': 'Archiver',
  'messages.restore': 'Restaurer',
  'messages.showSuggestions': 'Afficher les suggestions',
  'messages.hideSuggestions': 'Masquer les suggestions',
  'messages.conversationOptionsAria': 'Options de conversation',
  'messages.archivedBanner':
    'Conversation archivée — vous pouvez la restaurer depuis le menu ⋯',
  'messages.blockedBanner':
    'Cette conversation est bloquée. Vous ne pouvez plus envoyer de messages.',
  'messages.removeAllVisible': 'Tout retirer',
  'messages.replyToListingLabel': 'Réponse à l’annonce',
  'messages.replyToMessage': 'Réponse à {name}',
  'messages.replyToMessageFallback': 'un message',
  'messages.editingTitle': 'Modification du message',
  'messages.editingHint': 'Modifiez le texte puis validez pour l’enregistrer.',
  'messages.draftSaved': 'Brouillon enregistré',
  'messages.youPrefix': 'Vous : ',
  'messages.startConversation': 'Démarrez la conversation',
  'messages.messageCount': '{count} message',
  'messages.messageCountPlural': '{count} messages',
  'messages.unreadSeparator': 'Message non lu',
  'messages.unreadSeparatorPlural': '{count} messages non lus',
  'messages.threadStart': 'Début de la conversation',
  'messages.securityTitle': 'Consignes de sécurité',
  'messages.date.today': "Aujourd'hui",
  'messages.date.yesterday': 'Hier',
  'messages.activity.new': 'Nouvelle conversation',
  'messages.activity.recent': 'Actif récemment',
  'messages.activity.seenMinutes': 'Vu il y a {minutes} min',
  'messages.activity.activeToday': "Actif aujourd'hui · {time}",
  'messages.activity.activeYesterday': 'Actif hier',
  'messages.activity.last': 'Dernière activité · {time}',
  'messages.assistant.name': 'Assistant MOXT',
  'messages.assistant.alwaysThere': 'Toujours là',
  'messages.assistant.preview': 'Comment puis-je vous aider aujourd’hui ?',
  'messages.assistant.subtitle': 'Assistant local contextuel',
  'messages.assistant.greeting':
    'Bonjour, je peux rechercher dans vos données MOXT et vous guider vers la bonne action.',
  'messages.assistant.backAria': 'Retour aux conversations',
  'messages.assistant.clearHistoryAria': 'Effacer l’historique',
  'messages.assistant.removeDocAria': 'Retirer le document',
  'messages.assistant.addDocAria': 'Ajouter un document',
  'messages.assistant.placeholder': 'Demandez quelque chose à l’assistant…',
  'messages.assistant.sendAria': 'Envoyer à l’assistant',
  'messages.assistant.sources': 'Sources: {list}',
  'messages.assistant.error': 'L’assistant local n’a pas pu répondre. {detail}',
  'messages.assistant.suggestions.transfer': "Comment effectuer un transfert d'argent ?",
  'messages.assistant.suggestions.publishListing':
    'Comment publier une annonce sur le marketplace ?',
  'messages.assistant.suggestions.parcel': 'Comment envoyer un colis via un voyageur ?',
  'messages.assistant.suggestions.verify': 'Comment vérifier mon identité ?',
  'messages.assistant.suggestions.dispute':
    'Comment contacter le support en cas de litige ?',
  'messages.assistant.suggestions.admin': 'Je souhaite parler avec un administrateur',
  'messages.assistant.suggestions.business': 'Comment créer un compte professionnel ?',
  'messages.assistant.contactAdmin': 'Contacter un administrateur',
  'messages.assistant.contactAdminAria': 'Contacter un administrateur MOXT',
  'messages.assistant.adminTicketSubject': 'Demande via assistant MOXT',
  'messages.assistant.adminTicketDefault':
    'Demande de contact avec un administrateur via l’assistant MOXT.',
  'messages.assistant.adminEscalated':
    'Votre demande a été transmise à l’équipe MOXT (ticket {id}). Un administrateur pourra vous répondre depuis Support.',
  'messages.assistant.adminFollowUp': 'Suivre ma demande',
  'messages.assistant.adminComposePrompt':
    'D’accord — un administrateur MOXT peut vous répondre directement dans la messagerie. Décrivez votre question ou préoccupation ci-dessous.',
  'messages.assistant.adminComposeTitle': 'Message à l’administrateur',
  'messages.assistant.adminComposeBody':
    'Expliquez clairement votre demande. Un admin vous répondra dans les meilleurs délais dans ce chat.',
  'messages.assistant.adminComposePlaceholder':
    'Ex. : je souhaite modifier mon pays d’origine, j’ai un problème de publication…',
  'messages.assistant.adminComposeHint': 'Je souhaite parler avec un administrateur.',
  'messages.assistant.adminComposeLocked': 'Rédigez votre message dans le formulaire ci-dessus…',
  'messages.assistant.adminSend': 'Envoyer à l’admin',
  'messages.assistant.adminSending': 'Envoi…',
  'messages.assistant.adminChatOpened':
    'Votre message a été envoyé. La conversation avec le support MOXT est ouverte — un administrateur peut y répondre.',
  'messages.assistant.adminOpenChat': 'Ouvrir la conversation',
  'messages.assistant.adminUnavailable':
    'Aucun administrateur n’est disponible pour le moment. Réessayez un peu plus tard.',
  'messages.assistant.adminSendFailed':
    'Impossible d’ouvrir la conversation admin. Vérifiez votre connexion puis réessayez.',
  'messages.filterSupport': 'Support admin',
  'messages.statusSending': 'Envoi en cours',
  'messages.attachment.photo': '📷 Photo',
  'messages.attachment.photos': '📷 {count} photos',
  'messages.attachment.file': '📎 {name}',
  'messages.attachment.fileFallback': 'Pièce jointe',
  'messages.attachment.searchPhoto': 'photo image',
  'messages.attachment.searchPhotos': '{count} photos photo images',
  'messages.attachment.searchFileFallback': 'pièce jointe',
  'messages.replyQuoteListing': 'Annonce',
  'messages.sendFailedBanner': 'Échec d’envoi',
  'messages.retryAction': 'Réessayer',
  'messages.notSynced': 'Non synchronisé',
  'messages.deleteConfirmDescription':
    'Le message sera retiré de votre conversation. Cette action est définitive.',
  'messages.threadEmptyTitle': 'Aucun message pour l’instant',
  'messages.threadEmptyDescription': 'Écrivez le premier message pour démarrer l’échange.',
  'messages.searchNoMatch': 'Aucun message ne correspond à votre recherche.',
  'messages.userFallback': 'Utilisateur',

  // ── related type labels ──────────────────────────────────────────────────
  'communications.related.business': 'Entreprise',
  'communications.related.event': 'Événement',
  'communications.related.job': 'Emploi',
  'communications.related.listing': 'Annonce',
  'communications.related.parcel': 'Colis',
  'communications.related.p2p': 'Échange P2P',
  'communications.related.transfer': 'Transfert',
  'communications.related.general': 'Discussion',
  'communications.related.support': 'Support admin',

  // ── contact button ───────────────────────────────────────────────────────
  'communications.contact': 'Contacter',
  'communications.contactOpening': 'Ouverture…',

  // ── snapshot badges / fallbacks ──────────────────────────────────────────
  'communications.snapshot.defaultTitle': 'Annonce',
  'communications.snapshot.available': 'Disponible',
  'communications.snapshot.recruiting': 'Recrutement',
  'communications.snapshot.freeEntry': 'Entrée gratuite',
  'communications.snapshot.business': 'Entreprise',
  'communications.snapshot.transferTitle': 'Transfert {id}',
  'communications.snapshot.rate': 'Taux {rate}',
  'communications.snapshot.amount': 'Montant {amount}',

  // ── static suggestion chips (config) ─────────────────────────────────────
  'communications.chips.business.services': 'Bonjour, quels services proposez-vous ?',
  'communications.chips.business.hours': 'Quels sont vos horaires ?',
  'communications.chips.business.quote': 'Je souhaite obtenir un devis.',
  'communications.chips.event.seats': 'Bonjour, reste-t-il des places ?',
  'communications.chips.event.register': 'Comment se déroule l’inscription ?',
  'communications.chips.event.access': 'Le lieu est-il accessible ?',
  'communications.chips.job.available': 'Bonjour, le poste est-il toujours disponible ?',
  'communications.chips.job.cv': 'Puis-je envoyer mon CV ?',
  'communications.chips.job.process': 'Quel est le processus de recrutement ?',
  'communications.chips.listing.available': 'Bonjour, cette annonce est-elle disponible ?',
  'communications.chips.listing.price': 'Le prix est-il négociable ?',
  'communications.chips.listing.details': 'Pouvez-vous partager plus de détails ?',
  'communications.chips.parcel.kg': 'Bonjour, combien de kilos restent disponibles ?',
  'communications.chips.parcel.delay': 'Quel est le délai prévu ?',
  'communications.chips.parcel.items': 'Quels objets acceptez-vous ?',
  'communications.chips.transfer.status':
    'Bonjour, pouvez-vous confirmer le statut du paiement ?',
  'communications.chips.transfer.proof': 'La preuve de paiement est-elle suffisante ?',
  'communications.chips.transfer.deadline':
    'Quel est le délai restant pour finaliser le transfert ?',
  'communications.chips.p2p.available': 'Bonjour, cette offre est-elle toujours disponible ?',
  'communications.chips.p2p.payment': 'Quel mode de paiement préférez-vous ?',
  'communications.chips.p2p.rate': 'Pouvez-vous confirmer le taux ?',
  'communications.chips.general.more': 'Bonjour, je souhaite en savoir plus.',
  'communications.chips.general.thanks': 'Merci pour votre message.',
  'communications.chips.general.clarify': 'Pouvez-vous préciser votre demande ?',
  'communications.chips.support.received': 'Bien reçu, je regarde cela.',
  'communications.chips.support.delay': 'Merci pour votre patience, je reviens rapidement.',
  'communications.chips.support.needInfo': 'Pouvez-vous me donner un peu plus de détails ?',

  // ── dynamic composer suggestions ─────────────────────────────────────────
  'messages.suggestions.fallback.listing': 'cette annonce',
  'messages.suggestions.fallback.job': 'ce poste',
  'messages.suggestions.fallback.parcel': 'ce trajet',
  'messages.suggestions.fallback.event': 'cet événement',
  'messages.suggestions.fallback.business': 'votre entreprise',
  'messages.suggestions.listing.owner.thanks':
    'Bonjour, merci pour votre intérêt pour « {item} ».',
  'messages.suggestions.listing.owner.available':
    "Bonjour {peer}, l'article est toujours disponible.",
  'messages.suggestions.listing.owner.price':
    'Le prix indiqué ({subtitle}) reste valable.',
  'messages.suggestions.listing.owner.details':
    "Je peux vous donner plus de détails sur l'article.",
  'messages.suggestions.listing.owner.questions':
    "N'hésitez pas si vous avez d'autres questions.",
  'messages.suggestions.listing.contact.available':
    'Bonjour, « {item} » est-il encore disponible ?',
  'messages.suggestions.listing.contact.price':
    'Bonjour, le prix affiché ({subtitle}) est-il négociable ?',
  'messages.suggestions.listing.contact.details':
    'Bonjour, pouvez-vous me donner plus de détails ?',
  'messages.suggestions.listing.contact.interest':
    'Bonjour {peer}, je suis intéressé(e) par cette annonce.',
  'messages.suggestions.listing.contact.visit':
    "Serait-il possible d'organiser une visite ou un essai ?",
  'messages.suggestions.listing.contact.location':
    'Quelle est la localisation pour la remise ?',
  'messages.suggestions.listing.contact.payment':
    'Acceptez-vous un paiement sécurisé via MOXT ?',
  'messages.suggestions.job.owner.thanks':
    'Bonjour, merci pour votre candidature concernant « {item} ».',
  'messages.suggestions.job.owner.open': 'Bonjour {peer}, le poste est toujours ouvert.',
  'messages.suggestions.job.owner.cv':
    "Pouvez-vous m'envoyer votre CV et une brève présentation ?",
  'messages.suggestions.job.owner.sector': 'Le secteur recherché : {subtitle}.',
  'messages.suggestions.job.owner.profile':
    'Je reste disponible pour échanger sur le profil recherché.',
  'messages.suggestions.job.contact.available':
    'Bonjour, le poste « {item} » est-il toujours disponible ?',
  'messages.suggestions.job.contact.apply':
    'Bonjour {peer}, je souhaite postuler à cette offre.',
  'messages.suggestions.job.contact.process':
    'Pouvez-vous me préciser le processus de recrutement ?',
  'messages.suggestions.job.contact.sector':
    'Le domaine « {subtitle} » me correspond bien.',
  'messages.suggestions.job.contact.cv':
    'Je peux vous transmettre mon CV dès maintenant.',
  'messages.suggestions.parcel.owner.thanks':
    'Bonjour, merci pour votre message concernant {item}.',
  'messages.suggestions.parcel.owner.space':
    'Bonjour {peer}, il reste de la place disponible.',
  'messages.suggestions.parcel.owner.rate': 'Tarif actuel : {subtitle}.',
  'messages.suggestions.parcel.owner.weight':
    'Indiquez-moi le poids et le contenu de votre colis.',
  'messages.suggestions.parcel.owner.deadlines':
    'Quels sont vos délais de dépôt et de retrait ?',
  'messages.suggestions.parcel.contact.space':
    'Bonjour, avez-vous encore de la place pour {item} ?',
  'messages.suggestions.parcel.contact.rate':
    'Le tarif affiché ({subtitle}) me convient.',
  'messages.suggestions.parcel.contact.book':
    'Bonjour {peer}, je souhaite réserver un envoi.',
  'messages.suggestions.parcel.contact.items': "Quels types d'objets acceptez-vous ?",
  'messages.suggestions.parcel.contact.dates':
    'Pouvez-vous confirmer les dates de départ et d’arrivée ?',
  'messages.suggestions.event.owner.thanks':
    'Bonjour, merci pour votre intérêt pour « {item} ».',
  'messages.suggestions.event.owner.seats':
    'Bonjour {peer}, des places sont encore disponibles.',
  'messages.suggestions.event.owner.access': 'Tarif / accès : {subtitle}.',
  'messages.suggestions.event.owner.explain':
    "Je peux vous expliquer le déroulement de l'événement.",
  'messages.suggestions.event.owner.program':
    'Souhaitez-vous que je vous envoie le programme ?',
  'messages.suggestions.event.contact.seats':
    'Bonjour, reste-t-il des places pour « {item} » ?',
  'messages.suggestions.event.contact.register':
    "Bonjour {peer}, comment s'inscrire à l'événement ?",
  'messages.suggestions.event.contact.access': "Concernant l'accès : {subtitle}.",
  'messages.suggestions.event.contact.place':
    "Pouvez-vous préciser le lieu et l'horaire ?",
  'messages.suggestions.event.contact.public':
    "L'événement est-il accessible et ouvert au public ?",
  'messages.suggestions.business.owner.thanks': 'Bonjour, merci pour votre message.',
  'messages.suggestions.business.owner.help': 'Bonjour {peer}, comment puis-je vous aider ?',
  'messages.suggestions.business.owner.about':
    'Nous serions ravis de répondre à vos questions sur {item}.',
  'messages.suggestions.business.owner.meeting':
    'Souhaitez-vous un rendez-vous ou un devis personnalisé ?',
  'messages.suggestions.business.contact.services':
    'Bonjour, quels services propose {item} ?',
  'messages.suggestions.business.contact.hours':
    'Bonjour {peer}, pouvez-vous me communiquer vos horaires ?',
  'messages.suggestions.business.contact.quote':
    'Je souhaite obtenir un devis, est-ce possible ?',
  'messages.suggestions.business.contact.custom':
    'Proposez-vous une prestation adaptée à mon besoin ?',
  'messages.suggestions.transfer.owner.status':
    'Bonjour {peer}, je consulte le statut de votre transfert.',
  'messages.suggestions.transfer.owner.received':
    'Pouvez-vous confirmer la réception des fonds ?',
  'messages.suggestions.transfer.owner.proof':
    'Avez-vous bien transmis la preuve de paiement ?',
  'messages.suggestions.transfer.owner.safe':
    "Je reste disponible pour finaliser l'opération en toute sécurité.",
  'messages.suggestions.transfer.contact.status':
    'Bonjour, pouvez-vous confirmer le statut du transfert ?',
  'messages.suggestions.transfer.contact.proof':
    'Bonjour {peer}, la preuve de paiement est-elle suffisante ?',
  'messages.suggestions.transfer.contact.deadline':
    "Quel est le délai restant pour finaliser l'opération ?",
  'messages.suggestions.transfer.contact.update':
    "Merci de me tenir informé(e) de l'avancement.",
  'messages.suggestions.p2p.owner.active':
    'Bonjour {peer}, mon offre est toujours active.',
  'messages.suggestions.p2p.owner.rate': 'Le taux proposé est {subtitle}.',
  'messages.suggestions.p2p.owner.terms':
    "Je peux confirmer les conditions de l'échange.",
  'messages.suggestions.p2p.owner.payment': 'Quel mode de paiement préférez-vous ?',
  'messages.suggestions.p2p.owner.safe':
    'Restons vigilants et échangeons uniquement via MOXT.',
  'messages.suggestions.p2p.contact.available':
    'Bonjour, votre offre est-elle toujours disponible ?',
  'messages.suggestions.p2p.contact.rate':
    'Le taux affiché ({subtitle}) me convient.',
  'messages.suggestions.p2p.contact.exchange':
    'Bonjour {peer}, je souhaite échanger avec vous.',
  'messages.suggestions.p2p.contact.payment': 'Quel mode de paiement acceptez-vous ?',
  'messages.suggestions.p2p.contact.confirm':
    'Pouvez-vous confirmer le montant et les conditions ?',
  'messages.suggestions.general.owner.thanks':
    'Bonjour {peer}, merci pour votre message.',
  'messages.suggestions.general.owner.help': 'Comment puis-je vous aider ?',
  'messages.suggestions.general.owner.available':
    'Je reste disponible pour répondre à vos questions.',
  'messages.suggestions.general.contact.more':
    'Bonjour {peer}, je souhaite en savoir plus.',
  'messages.suggestions.general.contact.thanks': 'Merci pour votre retour.',
  'messages.suggestions.general.contact.clarify':
    'Pouvez-vous préciser votre demande ?',
}

export function messagesText(t, key, vars = {}) {
  const translated = typeof t === 'function' ? t(key, vars) : null
  if (translated && translated !== key) return translated
  const source = MESSAGES_FR_SOURCES[key]
  if (!source) return key
  return source.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

export function relatedOptionLabel(t, meta) {
  if (!meta) return ''
  return meta.labelKey ? messagesText(t, meta.labelKey) : meta.label || ''
}

export const ASSISTANT_SUGGESTION_KEYS = [
  'messages.assistant.suggestions.transfer',
  'messages.assistant.suggestions.publishListing',
  'messages.assistant.suggestions.parcel',
  'messages.assistant.suggestions.verify',
  'messages.assistant.suggestions.dispute',
  'messages.assistant.suggestions.admin',
  'messages.assistant.suggestions.business',
]
