/**
 * Builds top-level `assistant` locale trees and injects them into
 * packages/shared/src/i18n/locales/{fr,en,ru,pt}.js
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const localesDir = path.join(root, 'packages/shared/src/i18n/locales')

/** @typedef {{ actions: string[], suggestions: string[], texts: string[] }} DomainCopy */

/** @type {Record<string, DomainCopy>} */
const fr = {
  transfert: {
    actions: ['Nouveau transfert', 'Mes transferts'],
    suggestions: [
      'Quels sont les délais de traitement ?',
      'Comment envoyer ma preuve de paiement ?',
      'Quels sont les frais appliqués ?',
      'Quels pays sont couverts ?',
    ],
    texts: [
      `Pour effectuer un transfert, rendez-vous dans **Transferts** puis **Nouveau transfert**.\n\nVoici les étapes :\n- Choisissez la direction (Afrique → Russie ou Russie → Afrique)\n- Sélectionnez un changeur parmi ceux disponibles\n- Indiquez le montant et les coordonnées du destinataire\n- Confirmez et envoyez votre preuve de paiement dans les 30 minutes\n\nLe changeur valide ensuite et vous êtes notifié immédiatement.`,
      `Un transfert MOXT se fait en quelques étapes simples.\n\nDepuis **Nouveau transfert**, choisissez votre changeur, le montant et les informations du bénéficiaire. Une fois la demande créée, vous avez 30 minutes pour envoyer la preuve de paiement — passé ce délai, la demande expire.\n\nSuivez l'avancement en temps réel depuis **Mes transferts**.`,
    ],
  },
  preuve: {
    actions: ['Mes transferts'],
    suggestions: [
      'Que faire si ma preuve est rejetée ?',
      'Combien de temps pour la validation ?',
      'Comment ouvrir un litige ?',
    ],
    texts: [
      `Pour soumettre une preuve de paiement, ouvrez le transfert concerné depuis **Mes transferts** et appuyez sur **Déclarer le paiement**.\n\nJoignez une capture d'écran ou une photo claire du virement. Le changeur est notifié et procède à la validation dans les meilleurs délais.\n\nAssurez-vous que le montant, la date et le numéro de référence soient bien visibles sur le document.`,
    ],
  },
  taux: {
    actions: ['Nouveau transfert', 'Échange P2P'],
    suggestions: [
      'Comment créer un transfert ?',
      "Qu'est-ce que l'échange P2P ?",
      'Quels changeurs sont disponibles ?',
    ],
    texts: [
      `Les taux de change sur MOXT sont fixés par chaque changeur enregistré et mis à jour régulièrement. Ils couvrent les devises des pays africains partenaires (XOF, XAF, NGN, GHS, KES, RUB, etc.) vers le rouble russe, et inversement.\n\nLors de la création d'un transfert, le montant reçu par le destinataire est calculé automatiquement selon le taux du jour, avec les frais clairement affichés avant confirmation.\n\nVous pouvez comparer les offres de plusieurs changeurs pour choisir la plus avantageuse.`,
    ],
  },
  pays: {
    actions: ['Nouveau transfert'],
    suggestions: [
      'Comment créer un transfert ?',
      'Quels sont les frais ?',
      'Comment vérifier mon compte ?',
    ],
    texts: [
      `MOXT connecte la **Russie** avec les pays d'**Afrique subsaharienne francophone et anglophone**.\n\nParmi les pays d'origine couverts :\n- Afrique de l'Ouest : Bénin, Burkina Faso, Côte d'Ivoire, Sénégal, Mali, Niger, Togo, Ghana, Nigeria\n- Afrique centrale : Cameroun, Congo, R.D. Congo, Gabon, Tchad\n- Afrique de l'Est : Kenya, Rwanda, Ouganda, Tanzanie\n- Et d'autres pays africains\n\nLes transferts s'effectuent entre ces pays et la Russie, dans les deux sens.`,
    ],
  },
  delai: {
    actions: ['Mes transferts'],
    suggestions: [
      'Comment envoyer ma preuve de paiement ?',
      'Comment contacter mon changeur ?',
      'Comment ouvrir un litige ?',
    ],
    texts: [
      `Les délais de traitement dépendent du changeur sélectionné. Chaque fiche changeur indique son délai moyen habituel.\n\nDe manière générale :\n- Une fois la preuve de paiement soumise, le changeur la valide sous quelques minutes à quelques heures\n- Vous avez **30 minutes** après la création du transfert pour envoyer la preuve\n- En cas de dépassement, la demande expire automatiquement et vous devez en créer une nouvelle\n\nSi votre transfert prend trop de temps, vous pouvez contacter le changeur directement via la messagerie.`,
    ],
  },
  frais: {
    actions: ['Nouveau transfert'],
    suggestions: [
      'Comment créer un transfert ?',
      'Quels sont les taux de change ?',
      'Comment vérifier mon compte pour des plafonds plus élevés ?',
    ],
    texts: [
      `Les frais de service MOXT sont transparents et affichés avant confirmation de chaque transfert.\n\nIls comprennent :\n- Un **pourcentage de service** fixé par le changeur (affiché sur sa fiche)\n- Une **marge de change** appliquée au taux du jour\n\nLe montant exact que recevra votre destinataire est toujours calculé et affiché avant que vous confirmiez l'opération. Aucune surprise après la validation.`,
    ],
  },
  colis: {
    actions: ['Voir les trajets', 'Publier un trajet'],
    suggestions: [
      'Quel est le prix au kilo ?',
      'Comment contacter un voyageur ?',
      "Quels types d'articles sont acceptés ?",
      'Comment publier mon propre trajet ?',
    ],
    texts: [
      `Le service colis MOXT met en relation des expéditeurs avec des voyageurs disposant de capacité dans leurs bagages, sur des trajets entre la Russie et les pays africains.\n\n**Pour envoyer un colis :**\n- Consultez les trajets disponibles dans **Colis**\n- Choisissez un voyageur selon la date, le poids disponible et le tarif\n- Envoyez une demande de réservation avec les détails de votre envoi\n\n**Pour proposer un trajet :**\n- Publiez votre trajet avec le poids disponible, le prix au kilo et les types d'articles acceptés\n- Acceptez les demandes reçues et coordonnez la remise avec l'expéditeur.`,
      `La rubrique **Colis** vous permet de transporter ou d'envoyer des articles entre la Russie et l'Afrique via des voyageurs particuliers.\n\nChaque trajet publié indique la date de départ, la capacité restante, le tarif au kilo et les restrictions éventuelles. La mise en relation se fait directement sur la plateforme, sans intermédiaire.`,
    ],
  },
  marketplace: {
    actions: ['Marketplace', 'Publier une annonce'],
    suggestions: [
      'Comment contacter un vendeur ?',
      'Comment gérer mes annonces ?',
      'Comment signaler une annonce ?',
    ],
    texts: [
      `Le marketplace MOXT vous permet d'acheter et de vendre des articles au sein de la communauté afro-russe.\n\n**Pour publier une annonce :**\n- Allez dans **Marketplace** puis **Publier une annonce**\n- Renseignez le titre, la description, le prix et les photos\n- Précisez si vous livrez ou si c'est à retirer\n\nVos annonces restent actives jusqu'à ce que vous les clôturiez ou que l'article soit vendu.`,
      `Depuis **Marketplace**, parcourez les annonces, filtrez par catégorie ou localisation, et contactez directement le vendeur via la messagerie intégrée.\n\nPour mettre un article en vente, utilisez **Publier une annonce**. Le formulaire vous guide : type de produit, état, prix et options de remise.`,
    ],
  },
  emploi: {
    actions: ["Offres d'emploi", 'Publier un poste'],
    suggestions: [
      'Comment postuler à une offre ?',
      'Comment suivre mes candidatures ?',
      "Comment publier une offre d'emploi ?",
    ],
    texts: [
      `La section **Jobs** centralise les offres de la communauté afro-russe : missions ponctuelles, CDI, freelance, et bien plus.\n\n**Pour postuler :**\n- Ouvrez une offre et lisez les exigences\n- Cliquez sur **Postuler** et rédigez un message personnalisé\n- Suivez l'état de votre candidature depuis votre espace\n\n**Pour recruter :**\n- Publiez votre offre avec le type de contrat, la rémunération et les compétences attendues\n- Gérez les candidatures reçues directement depuis la fiche du poste.`,
    ],
  },
  evenement: {
    actions: ['Événements', 'Publier un événement'],
    suggestions: [
      "Comment s'inscrire à un événement ?",
      'Comment annuler mon inscription ?',
      'Comment organiser un événement ?',
    ],
    texts: [
      `La page **Événements** regroupe les rencontres, conférences, soirées et ateliers organisés au sein de la communauté afro-russe.\n\nPour vous inscrire, ouvrez la fiche et cliquez sur **S'inscrire**. Vous recevez une confirmation et un rappel avant la date.\n\nPour organiser un événement, utilisez **Publier un événement** et renseignez le lieu, la date, la capacité et toutes les informations pratiques.`,
    ],
  },
  entreprise: {
    actions: ['Annuaire des entreprises', 'Créer un profil entreprise'],
    suggestions: [
      'Comment trouver un changeur fiable ?',
      'Comment lire les avis clients ?',
      'Comment référencer mon activité ?',
    ],
    texts: [
      `L'annuaire **Entreprises** répertorie les changeurs, prestataires et sociétés actifs au sein de la communauté afro-russe en Russie.\n\nVous pouvez consulter les fiches, lire les avis clients, comparer les taux et les délais, puis contacter directement via la messagerie intégrée.\n\nPour référencer votre propre activité, rendez-vous dans **Créer un profil entreprise**. Une fois validé, votre fiche sera visible de toute la communauté.`,
    ],
  },
  verification: {
    actions: ['Vérifier mon identité', 'Mes documents'],
    suggestions: [
      'Quels documents sont acceptés ?',
      'Combien de temps prend la validation ?',
      'Quels avantages après vérification ?',
    ],
    texts: [
      `MOXT applique **trois niveaux de vérification** :\n\n**1. Téléphone russe (+7)** — obligatoire pour publier une annonce, un colis, un job ou un événement. Un numéro unique par compte, confirmé par SMS. Si vous vous êtes inscrit par e-mail, confirmez votre numéro depuis **Profil** ou **Vérification**.\n\n**2. Identité MOXT** — pièce d'identité + selfie. Requis pour créer une entreprise et utiliser les comptes de transfert.\n\n**3. Renforcée** — identité + justificatif de domicile pour des plafonds de transfert plus élevés.\n\nLa **messagerie** et les interactions sociales restent accessibles sans vérification renforcée.\n\nSi un dossier est en attente plus de 24 h, contactez l'administrateur via **Support**.`,
      `La vérification d'identité sur MOXT se fait depuis la rubrique **Vérification**.\n\n**Avant de publier** : confirmez votre numéro russe par OTP (niveau 1).\n\n**Niveau identité** : passeport, carte de séjour russe ou carte consulaire + selfie.\n\n**Niveau renforcé** : + justificatif de domicile récent en Russie.\n\nChangement de numéro : une nouvelle confirmation SMS est demandée.`,
    ],
  },
  p2p: {
    actions: ['Échange P2P', 'Proposer une offre'],
    suggestions: [
      'Quelles devises sont disponibles ?',
      'Comment sécuriser ma transaction P2P ?',
      'Quelle différence avec un transfert classique ?',
    ],
    texts: [
      `L'échange **P2P** (pair à pair) vous permet d'acheter ou de vendre des devises directement avec d'autres membres de la communauté.\n\nParcourez les offres disponibles, filtrez par devise et méthode de paiement, puis sélectionnez celle qui correspond à vos besoins. La transaction est encadrée par MOXT pour garantir la sécurité des deux parties.\n\nVous pouvez aussi publier votre propre offre si vous souhaitez vendre des devises à un taux que vous définissez.`,
    ],
  },
  litige: {
    actions: ['Mes litiges', 'Support'],
    suggestions: [
      'Quels justificatifs joindre à mon dossier ?',
      'Quel est le délai de traitement ?',
      'Comment contacter le support directement ?',
    ],
    texts: [
      `En cas de problème avec un transfert, un colis ou une transaction, ouvrez un litige depuis **Mes litiges**.\n\nPour cela :\n- Sélectionnez l'opération concernée\n- Décrivez le problème avec précision\n- Joignez les preuves disponibles (captures d'écran, reçus, photos)\n\nNotre équipe intervient dans un délai de 24 à 72 heures. Toutes les parties sont informées de l'avancement du dossier jusqu'à sa résolution.`,
    ],
  },
  compte: {
    actions: ['Mon profil', 'Informations personnelles'],
    suggestions: [
      'Comment changer ma photo de profil ?',
      'Comment vérifier mon identité ?',
      'Comment gérer mes profils de transfert ?',
    ],
    texts: [
      `Votre espace **Profil** centralise toutes les informations de votre compte MOXT.\n\nVous pouvez y :\n- Modifier vos informations personnelles (nom, téléphone, ville)\n- Mettre à jour votre photo de profil\n- Consulter votre niveau de vérification\n- Gérer vos documents et vos profils de transfert enregistrés\n\nNous vous recommandons de maintenir vos coordonnées à jour pour une expérience optimale.`,
    ],
  },
  recu: {
    actions: ['Mes transferts', 'Finances'],
    suggestions: [
      'Comment télécharger un reçu ?',
      'Comment contester un transfert ?',
      'Où voir mon historique complet ?',
    ],
    texts: [
      `Les reçus de vos transferts sont disponibles directement depuis chaque opération dans **Mes transferts**.\n\nChaque reçu contient :\n- Le montant envoyé et le montant reçu\n- Le taux de change appliqué\n- Les informations du changeur\n- La chronologie complète du traitement\n\nVous pouvez le consulter ou le partager directement depuis l'application.`,
    ],
  },
  finance: {
    actions: ['Finances'],
    suggestions: [
      'Comment lire mon historique de paiements ?',
      'Où voir mes transferts ?',
      'Comment vérifier mon solde ?',
    ],
    texts: [
      `La section **Finances** vous donne une vue d'ensemble de votre activité sur MOXT : historique des paiements, solde du portefeuille et récapitulatif des opérations.\n\nChaque mouvement est enregistré avec la date, le statut et le détail de l'opération. C'est l'espace idéal pour suivre vos dépenses et vos transferts sur une période donnée.`,
    ],
  },
  message: {
    actions: ['Messagerie'],
    suggestions: [
      'Comment contacter un changeur ?',
      'Comment contacter le support ?',
      'Comment retrouver une conversation archivée ?',
    ],
    texts: [
      `La messagerie MOXT vous permet d'échanger directement avec les autres membres, les changeurs et les prestataires.\n\nChaque conversation est liée à une opération ou une fiche professionnelle, ce qui facilite la recherche du contexte. Vous pouvez aussi contacter le support depuis cette interface pour toute demande d'assistance.`,
    ],
  },
  fallback: {
    actions: ['Découvrir MOXT', 'Contacter le support'],
    suggestions: [
      'Comment effectuer un transfert ?',
      'Comment envoyer un colis ?',
      'Comment vérifier mon identité ?',
      'Quels pays sont couverts ?',
    ],
    texts: [
      `Bonjour ! Je suis Moxi, votre assistante MOXT. Je peux vous renseigner sur :\n\n- **Transferts** — envoyer de l'argent entre la Russie et l'Afrique\n- **Colis** — expédier des articles via des voyageurs\n- **Marketplace** — acheter et vendre au sein de la communauté\n- **Jobs & Événements** — postuler ou organiser des rencontres\n- **Entreprises** — trouver un changeur ou référencer votre activité\n- **Vérification** — débloquer des plafonds de transfert plus élevés\n- **Litiges & Support** — obtenir de l'aide en cas de problème\n\nQuelle est votre question ?`,
      `Je suis là pour vous guider sur la plateforme MOXT, qui connecte la **Russie** et les **pays d'Afrique subsaharienne**.\n\nDites-moi ce que vous cherchez — transfert, colis, annonce, emploi ou autre — et je vous oriente vers la bonne section avec toutes les informations utiles.`,
    ],
  },
}

