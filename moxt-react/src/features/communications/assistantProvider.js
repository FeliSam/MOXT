// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function match(text, keywords) {
  return keywords.some((kw) => text.includes(kw))
}

// ─── Base de réponses par domaine ─────────────────────────────────────────────

const responses = {
  transfert: {
    actions: [
      { label: 'Nouveau transfert', path: '/transfers/new' },
      { label: 'Mes transferts', path: '/transfers' },
    ],
    suggestions: [
      "Quels sont les délais de traitement ?",
      "Comment envoyer ma preuve de paiement ?",
      "Quels sont les frais appliqués ?",
      "Quels pays sont couverts ?",
    ],
    texts: [
      `Pour effectuer un transfert, rendez-vous dans **Transferts** puis **Nouveau transfert**.\n\nVoici les étapes :\n- Choisissez la direction (Afrique → Russie ou Russie → Afrique)\n- Sélectionnez un changeur parmi ceux disponibles\n- Indiquez le montant et les coordonnées du destinataire\n- Confirmez et envoyez votre preuve de paiement dans les 30 minutes\n\nLe changeur valide ensuite et vous êtes notifié immédiatement.`,
      `Un transfert MOXT se fait en quelques étapes simples.\n\nDepuis **Nouveau transfert**, choisissez votre changeur, le montant et les informations du bénéficiaire. Une fois la demande créée, vous avez 30 minutes pour envoyer la preuve de paiement — passé ce délai, la demande expire.\n\nSuivez l'avancement en temps réel depuis **Mes transferts**.`,
    ],
  },

  preuve: {
    actions: [
      { label: 'Mes transferts', path: '/transfers' },
    ],
    suggestions: [
      "Que faire si ma preuve est rejetée ?",
      "Combien de temps pour la validation ?",
      "Comment ouvrir un litige ?",
    ],
    texts: [
      `Pour soumettre une preuve de paiement, ouvrez le transfert concerné depuis **Mes transferts** et appuyez sur **Déclarer le paiement**.\n\nJoignez une capture d'écran ou une photo claire du virement. Le changeur est notifié et procède à la validation dans les meilleurs délais.\n\nAssurez-vous que le montant, la date et le numéro de référence soient bien visibles sur le document.`,
    ],
  },

  taux: {
    actions: [
      { label: 'Nouveau transfert', path: '/transfers/new' },
      { label: 'Échange P2P', path: '/p2p' },
    ],
    suggestions: [
      "Comment créer un transfert ?",
      "Qu'est-ce que l'échange P2P ?",
      "Quels changeurs sont disponibles ?",
    ],
    texts: [
      `Les taux de change sur MOXT sont fixés par chaque changeur enregistré et mis à jour régulièrement. Ils couvrent les devises des pays africains partenaires (XOF, XAF, NGN, GHS, KES, RUB, etc.) vers le rouble russe, et inversement.\n\nLors de la création d'un transfert, le montant reçu par le destinataire est calculé automatiquement selon le taux du jour, avec les frais clairement affichés avant confirmation.\n\nVous pouvez comparer les offres de plusieurs changeurs pour choisir la plus avantageuse.`,
    ],
  },

  pays: {
    actions: [
      { label: 'Nouveau transfert', path: '/transfers/new' },
    ],
    suggestions: [
      "Comment créer un transfert ?",
      "Quels sont les frais ?",
      "Comment vérifier mon compte ?",
    ],
    texts: [
      `MOXT connecte la **Russie** avec les pays d'**Afrique subsaharienne francophone et anglophone**.\n\nParmi les pays d'origine couverts :\n- Afrique de l'Ouest : Bénin, Burkina Faso, Côte d'Ivoire, Sénégal, Mali, Niger, Togo, Ghana, Nigeria\n- Afrique centrale : Cameroun, Congo, R.D. Congo, Gabon, Tchad\n- Afrique de l'Est : Kenya, Rwanda, Ouganda, Tanzanie\n- Et d'autres pays africains\n\nLes transferts s'effectuent entre ces pays et la Russie, dans les deux sens.`,
    ],
  },

  delai: {
    actions: [
      { label: 'Mes transferts', path: '/transfers' },
    ],
    suggestions: [
      "Comment envoyer ma preuve de paiement ?",
      "Comment contacter mon changeur ?",
      "Comment ouvrir un litige ?",
    ],
    texts: [
      `Les délais de traitement dépendent du changeur sélectionné. Chaque fiche changeur indique son délai moyen habituel.\n\nDe manière générale :\n- Une fois la preuve de paiement soumise, le changeur la valide sous quelques minutes à quelques heures\n- Vous avez **30 minutes** après la création du transfert pour envoyer la preuve\n- En cas de dépassement, la demande expire automatiquement et vous devez en créer une nouvelle\n\nSi votre transfert prend trop de temps, vous pouvez contacter le changeur directement via la messagerie.`,
    ],
  },

  frais: {
    actions: [
      { label: 'Nouveau transfert', path: '/transfers/new' },
    ],
    suggestions: [
      "Comment créer un transfert ?",
      "Quels sont les taux de change ?",
      "Comment vérifier mon compte pour des plafonds plus élevés ?",
    ],
    texts: [
      `Les frais de service MOXT sont transparents et affichés avant confirmation de chaque transfert.\n\nIls comprennent :\n- Un **pourcentage de service** fixé par le changeur (affiché sur sa fiche)\n- Une **marge de change** appliquée au taux du jour\n\nLe montant exact que recevra votre destinataire est toujours calculé et affiché avant que vous confirmiez l'opération. Aucune surprise après la validation.`,
    ],
  },

  colis: {
    actions: [
      { label: 'Voir les trajets', path: '/parcels' },
      { label: 'Publier un trajet', path: '/parcels/publish' },
    ],
    suggestions: [
      "Quel est le prix au kilo ?",
      "Comment contacter un voyageur ?",
      "Quels types d'articles sont acceptés ?",
      "Comment publier mon propre trajet ?",
    ],
    texts: [
      `Le service colis MOXT met en relation des expéditeurs avec des voyageurs disposant de capacité dans leurs bagages, sur des trajets entre la Russie et les pays africains.\n\n**Pour envoyer un colis :**\n- Consultez les trajets disponibles dans **Colis**\n- Choisissez un voyageur selon la date, le poids disponible et le tarif\n- Envoyez une demande de réservation avec les détails de votre envoi\n\n**Pour proposer un trajet :**\n- Publiez votre trajet avec le poids disponible, le prix au kilo et les types d'articles acceptés\n- Acceptez les demandes reçues et coordonnez la remise avec l'expéditeur.`,
      `La rubrique **Colis** vous permet de transporter ou d'envoyer des articles entre la Russie et l'Afrique via des voyageurs particuliers.\n\nChaque trajet publié indique la date de départ, la capacité restante, le tarif au kilo et les restrictions éventuelles. La mise en relation se fait directement sur la plateforme, sans intermédiaire.`,
    ],
  },

  marketplace: {
    actions: [
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'Publier une annonce', path: '/listings/new' },
    ],
    suggestions: [
      "Comment contacter un vendeur ?",
      "Comment gérer mes annonces ?",
      "Comment signaler une annonce ?",
    ],
    texts: [
      `Le marketplace MOXT vous permet d'acheter et de vendre des articles au sein de la communauté afro-russe.\n\n**Pour publier une annonce :**\n- Allez dans **Marketplace** puis **Publier une annonce**\n- Renseignez le titre, la description, le prix et les photos\n- Précisez si vous livrez ou si c'est à retirer\n\nVos annonces restent actives jusqu'à ce que vous les clôturiez ou que l'article soit vendu.`,
      `Depuis **Marketplace**, parcourez les annonces, filtrez par catégorie ou localisation, et contactez directement le vendeur via la messagerie intégrée.\n\nPour mettre un article en vente, utilisez **Publier une annonce**. Le formulaire vous guide : type de produit, état, prix et options de remise.`,
    ],
  },

  emploi: {
    actions: [
      { label: "Offres d'emploi", path: '/jobs' },
      { label: 'Publier un poste', path: '/jobs/publish' },
    ],
    suggestions: [
      "Comment postuler à une offre ?",
      "Comment suivre mes candidatures ?",
      "Comment publier une offre d'emploi ?",
    ],
    texts: [
      `La section **Jobs** centralise les offres de la communauté afro-russe : missions ponctuelles, CDI, freelance, et bien plus.\n\n**Pour postuler :**\n- Ouvrez une offre et lisez les exigences\n- Cliquez sur **Postuler** et rédigez un message personnalisé\n- Suivez l'état de votre candidature depuis votre espace\n\n**Pour recruter :**\n- Publiez votre offre avec le type de contrat, la rémunération et les compétences attendues\n- Gérez les candidatures reçues directement depuis la fiche du poste.`,
    ],
  },

  evenement: {
    actions: [
      { label: 'Événements', path: '/events' },
      { label: 'Publier un événement', path: '/events/publish' },
    ],
    suggestions: [
      "Comment s'inscrire à un événement ?",
      "Comment annuler mon inscription ?",
      "Comment organiser un événement ?",
    ],
    texts: [
      `La page **Événements** regroupe les rencontres, conférences, soirées et ateliers organisés au sein de la communauté afro-russe.\n\nPour vous inscrire, ouvrez la fiche et cliquez sur **S'inscrire**. Vous recevez une confirmation et un rappel avant la date.\n\nPour organiser un événement, utilisez **Publier un événement** et renseignez le lieu, la date, la capacité et toutes les informations pratiques.`,
    ],
  },

  entreprise: {
    actions: [
      { label: 'Annuaire des entreprises', path: '/businesses' },
      { label: 'Créer un profil entreprise', path: '/business/setup' },
    ],
    suggestions: [
      "Comment trouver un changeur fiable ?",
      "Comment lire les avis clients ?",
      "Comment référencer mon activité ?",
    ],
    texts: [
      `L'annuaire **Entreprises** répertorie les changeurs, prestataires et sociétés actifs au sein de la communauté afro-russe en Russie.\n\nVous pouvez consulter les fiches, lire les avis clients, comparer les taux et les délais, puis contacter directement via la messagerie intégrée.\n\nPour référencer votre propre activité, rendez-vous dans **Créer un profil entreprise**. Une fois validé, votre fiche sera visible de toute la communauté.`,
    ],
  },

  verification: {
    actions: [
      { label: 'Vérifier mon identité', path: '/verification' },
      { label: 'Mes documents', path: '/documents' },
    ],
    suggestions: [
      "Quels documents sont acceptés ?",
      "Combien de temps prend la validation ?",
      "Quels avantages après vérification ?",
    ],
    texts: [
      `La vérification d'identité sur MOXT se fait depuis la rubrique **Vérification** en quelques étapes.\n\n**Niveau standard :**\n- Pièce d'identité valide (passeport, carte de séjour russe, carte consulaire)\n- Selfie de confirmation avec le document\n- Validation de votre numéro de téléphone par SMS\n\n**Niveau renforcé :**\n- Tout ce qui précède, plus un justificatif de domicile récent (enregistrement migratoire, bail)\n\nUne fois le dossier soumis, notre équipe le traite sous 24 à 48 heures. La vérification débloque des plafonds de transfert plus élevés.`,
    ],
  },

  p2p: {
    actions: [
      { label: 'Échange P2P', path: '/p2p' },
    ],
    suggestions: [
      "Quelles devises sont disponibles ?",
      "Comment sécuriser ma transaction P2P ?",
      "Quelle différence avec un transfert classique ?",
    ],
    texts: [
      `L'échange **P2P** (pair à pair) vous permet d'acheter ou de vendre des devises directement avec d'autres membres de la communauté.\n\nParcourez les offres disponibles, filtrez par devise et méthode de paiement, puis sélectionnez celle qui correspond à vos besoins. La transaction est encadrée par MOXT pour garantir la sécurité des deux parties.\n\nVous pouvez aussi publier votre propre offre si vous souhaitez vendre des devises à un taux que vous définissez.`,
    ],
  },

  litige: {
    actions: [
      { label: 'Mes litiges', path: '/disputes' },
      { label: 'Support', path: '/support' },
    ],
    suggestions: [
      "Quels justificatifs joindre à mon dossier ?",
      "Quel est le délai de traitement ?",
      "Comment contacter le support directement ?",
    ],
    texts: [
      `En cas de problème avec un transfert, un colis ou une transaction, ouvrez un litige depuis **Mes litiges**.\n\nPour cela :\n- Sélectionnez l'opération concernée\n- Décrivez le problème avec précision\n- Joignez les preuves disponibles (captures d'écran, reçus, photos)\n\nNotre équipe intervient dans un délai de 24 à 72 heures. Toutes les parties sont informées de l'avancement du dossier jusqu'à sa résolution.`,
    ],
  },

  compte: {
    actions: [
      { label: 'Mon profil', path: '/profile' },
      { label: 'Informations personnelles', path: '/profile/personal-information' },
    ],
    suggestions: [
      "Comment changer ma photo de profil ?",
      "Comment vérifier mon identité ?",
      "Comment gérer mes profils de transfert ?",
    ],
    texts: [
      `Votre espace **Profil** centralise toutes les informations de votre compte MOXT.\n\nVous pouvez y :\n- Modifier vos informations personnelles (nom, téléphone, ville)\n- Mettre à jour votre photo de profil\n- Consulter votre niveau de vérification\n- Gérer vos documents et vos profils de transfert enregistrés\n\nNous vous recommandons de maintenir vos coordonnées à jour pour une expérience optimale.`,
    ],
  },

  recu: {
    actions: [
      { label: 'Mes transferts', path: '/transfers' },
      { label: 'Finances', path: '/finance' },
    ],
    suggestions: [
      "Comment télécharger un reçu ?",
      "Comment contester un transfert ?",
      "Où voir mon historique complet ?",
    ],
    texts: [
      `Les reçus de vos transferts sont disponibles directement depuis chaque opération dans **Mes transferts**.\n\nChaque reçu contient :\n- Le montant envoyé et le montant reçu\n- Le taux de change appliqué\n- Les informations du changeur\n- La chronologie complète du traitement\n\nVous pouvez le consulter ou le partager directement depuis l'application.`,
    ],
  },

  finance: {
    actions: [
      { label: 'Finances', path: '/finance' },
    ],
    suggestions: [
      "Comment lire mon historique de paiements ?",
      "Où voir mes transferts ?",
      "Comment vérifier mon solde ?",
    ],
    texts: [
      `La section **Finances** vous donne une vue d'ensemble de votre activité sur MOXT : historique des paiements, solde du portefeuille et récapitulatif des opérations.\n\nChaque mouvement est enregistré avec la date, le statut et le détail de l'opération. C'est l'espace idéal pour suivre vos dépenses et vos transferts sur une période donnée.`,
    ],
  },

  message: {
    actions: [
      { label: 'Messagerie', path: '/messages' },
    ],
    suggestions: [
      "Comment contacter un changeur ?",
      "Comment contacter le support ?",
      "Comment retrouver une conversation archivée ?",
    ],
    texts: [
      `La messagerie MOXT vous permet d'échanger directement avec les autres membres, les changeurs et les prestataires.\n\nChaque conversation est liée à une opération ou une fiche professionnelle, ce qui facilite la recherche du contexte. Vous pouvez aussi contacter le support depuis cette interface pour toute demande d'assistance.`,
    ],
  },

  fallback: {
    actions: [
      { label: 'Découvrir MOXT', path: '/discover' },
      { label: 'Contacter le support', path: '/support' },
    ],
    suggestions: [
      "Comment effectuer un transfert ?",
      "Comment envoyer un colis ?",
      "Comment vérifier mon identité ?",
      "Quels pays sont couverts ?",
    ],
    texts: [
      `Bonjour ! Je suis Moxi, votre assistante MOXT. Je peux vous renseigner sur :\n\n- **Transferts** — envoyer de l'argent entre la Russie et l'Afrique\n- **Colis** — expédier des articles via des voyageurs\n- **Marketplace** — acheter et vendre au sein de la communauté\n- **Jobs & Événements** — postuler ou organiser des rencontres\n- **Entreprises** — trouver un changeur ou référencer votre activité\n- **Vérification** — débloquer des plafonds de transfert plus élevés\n- **Litiges & Support** — obtenir de l'aide en cas de problème\n\nQuelle est votre question ?`,
      `Je suis là pour vous guider sur la plateforme MOXT, qui connecte la **Russie** et les **pays d'Afrique subsaharienne**.\n\nDites-moi ce que vous cherchez — transfert, colis, annonce, emploi ou autre — et je vous oriente vers la bonne section avec toutes les informations utiles.`,
    ],
  },
}

