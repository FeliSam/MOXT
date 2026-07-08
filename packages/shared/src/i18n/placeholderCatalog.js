// Placeholders UI (FR source → EN / RU / PT).
// Branchés dans uiTranslations via PLACEHOLDER_CATALOGS.
// Inclut les variantes … / ... lorsqu’elles coexistent dans le JSX.

const EN = {
  // Search
  'Recherche globale': 'Global search',
  Rechercher: 'Search',
  'Rechercher...': 'Search...',
  'Rechercher : Cotonou, colis, job, paramètres, sécurité, profil...':
    'Search: Cotonou, parcel, job, settings, security, profile...',
  'Rechercher : iPhone, coiffure, appartement, électricien...':
    'Search: iPhone, haircut, apartment, electrician...',
  'Rechercher un service...': 'Search for a service...',
  'Rechercher un transfert...': 'Search for a transfer...',
  'Rechercher transferts, annonces, colis...': 'Search transfers, listings, parcels...',
  'Rechercher titre, ville, catégorie...': 'Search title, city, category...',
  'Rechercher titre, entreprise, ville...': 'Search title, company, city...',
  'Rechercher une conversation': 'Search conversations',
  'Rechercher dans la FAQ...': 'Search the FAQ...',
  'Nom, service, ville...': 'Name, service, city...',
  'Entreprise, service, domaine ou ville...': 'Business, service, field or city...',
  'Événement, organisateur, lieu ou ville...': 'Event, organizer, venue or city...',
  'Métier, entreprise, secteur, compétence...': 'Role, company, industry, skill...',
  'Pays, ville, voyageur, entreprise...': 'Country, city, traveler, business...',
  'Ville ou pays': 'City or country',
  'Ville...': 'City...',
  'Devise, méthode, utilisateur ou condition...': 'Currency, method, user or condition...',
  'Échangeur, ville ou délai...': 'Exchanger, city or ETA...',
  'Référence, destinataire ou opération...': 'Reference, recipient or operation...',
  'Prix min': 'Min price',
  'Prix max': 'Max price',
  'Choisir une ville...': 'Choose a city...',
  'Moscou, Kazan, Khimki, Москва...': 'Moscow, Kazan, Khimki, Москва...',
  'Mobile Money, banque...': 'Mobile Money, bank...',

  // Auth / profile
  'nom@example.com ou +7XXXXXXXXXX': 'name@example.com or +7XXXXXXXXXX',
  'Votre prénom': 'Your first name',
  'Votre nom': 'Your last name',
  Moscou: 'Moscow',
  'ID utilisateur': 'User ID',

  // Messages / reviews
  'Écrire un message…': 'Write a message…',
  'Écrire un message...': 'Write a message...',
  'Cette conversation est bloquée': 'This conversation is blocked',
  'Votre message...': 'Your message...',
  'Écrire un commentaire…': 'Write a comment…',
  'Écrire un commentaire...': 'Write a comment...',
  'Rédigez votre message…': 'Write your message…',
  'Rédigez votre message...': 'Write your message...',
  'Partagez votre expérience avec ce profil…': 'Share your experience with this profile…',
  'Votre expérience...': 'Your experience...',
  'Répondez de manière professionnelle à cet avis…':
    'Reply professionally to this review…',
  'Expliquez pourquoi cet avis vous semble injuste ou non conforme (min. 10 caractères)…':
    'Explain why this review seems unfair or non-compliant (min. 10 characters)…',
  'Comportement abusif, spam, harcèlement…': 'Abusive behavior, spam, harassment…',
  'Décrivez le comportement problématique…': 'Describe the problematic behavior…',
  'Demandez quelque chose à l’assistant…': 'Ask the assistant something…',
  "Demandez quelque chose à l'assistant…": 'Ask the assistant something…',

  // Support / disputes / admin
  Répondre: 'Reply',
  'Votre réponse...': 'Your reply...',
  'Résumé de votre problème': 'Summary of your issue',
  'Décrivez votre problème en détail...': 'Describe your issue in detail...',
  'Décrivez précisément le problème': 'Describe the issue precisely',
  'Votre commentaire': 'Your comment',
  'Reponse au ticket...': 'Reply to ticket...',
  'Réponse au ticket...': 'Reply to ticket...',
  'Reponse rapide...': 'Quick reply...',
  'Réponse rapide...': 'Quick reply...',
  'Ex: TRF-ABC123': 'Ex: TRF-ABC123',

  // Listing Q&A / marketplace
  'Demandez une précision sur l’état, la livraison ou la disponibilité...':
    'Ask about condition, delivery or availability...',
  "Demandez une précision sur l'état, la livraison ou la disponibilité...":
    'Ask about condition, delivery or availability...',
  'Répondez clairement pour aider les autres acheteurs...':
    'Reply clearly to help other buyers...',
  "Titre de l'annonce *": 'Listing title *',
  Description: 'Description',
  'Prix (RUB) *': 'Price (RUB) *',
  Ville: 'City',
  'Téléphone de contact': 'Contact phone',

  // Publish listing
  'Ex : Appartement 2 pièces meublé, Moscou Centre':
    'Ex: Furnished 2-room apartment, Moscow Center',
  'Ex : Toyota Camry 2020, 45 000 km, excellent état':
    'Ex: Toyota Camry 2020, 45,000 km, excellent condition',
  'Ex : Cours de français pour russophone — 1h':
    'Ex: French lessons for Russian speakers — 1h',
  'Ex : Riz parfumé du Bénin — livraison Moscou':
    'Ex: Fragrant rice from Benin — Moscow delivery',
  'Ex : iPhone 14 Pro 256 Go – Excellent état':
    'Ex: iPhone 14 Pro 256 GB – Excellent condition',
  'Ex : iPhone 14 Pro 256 Go Noir': 'Ex: iPhone 14 Pro 256 GB Black',
  'Surface, nombre de pièces, équipements, proximité des transports, charges…':
    'Area, rooms, amenities, transport access, charges…',
  "Historique d'entretien, équipements, points forts, raison de la vente…":
    'Service history, features, strengths, reason for sale…',
  'Déroulement de la prestation, compétences, expérience, tarif à l\'heure…':
    'How the service works, skills, experience, hourly rate…',
  'Composition, provenance, allergènes, mode de conservation…':
    'Ingredients, origin, allergens, storage…',
  'Décrivez votre annonce : état, accessoires inclus, raison de la vente…':
    'Describe your listing: condition, included accessories, reason for sale…',
  'Ex : Samsung, Nike…': 'Ex: Samsung, Nike…',
  'Ex : Galaxy S23, Air Max…': 'Ex: Galaxy S23, Air Max…',
  'Ex : Noir, Blanc…': 'Ex: Black, White…',
  'Ex : Moscou, Saint-Pétersbourg…': 'Ex: Moscow, Saint Petersburg…',
  'Ex : Tverski, Arbat…': 'Ex: Tverskoy, Arbat…',
  'Ex : Tverski, Zamoskvorechye…': 'Ex: Tverskoy, Zamoskvorechye…',
  'Ex : Tverskaya 12, appartement 45, Moscou':
    'Ex: Tverskaya 12, apt. 45, Moscow',
  'Ex : Tverskaya 12, app. 45, Moscou': 'Ex: Tverskaya 12, apt. 45, Moscow',
  'Ex : 300 (en RUB)': 'Ex: 300 (in RUB)',
  'Ex : 2-3 jours': 'Ex: 2-3 days',
  'Ex : 12 mois constructeur': 'Ex: 12-month manufacturer warranty',
  'Ex : Retour sous 7 jours, état neuf': 'Ex: Return within 7 days, like new',
  Optionnel: 'Optional',
  'Ex : 500 g, 1 L': 'Ex: 500 g, 1 L',
  'Ex : farine, œufs, sans gluten…': 'Ex: flour, eggs, gluten-free…',
  'Ex : lun-ven 9h-18h, sur RDV': 'Ex: Mon–Fri 9am–6pm, by appointment',
  'Ex : 1h, demi-journée': 'Ex: 1h, half-day',
  'Ex : 1 mois': 'Ex: 1 month',
  'Ex : PDF, MP4, ZIP': 'Ex: PDF, MP4, ZIP',
  'Ex : 250 Mo': 'Ex: 250 MB',
  'Ex : 2 (0 = RDC)': 'Ex: 2 (0 = ground floor)',
  'Ex : 15 000': 'Ex: 15,000',
  'Ex : 20': 'Ex: 20',
  'Ex : 10': 'Ex: 10',

  // Jobs
  'Ex : Développeur web, Professeur de français, Cuisinier…':
    'Ex: Web developer, French teacher, Cook…',
  "Missions, responsabilités, contexte de l'équipe…":
    'Duties, responsibilities, team context…',
  'Compétences, diplômes, qualités attendues…':
    'Skills, degrees, expected qualities…',
  'Logement, repas, transport, prime…': 'Housing, meals, transport, bonus…',
  'Ex : 95 000 RUB': 'Ex: 95,000 RUB',
  'Message de motivation (optionnel)': 'Cover message (optional)',

  // Events / posts
  'Ex : Fête nationale du Bénin à Moscou, Cours de russe…':
    'Ex: Benin National Day in Moscow, Russian class…',
  "Décrivez l'événement, son ambiance, ce que les participants vont vivre…":
    'Describe the event, atmosphere, and what guests will experience…',
  '18h00 - Accueil · 18h30 - Discours · 19h00 - Repas…':
    '6:00pm - Welcome · 6:30pm - Speech · 7:00pm - Dinner…',
  'Ex : DJ Soulful, Conférencier M. Dupont…': 'Ex: DJ Soulful, Speaker Mr Dupont…',
  'Ex : Maison de la culture africaine, Hôtel Cosmos…':
    'Ex: African Cultural Center, Hotel Cosmos…',
  'Ex : Prospekt Mira 150, Moscou': 'Ex: Prospekt Mira 150, Moscow',
  'Ex : Association MOXT, Club Africain…': 'Ex: MOXT Association, African Club…',
  'Téléphone ou email': 'Phone or email',
  'Donnez un titre accrocheur…': 'Write a catchy title…',
  'Partagez une info, une annonce, une actualité…':
    'Share news, a listing tip, or an update…',
  'Ex : événement, moscou, culture': 'Ex: event, moscow, culture',

  // Parcels
  'Ex : Pas de liquides, pas de matières dangereuses...':
    'Ex: No liquids, no hazardous materials...',
  'Photos demandées, emballage requis, modalités de remise...':
    'Photos required, packaging needed, handover details...',
  'Décrivez brièvement le contenu (vêtements, documents, etc.)':
    'Briefly describe the contents (clothes, documents, etc.)',

  // Transfers / accounts
  'Ex : Sberbank principal': 'Ex: Main Sberbank account',
  'Nom exact du compte': 'Exact account name',
  'Numéro de carte, compte ou ID client': 'Card number, account or client ID',
  'Agence, banque, ville ou précision': 'Branch, bank, city or details',
  'Référence à mettre, horaires, confirmation attendue...':
    'Reference to include, hours, expected confirmation...',
  Prénom: 'First name',
  Nom: 'Last name',
  'Ex. 125000': 'Ex. 125000',
  'ex. 50000': 'ex. 50000',

  // Business
  'Ex : Koudjo Transfer, Afrik Logistique...': 'Ex: Koudjo Transfer, Afrik Logistics...',
  'Rue, immeuble, metro ou repere': 'Street, building, metro or landmark',
  'Moscou, Saint-Petersbourg...': 'Moscow, Saint Petersburg...',
  'Nous proposons... Notre specialite est... Nous intervenons sur...':
    'We offer... Our specialty is... We operate in...',
  'Ex : 30-60 min': 'Ex: 30-60 min',
  'Ex. MOXT Corp': 'Ex. MOXT Corp',
  'Décrivez votre organisation...': 'Describe your organization...',
  'nom@exemple.com': 'name@example.com',
}