/** @type {Record<string, DomainCopy>} */
const en = {
  transfert: {
    actions: ['New transfer', 'My transfers'],
    suggestions: [
      'What are the processing times?',
      'How do I send my payment proof?',
      'What fees apply?',
      'Which countries are covered?',
    ],
    texts: [
      `To make a transfer, go to **Transfers** then **New transfer**.\n\nHere are the steps:\n- Choose the direction (Africa → Russia or Russia → Africa)\n- Select an exchanger from those available\n- Enter the amount and the recipient’s details\n- Confirm and send your payment proof within 30 minutes\n\nThe exchanger then validates it and you are notified immediately.`,
      `A MOXT transfer takes just a few simple steps.\n\nFrom **New transfer**, choose your exchanger, the amount, and the beneficiary details. Once the request is created, you have 30 minutes to send the payment proof — after that, the request expires.\n\nTrack progress in real time from **My transfers**.`,
    ],
  },
  preuve: {
    actions: ['My transfers'],
    suggestions: [
      'What if my proof is rejected?',
      'How long does validation take?',
      'How do I open a dispute?',
    ],
    texts: [
      `To submit a payment proof, open the relevant transfer from **My transfers** and tap **Declare payment**.\n\nAttach a clear screenshot or photo of the transfer. The exchanger is notified and validates it as soon as possible.\n\nMake sure the amount, date, and reference number are clearly visible on the document.`,
    ],
  },
  taux: {
    actions: ['New transfer', 'P2P exchange'],
    suggestions: [
      'How do I create a transfer?',
      'What is P2P exchange?',
      'Which exchangers are available?',
    ],
    texts: [
      `Exchange rates on MOXT are set by each registered exchanger and updated regularly. They cover partner African currencies (XOF, XAF, NGN, GHS, KES, RUB, etc.) to the Russian ruble, and the reverse.\n\nWhen you create a transfer, the amount the recipient will receive is calculated automatically at the day’s rate, with fees clearly shown before confirmation.\n\nYou can compare offers from several exchangers to pick the best one.`,
    ],
  },
  pays: {
    actions: ['New transfer'],
    suggestions: [
      'How do I create a transfer?',
      'What are the fees?',
      'How do I verify my account?',
    ],
    texts: [
      `MOXT connects **Russia** with **Francophone and Anglophone sub-Saharan African** countries.\n\nCovered origin countries include:\n- West Africa: Benin, Burkina Faso, Côte d'Ivoire, Senegal, Mali, Niger, Togo, Ghana, Nigeria\n- Central Africa: Cameroon, Congo, D.R. Congo, Gabon, Chad\n- East Africa: Kenya, Rwanda, Uganda, Tanzania\n- And other African countries\n\nTransfers run between these countries and Russia, in both directions.`,
    ],
  },
  delai: {
    actions: ['My transfers'],
    suggestions: [
      'How do I send my payment proof?',
      'How do I contact my exchanger?',
      'How do I open a dispute?',
    ],
    texts: [
      `Processing times depend on the selected exchanger. Each exchanger profile shows their usual average time.\n\nIn general:\n- Once payment proof is submitted, the exchanger validates it within minutes to a few hours\n- You have **30 minutes** after creating the transfer to send the proof\n- If you miss the deadline, the request expires automatically and you must create a new one\n\nIf your transfer takes too long, you can contact the exchanger directly via messaging.`,
    ],
  },
  frais: {
    actions: ['New transfer'],
    suggestions: [
      'How do I create a transfer?',
      'What are the exchange rates?',
      'How do I verify my account for higher limits?',
    ],
    texts: [
      `MOXT service fees are transparent and shown before you confirm each transfer.\n\nThey include:\n- A **service percentage** set by the exchanger (shown on their profile)\n- An **exchange margin** applied to the day’s rate\n\nThe exact amount your recipient will get is always calculated and displayed before you confirm. No surprises after validation.`,
    ],
  },
  colis: {
    actions: ['View trips', 'Publish a trip'],
    suggestions: [
      'What is the price per kilo?',
      'How do I contact a traveler?',
      'What types of items are accepted?',
      'How do I publish my own trip?',
    ],
    texts: [
      `MOXT’s parcel service matches senders with travelers who have spare luggage capacity on routes between Russia and African countries.\n\n**To send a parcel:**\n- Browse available trips in **Parcels**\n- Choose a traveler by date, available weight, and rate\n- Send a booking request with your shipment details\n\n**To offer a trip:**\n- Publish your trip with available weight, price per kilo, and accepted item types\n- Accept incoming requests and coordinate handover with the sender.`,
      `The **Parcels** section lets you carry or send items between Russia and Africa via private travelers.\n\nEach published trip shows departure date, remaining capacity, price per kilo, and any restrictions. Matching happens directly on the platform, with no middleman.`,
    ],
  },
  marketplace: {
    actions: ['Marketplace', 'Post a listing'],
    suggestions: [
      'How do I contact a seller?',
      'How do I manage my listings?',
      'How do I report a listing?',
    ],
    texts: [
      `The MOXT marketplace lets you buy and sell items within the Afro-Russian community.\n\n**To post a listing:**\n- Go to **Marketplace** then **Post a listing**\n- Enter the title, description, price, and photos\n- Specify whether you deliver or if it’s pickup only\n\nYour listings stay active until you close them or the item is sold.`,
      `From **Marketplace**, browse listings, filter by category or location, and contact the seller directly via built-in messaging.\n\nTo list an item for sale, use **Post a listing**. The form guides you: product type, condition, price, and handover options.`,
    ],
  },
  emploi: {
    actions: ['Job offers', 'Post a job'],
    suggestions: [
      'How do I apply to a job?',
      'How do I track my applications?',
      'How do I post a job offer?',
    ],
    texts: [
      `The **Jobs** section gathers offers from the Afro-Russian community: short assignments, permanent roles, freelance, and more.\n\n**To apply:**\n- Open an offer and read the requirements\n- Tap **Apply** and write a personalized message\n- Track your application status from your space\n\n**To hire:**\n- Publish your offer with contract type, pay, and expected skills\n- Manage applications directly from the job page.`,
    ],
  },
  evenement: {
    actions: ['Events', 'Publish an event'],
    suggestions: [
      'How do I register for an event?',
      'How do I cancel my registration?',
      'How do I organize an event?',
    ],
    texts: [
      `The **Events** page lists meetups, conferences, parties, and workshops in the Afro-Russian community.\n\nTo register, open the event and tap **Register**. You get a confirmation and a reminder before the date.\n\nTo organize an event, use **Publish an event** and enter the venue, date, capacity, and practical details.`,
    ],
  },
  entreprise: {
    actions: ['Business directory', 'Create a business profile'],
    suggestions: [
      'How do I find a reliable exchanger?',
      'How do I read customer reviews?',
      'How do I list my business?',
    ],
    texts: [
      `The **Businesses** directory lists exchangers, providers, and companies active in the Afro-Russian community in Russia.\n\nYou can browse profiles, read reviews, compare rates and timelines, then contact them via built-in messaging.\n\nTo list your own business, go to **Create a business profile**. Once approved, your page is visible to the whole community.`,
    ],
  },
  verification: {
    actions: ['Verify my identity', 'My documents'],
    suggestions: [
      'Which documents are accepted?',
      'How long does validation take?',
      'What are the benefits after verification?',
    ],
    texts: [
      `MOXT uses **three verification levels**:\n\n**1. Russian phone (+7)** — required to publish a listing, parcel, job, or event. One unique number per account, confirmed by SMS. If you signed up by email, confirm your number from **Profile** or **Verification**.\n\n**2. MOXT identity** — ID document + selfie. Required to create a business and use transfer accounts.\n\n**3. Enhanced** — identity + proof of address for higher transfer limits.\n\n**Messaging** and social interactions remain available without enhanced verification.\n\nIf a file is pending more than 24 h, contact an admin via **Support**.`,
      `Identity verification on MOXT is done from the **Verification** section.\n\n**Before publishing**: confirm your Russian number by OTP (level 1).\n\n**Identity level**: passport, Russian residence card, or consular card + selfie.\n\n**Enhanced level**: + recent proof of address in Russia.\n\nNumber change: a new SMS confirmation is required.`,
    ],
  },
  p2p: {
    actions: ['P2P exchange', 'Post an offer'],
    suggestions: [
      'Which currencies are available?',
      'How do I secure my P2P transaction?',
      'How is it different from a classic transfer?',
    ],
    texts: [
      `**P2P** (peer-to-peer) exchange lets you buy or sell currencies directly with other community members.\n\nBrowse available offers, filter by currency and payment method, then pick the one that fits. MOXT oversees the transaction to protect both parties.\n\nYou can also publish your own offer if you want to sell currency at a rate you set.`,
    ],
  },
  litige: {
    actions: ['My disputes', 'Support'],
    suggestions: [
      'What evidence should I attach?',
      'What is the processing time?',
      'How do I contact support directly?',
    ],
    texts: [
      `If you have an issue with a transfer, parcel, or transaction, open a dispute from **My disputes**.\n\nTo do so:\n- Select the relevant operation\n- Describe the problem precisely\n- Attach available evidence (screenshots, receipts, photos)\n\nOur team responds within 24 to 72 hours. All parties are kept informed until the case is resolved.`,
    ],
  },
  compte: {
    actions: ['My profile', 'Personal information'],
    suggestions: [
      'How do I change my profile photo?',
      'How do I verify my identity?',
      'How do I manage my transfer profiles?',
    ],
    texts: [
      `Your **Profile** space centralizes all your MOXT account information.\n\nThere you can:\n- Edit personal details (name, phone, city)\n- Update your profile photo\n- Check your verification level\n- Manage documents and saved transfer profiles\n\nWe recommend keeping your contact details up to date for the best experience.`,
    ],
  },
  recu: {
    actions: ['My transfers', 'Finance'],
    suggestions: [
      'How do I download a receipt?',
      'How do I contest a transfer?',
      'Where can I see my full history?',
    ],
    texts: [
      `Transfer receipts are available directly from each operation in **My transfers**.\n\nEach receipt includes:\n- Amount sent and amount received\n- Applied exchange rate\n- Exchanger details\n- Full processing timeline\n\nYou can view or share it directly from the app.`,
    ],
  },
  finance: {
    actions: ['Finance'],
    suggestions: [
      'How do I read my payment history?',
      'Where can I see my transfers?',
      'How do I check my balance?',
    ],
    texts: [
      `The **Finance** section gives an overview of your MOXT activity: payment history, wallet balance, and operation summaries.\n\nEvery movement is logged with date, status, and details. It’s the ideal place to track spending and transfers over a given period.`,
    ],
  },
  message: {
    actions: ['Messaging'],
    suggestions: [
      'How do I contact an exchanger?',
      'How do I contact support?',
      'How do I find an archived conversation?',
    ],
    texts: [
      `MOXT messaging lets you chat directly with other members, exchangers, and providers.\n\nEach conversation is linked to an operation or professional profile, which makes context easy to find. You can also contact support from this interface for any help request.`,
    ],
  },
  fallback: {
    actions: ['Discover MOXT', 'Contact support'],
    suggestions: [
      'How do I make a transfer?',
      'How do I send a parcel?',
      'How do I verify my identity?',
      'Which countries are covered?',
    ],
    texts: [
      `Hello! I’m Moxi, your MOXT assistant. I can help you with:\n\n- **Transfers** — send money between Russia and Africa\n- **Parcels** — ship items via travelers\n- **Marketplace** — buy and sell within the community\n- **Jobs & Events** — apply or organize meetups\n- **Businesses** — find an exchanger or list your activity\n- **Verification** — unlock higher transfer limits\n- **Disputes & Support** — get help when something goes wrong\n\nWhat’s your question?`,
      `I’m here to guide you on the MOXT platform, which connects **Russia** and **sub-Saharan African countries**.\n\nTell me what you need — transfer, parcel, listing, job, or something else — and I’ll point you to the right section with the useful details.`,
    ],
  },
}

