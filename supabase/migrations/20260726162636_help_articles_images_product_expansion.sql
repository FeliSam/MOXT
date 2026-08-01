-- Illustrations pour les fiches d'aide (guide + aide produit) + nouvelles
-- sessions "Aide Moxt" (/aide) couvrant les zones jusque-là non documentées.

alter table public.help_articles
  add column if not exists images text[] not null default '{}';

-- Illustration de chaque session produit existante (FR déjà seedée).
update public.help_articles set images = array['/assets/help/getting_started.svg']
  where translation_group_id = 'product-getting-started' and images = '{}';
update public.help_articles set images = array['/assets/help/transfers.svg']
  where translation_group_id = 'product-transfers' and images = '{}';
update public.help_articles set images = array['/assets/help/marketplace.svg']
  where translation_group_id = 'product-marketplace' and images = '{}';
update public.help_articles set images = array['/assets/help/parcels.svg']
  where translation_group_id = 'product-parcels' and images = '{}';
update public.help_articles set images = array['/assets/help/messages.svg']
  where translation_group_id = 'product-messages' and images = '{}';

-- Nouvelles sessions "Aide Moxt" (FR) pour les zones non couvertes jusqu'ici.
insert into public.help_articles (
  id, translation_group_id, category, language, title, summary, content,
  images, pinned, status, sort_order, author_name, created_at, updated_at
)
values
  (
    'product-account-fr', 'product-account', 'account', 'fr',
    'Gérer mon compte',
    'Modifiez vos informations, votre langue et vos préférences de confidentialité.',
    E'1. Ouvrez Profil depuis le menu MOXT.\n2. Modifiez vos informations personnelles, votre photo et votre langue.\n3. Réglez la visibilité de votre activité dans Paramètres.\n4. Gérez vos appareils et votre sécurité de connexion dans Sécurité.\n5. Retrouvez vos favoris et vos abonnements depuis le hub MOXT.',
    array['/assets/help/account.svg'], false, 'published', 60, 'MOXT', now(), now()
  ),
  (
    'product-p2p-fr', 'product-p2p', 'p2p', 'fr',
    'Échanges P2P entre particuliers',
    'Publiez une offre de change ou acceptez celle d’un autre membre en toute sécurité.',
    E'1. Ouvrez Échanges P2P depuis le menu Finances.\n2. Publiez une offre (devises, montant, méthode) ou parcourez les offres actives.\n3. Une fois un accord trouvé, suivez les étapes de la commande : paiement, preuve, confirmation.\n4. En cas de litige, ouvrez un litige directement depuis la commande.\n5. Notez votre partenaire d’échange à la fin de la transaction.',
    array['/assets/help/p2p.svg'], false, 'published', 70, 'MOXT', now(), now()
  ),
  (
    'product-exchangers-fr', 'product-exchangers', 'exchangers', 'fr',
    'Trouver un échangeur vérifié',
    'Comparez les échangeurs disponibles et choisissez le mieux adapté à votre besoin.',
    E'1. Ouvrez Échangeurs depuis le menu Finances.\n2. Comparez les taux, frais et délais proposés.\n3. Consultez les avis et le badge de vérification avant de contacter.\n4. Démarrez un transfert directement depuis la fiche de l’échangeur.\n5. Laissez un avis après votre transaction pour aider la communauté.',
    array['/assets/help/exchangers.svg'], false, 'published', 80, 'MOXT', now(), now()
  ),
  (
    'product-businesses-fr', 'product-businesses', 'businesses', 'fr',
    'Découvrir les entreprises vérifiées',
    'Parcourez l’annuaire d’entreprises et contactez-les directement sur MOXT.',
    E'1. Ouvrez Entreprises depuis le menu Services.\n2. Filtrez par secteur d’activité ou ville.\n3. Ouvrez une fiche pour voir les services, avis et coordonnées.\n4. Contactez l’entreprise via le bouton Contacter ou Messages.\n5. Le badge vérifié garantit une entreprise validée par MOXT.',
    array['/assets/help/businesses.svg'], false, 'published', 90, 'MOXT', now(), now()
  ),
  (
    'product-professional-fr', 'product-professional', 'professional', 'fr',
    'Créer mon espace professionnel',
    'Enregistrez votre entreprise, ajoutez vos documents et suivez votre vérification.',
    E'1. Ouvrez Espace professionnel depuis le menu Services.\n2. Créez votre fiche entreprise (nom, secteur, description, ville).\n3. Ajoutez vos documents justificatifs pour la vérification.\n4. Suivez l’avancement de la vérification depuis votre tableau de bord.\n5. Une fois vérifiée, votre entreprise apparaît dans l’annuaire public.',
    array['/assets/help/professional.svg'], false, 'published', 100, 'MOXT', now(), now()
  ),
  (
    'product-jobs-fr', 'product-jobs', 'jobs', 'fr',
    'Jobs : publier ou postuler',
    'Publiez une offre d’emploi ou postulez directement depuis MOXT.',
    E'1. Ouvrez Jobs depuis le menu Communauté.\n2. Pour recruter : publiez une offre (titre, description, ville, contrat).\n3. Pour postuler : filtrez les offres et envoyez votre candidature.\n4. Suivez vos candidatures envoyées ou reçues depuis Mes candidatures.\n5. Échangez avec l’autre partie via Messages.',
    array['/assets/help/jobs.svg'], false, 'published', 110, 'MOXT', now(), now()
  ),
  (
    'product-events-fr', 'product-events', 'events', 'fr',
    'Organiser ou rejoindre un événement',
    'Publiez un événement ou inscrivez-vous à ceux de la communauté.',
    E'1. Ouvrez Événements depuis le menu Communauté.\n2. Pour organiser : publiez votre événement (date, lieu, description).\n3. Pour participer : parcourez les événements et inscrivez-vous en un clic.\n4. Gérez vos inscriptions ou vos participants depuis la fiche événement.\n5. Recevez un rappel avant la date de l’événement.',
    array['/assets/help/events.svg'], false, 'published', 120, 'MOXT', now(), now()
  ),
  (
    'product-news-fr', 'product-news', 'news', 'fr',
    'Suivre et publier sur le fil d’actualité',
    'Partagez une publication et suivez l’actualité de la communauté MOXT.',
    E'1. Ouvrez Actualités depuis le menu Communauté.\n2. Publiez un message, une photo ou partagez une annonce/offre.\n3. Réagissez et commentez les publications de la communauté.\n4. Filtrez le fil par type de contenu (annonces, jobs, événements, posts libres).\n5. Gérez vos propres publications depuis Mes publications.',
    array['/assets/help/news.svg'], false, 'published', 130, 'MOXT', now(), now()
  ),
  (
    'product-verification-fr', 'product-verification', 'verification', 'fr',
    'Vérifier mon identité',
    'Faites vérifier votre profil pour débloquer la confiance et les plafonds élevés.',
    E'1. Ouvrez Vérification depuis le menu Compte.\n2. Soumettez vos documents d’identité demandés.\n3. Suivez le statut de votre demande (en attente, vérifié, refusé).\n4. Une fois vérifié, votre badge apparaît sur votre profil public.\n5. La vérification augmente vos plafonds de transfert et la confiance des autres membres.',
    array['/assets/help/verification.svg'], false, 'published', 140, 'MOXT', now(), now()
  ),
  (
    'product-security-fr', 'product-security', 'security', 'fr',
    'Sécuriser mon compte',
    'Gérez votre mot de passe, vos appareils connectés et les alertes de sécurité.',
    E'1. Ouvrez Sécurité depuis le menu Compte.\n2. Changez votre mot de passe régulièrement.\n3. Consultez les appareils et sessions connectés à votre compte.\n4. Activez les alertes de sécurité par e-mail ou SMS.\n5. Signalez immédiatement toute activité suspecte au support.',
    array['/assets/help/security.svg'], false, 'published', 150, 'MOXT', now(), now()
  ),
  (
    'product-disputes-fr', 'product-disputes', 'disputes', 'fr',
    'Ouvrir et suivre un litige',
    'En cas de désaccord sur un transfert ou un échange P2P, ouvrez un litige encadré.',
    E'1. Depuis la fiche du transfert ou de la commande P2P concernée, choisissez Ouvrir un litige.\n2. Décrivez le problème et joignez vos preuves (captures, reçus).\n3. Suivez l’avancement depuis Litiges dans le menu Finances.\n4. Un membre de l’équipe MOXT peut être amené à arbitrer.\n5. La décision et son motif sont communiqués aux deux parties.',
    array['/assets/help/disputes.svg'], false, 'published', 160, 'MOXT', now(), now()
  ),
  (
    'product-subscriptions-fr', 'product-subscriptions', 'subscriptions', 'fr',
    'Gérer mes abonnements et notifications',
    'Suivez vos profils et entreprises préférés, et réglez vos alertes.',
    E'1. Ouvrez Abonnements depuis le menu Compte.\n2. Suivez un profil ou une entreprise pour être alerté de ses publications.\n3. Retrouvez vos abonnements actifs et désabonnez-vous à tout moment.\n4. Réglez le type de notifications reçues dans Paramètres.\n5. Consultez l’historique de vos notifications depuis Notifications.',
    array['/assets/help/subscriptions.svg'], false, 'published', 170, 'MOXT', now(), now()
  ),
  (
    'product-referral-fr', 'product-referral', 'referral', 'fr',
    'Inviter mes proches avec mon QR code',
    'Partagez votre QR code ou votre lien pour inviter vos proches sur MOXT.',
    E'1. Ouvrez QR & invitation depuis le menu Compte.\n2. Partagez votre QR code ou votre lien d’invitation.\n3. Téléchargez votre badge MOXT personnalisé pour le publier sur les réseaux sociaux.\n4. Suivez le nombre de personnes invitées depuis cette même page.\n5. Scannez le QR code d’un autre membre pour accéder directement à son profil.',
    array['/assets/help/referral.svg'], false, 'published', 180, 'MOXT', now(), now()
  )
on conflict (id) do nothing;

notify pgrst, 'reload schema';