const RU = {
  'Recherche globale': 'Глобальный поиск',
  Rechercher: 'Поиск',
  'Rechercher...': 'Поиск...',
  'Rechercher : Cotonou, colis, job, paramètres, sécurité, profil...':
    'Поиск: Котону, посылка, работа, настройки, безопасность, профиль...',
  'Rechercher : iPhone, coiffure, appartement, électricien...':
    'Поиск: iPhone, стрижка, квартира, электрик...',
  'Rechercher un service...': 'Найти услугу...',
  'Rechercher un transfert...': 'Найти перевод...',
  'Rechercher transferts, annonces, colis...': 'Поиск переводов, объявлений, посылок...',
  'Rechercher titre, ville, catégorie...': 'Поиск по названию, городу, категории...',
  'Rechercher titre, entreprise, ville...': 'Поиск по названию, компании, городу...',
  'Rechercher une conversation': 'Найти диалог',
  'Rechercher dans la FAQ...': 'Поиск в FAQ...',
  'Nom, service, ville...': 'Имя, услуга, город...',
  'Entreprise, service, domaine ou ville...': 'Компания, услуга, сфера или город...',
  'Événement, organisateur, lieu ou ville...': 'Событие, организатор, место или город...',
  'Métier, entreprise, secteur, compétence...': 'Профессия, компания, отрасль, навык...',
  'Pays, ville, voyageur, entreprise...': 'Страна, город, путешественник, компания...',
  'Ville ou pays': 'Город или страна',
  'Ville...': 'Город...',
  'Devise, méthode, utilisateur ou condition...': 'Валюта, метод, пользователь или условие...',
  'Échangeur, ville ou délai...': 'Обменник, город или срок...',
  'Référence, destinataire ou opération...': 'Ссылка, получатель или операция...',
  'Prix min': 'Мин. цена',
  'Prix max': 'Макс. цена',
  'Choisir une ville...': 'Выберите город...',
  'Moscou, Kazan, Khimki, Москва...': 'Москва, Казань, Химки...',
  'Mobile Money, banque...': 'Mobile Money, банк...',

  'nom@example.com ou +7XXXXXXXXXX': 'name@example.com или +7XXXXXXXXXX',
  'Votre prénom': 'Ваше имя',
  'Votre nom': 'Ваша фамилия',
  Moscou: 'Москва',
  'ID utilisateur': 'ID пользователя',

  'Écrire un message…': 'Написать сообщение…',
  'Écrire un message...': 'Написать сообщение...',
  'Cette conversation est bloquée': 'Этот диалог заблокирован',
  'Votre message...': 'Ваше сообщение...',
  'Écrire un commentaire…': 'Написать комментарий…',
  'Écrire un commentaire...': 'Написать комментарий...',
  'Rédigez votre message…': 'Напишите сообщение…',
  'Rédigez votre message...': 'Напишите сообщение...',
  'Partagez votre expérience avec ce profil…': 'Поделитесь опытом с этим профилем…',
  'Votre expérience...': 'Ваш опыт...',
  'Répondez de manière professionnelle à cet avis…':
    'Ответьте профессионально на этот отзыв…',
  'Expliquez pourquoi cet avis vous semble injuste ou non conforme (min. 10 caractères)…':
    'Объясните, почему отзыв кажется несправедливым или некорректным (мин. 10 символов)…',
  'Comportement abusif, spam, harcèlement…': 'Оскорбления, спам, травля…',
  'Décrivez le comportement problématique…': 'Опишите проблемное поведение…',
  'Demandez quelque chose à l’assistant…': 'Спросите что-нибудь у ассистента…',
  "Demandez quelque chose à l'assistant…": 'Спросите что-нибудь у ассистента…',

  Répondre: 'Ответить',
  'Votre réponse...': 'Ваш ответ...',
  'Résumé de votre problème': 'Краткое описание проблемы',
  'Décrivez votre problème en détail...': 'Опишите проблему подробно...',
  'Décrivez précisément le problème': 'Опишите проблему точно',
  'Votre commentaire': 'Ваш комментарий',
  'Reponse au ticket...': 'Ответ на тикет...',
  'Réponse au ticket...': 'Ответ на тикет...',
  'Reponse rapide...': 'Быстрый ответ...',
  'Réponse rapide...': 'Быстрый ответ...',
  'Ex: TRF-ABC123': 'Напр.: TRF-ABC123',

  'Demandez une précision sur l’état, la livraison ou la disponibilité...':
    'Уточните состояние, доставку или наличие...',
  "Demandez une précision sur l'état, la livraison ou la disponibilité...":
    'Уточните состояние, доставку или наличие...',
  'Répondez clairement pour aider les autres acheteurs...':
    'Ответьте ясно, чтобы помочь другим покупателям...',
  "Titre de l'annonce *": 'Заголовок объявления *',
  Description: 'Описание',
  'Prix (RUB) *': 'Цена (RUB) *',
  Ville: 'Город',
  'Téléphone de contact': 'Контактный телефон',

  'Ex : Appartement 2 pièces meublé, Moscou Centre':
    'Напр.: Меблированная 2-комн. квартира, центр Москвы',
  'Ex : Toyota Camry 2020, 45 000 km, excellent état':
    'Напр.: Toyota Camry 2020, 45 000 км, отличное состояние',
  'Ex : Cours de français pour russophone — 1h':
    'Напр.: Уроки французского для русскоязычных — 1 ч',
  'Ex : Riz parfumé du Bénin — livraison Moscou':
    'Напр.: Ароматный рис из Бенина — доставка по Москве',
  'Ex : iPhone 14 Pro 256 Go – Excellent état':
    'Напр.: iPhone 14 Pro 256 ГБ – отличное состояние',
  'Ex : iPhone 14 Pro 256 Go Noir': 'Напр.: iPhone 14 Pro 256 ГБ чёрный',
  'Surface, nombre de pièces, équipements, proximité des transports, charges…':
    'Площадь, комнаты, удобства, транспорт, коммуналка…',
  "Historique d'entretien, équipements, points forts, raison de la vente…":
    'История обслуживания, оснащение, плюсы, причина продажи…',
  'Déroulement de la prestation, compétences, expérience, tarif à l\'heure…':
    'Ход услуги, навыки, опыт, почасовая ставка…',
  'Composition, provenance, allergènes, mode de conservation…':
    'Состав, происхождение, аллергены, хранение…',
  'Décrivez votre annonce : état, accessoires inclus, raison de la vente…':
    'Опишите объявление: состояние, комплектация, причина продажи…',
  'Ex : Samsung, Nike…': 'Напр.: Samsung, Nike…',
  'Ex : Galaxy S23, Air Max…': 'Напр.: Galaxy S23, Air Max…',
  'Ex : Noir, Blanc…': 'Напр.: Чёрный, белый…',
  'Ex : Moscou, Saint-Pétersbourg…': 'Напр.: Москва, Санкт-Петербург…',
  'Ex : Tverski, Arbat…': 'Напр.: Тверской, Арбат…',
  'Ex : Tverski, Zamoskvorechye…': 'Напр.: Тверской, Замоскворечье…',
  'Ex : Tverskaya 12, appartement 45, Moscou':
    'Напр.: Тверская 12, кв. 45, Москва',
  'Ex : Tverskaya 12, app. 45, Moscou': 'Напр.: Тверская 12, кв. 45, Москва',
  'Ex : 300 (en RUB)': 'Напр.: 300 (в RUB)',
  'Ex : 2-3 jours': 'Напр.: 2–3 дня',
  'Ex : 12 mois constructeur': 'Напр.: 12 месяцев гарантии производителя',
  'Ex : Retour sous 7 jours, état neuf': 'Напр.: Возврат за 7 дней, как новый',
  Optionnel: 'Необязательно',
  'Ex : 500 g, 1 L': 'Напр.: 500 г, 1 л',
  'Ex : farine, œufs, sans gluten…': 'Напр.: мука, яйца, без глютена…',
  'Ex : lun-ven 9h-18h, sur RDV': 'Напр.: пн–пт 9:00–18:00, по записи',
  'Ex : 1h, demi-journée': 'Напр.: 1 ч, полдня',
  'Ex : 1 mois': 'Напр.: 1 месяц',
  'Ex : PDF, MP4, ZIP': 'Напр.: PDF, MP4, ZIP',
  'Ex : 250 Mo': 'Напр.: 250 МБ',
  'Ex : 2 (0 = RDC)': 'Напр.: 2 (0 = 1-й этаж)',
  'Ex : 15 000': 'Напр.: 15 000',
  'Ex : 20': 'Напр.: 20',
  'Ex : 10': 'Напр.: 10',

  'Ex : Développeur web, Professeur de français, Cuisinier…':
    'Напр.: Веб-разработчик, преподаватель французского, повар…',
  "Missions, responsabilités, contexte de l'équipe…":
    'Задачи, обязанности, контекст команды…',
  'Compétences, diplômes, qualités attendues…':
    'Навыки, дипломы, ожидаемые качества…',
  'Logement, repas, transport, prime…': 'Жильё, питание, транспорт, премия…',
  'Ex : 95 000 RUB': 'Напр.: 95 000 RUB',
  'Message de motivation (optionnel)': 'Сопроводительное сообщение (необязательно)',

  'Ex : Fête nationale du Bénin à Moscou, Cours de russe…':
    'Напр.: Национальный день Бенина в Москве, курс русского…',
  "Décrivez l'événement, son ambiance, ce que les participants vont vivre…":
    'Опишите событие, атмосферу и впечатления участников…',
  '18h00 - Accueil · 18h30 - Discours · 19h00 - Repas…':
    '18:00 — Встреча · 18:30 — Речь · 19:00 — Ужин…',
  'Ex : DJ Soulful, Conférencier M. Dupont…':
    'Напр.: DJ Soulful, спикер г-н Дюпон…',
  'Ex : Maison de la culture africaine, Hôtel Cosmos…':
    'Напр.: Дом африканской культуры, отель Cosmos…',
  'Ex : Prospekt Mira 150, Moscou': 'Напр.: Проспект Мира 150, Москва',
  'Ex : Association MOXT, Club Africain…': 'Напр.: Ассоциация MOXT, Африканский клуб…',
  'Téléphone ou email': 'Телефон или email',
  'Donnez un titre accrocheur…': 'Придумайте яркий заголовок…',
  'Partagez une info, une annonce, une actualité…':
    'Поделитесь новостью, объявлением или обновлением…',
  'Ex : événement, moscou, culture': 'Напр.: событие, москва, культура',

  'Ex : Pas de liquides, pas de matières dangereuses...':
    'Напр.: Без жидкостей, без опасных веществ...',
  'Photos demandées, emballage requis, modalités de remise...':
    'Нужны фото, упаковка, условия передачи...',
  'Décrivez brièvement le contenu (vêtements, documents, etc.)':
    'Кратко опишите содержимое (одежда, документы и т.д.)',

  'Ex : Sberbank principal': 'Напр.: Основной Сбербанк',
  'Nom exact du compte': 'Точное имя счёта',
  'Numéro de carte, compte ou ID client': 'Номер карты, счёта или ID клиента',
  'Agence, banque, ville ou précision': 'Отделение, банк, город или уточнение',
  'Référence à mettre, horaires, confirmation attendue...':
    'Ссылка для платежа, часы, ожидаемое подтверждение...',
  Prénom: 'Имя',
  Nom: 'Фамилия',
  'Ex. 125000': 'Напр. 125000',
  'ex. 50000': 'напр. 50000',

  'Ex : Koudjo Transfer, Afrik Logistique...':
    'Напр.: Koudjo Transfer, Afrik Logistics...',
  'Rue, immeuble, metro ou repere': 'Улица, дом, метро или ориентир',
  'Moscou, Saint-Petersbourg...': 'Москва, Санкт-Петербург...',
  'Nous proposons... Notre specialite est... Nous intervenons sur...':
    'Мы предлагаем... Наша специализация... Мы работаем в...',
  'Ex : 30-60 min': 'Напр.: 30–60 мин',
  'Ex. MOXT Corp': 'Напр. MOXT Corp',
  'Décrivez votre organisation...': 'Опишите вашу организацию...',
  'nom@exemple.com': 'name@example.com',
}