/** @type {Record<string, DomainCopy>} */
const ru = {
  transfert: {
    actions: ['Новый перевод', 'Мои переводы'],
    suggestions: [
      'Каковы сроки обработки?',
      'Как отправить подтверждение оплаты?',
      'Какие комиссии применяются?',
      'Какие страны поддерживаются?',
    ],
    texts: [
      `Чтобы выполнить перевод, перейдите в **Переводы**, затем **Новый перевод**.\n\nШаги:\n- Выберите направление (Африка → Россия или Россия → Африка)\n- Выберите обменника из доступных\n- Укажите сумму и данные получателя\n- Подтвердите и отправьте подтверждение оплаты в течение 30 минут\n\nОбменник проверяет платёж, и вы сразу получаете уведомление.`,
      `Перевод в MOXT выполняется за несколько простых шагов.\n\nВ разделе **Новый перевод** выберите обменника, сумму и данные получателя. После создания заявки у вас есть 30 минут, чтобы отправить подтверждение оплаты — иначе заявка истечёт.\n\nСледите за статусом в реальном времени в **Мои переводы**.`,
    ],
  },
  preuve: {
    actions: ['Мои переводы'],
    suggestions: [
      'Что делать, если подтверждение отклонили?',
      'Сколько занимает проверка?',
      'Как открыть спор?',
    ],
    texts: [
      `Чтобы отправить подтверждение оплаты, откройте нужный перевод в **Мои переводы** и нажмите **Заявить об оплате**.\n\nПриложите чёткий скриншот или фото перевода. Обменник получит уведомление и проверит платёж в кратчайшие сроки.\n\nУбедитесь, что сумма, дата и номер операции хорошо видны на документе.`,
    ],
  },
  taux: {
    actions: ['Новый перевод', 'Обмен P2P'],
    suggestions: [
      'Как создать перевод?',
      'Что такое обмен P2P?',
      'Какие обменники доступны?',
    ],
    texts: [
      `Курсы на MOXT устанавливает каждый зарегистрированный обменник и обновляет их регулярно. Поддерживаются валюты партнёрских африканских стран (XOF, XAF, NGN, GHS, KES, RUB и др.) к российскому рублю и обратно.\n\nПри создании перевода сумма к получению рассчитывается автоматически по курсу дня, а комиссии показываются до подтверждения.\n\nВы можете сравнить предложения нескольких обменников и выбрать выгодное.`,
    ],
  },
  pays: {
    actions: ['Новый перевод'],
    suggestions: [
      'Как создать перевод?',
      'Какие комиссии?',
      'Как подтвердить аккаунт?',
    ],
    texts: [
      `MOXT связывает **Россию** со странами **франкоязычной и англоязычной Африки южнее Сахары**.\n\nСреди стран отправления:\n- Западная Африка: Бенин, Буркина-Фасо, Кот-д'Ивуар, Сенегал, Мали, Нигер, Того, Гана, Нигерия\n- Центральная Африка: Камерун, Конго, ДР Конго, Габон, Чад\n- Восточная Африка: Кения, Руанда, Уганда, Танзания\n- И другие африканские страны\n\nПереводы выполняются между этими странами и Россией в обоих направлениях.`,
    ],
  },
  delai: {
    actions: ['Мои переводы'],
    suggestions: [
      'Как отправить подтверждение оплаты?',
      'Как связаться с обменником?',
      'Как открыть спор?',
    ],
    texts: [
      `Сроки обработки зависят от выбранного обменника. На карточке каждого обменника указано обычное среднее время.\n\nКак правило:\n- После отправки подтверждения оплаты обменник проверяет его от нескольких минут до нескольких часов\n- У вас есть **30 минут** после создания перевода, чтобы отправить подтверждение\n- При просрочке заявка автоматически истекает, и нужно создать новую\n\nЕсли перевод задерживается, свяжитесь с обменником напрямую через сообщения.`,
    ],
  },
  frais: {
    actions: ['Новый перевод'],
    suggestions: [
      'Как создать перевод?',
      'Какие курсы обмена?',
      'Как подтвердить аккаунт для повышенных лимитов?',
    ],
    texts: [
      `Сервисные комиссии MOXT прозрачны и отображаются до подтверждения каждого перевода.\n\nОни включают:\n- **Процент сервиса**, установленный обменником (указан в карточке)\n- **Маржу обмена**, применяемую к курсу дня\n\nТочная сумма, которую получит получатель, всегда рассчитывается и показывается до подтверждения операции. Без сюрпризов после проверки.`,
    ],
  },
  colis: {
    actions: ['Смотреть маршруты', 'Опубликовать маршрут'],
    suggestions: [
      'Какова цена за килограмм?',
      'Как связаться с путешественником?',
      'Какие типы вещей принимаются?',
      'Как опубликовать свой маршрут?',
    ],
    texts: [
      `Сервис посылок MOXT связывает отправителей с путешественниками, у которых есть свободное место в багаже, на маршрутах между Россией и африканскими странами.\n\n**Чтобы отправить посылку:**\n- Посмотрите доступные маршруты в **Посылки**\n- Выберите путешественника по дате, доступному весу и тарифу\n- Отправьте запрос на бронирование с деталями отправления\n\n**Чтобы предложить маршрут:**\n- Опубликуйте маршрут с доступным весом, ценой за кг и допустимыми типами вещей\n- Принимайте входящие запросы и согласуйте передачу с отправителем.`,
      `Раздел **Посылки** позволяет перевозить или отправлять вещи между Россией и Африкой через частных путешественников.\n\nВ каждом опубликованном маршруте указаны дата вылета, оставшаяся ёмкость, тариф за кг и возможные ограничения. Связь происходит напрямую на платформе, без посредников.`,
    ],
  },
  marketplace: {
    actions: ['Маркетплейс', 'Разместить объявление'],
    suggestions: [
      'Как связаться с продавцом?',
      'Как управлять объявлениями?',
      'Как пожаловаться на объявление?',
    ],
    texts: [
      `Маркетплейс MOXT позволяет покупать и продавать товары внутри афро-российской сообщества.\n\n**Чтобы разместить объявление:**\n- Перейдите в **Маркетплейс**, затем **Разместить объявление**\n- Укажите название, описание, цену и фото\n- Уточните, есть ли доставка или только самовывоз\n\nОбъявления остаются активными, пока вы их не закроете или товар не будет продан.`,
      `В разделе **Маркетплейс** просматривайте объявления, фильтруйте по категории или локации и пишите продавцу напрямую через встроенные сообщения.\n\nЧтобы выставить товар на продажу, используйте **Разместить объявление**. Форма подскажет: тип товара, состояние, цена и варианты передачи.`,
    ],
  },
  emploi: {
    actions: ['Вакансии', 'Опубликовать вакансию'],
    suggestions: [
      'Как откликнуться на вакансию?',
      'Как отслеживать отклики?',
      'Как опубликовать вакансию?',
    ],
    texts: [
      `Раздел **Вакансии** собирает предложения афро-российского сообщества: разовые задания, постоянная работа, фриланс и другое.\n\n**Чтобы откликнуться:**\n- Откройте вакансию и изучите требования\n- Нажмите **Откликнуться** и напишите персональное сообщение\n- Следите за статусом отклика в личном кабинете\n\n**Чтобы нанять:**\n- Опубликуйте вакансию с типом договора, оплатой и нужными навыками\n- Управляйте откликами прямо на странице вакансии.`,
    ],
  },
  evenement: {
    actions: ['События', 'Опубликовать событие'],
    suggestions: [
      'Как записаться на событие?',
      'Как отменить запись?',
      'Как организовать событие?',
    ],
    texts: [
      `Страница **События** объединяет встречи, конференции, вечеринки и мастер-классы афро-российского сообщества.\n\nЧтобы записаться, откройте карточку и нажмите **Записаться**. Вы получите подтверждение и напоминание перед датой.\n\nЧтобы организовать событие, используйте **Опубликовать событие** и укажите место, дату, вместимость и практическую информацию.`,
    ],
  },
  entreprise: {
    actions: ['Каталог компаний', 'Создать профиль компании'],
    suggestions: [
      'Как найти надёжного обменника?',
      'Как читать отзывы клиентов?',
      'Как добавить свой бизнес?',
    ],
    texts: [
      `Каталог **Компании** включает обменников, подрядчиков и фирмы афро-российского сообщества в России.\n\nВы можете смотреть карточки, читать отзывы, сравнивать курсы и сроки, затем писать напрямую через сообщения.\n\nЧтобы добавить свою деятельность, откройте **Создать профиль компании**. После проверки карточка станет видимой всему сообществу.`,
    ],
  },
  verification: {
    actions: ['Подтвердить личность', 'Мои документы'],
    suggestions: [
      'Какие документы принимаются?',
      'Сколько занимает проверка?',
      'Какие преимущества после верификации?',
    ],
    texts: [
      `В MOXT действует **три уровня проверки**:\n\n**1. Российский телефон (+7)** — обязателен для публикации объявления, посылки, вакансии или события. Один уникальный номер на аккаунт, подтверждается SMS. Если вы регистрировались по e-mail, подтвердите номер в **Профиль** или **Верификация**.\n\n**2. Идентичность MOXT** — документ + селфи. Нужна для создания компании и использования счетов переводов.\n\n**3. Расширенная** — личность + подтверждение адреса для повышенных лимитов перевода.\n\n**Сообщения** и социальные функции доступны без расширенной проверки.\n\nЕсли заявка в ожидании более 24 ч, обратитесь к администратору через **Поддержку**.`,
      `Проверка личности в MOXT выполняется в разделе **Верификация**.\n\n**Перед публикацией**: подтвердите российский номер по OTP (уровень 1).\n\n**Уровень личности**: паспорт, вид на жительство РФ или консульская карта + селфи.\n\n**Расширенный уровень**: + свежее подтверждение адреса в России.\n\nСмена номера: требуется новое SMS-подтверждение.`,
    ],
  },
  p2p: {
    actions: ['Обмен P2P', 'Предложить оффер'],
    suggestions: [
      'Какие валюты доступны?',
      'Как обезопасить P2P-сделку?',
      'Чем это отличается от обычного перевода?',
    ],
    texts: [
      `Обмен **P2P** (peer-to-peer) позволяет покупать или продавать валюту напрямую с другими участниками сообщества.\n\nПросматривайте офферы, фильтруйте по валюте и способу оплаты, затем выбирайте подходящий. Сделка контролируется MOXT для безопасности обеих сторон.\n\nВы также можете опубликовать свой оффер, если хотите продать валюту по своему курсу.`,
    ],
  },
  litige: {
    actions: ['Мои споры', 'Поддержка'],
    suggestions: [
      'Какие доказательства приложить?',
      'Каков срок рассмотрения?',
      'Как связаться с поддержкой напрямую?',
    ],
    texts: [
      `При проблеме с переводом, посылкой или транзакцией откройте спор в **Мои споры**.\n\nДля этого:\n- Выберите нужную операцию\n- Точно опишите проблему\n- Приложите доказательства (скриншоты, чеки, фото)\n\nНаша команда отвечает в течение 24–72 часов. Все стороны информируются о ходе дела до его разрешения.`,
    ],
  },
  compte: {
    actions: ['Мой профиль', 'Личные данные'],
    suggestions: [
      'Как сменить фото профиля?',
      'Как подтвердить личность?',
      'Как управлять профилями переводов?',
    ],
    texts: [
      `Раздел **Профиль** собирает все данные вашего аккаунта MOXT.\n\nТам вы можете:\n- Изменить личные данные (имя, телефон, город)\n- Обновить фото профиля\n- Проверить уровень верификации\n- Управлять документами и сохранёнными профилями переводов\n\nРекомендуем держать контакты актуальными для комфортной работы.`,
    ],
  },
  recu: {
    actions: ['Мои переводы', 'Финансы'],
    suggestions: [
      'Как скачать квитанцию?',
      'Как оспорить перевод?',
      'Где посмотреть полную историю?',
    ],
    texts: [
      `Квитанции по переводам доступны прямо из каждой операции в **Мои переводы**.\n\nВ каждой квитанции:\n- Отправленная и полученная сумма\n- Применённый курс\n- Данные обменника\n- Полная хронология обработки\n\nВы можете просмотреть или поделиться ею прямо в приложении.`,
    ],
  },
  finance: {
    actions: ['Финансы'],
    suggestions: [
      'Как читать историю платежей?',
      'Где посмотреть мои переводы?',
      'Как проверить баланс?',
    ],
    texts: [
      `Раздел **Финансы** даёт обзор вашей активности в MOXT: история платежей, баланс кошелька и сводка операций.\n\nКаждое движение фиксируется с датой, статусом и деталями. Это удобное место, чтобы отслеживать расходы и переводы за период.`,
    ],
  },
  message: {
    actions: ['Сообщения'],
    suggestions: [
      'Как связаться с обменником?',
      'Как связаться с поддержкой?',
      'Как найти архивный диалог?',
    ],
    texts: [
      `Сообщения MOXT позволяют общаться напрямую с участниками, обменниками и подрядчиками.\n\nКаждый диалог связан с операцией или профилем специалиста, поэтому контекст легко найти. Через этот же интерфейс можно обратиться в поддержку по любому вопросу.`,
    ],
  },
  fallback: {
    actions: ['Открыть MOXT', 'Связаться с поддержкой'],
    suggestions: [
      'Как сделать перевод?',
      'Как отправить посылку?',
      'Как подтвердить личность?',
      'Какие страны поддерживаются?',
    ],
    texts: [
      `Здравствуйте! Я Мокси, ваш помощник MOXT. Я могу рассказать о:\n\n- **Переводах** — отправка денег между Россией и Африкой\n- **Посылках** — доставка вещей через путешественников\n- **Маркетплейсе** — покупка и продажа в сообществе\n- **Вакансиях и событиях** — отклики и организация встреч\n- **Компаниях** — поиск обменника или размещение бизнеса\n- **Верификации** — повышение лимитов переводов\n- **Спорах и поддержке** — помощь при проблемах\n\nКакой у вас вопрос?`,
      `Я помогу вам ориентироваться на платформе MOXT, которая связывает **Россию** и **страны Африки южнее Сахары**.\n\nСкажите, что вам нужно — перевод, посылка, объявление, работа или другое — и я направлю в нужный раздел с полезной информацией.`,
    ],
  },
}