// ─── Détection par mots-clés ──────────────────────────────────────────────────

function detectDomain(text) {
  if (match(text, ['preuve', 'paiement déclaré', 'déclarer paiement', 'justificatif de paiement'])) return 'preuve'
  if (match(text, ['quel pays', 'pays couvert', 'pays disponible', 'afrique', 'bénin', 'togo', 'sénégal', 'cameroun', 'nigeria', 'côte d'])) return 'pays'
  if (match(text, ['délai', 'combien de temps', 'durée', 'rapide', 'temps de traitement'])) return 'delai'
  if (match(text, ['frais', 'commission', 'coût', 'combien ça coûte', 'tarif', 'combien prend'])) return 'frais'
  if (match(text, ['taux', 'change', 'cours', 'conversion', 'combien reçoi'])) return 'taux'
  if (match(text, ['transfert', "envoyer de l'argent", 'envoyer argent', 'virement', 'mandat', 'envoyer de l'])) return 'transfert'
  if (match(text, ['colis', 'trajet', 'bagage', 'voyageur', 'expédier', 'kilo', 'kg', 'transporter'])) return 'colis'
  if (match(text, ['annonce', 'marketplace', 'vendre', 'acheter', 'article', 'produit', 'vente'])) return 'marketplace'
  if (match(text, ['emploi', 'job', 'travail', 'poste', 'recruter', 'candidature', "offre d'emploi", 'recrut'])) return 'emploi'
  if (match(text, ['événement', 'evenement', 'soirée', 'conférence', 'atelier', 'rencontre', 'inscription'])) return 'evenement'
  if (match(text, ['entreprise', 'société', 'prestataire', 'changeur', 'professionnel', 'annuaire', 'business'])) return 'entreprise'
  if (match(text, ['vérification', 'vérifier', 'identité', 'kyc', 'document', "pièce d'identité", 'selfie', 'valider mon'])) return 'verification'
  if (match(text, ['p2p', 'pair à pair', 'devise', 'acheter des euros', 'vendre des roubles', 'pair-à-pair'])) return 'p2p'
  if (match(text, ['litige', 'réclamation', 'problème', 'plainte', 'conflit', 'remboursement', 'signaler', 'contestation'])) return 'litige'
  if (match(text, ['profil', 'compte', 'modifier', 'photo', 'avatar', 'paramètre', 'informations personnelles'])) return 'compte'
  if (match(text, ['reçu', 'historique', 'facture', 'preuve de transfert', 'archive'])) return 'recu'
  if (match(text, ['finance', 'portefeuille', 'wallet', 'solde', 'dépenses', 'bilan'])) return 'finance'
  if (match(text, ['message', 'messagerie', 'chat', 'conversation', 'contacter'])) return 'message'
  return 'fallback'
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const localAssistantProvider = {
  async respond({ question, searchIndex }) {
    const normalized = question.toLocaleLowerCase('fr')

    const entityMatches = searchIndex
      .filter((item) => {
        const haystack = `${item.title} ${item.subtitle} ${item.typeLabel}`.toLocaleLowerCase('fr')
        return normalized.split(/\s+/).some((word) => word.length > 3 && haystack.includes(word))
      })
      .slice(0, 3)

    const domain = detectDomain(normalized)
    const { texts, actions, suggestions } = responses[domain]
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