const PT = {
  'Recherche globale': 'Pesquisa global',
  Rechercher: 'Pesquisar',
  'Rechercher...': 'Pesquisar...',
  'Rechercher : Cotonou, colis, job, paramètres, sécurité, profil...':
    'Pesquisar: Cotonou, encomenda, emprego, definições, segurança, perfil...',
  'Rechercher : iPhone, coiffure, appartement, électricien...':
    'Pesquisar: iPhone, cabeleireiro, apartamento, eletricista...',
  'Rechercher un service...': 'Pesquisar um serviço...',
  'Rechercher un transfert...': 'Pesquisar uma transferência...',
  'Rechercher transferts, annonces, colis...':
    'Pesquisar transferências, anúncios, encomendas...',
  'Rechercher titre, ville, catégorie...': 'Pesquisar título, cidade, categoria...',
  'Rechercher titre, entreprise, ville...': 'Pesquisar título, empresa, cidade...',
  'Rechercher une conversation': 'Buscar conversa',
  'Rechercher dans la FAQ...': 'Pesquisar na FAQ...',
  'Nom, service, ville...': 'Nome, serviço, cidade...',
  'Entreprise, service, domaine ou ville...': 'Empresa, serviço, área ou cidade...',
  'Événement, organisateur, lieu ou ville...': 'Evento, organizador, local ou cidade...',
  'Métier, entreprise, secteur, compétence...': 'Profissão, empresa, setor, competência...',
  'Pays, ville, voyageur, entreprise...': 'País, cidade, viajante, empresa...',
  'Ville ou pays': 'Cidade ou país',
  'Ville...': 'Cidade...',
  'Devise, méthode, utilisateur ou condition...':
    'Moeda, método, utilizador ou condição...',
  'Échangeur, ville ou délai...': 'Câmbio, cidade ou prazo...',
  'Référence, destinataire ou opération...': 'Referência, destinatário ou operação...',
  'Prix min': 'Preço mín.',
  'Prix max': 'Preço máx.',
  'Choisir une ville...': 'Escolher uma cidade...',
  'Moscou, Kazan, Khimki, Москва...': 'Moscovo, Kazan, Khimki, Москва...',
  'Mobile Money, banque...': 'Mobile Money, banco...',

  'nom@example.com ou +7XXXXXXXXXX': 'nome@example.com ou +7XXXXXXXXXX',
  'Votre prénom': 'O seu nome',
  'Votre nom': 'O seu apelido',
  Moscou: 'Moscovo',
  'ID utilisateur': 'ID do utilizador',

  'Écrire un message…': 'Escrever uma mensagem…',
  'Écrire un message...': 'Escrever uma mensagem...',
  'Cette conversation est bloquée': 'Esta conversa está bloqueada',
  'Votre message...': 'A sua mensagem...',
  'Écrire un commentaire…': 'Escrever um comentário…',
  'Écrire un commentaire...': 'Escrever um comentário...',
  'Rédigez votre message…': 'Escreva a sua mensagem…',
  'Rédigez votre message...': 'Escreva a sua mensagem...',
  'Partagez votre expérience avec ce profil…':
    'Partilhe a sua experiência com este perfil…',
  'Votre expérience...': 'A sua experiência...',
  'Répondez de manière professionnelle à cet avis…':
    'Responda de forma profissional a esta avaliação…',
  'Expliquez pourquoi cet avis vous semble injuste ou non conforme (min. 10 caractères)…':
    'Explique por que esta avaliação parece injusta ou incorreta (mín. 10 caracteres)…',
  'Comportement abusif, spam, harcèlement…': 'Comportamento abusivo, spam, assédio…',
  'Décrivez le comportement problématique…': 'Descreva o comportamento problemático…',
  'Demandez quelque chose à l’assistant…': 'Peça algo ao assistente…',
  "Demandez quelque chose à l'assistant…": 'Peça algo ao assistente…',

  Répondre: 'Responder',
  'Votre réponse...': 'A sua resposta...',
  'Résumé de votre problème': 'Resumo do seu problema',
  'Décrivez votre problème en détail...': 'Descreva o seu problema em detalhe...',
  'Décrivez précisément le problème': 'Descreva o problema com precisão',
  'Votre commentaire': 'O seu comentário',
  'Reponse au ticket...': 'Resposta ao ticket...',
  'Réponse au ticket...': 'Resposta ao ticket...',
  'Reponse rapide...': 'Resposta rápida...',
  'Réponse rapide...': 'Resposta rápida...',
  'Ex: TRF-ABC123': 'Ex.: TRF-ABC123',

  'Demandez une précision sur l’état, la livraison ou la disponibilité...':
    'Peça detalhes sobre estado, entrega ou disponibilidade...',
  "Demandez une précision sur l'état, la livraison ou la disponibilité...":
    'Peça detalhes sobre estado, entrega ou disponibilidade...',
  'Répondez clairement pour aider les autres acheteurs...':
    'Responda com clareza para ajudar outros compradores...',
  "Titre de l'annonce *": 'Título do anúncio *',
  Description: 'Descrição',
  'Prix (RUB) *': 'Preço (RUB) *',
  Ville: 'Cidade',
  'Téléphone de contact': 'Telefone de contacto',

  'Ex : Appartement 2 pièces meublé, Moscou Centre':
    'Ex.: Apartamento T2 mobilado, centro de Moscovo',
  'Ex : Toyota Camry 2020, 45 000 km, excellent état':
    'Ex.: Toyota Camry 2020, 45 000 km, excelente estado',
  'Ex : Cours de français pour russophone — 1h':
    'Ex.: Aulas de francês para falantes de russo — 1h',
  'Ex : Riz parfumé du Bénin — livraison Moscou':
    'Ex.: Arroz aromático do Benim — entrega em Moscovo',
  'Ex : iPhone 14 Pro 256 Go – Excellent état':
    'Ex.: iPhone 14 Pro 256 GB – Excelente estado',
  'Ex : iPhone 14 Pro 256 Go Noir': 'Ex.: iPhone 14 Pro 256 GB Preto',
  'Surface, nombre de pièces, équipements, proximité des transports, charges…':
    'Área, quartos, equipamentos, transportes, encargos…',
  "Historique d'entretien, équipements, points forts, raison de la vente…":
    'Histórico de manutenção, equipamentos, pontos fortes, motivo da venda…',
  'Déroulement de la prestation, compétences, expérience, tarif à l\'heure…':
    'Como funciona o serviço, competências, experiência, preço/hora…',
  'Composition, provenance, allergènes, mode de conservation…':
    'Composição, origem, alergénios, conservação…',
  'Décrivez votre annonce : état, accessoires inclus, raison de la vente…':
    'Descreva o anúncio: estado, acessórios incluídos, motivo da venda…',
  'Ex : Samsung, Nike…': 'Ex.: Samsung, Nike…',
  'Ex : Galaxy S23, Air Max…': 'Ex.: Galaxy S23, Air Max…',
  'Ex : Noir, Blanc…': 'Ex.: Preto, Branco…',
  'Ex : Moscou, Saint-Pétersbourg…': 'Ex.: Moscovo, São Petersburgo…',
  'Ex : Tverski, Arbat…': 'Ex.: Tverskoy, Arbat…',
  'Ex : Tverski, Zamoskvorechye…': 'Ex.: Tverskoy, Zamoskvorechye…',
  'Ex : Tverskaya 12, appartement 45, Moscou':
    'Ex.: Tverskaya 12, apt. 45, Moscovo',
  'Ex : Tverskaya 12, app. 45, Moscou': 'Ex.: Tverskaya 12, apt. 45, Moscovo',
  'Ex : 300 (en RUB)': 'Ex.: 300 (em RUB)',
  'Ex : 2-3 jours': 'Ex.: 2-3 dias',
  'Ex : 12 mois constructeur': 'Ex.: 12 meses de garantia do fabricante',
  'Ex : Retour sous 7 jours, état neuf': 'Ex.: Devolução em 7 dias, como novo',
  Optionnel: 'Opcional',
  'Ex : 500 g, 1 L': 'Ex.: 500 g, 1 L',
  'Ex : farine, œufs, sans gluten…': 'Ex.: farinha, ovos, sem glúten…',
  'Ex : lun-ven 9h-18h, sur RDV': 'Ex.: seg–sex 9h–18h, com marcação',
  'Ex : 1h, demi-journée': 'Ex.: 1h, meio dia',
  'Ex : 1 mois': 'Ex.: 1 mês',
  'Ex : PDF, MP4, ZIP': 'Ex.: PDF, MP4, ZIP',
  'Ex : 250 Mo': 'Ex.: 250 MB',
  'Ex : 2 (0 = RDC)': 'Ex.: 2 (0 = rés-do-chão)',
  'Ex : 15 000': 'Ex.: 15 000',
  'Ex : 20': 'Ex.: 20',
  'Ex : 10': 'Ex.: 10',

  'Ex : Développeur web, Professeur de français, Cuisinier…':
    'Ex.: Programador web, professor de francês, cozinheiro…',
  "Missions, responsabilités, contexte de l'équipe…":
    'Missões, responsabilidades, contexto da equipa…',
  'Compétences, diplômes, qualités attendues…':
    'Competências, diplomas, qualidades esperadas…',
  'Logement, repas, transport, prime…': 'Alojamento, refeições, transporte, bónus…',
  'Ex : 95 000 RUB': 'Ex.: 95 000 RUB',
  'Message de motivation (optionnel)': 'Mensagem de motivação (opcional)',

  'Ex : Fête nationale du Bénin à Moscou, Cours de russe…':
    'Ex.: Festa nacional do Benim em Moscovo, curso de russo…',
  "Décrivez l'événement, son ambiance, ce que les participants vont vivre…":
    'Descreva o evento, o ambiente e a experiência dos participantes…',
  '18h00 - Accueil · 18h30 - Discours · 19h00 - Repas…':
    '18h00 - Acolhimento · 18h30 - Discurso · 19h00 - Refeição…',
  'Ex : DJ Soulful, Conférencier M. Dupont…': 'Ex.: DJ Soulful, orador Sr. Dupont…',
  'Ex : Maison de la culture africaine, Hôtel Cosmos…':
    'Ex.: Casa da cultura africana, Hotel Cosmos…',
  'Ex : Prospekt Mira 150, Moscou': 'Ex.: Prospekt Mira 150, Moscovo',
  'Ex : Association MOXT, Club Africain…': 'Ex.: Associação MOXT, Clube Africano…',
  'Téléphone ou email': 'Telefone ou email',
  'Donnez un titre accrocheur…': 'Dê um título apelativo…',
  'Partagez une info, une annonce, une actualité…':
    'Partilhe uma info, um anúncio ou uma atualidade…',
  'Ex : événement, moscou, culture': 'Ex.: evento, moscovo, cultura',

  'Ex : Pas de liquides, pas de matières dangereuses...':
    'Ex.: Sem líquidos, sem materiais perigosos...',
  'Photos demandées, emballage requis, modalités de remise...':
    'Fotos pedidas, embalagem necessária, modalidades de entrega...',
  'Décrivez brièvement le contenu (vêtements, documents, etc.)':
    'Descreva brevemente o conteúdo (roupa, documentos, etc.)',

  'Ex : Sberbank principal': 'Ex.: Conta principal Sberbank',
  'Nom exact du compte': 'Nome exato da conta',
  'Numéro de carte, compte ou ID client': 'Número do cartão, conta ou ID do cliente',
  'Agence, banque, ville ou précision': 'Agência, banco, cidade ou detalhe',
  'Référence à mettre, horaires, confirmation attendue...':
    'Referência a indicar, horários, confirmação esperada...',
  Prénom: 'Nome',
  Nom: 'Apelido',
  'Ex. 125000': 'Ex. 125000',
  'ex. 50000': 'ex. 50000',

  'Ex : Koudjo Transfer, Afrik Logistique...':
    'Ex.: Koudjo Transfer, Afrik Logística...',
  'Rue, immeuble, metro ou repere': 'Rua, edifício, metro ou referência',
  'Moscou, Saint-Petersbourg...': 'Moscovo, São Petersburgo...',
  'Nous proposons... Notre specialite est... Nous intervenons sur...':
    'Oferecemos... A nossa especialidade é... Atuamos em...',
  'Ex : 30-60 min': 'Ex.: 30-60 min',
  'Ex. MOXT Corp': 'Ex. MOXT Corp',
  'Décrivez votre organisation...': 'Descreva a sua organização...',
  'nom@exemple.com': 'nome@exemplo.com',
}

export const PLACEHOLDER_CATALOGS = { en: EN, ru: RU, pt: PT }