/** @type {Record<string, DomainCopy>} */
const pt = {
  transfert: {
    actions: ['Nova transferência', 'As minhas transferências'],
    suggestions: [
      'Quais são os prazos de processamento?',
      'Como envio o comprovativo de pagamento?',
      'Quais são as taxas aplicadas?',
      'Que países são cobertos?',
    ],
    texts: [
      `Para fazer uma transferência, vá a **Transferências** e depois **Nova transferência**.\n\nPassos:\n- Escolha a direção (África → Rússia ou Rússia → África)\n- Selecione um cambista entre os disponíveis\n- Indique o montante e os dados do destinatário\n- Confirme e envie o comprovativo de pagamento em 30 minutos\n\nO cambista valida em seguida e é notificado de imediato.`,
      `Uma transferência MOXT faz-se em poucos passos simples.\n\nEm **Nova transferência**, escolha o cambista, o montante e os dados do beneficiário. Depois de criar o pedido, tem 30 minutos para enviar o comprovativo — após esse prazo, o pedido expira.\n\nAcompanhe o progresso em tempo real em **As minhas transferências**.`,
    ],
  },
  preuve: {
    actions: ['As minhas transferências'],
    suggestions: [
      'O que fazer se o comprovativo for rejeitado?',
      'Quanto tempo demora a validação?',
      'Como abrir um litígio?',
    ],
    texts: [
      `Para submeter um comprovativo de pagamento, abra a transferência em **As minhas transferências** e toque em **Declarar o pagamento**.\n\nAnexe uma captura de ecrã ou uma foto nítida da transferência. O cambista é notificado e valida o mais depressa possível.\n\nCertifique-se de que o montante, a data e o número de referência estão bem visíveis no documento.`,
    ],
  },
  taux: {
    actions: ['Nova transferência', 'Câmbio P2P'],
    suggestions: [
      'Como criar uma transferência?',
      'O que é o câmbio P2P?',
      'Que cambistas estão disponíveis?',
    ],
    texts: [
      `As taxas de câmbio no MOXT são definidas por cada cambista registado e atualizadas regularmente. Cobrem as moedas dos países africanos parceiros (XOF, XAF, NGN, GHS, KES, RUB, etc.) para o rublo russo, e o inverso.\n\nAo criar uma transferência, o montante recebido pelo destinatário é calculado automaticamente à taxa do dia, com as comissões claramente mostradas antes da confirmação.\n\nPode comparar as ofertas de vários cambistas para escolher a mais vantajosa.`,
    ],
  },
  pays: {
    actions: ['Nova transferência'],
    suggestions: [
      'Como criar uma transferência?',
      'Quais são as taxas?',
      'Como verificar a minha conta?',
    ],
    texts: [
      `O MOXT liga a **Rússia** aos países da **África subsariana francófona e anglófona**.\n\nEntre os países de origem cobertos:\n- África Ocidental: Benim, Burkina Faso, Costa do Marfim, Senegal, Mali, Níger, Togo, Gana, Nigéria\n- África Central: Camarões, Congo, R.D. Congo, Gabão, Chade\n- África Oriental: Quénia, Ruanda, Uganda, Tanzânia\n- E outros países africanos\n\nAs transferências fazem-se entre estes países e a Rússia, nos dois sentidos.`,
    ],
  },
  delai: {
    actions: ['As minhas transferências'],
    suggestions: [
      'Como envio o comprovativo de pagamento?',
      'Como contacto o meu cambista?',
      'Como abrir um litígio?',
    ],
    texts: [
      `Os prazos de processamento dependem do cambista selecionado. Cada ficha de cambista indica o prazo médio habitual.\n\nEm geral:\n- Depois de submetido o comprovativo, o cambista valida em minutos a algumas horas\n- Tem **30 minutos** após criar a transferência para enviar o comprovativo\n- Se ultrapassar o prazo, o pedido expira automaticamente e deve criar um novo\n\nSe a transferência demorar demasiado, contacte o cambista diretamente pela mensagens.`,
    ],
  },
  frais: {
    actions: ['Nova transferência'],
    suggestions: [
      'Como criar uma transferência?',
      'Quais são as taxas de câmbio?',
      'Como verificar a conta para limites mais altos?',
    ],
    texts: [
      `As taxas de serviço MOXT são transparentes e mostradas antes de confirmar cada transferência.\n\nIncluem:\n- Uma **percentagem de serviço** definida pelo cambista (visível na ficha)\n- Uma **margem de câmbio** aplicada à taxa do dia\n\nO montante exacto que o destinatário receberá é sempre calculado e mostrado antes de confirmar. Sem surpresas após a validação.`,
    ],
  },
  colis: {
    actions: ['Ver trajetos', 'Publicar um trajeto'],
    suggestions: [
      'Qual é o preço por quilo?',
      'Como contacto um viajante?',
      'Que tipos de artigos são aceites?',
      'Como publico o meu próprio trajeto?',
    ],
    texts: [
      `O serviço de encomendas MOXT liga remetentes a viajantes com capacidade nas bagagens, em trajetos entre a Rússia e os países africanos.\n\n**Para enviar uma encomenda:**\n- Consulte os trajetos em **Encomendas**\n- Escolha um viajante pela data, peso disponível e tarifa\n- Envie um pedido de reserva com os detalhes do envio\n\n**Para propor um trajeto:**\n- Publique o trajeto com o peso disponível, o preço por quilo e os tipos de artigos aceites\n- Aceite os pedidos recebidos e coordene a entrega com o remetente.`,
      `A rubrica **Encomendas** permite transportar ou enviar artigos entre a Rússia e a África via viajantes particulares.\n\nCada trajeto publicado indica a data de partida, a capacidade restante, a tarifa por quilo e eventuais restrições. A ligação faz-se diretamente na plataforma, sem intermediário.`,
    ],
  },
  marketplace: {
    actions: ['Marketplace', 'Publicar um anúncio'],
    suggestions: [
      'Como contacto um vendedor?',
      'Como gerir os meus anúncios?',
      'Como denunciar um anúncio?',
    ],
    texts: [
      `O marketplace MOXT permite comprar e vender artigos na comunidade afro-russa.\n\n**Para publicar um anúncio:**\n- Vá a **Marketplace** e depois **Publicar um anúncio**\n- Preencha o título, a descrição, o preço e as fotos\n- Indique se faz entrega ou se é apenas levantamento\n\nOs anúncios permanecem ativos até os fechar ou até o artigo ser vendido.`,
      `Em **Marketplace**, navegue pelos anúncios, filtre por categoria ou localização e contacte o vendedor diretamente pela mensagens integrada.\n\nPara pôr um artigo à venda, use **Publicar um anúncio**. O formulário orienta-o: tipo de produto, estado, preço e opções de entrega.`,
    ],
  },
  emploi: {
    actions: ['Ofertas de emprego', 'Publicar uma vaga'],
    suggestions: [
      'Como candidatar-me a uma oferta?',
      'Como acompanhar as minhas candidaturas?',
      'Como publicar uma oferta de emprego?',
    ],
    texts: [
      `A secção **Empregos** reúne as ofertas da comunidade afro-russa: missões pontuais, contratos, freelance e muito mais.\n\n**Para candidatar-se:**\n- Abra uma oferta e leia os requisitos\n- Toque em **Candidatar-se** e escreva uma mensagem personalizada\n- Acompanhe o estado da candidatura no seu espaço\n\n**Para recrutar:**\n- Publique a oferta com o tipo de contrato, a remuneração e as competências pedidas\n- Faça a gestão das candidaturas diretamente na ficha da vaga.`,
    ],
  },
  evenement: {
    actions: ['Eventos', 'Publicar um evento'],
    suggestions: [
      'Como inscrever-me num evento?',
      'Como cancelar a minha inscrição?',
      'Como organizar um evento?',
    ],
    texts: [
      `A página **Eventos** reúne encontros, conferências, festas e workshops da comunidade afro-russa.\n\nPara se inscrever, abra a ficha e toque em **Inscrever-se**. Recebe uma confirmação e um lembrete antes da data.\n\nPara organizar um evento, use **Publicar um evento** e preencha o local, a data, a capacidade e as informações práticas.`,
    ],
  },
  entreprise: {
    actions: ['Diretório de empresas', 'Criar perfil de empresa'],
    suggestions: [
      'Como encontrar um cambista fiável?',
      'Como ler as avaliações de clientes?',
      'Como registar a minha atividade?',
    ],
    texts: [
      `O diretório **Empresas** lista cambistas, prestadores e sociedades ativos na comunidade afro-russa na Rússia.\n\nPode consultar fichas, ler avaliações, comparar taxas e prazos, e contactar diretamente pela mensagens.\n\nPara registar a sua atividade, vá a **Criar perfil de empresa**. Depois de validado, o perfil fica visível para toda a comunidade.`,
    ],
  },
  verification: {
    actions: ['Verificar a minha identidade', 'Os meus documentos'],
    suggestions: [
      'Que documentos são aceites?',
      'Quanto tempo demora a validação?',
      'Que vantagens após a verificação?',
    ],
    texts: [
      `O MOXT aplica **três níveis de verificação**:\n\n**1. Telefone russo (+7)** — obrigatório para publicar um anúncio, uma encomenda, um emprego ou um evento. Um número único por conta, confirmado por SMS. Se se registou por e-mail, confirme o número em **Perfil** ou **Verificação**.\n\n**2. Identidade MOXT** — documento de identidade + selfie. Necessário para criar uma empresa e usar contas de transferência.\n\n**3. Reforçada** — identidade + comprovativo de morada para limites de transferência mais altos.\n\nA **mensagens** e as interações sociais continuam acessíveis sem verificação reforçada.\n\nSe um processo estiver pendente há mais de 24 h, contacte o administrador via **Suporte**.`,
      `A verificação de identidade no MOXT faz-se na rubrica **Verificação**.\n\n**Antes de publicar**: confirme o número russo por OTP (nível 1).\n\n**Nível identidade**: passaporte, cartão de residência russo ou cartão consular + selfie.\n\n**Nível reforçado**: + comprovativo de morada recente na Rússia.\n\nMudança de número: é pedida uma nova confirmação por SMS.`,
    ],
  },
  p2p: {
    actions: ['Câmbio P2P', 'Propor uma oferta'],
    suggestions: [
      'Que moedas estão disponíveis?',
      'Como proteger a minha transação P2P?',
      'Qual a diferença face a uma transferência clássica?',
    ],
    texts: [
      `O câmbio **P2P** (peer-to-peer) permite comprar ou vender moedas diretamente com outros membros da comunidade.\n\nExplore as ofertas, filtre por moeda e método de pagamento, e escolha a que melhor se adequa. A transação é acompanhada pelo MOXT para garantir a segurança de ambas as partes.\n\nTambém pode publicar a sua própria oferta se quiser vender moeda a uma taxa que definir.`,
    ],
  },
  litige: {
    actions: ['Os meus litígios', 'Suporte'],
    suggestions: [
      'Que comprovativos anexar ao processo?',
      'Qual é o prazo de tratamento?',
      'Como contactar o suporte diretamente?',
    ],
    texts: [
      `Em caso de problema com uma transferência, encomenda ou transação, abra um litígio em **Os meus litígios**.\n\nPara isso:\n- Selecione a operação em causa\n- Descreva o problema com precisão\n- Anexe as provas disponíveis (capturas, recibos, fotos)\n\nA nossa equipa intervém no prazo de 24 a 72 horas. Todas as partes são informadas do andamento até à resolução.`,
    ],
  },
  compte: {
    actions: ['O meu perfil', 'Informações pessoais'],
    suggestions: [
      'Como alterar a foto de perfil?',
      'Como verificar a minha identidade?',
      'Como gerir os meus perfis de transferência?',
    ],
    texts: [
      `O espaço **Perfil** centraliza todas as informações da sua conta MOXT.\n\nPode:\n- Alterar dados pessoais (nome, telefone, cidade)\n- Atualizar a foto de perfil\n- Consultar o nível de verificação\n- Gerir documentos e perfis de transferência guardados\n\nRecomendamos manter os contactos atualizados para uma experiência ideal.`,
    ],
  },
  recu: {
    actions: ['As minhas transferências', 'Finanças'],
    suggestions: [
      'Como descarregar um recibo?',
      'Como contestar uma transferência?',
      'Onde ver o histórico completo?',
    ],
    texts: [
      `Os recibos das transferências estão disponíveis diretamente em cada operação em **As minhas transferências**.\n\nCada recibo contém:\n- O montante enviado e o montante recebido\n- A taxa de câmbio aplicada\n- As informações do cambista\n- A cronologia completa do tratamento\n\nPode consultá-lo ou partilhá-lo diretamente na aplicação.`,
    ],
  },
  finance: {
    actions: ['Finanças'],
    suggestions: [
      'Como ler o histórico de pagamentos?',
      'Onde ver as minhas transferências?',
      'Como verificar o meu saldo?',
    ],
    texts: [
      `A secção **Finanças** dá uma visão geral da sua atividade no MOXT: histórico de pagamentos, saldo da carteira e resumo das operações.\n\nCada movimento é registado com data, estado e detalhe. É o espaço ideal para acompanhar despesas e transferências num período.`,
    ],
  },
  message: {
    actions: ['Mensagens'],
    suggestions: [
      'Como contactar um cambista?',
      'Como contactar o suporte?',
      'Como encontrar uma conversa arquivada?',
    ],
    texts: [
      `As mensagens MOXT permitem trocar mensagens diretamente com outros membros, cambistas e prestadores.\n\nCada conversa está ligada a uma operação ou ficha profissional, o que facilita o contexto. Também pode contactar o suporte nesta interface para qualquer pedido de ajuda.`,
    ],
  },
  fallback: {
    actions: ['Descobrir o MOXT', 'Contactar o suporte'],
    suggestions: [
      'Como fazer uma transferência?',
      'Como enviar uma encomenda?',
      'Como verificar a minha identidade?',
      'Que países são cobertos?',
    ],
    texts: [
      `Olá! Sou a Moxi, a sua assistente MOXT. Posso ajudar com:\n\n- **Transferências** — enviar dinheiro entre a Rússia e a África\n- **Encomendas** — enviar artigos via viajantes\n- **Marketplace** — comprar e vender na comunidade\n- **Empregos e eventos** — candidatar-se ou organizar encontros\n- **Empresas** — encontrar um cambista ou registar a atividade\n- **Verificação** — desbloquear limites de transferência mais altos\n- **Litígios e suporte** — obter ajuda em caso de problema\n\nQual é a sua pergunta?`,
      `Estou aqui para o orientar na plataforma MOXT, que liga a **Rússia** e os **países da África subsariana**.\n\nDiga-me o que procura — transferência, encomenda, anúncio, emprego ou outro — e eu indico a secção certa com as informações úteis.`,
    ],
  },
}

