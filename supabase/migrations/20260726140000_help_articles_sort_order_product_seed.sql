-- Ordre des sessions d'aide produit + seed FR initial (Aide Moxt /aide).

alter table public.help_articles
  add column if not exists sort_order integer not null default 0;

create index if not exists help_articles_sort_order_idx on public.help_articles (sort_order);

-- Sessions produit (FR). Autres langues via /admin/guide.
insert into public.help_articles (
  id,
  translation_group_id,
  category,
  language,
  title,
  summary,
  content,
  pinned,
  status,
  sort_order,
  author_name,
  created_at,
  updated_at
)
values
  (
    'product-getting-started-fr',
    'product-getting-started',
    'getting_started',
    'fr',
    'Premiers pas sur MOXT',
    'Créez votre compte, complétez votre profil et découvrez l’accueil.',
    E'1. Créez un compte ou connectez-vous.\n2. Complétez votre profil (nom, photo, pays).\n3. Depuis le tableau de bord, explorez les services essentiels (transferts, marketplace, colis, messages).\n4. Activez les notifications pour ne rien manquer.\n5. En cas de besoin, ouvrez Support ou cette aide depuis le hub MOXT.',
    true,
    'published',
    10,
    'MOXT',
    now(),
    now()
  ),
  (
    'product-transfers-fr',
    'product-transfers',
    'transfers',
    'fr',
    'Envoyer et recevoir un transfert',
    'Publiez ou acceptez un transfert, suivez les étapes et échangez dans la messagerie.',
    E'1. Ouvrez Transferts depuis le menu ou le tableau de bord.\n2. Pour envoyer : créez un transfert (montant, devises, pays, destinataire).\n3. Pour recevoir : parcourez les offres ou répondez à une demande.\n4. Suivez le statut sur la fiche transfert et joignez les preuves demandées.\n5. Discutez avec l’autre partie via Messages si besoin.',
    false,
    'published',
    20,
    'MOXT',
    now(),
    now()
  ),
  (
    'product-marketplace-fr',
    'product-marketplace',
    'marketplace',
    'fr',
    'Marketplace : acheter et vendre',
    'Publiez une annonce, parcourez le catalogue et contactez un vendeur.',
    E'1. Ouvrez Marketplace.\n2. Pour vendre : Publier une annonce (photos, titre, prix, lieu).\n3. Pour acheter : filtrez par catégorie ou recherche, puis ouvrez une fiche.\n4. Contactez le vendeur depuis la fiche (messagerie).\n5. Retrouvez vos annonces dans Mes publications.',
    false,
    'published',
    30,
    'MOXT',
    now(),
    now()
  ),
  (
    'product-parcels-fr',
    'product-parcels',
    'parcels',
    'fr',
    'Colis et trajets',
    'Publiez un colis ou un trajet et mettez-vous d’accord avec un voyageur.',
    E'1. Ouvrez Colis.\n2. Publiez un colis à envoyer ou un trajet disponible.\n3. Consultez les détails (origine, destination, dates).\n4. Contactez l’autre personne via Messages pour convenir du rendez-vous.\n5. Suivez le statut jusqu’à la remise.',
    false,
    'published',
    40,
    'MOXT',
    now(),
    now()
  ),
  (
    'product-messages-fr',
    'product-messages',
    'messages',
    'fr',
    'Messagerie et support',
    'Échangez avec les membres, filtrez vos conversations et contactez le support.',
    E'1. Ouvrez Messages depuis la barre de navigation.\n2. Utilisez les filtres (transferts, P2P, support) pour retrouver une conversation.\n3. Envoyez texte, photos ou documents selon le besoin.\n4. Pour l’équipe MOXT : Support ou Contribute ouvre une conversation dédiée.\n5. Les notifications vous alertent des nouveaux messages.',
    false,
    'published',
    50,
    'MOXT',
    now(),
    now()
  )
on conflict (id) do nothing;

notify pgrst, 'reload schema';