function toIndexed(arr) {
  return Object.fromEntries(arr.map((value, i) => [String(i), value]))
}

function toLocaleTree(domains) {
  const responses = {}
  for (const [domain, copy] of Object.entries(domains)) {
    responses[domain] = {
      actions: toIndexed(copy.actions),
      suggestions: toIndexed(copy.suggestions),
      texts: toIndexed(copy.texts),
    }
  }
  return { responses }
}

function serialize(value, indent = 2) {
  const pad = ' '.repeat(indent)
  if (typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    const lines = value.map((item) => `${pad}  ${serialize(item, indent + 2)},`)
    return `[\n${lines.join('\n')}\n${pad}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (!entries.length) return '{}'
    const lines = entries.map(([k, v]) => {
      const key = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : JSON.stringify(k)
      return `${pad}  ${key}: ${serialize(v, indent + 2)},`
    })
    return `{\n${lines.join('\n')}\n${pad}}`
  }
  return String(value)
}

function countLeafKeys(node) {
  if (node == null || typeof node !== 'object') return 1
  if (Array.isArray(node)) return node.length ? node.reduce((n, v) => n + countLeafKeys(v), 0) : 0
  return Object.values(node).reduce((n, v) => n + countLeafKeys(v), 0)
}

function injectAssistant(localeCode, tree) {
  const filePath = path.join(localesDir, `${localeCode}.js`)
  let source = fs.readFileSync(filePath, 'utf8')
  if (/\n  assistant: \{/.test(source)) {
    source = source.replace(/\n  assistant: \{[\s\S]*?\n  \},\n(?=  [a-z]+: \{|\}$)/, '\n')
    // If assistant was at the end before closing brace
    source = source.replace(/\n  assistant: \{[\s\S]*?\n  \},\n\}\s*$/, '\n}\n')
  }
  if (!source.trimEnd().endsWith('}')) {
    throw new Error(`Unexpected end of ${localeCode}.js`)
  }
  const trimmed = source.replace(/\}\s*$/, '')
  const block = `  assistant: ${serialize(tree, 2)},\n}\n`
  fs.writeFileSync(filePath, `${trimmed}${block}`)
}

const catalogs = { fr, en, ru, pt }
const counts = {}
for (const [code, domains] of Object.entries(catalogs)) {
  const tree = toLocaleTree(domains)
  counts[code] = countLeafKeys(tree)
  injectAssistant(code, tree)
}

console.log(JSON.stringify(counts, null, 2))
