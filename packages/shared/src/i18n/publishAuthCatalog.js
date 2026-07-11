// Publication forms, OTP/Telegram register, auth errors & toasts (FR → EN / RU / PT).
// Merged into uiTranslations via PUBLISH_AUTH_CATALOGS.
// Includes … / ... and ’ / ' variants when both appear in the UX.

const EN = {
  // Register / OTP toasts & UI
  'E-mail indisponible': 'Email unavailable',
  'La vérification par e-mail est indisponible. Nous avons basculé vers Telegram — réessayez.':
    'Email verification is unavailable. We switched to Telegram — please try again.',
  'Postbox n’a pas encore validé le domaine (DKIM). Utilisez le SMS pour l’instant, ou lancez npm run setup:postbox puis réessayez.':
    'Postbox has not validated the domain yet (DKIM). Use SMS for now, or run npm run setup:postbox then try again.',
  'SMS indisponible': 'SMS unavailable',
  'L’envoi SMS n’est pas disponible. Choisissez « Par Telegram » (déjà sélectionné) puis réessayez.':
    'SMS sending is unavailable. Choose “Via Telegram” (already selected) then try again.',
  "L'envoi SMS n'est pas disponible. Choisissez « Par Telegram » (déjà sélectionné) puis réessayez.":
    'SMS sending is unavailable. Choose “Via Telegram” (already selected) then try again.',
  'Connexion Google': 'Google sign-in',
  'Impossible de récupérer votre profil Google. Réessayez ou inscrivez-vous par e-mail.':
    'Could not retrieve your Google profile. Try again or sign up with email.',
  'Code Telegram envoyé': 'Telegram code sent',
  'Consultez Telegram sur le numéro associé à votre compte.':
    'Check Telegram on the number linked to your account.',
  'Envoi Telegram impossible': 'Could not send via Telegram',
  'Code renvoyé': 'Code resent',
  'Un nouveau code a été envoyé sur Telegram.': 'A new code has been sent on Telegram.',
  'Code non envoyé': 'Code not sent',
  'Attendez l’envoi Telegram ou renvoyez le code.':
    'Wait for the Telegram message or resend the code.',
  "Attendez l'envoi Telegram ou renvoyez le code.":
    'Wait for the Telegram message or resend the code.',
  'Compte créé': 'Account created',
  'Votre compte est actif. Vous pourrez confirmer votre e-mail plus tard dans Sécurité.':
    'Your account is active. You can confirm your email later in Security.',
  'Par Telegram': 'Via Telegram',
  'Confirmez via Telegram': 'Confirm via Telegram',
  'Code reçu sur Telegram': 'Code received on Telegram',
  'Renvoyer le code Telegram': 'Resend Telegram code',
  'Confirmer et accéder à MOXT': 'Confirm and enter MOXT',
  'Créer et confirmer': 'Create and confirm',
  Identité: 'Identity',
  Résidence: 'Residence',
  Vérification: 'Verification',
  Inscription: 'Sign up',
  'Créer votre compte MOXT': 'Create your MOXT account',
  "S'inscrire avec Google": 'Sign up with Google',
  'ou avec votre email': 'or with your email',
  'Compte déjà existant': 'Account already exists',
  'Réessayez dans quelques instants.': 'Please try again in a moment.',

  // Publish toasts & UI
  'Publication entreprise impossible': 'Business publishing unavailable',
  'Votre entreprise doit être vérifiée par MOXT avant de publier au nom de l’entreprise.':
    'Your business must be verified by MOXT before publishing on behalf of the company.',
  "Votre entreprise doit être vérifiée par MOXT avant de publier au nom de l'entreprise.":
    'Your business must be verified by MOXT before publishing on behalf of the company.',
  'Votre entreprise doit être vérifiée et disposer du module Jobs avant publication.':
    'Your business must be verified and have the Jobs module before publishing.',
  'Fichier trop volumineux': 'File too large',
  'La preuve de voyage ne doit pas dépasser 5 Mo.':
    'Travel proof must not exceed 5 MB.',
  'Preuve ajoutée': 'Proof added',
  'Le document de voyage a été envoyé.': 'The travel document has been uploaded.',
  'Envoi impossible': 'Send failed',
  "La preuve de voyage n'a pas pu être envoyée.": 'The travel proof could not be uploaded.',
  'La preuve de voyage n’a pas pu être envoyée.': 'The travel proof could not be uploaded.',
  'Publier une annonce': 'Publish a listing',
  'Publier un voyage': 'Publish a trip',
  "Publier une offre d'emploi": 'Publish a job offer',
  "Créer l'événement": 'Create the event',
  'Créer l’événement': 'Create the event',
  'Publication...': 'Publishing...',
  'Publication…': 'Publishing…',
  "Publier l'annonce": 'Publish listing',
  'Publier l’annonce': 'Publish listing',
  'Publier le voyage': 'Publish trip',
  "Publier l'offre": 'Publish offer',
  'Publier l’offre': 'Publish offer',
  Précédent: 'Previous',
  Type: 'Type',
  Détails: 'Details',
  Photos: 'Photos',
  Localisation: 'Location',
  Trajet: 'Route',
  Colis: 'Parcels',
  Conditions: 'Terms',
  Valider: 'Review',
  "L'offre": 'The offer',
  'L’offre': 'The offer',
  Lieu: 'Place',
  "L'événement": 'The event',
  'L’événement': 'The event',
  Programme: 'Schedule',
  'Lieu & accès': 'Venue & access',
  'Choisissez une catégorie.': 'Choose a category.',
  'Titre trop court (4 caractères min).': 'Title too short (min. 4 characters).',
  'Annonce publiée': 'Listing published',
  'Voyage publié': 'Trip published',
  'Offre publiée': 'Offer published',
  'Événement publié': 'Event published',
  'Votre annonce est en ligne.': 'Your listing is live.',
  'Votre voyage est en ligne.': 'Your trip is live.',
  'Votre offre est en ligne.': 'Your offer is live.',
  'Votre événement est en ligne.': 'Your event is live.',

  // Auth / forgot / errors (translateAuthError.js + related UI)
  'Les inscriptions sont temporairement désactivées. Réessayez plus tard.':
    'Sign-ups are temporarily disabled. Please try again later.',
  'La connexion par numéro est désactivée côté serveur. Utilisez votre e-mail, ou réessayez après activation Phone dans Supabase Auth.':
    'Phone sign-in is disabled on the server. Use your email, or try again after enabling Phone in Supabase Auth.',
  "L'envoi SMS est indisponible. Choisissez « Par Telegram » pour confirmer votre numéro, ou réessayez plus tard.":
    'SMS sending is unavailable. Choose “Via Telegram” to confirm your number, or try again later.',
  'L’envoi SMS est indisponible. Choisissez « Par Telegram » pour confirmer votre numéro, ou réessayez plus tard.':
    'SMS sending is unavailable. Choose “Via Telegram” to confirm your number, or try again later.',
  "Le service d'inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard.":
    'Email registration is unavailable. Use phone verification or try again later.',
  'Le service d’inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard.':
    'Email registration is unavailable. Use phone verification or try again later.',
  'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec majuscule, minuscule et chiffre.':
    'Password is too weak. Use at least 8 characters with uppercase, lowercase and a number.',
  "Le code est invalide ou a expiré. Recommencez le processus d'inscription.":
    'The code is invalid or has expired. Restart the registration process.',
  'Le code est invalide ou a expiré. Recommencez le processus d’inscription.':
    'The code is invalid or has expired. Restart the registration process.',
  "Configuration du service d'authentification incorrecte. Réessayez plus tard ou contactez le support.":
    'Authentication service misconfiguration. Try again later or contact support.',
  'Configuration du service d’authentification incorrecte. Réessayez plus tard ou contactez le support.':
    'Authentication service misconfiguration. Try again later or contact support.',
  'Une erreur est survenue. Veuillez réessayer.': 'Something went wrong. Please try again.',
  "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail.":
    'Your email address has not been confirmed yet. Check your inbox.',
  'Votre adresse e-mail n’a pas encore été confirmée. Vérifiez votre boîte mail.':
    'Your email address has not been confirmed yet. Check your inbox.',
  'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.':
    'Incorrect credentials. Check your email and password.',
  'Identifiants incorrects. Vérifiez votre e-mail / numéro ou votre mot de passe.':
    'Incorrect credentials. Check your email / number or password.',
  'Identifiants incorrects. Vérifiez votre numéro et mot de passe.':
    'Incorrect credentials. Check your number and password.',
  'Trop de tentatives. Patientez quelques minutes avant de réessayer.':
    'Too many attempts. Wait a few minutes before trying again.',
  'Le mot de passe doit contenir au moins 6 caractères.':
    'Password must contain at least 6 characters.',
  'Numéro de téléphone invalide. Vérifiez le format (+7XXXXXXXXXX).':
    'Invalid phone number. Check the format (+7XXXXXXXXXX).',
  'Configuration du service incorrecte. Utilisez la vérification par téléphone.':
    'Service misconfiguration. Use phone verification.',
  'Demande enregistrée': 'Request recorded',
  'Consultez votre messagerie pour poursuivre la récupération.':
    'Check your inbox to continue recovery.',
  'Mot de passe oublié': 'Forgot password',
  'Mot de passe oublie': 'Forgot password',
  'Demander un lien': 'Request a link',

  // Favorites / verification welcome
  Enregistré: 'Saved',
  'Ajouter aux favoris': 'Add to favorites',
  'Retirer des favoris': 'Remove from favorites',
  Aimer: 'Like',
  'Retirer le like': 'Unlike',
  'Chargement...': 'Loading...',
  'Chargement…': 'Loading…',
  'Vérification réussie': 'Verification successful',
  'Bienvenue sur MOXT': 'Welcome to MOXT',
  'Un nouvel e-mail a été envoyé à {email}.': 'A new email was sent to {email}.',
  'Un nouveau SMS a été envoyé au {phone}.': 'A new SMS was sent to {phone}.',
  'Synchronisation…': 'Syncing…',
  'Charger les messages précédents': 'Load earlier messages',
}

const RU = {
  'E-mail indisponible': 'Электронная почта недоступна',
  'La vérification par e-mail est indisponible. Nous avons basculé vers Telegram — réessayez.':
    'Проверка по электронной почте недоступна. Мы переключились на Telegram — попробуйте снова.',
  'Postbox n’a pas encore validé le domaine (DKIM). Utilisez le SMS pour l’instant, ou lancez npm run setup:postbox puis réessayez.':
    'Postbox ещё не подтвердил домен (DKIM). Пока используйте SMS или выполните npm run setup:postbox и повторите.',
  'SMS indisponible': 'SMS недоступны',
  'L’envoi SMS n’est pas disponible. Choisissez « Par Telegram » (déjà sélectionné) puis réessayez.':
    'Отправка SMS недоступна. Выберите « Через Telegram » (уже выбрано) и попробуйте снова.',
  "L'envoi SMS n'est pas disponible. Choisissez « Par Telegram » (déjà sélectionné) puis réessayez.":
    'Отправка SMS недоступна. Выберите « Через Telegram » (уже выбрано) и попробуйте снова.',
  'Connexion Google': 'Вход через Google',
  'Impossible de récupérer votre profil Google. Réessayez ou inscrivez-vous par e-mail.':
    'Не удалось получить профиль Google. Попробуйте снова или зарегистрируйтесь по электронной почте.',
  'Code Telegram envoyé': 'Код Telegram отправлен',
  'Consultez Telegram sur le numéro associé à votre compte.':
    'Проверьте Telegram на номере, связанном с вашим аккаунтом.',
  'Envoi Telegram impossible': 'Не удалось отправить через Telegram',
  'Code renvoyé': 'Код отправлен повторно',
  'Un nouveau code a été envoyé sur Telegram.': 'Новый код отправлен в Telegram.',
  'Code non envoyé': 'Код не отправлен',
  'Attendez l’envoi Telegram ou renvoyez le code.':
    'Дождитесь сообщения в Telegram или отправьте код повторно.',
  "Attendez l'envoi Telegram ou renvoyez le code.":
    'Дождитесь сообщения в Telegram или отправьте код повторно.',
  'Compte créé': 'Аккаунт создан',
  'Votre compte est actif. Vous pourrez confirmer votre e-mail plus tard dans Sécurité.':
    'Ваш аккаунт активен. Подтвердить электронную почту можно позже в разделе «Безопасность».',
  'Par Telegram': 'Через Telegram',
  'Confirmez via Telegram': 'Подтвердите через Telegram',
  'Code reçu sur Telegram': 'Код получен в Telegram',
  'Renvoyer le code Telegram': 'Отправить код Telegram повторно',
  'Confirmer et accéder à MOXT': 'Подтвердить и войти в MOXT',
  'Créer et confirmer': 'Создать и подтвердить',
  Identité: 'Личность',
  Résidence: 'Проживание',
  Vérification: 'Проверка',
  Inscription: 'Регистрация',
  'Créer votre compte MOXT': 'Создайте аккаунт MOXT',
  "S'inscrire avec Google": 'Зарегистрироваться через Google',
  'ou avec votre email': 'или по электронной почте',
  'Compte déjà existant': 'Аккаунт уже существует',
  'Réessayez dans quelques instants.': 'Попробуйте снова через несколько мгновений.',

  'Publication entreprise impossible': 'Публикация от имени компании недоступна',
  'Votre entreprise doit être vérifiée par MOXT avant de publier au nom de l’entreprise.':
    'Ваша компания должна быть проверена MOXT, прежде чем публиковать от её имени.',
  "Votre entreprise doit être vérifiée par MOXT avant de publier au nom de l'entreprise.":
    'Ваша компания должна быть проверена MOXT, прежде чем публиковать от её имени.',
  'Votre entreprise doit être vérifiée et disposer du module Jobs avant publication.':
    'Ваша компания должна быть проверена и иметь модуль Jobs перед публикацией.',
  'Fichier trop volumineux': 'Файл слишком большой',
  'La preuve de voyage ne doit pas dépasser 5 Mo.':
    'Документ о поездке не должен превышать 5 МБ.',
  'Preuve ajoutée': 'Подтверждение добавлено',
  'Le document de voyage a été envoyé.': 'Документ о поездке отправлен.',
  'Envoi impossible': 'Отправка не удалась',
  "La preuve de voyage n'a pas pu être envoyée.": 'Не удалось отправить подтверждение поездки.',
  'La preuve de voyage n’a pas pu être envoyée.': 'Не удалось отправить подтверждение поездки.',
  'Publier une annonce': 'Опубликовать объявление',
  'Publier un voyage': 'Опубликовать поездку',
  "Publier une offre d'emploi": 'Опубликовать вакансию',
  "Créer l'événement": 'Создать событие',
  'Créer l’événement': 'Создать событие',
  'Publication...': 'Публикация...',
  'Publication…': 'Публикация…',
  "Publier l'annonce": 'Опубликовать объявление',
  'Publier l’annonce': 'Опубликовать объявление',
  'Publier le voyage': 'Опубликовать поездку',
  "Publier l'offre": 'Опубликовать предложение',
  'Publier l’offre': 'Опубликовать предложение',
  Précédent: 'Назад',
  Type: 'Тип',
  Détails: 'Детали',
  Photos: 'Фото',
  Localisation: 'Местоположение',
  Trajet: 'Маршрут',
  Colis: 'Посылки',
  Conditions: 'Условия',
  Valider: 'Проверка',
  "L'offre": 'Вакансия',
  'L’offre': 'Вакансия',
  Lieu: 'Место',
  "L'événement": 'Событие',
  'L’événement': 'Событие',
  Programme: 'Программа',
  'Lieu & accès': 'Место и доступ',
  'Choisissez une catégorie.': 'Выберите категорию.',
  'Titre trop court (4 caractères min).': 'Слишком короткий заголовок (мин. 4 символа).',
  'Annonce publiée': 'Объявление опубликовано',
  'Voyage publié': 'Поездка опубликована',
  'Offre publiée': 'Предложение опубликовано',
  'Événement publié': 'Событие опубликовано',
  'Votre annonce est en ligne.': 'Ваше объявление онлайн.',
  'Votre voyage est en ligne.': 'Ваша поездка онлайн.',
  'Votre offre est en ligne.': 'Ваше предложение онлайн.',
  'Votre événement est en ligne.': 'Ваше событие онлайн.',

  'Les inscriptions sont temporairement désactivées. Réessayez plus tard.':
    'Регистрация временно отключена. Попробуйте позже.',
  'La connexion par numéro est désactivée côté serveur. Utilisez votre e-mail, ou réessayez après activation Phone dans Supabase Auth.':
    'Вход по номеру отключён на сервере. Используйте электронную почту или повторите попытку после включения Phone в Supabase Auth.',
  "L'envoi SMS est indisponible. Choisissez « Par Telegram » pour confirmer votre numéro, ou réessayez plus tard.":
    'Отправка SMS недоступна. Выберите « Через Telegram », чтобы подтвердить номер, или попробуйте позже.',
  'L’envoi SMS est indisponible. Choisissez « Par Telegram » pour confirmer votre numéro, ou réessayez plus tard.':
    'Отправка SMS недоступна. Выберите « Через Telegram », чтобы подтвердить номер, или попробуйте позже.',
  "Le service d'inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard.":
    'Регистрация по электронной почте недоступна. Используйте проверку по телефону или попробуйте позже.',
  'Le service d’inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard.':
    'Регистрация по электронной почте недоступна. Используйте проверку по телефону или попробуйте позже.',
  'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec majuscule, minuscule et chiffre.':
    'Пароль слишком слабый. Используйте не менее 8 символов с заглавной, строчной буквой и цифрой.',
  "Le code est invalide ou a expiré. Recommencez le processus d'inscription.":
    'Код недействителен или истёк. Начните регистрацию заново.',
  'Le code est invalide ou a expiré. Recommencez le processus d’inscription.':
    'Код недействителен или истёк. Начните регистрацию заново.',
  "Configuration du service d'authentification incorrecte. Réessayez plus tard ou contactez le support.":
    'Неверная конфигурация службы аутентификации. Попробуйте позже или обратитесь в поддержку.',
  'Configuration du service d’authentification incorrecte. Réessayez plus tard ou contactez le support.':
    'Неверная конфигурация службы аутентификации. Попробуйте позже или обратитесь в поддержку.',
  'Une erreur est survenue. Veuillez réessayer.': 'Произошла ошибка. Пожалуйста, попробуйте снова.',
  "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail.":
    'Адрес электронной почты ещё не подтверждён. Проверьте почтовый ящик.',
  'Votre adresse e-mail n’a pas encore été confirmée. Vérifiez votre boîte mail.':
    'Адрес электронной почты ещё не подтверждён. Проверьте почтовый ящик.',
  'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.':
    'Неверные учётные данные. Проверьте электронную почту и пароль.',
  'Identifiants incorrects. Vérifiez votre e-mail / numéro ou votre mot de passe.':
    'Неверные учётные данные. Проверьте электронную почту / номер или пароль.',
  'Identifiants incorrects. Vérifiez votre numéro et mot de passe.':
    'Неверные учётные данные. Проверьте номер и пароль.',
  'Trop de tentatives. Patientez quelques minutes avant de réessayer.':
    'Слишком много попыток. Подождите несколько минут перед повтором.',
  'Le mot de passe doit contenir au moins 6 caractères.':
    'Пароль должен содержать не менее 6 символов.',
  'Numéro de téléphone invalide. Vérifiez le format (+7XXXXXXXXXX).':
    'Неверный номер телефона. Проверьте формат (+7XXXXXXXXXX).',
  'Configuration du service incorrecte. Utilisez la vérification par téléphone.':
    'Неверная конфигурация службы. Используйте проверку по телефону.',
  'Demande enregistrée': 'Запрос зарегистрирован',
  'Consultez votre messagerie pour poursuivre la récupération.':
    'Проверьте почту, чтобы продолжить восстановление.',
  'Mot de passe oublié': 'Забыли пароль',
  'Mot de passe oublie': 'Забыли пароль',
  'Demander un lien': 'Запросить ссылку',

  Enregistré: 'Сохранено',
  'Ajouter aux favoris': 'Добавить в избранное',
  'Retirer des favoris': 'Убрать из избранного',
  Aimer: 'Нравится',
  'Retirer le like': 'Убрать лайк',
  'Chargement...': 'Загрузка...',
  'Chargement…': 'Загрузка…',
  'Vérification réussie': 'Проверка успешна',
  'Bienvenue sur MOXT': 'Добро пожаловать в MOXT',
  'Un nouvel e-mail a été envoyé à {email}.': 'Новое письмо отправлено на {email}.',
  'Un nouveau SMS a été envoyé au {phone}.': 'Новое SMS отправлено на {phone}.',
  'Synchronisation…': 'Синхронизация…',
  'Charger les messages précédents': 'Загрузить предыдущие сообщения',
}

const PT = {
  'E-mail indisponible': 'E-mail indisponível',
  'La vérification par e-mail est indisponible. Nous avons basculé vers Telegram — réessayez.':
    'A verificação por e-mail está indisponível. Mudámos para o Telegram — tente novamente.',
  'Postbox n’a pas encore validé le domaine (DKIM). Utilisez le SMS pour l’instant, ou lancez npm run setup:postbox puis réessayez.':
    'O Postbox ainda não validou o domínio (DKIM). Use SMS por agora ou execute npm run setup:postbox e tente de novo.',
  'SMS indisponible': 'SMS indisponível',
  'L’envoi SMS n’est pas disponible. Choisissez « Par Telegram » (déjà sélectionné) puis réessayez.':
    'O envio de SMS não está disponível. Escolha « Via Telegram » (já selecionado) e tente novamente.',
  "L'envoi SMS n'est pas disponible. Choisissez « Par Telegram » (déjà sélectionné) puis réessayez.":
    'O envio de SMS não está disponível. Escolha « Via Telegram » (já selecionado) e tente novamente.',
  'Connexion Google': 'Início de sessão Google',
  'Impossible de récupérer votre profil Google. Réessayez ou inscrivez-vous par e-mail.':
    'Não foi possível obter o seu perfil Google. Tente novamente ou registe-se por e-mail.',
  'Code Telegram envoyé': 'Código Telegram enviado',
  'Consultez Telegram sur le numéro associé à votre compte.':
    'Consulte o Telegram no número associado à sua conta.',
  'Envoi Telegram impossible': 'Envio pelo Telegram impossível',
  'Code renvoyé': 'Código reenviado',
  'Un nouveau code a été envoyé sur Telegram.': 'Um novo código foi enviado no Telegram.',
  'Code non envoyé': 'Código não enviado',
  'Attendez l’envoi Telegram ou renvoyez le code.':
    'Aguarde o envio pelo Telegram ou reenvie o código.',
  "Attendez l'envoi Telegram ou renvoyez le code.":
    'Aguarde o envio pelo Telegram ou reenvie o código.',
  'Compte créé': 'Conta criada',
  'Votre compte est actif. Vous pourrez confirmer votre e-mail plus tard dans Sécurité.':
    'A sua conta está ativa. Pode confirmar o e-mail mais tarde em Segurança.',
  'Par Telegram': 'Via Telegram',
  'Confirmez via Telegram': 'Confirme via Telegram',
  'Code reçu sur Telegram': 'Código recebido no Telegram',
  'Renvoyer le code Telegram': 'Reenviar o código Telegram',
  'Confirmer et accéder à MOXT': 'Confirmar e aceder ao MOXT',
  'Créer et confirmer': 'Criar e confirmar',
  Identité: 'Identidade',
  Résidence: 'Residência',
  Vérification: 'Verificação',
  Inscription: 'Registo',
  'Créer votre compte MOXT': 'Crie a sua conta MOXT',
  "S'inscrire avec Google": 'Registar-se com Google',
  'ou avec votre email': 'ou com o seu e-mail',
  'Compte déjà existant': 'Conta já existente',
  'Réessayez dans quelques instants.': 'Tente novamente dentro de momentos.',

  'Publication entreprise impossible': 'Publicação empresarial impossível',
  'Votre entreprise doit être vérifiée par MOXT avant de publier au nom de l’entreprise.':
    'A sua empresa deve ser verificada pelo MOXT antes de publicar em nome da empresa.',
  "Votre entreprise doit être vérifiée par MOXT avant de publier au nom de l'entreprise.":
    'A sua empresa deve ser verificada pelo MOXT antes de publicar em nome da empresa.',
  'Votre entreprise doit être vérifiée et disposer du module Jobs avant publication.':
    'A sua empresa deve ser verificada e ter o módulo Jobs antes da publicação.',
  'Fichier trop volumineux': 'Ficheiro demasiado grande',
  'La preuve de voyage ne doit pas dépasser 5 Mo.':
    'A prova de viagem não deve exceder 5 MB.',
  'Preuve ajoutée': 'Prova adicionada',
  'Le document de voyage a été envoyé.': 'O documento de viagem foi enviado.',
  'Envoi impossible': 'Envio impossível',
  "La preuve de voyage n'a pas pu être envoyée.": 'A prova de viagem não pôde ser enviada.',
  'La preuve de voyage n’a pas pu être envoyée.': 'A prova de viagem não pôde ser enviada.',
  'Publier une annonce': 'Publicar um anúncio',
  'Publier un voyage': 'Publicar uma viagem',
  "Publier une offre d'emploi": 'Publicar uma oferta de emprego',
  "Créer l'événement": 'Criar o evento',
  'Créer l’événement': 'Criar o evento',
  'Publication...': 'A publicar...',
  'Publication…': 'A publicar…',
  "Publier l'annonce": 'Publicar o anúncio',
  'Publier l’annonce': 'Publicar o anúncio',
  'Publier le voyage': 'Publicar a viagem',
  "Publier l'offre": 'Publicar a oferta',
  'Publier l’offre': 'Publicar a oferta',
  Précédent: 'Anterior',
  Type: 'Tipo',
  Détails: 'Detalhes',
  Photos: 'Fotos',
  Localisation: 'Localização',
  Trajet: 'Percurso',
  Colis: 'Encomendas',
  Conditions: 'Condições',
  Valider: 'Validar',
  "L'offre": 'A oferta',
  'L’offre': 'A oferta',
  Lieu: 'Local',
  "L'événement": 'O evento',
  'L’événement': 'O evento',
  Programme: 'Programa',
  'Lieu & accès': 'Local e acesso',
  'Choisissez une catégorie.': 'Escolha uma categoria.',
  'Titre trop court (4 caractères min).': 'Título demasiado curto (mín. 4 caracteres).',
  'Annonce publiée': 'Anúncio publicado',
  'Voyage publié': 'Viagem publicada',
  'Offre publiée': 'Oferta publicada',
  'Événement publié': 'Evento publicado',
  'Votre annonce est en ligne.': 'O seu anúncio está online.',
  'Votre voyage est en ligne.': 'A sua viagem está online.',
  'Votre offre est en ligne.': 'A sua oferta está online.',
  'Votre événement est en ligne.': 'O seu evento está online.',

  'Les inscriptions sont temporairement désactivées. Réessayez plus tard.':
    'Os registos estão temporariamente desativados. Tente novamente mais tarde.',
  'La connexion par numéro est désactivée côté serveur. Utilisez votre e-mail, ou réessayez après activation Phone dans Supabase Auth.':
    'O início de sessão por número está desativado no servidor. Use o seu e-mail, ou tente novamente após ativar Phone no Supabase Auth.',
  "L'envoi SMS est indisponible. Choisissez « Par Telegram » pour confirmer votre numéro, ou réessayez plus tard.":
    'O envio de SMS está indisponível. Escolha « Via Telegram » para confirmar o seu número, ou tente mais tarde.',
  'L’envoi SMS est indisponible. Choisissez « Par Telegram » pour confirmer votre numéro, ou réessayez plus tard.':
    'O envio de SMS está indisponível. Escolha « Via Telegram » para confirmar o seu número, ou tente mais tarde.',
  "Le service d'inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard.":
    'O serviço de registo por e-mail está indisponível. Use a verificação por telefone ou tente mais tarde.',
  'Le service d’inscription par e-mail est indisponible. Utilisez la vérification par téléphone ou réessayez plus tard.':
    'O serviço de registo por e-mail está indisponível. Use a verificação por telefone ou tente mais tarde.',
  'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec majuscule, minuscule et chiffre.':
    'A palavra-passe é demasiado fraca. Use pelo menos 8 caracteres com maiúscula, minúscula e um número.',
  "Le code est invalide ou a expiré. Recommencez le processus d'inscription.":
    'O código é inválido ou expirou. Reinicie o processo de registo.',
  'Le code est invalide ou a expiré. Recommencez le processus d’inscription.':
    'O código é inválido ou expirou. Reinicie o processo de registo.',
  "Configuration du service d'authentification incorrecte. Réessayez plus tard ou contactez le support.":
    'Configuração do serviço de autenticação incorreta. Tente mais tarde ou contacte o suporte.',
  'Configuration du service d’authentification incorrecte. Réessayez plus tard ou contactez le support.':
    'Configuração do serviço de autenticação incorreta. Tente mais tarde ou contacte o suporte.',
  'Une erreur est survenue. Veuillez réessayer.': 'Ocorreu um erro. Tente novamente.',
  "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail.":
    'O seu endereço de e-mail ainda não foi confirmado. Verifique a sua caixa de correio.',
  'Votre adresse e-mail n’a pas encore été confirmée. Vérifiez votre boîte mail.':
    'O seu endereço de e-mail ainda não foi confirmado. Verifique a sua caixa de correio.',
  'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.':
    'Credenciais incorretas. Verifique o seu e-mail e a palavra-passe.',
  'Identifiants incorrects. Vérifiez votre e-mail / numéro ou votre mot de passe.':
    'Credenciais incorretas. Verifique o seu e-mail / número ou a palavra-passe.',
  'Identifiants incorrects. Vérifiez votre numéro et mot de passe.':
    'Credenciais incorretas. Verifique o seu número e a palavra-passe.',
  'Trop de tentatives. Patientez quelques minutes avant de réessayer.':
    'Demasiadas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  'Le mot de passe doit contenir au moins 6 caractères.':
    'A palavra-passe deve ter pelo menos 6 caracteres.',
  'Numéro de téléphone invalide. Vérifiez le format (+7XXXXXXXXXX).':
    'Número de telefone inválido. Verifique o formato (+7XXXXXXXXXX).',
  'Configuration du service incorrecte. Utilisez la vérification par téléphone.':
    'Configuração do serviço incorreta. Use a verificação por telefone.',
  'Demande enregistrée': 'Pedido registado',
  'Consultez votre messagerie pour poursuivre la récupération.':
    'Consulte o seu e-mail para continuar a recuperação.',
  'Mot de passe oublié': 'Palavra-passe esquecida',
  'Mot de passe oublie': 'Palavra-passe esquecida',
  'Demander un lien': 'Pedir uma ligação',

  Enregistré: 'Guardado',
  'Ajouter aux favoris': 'Adicionar aos favoritos',
  'Retirer des favoris': 'Remover dos favoritos',
  Aimer: 'Gostar',
  'Retirer le like': 'Remover gosto',
  'Chargement...': 'A carregar...',
  'Chargement…': 'A carregar…',
  'Vérification réussie': 'Verificação bem-sucedida',
  'Bienvenue sur MOXT': 'Bem-vindo ao MOXT',
  'Un nouvel e-mail a été envoyé à {email}.': 'Um novo e-mail foi enviado para {email}.',
  'Un nouveau SMS a été envoyé au {phone}.': 'Um novo SMS foi enviado para {phone}.',
  'Synchronisation…': 'A sincronizar…',
  'Charger les messages précédents': 'Carregar mensagens anteriores',
}

export const PUBLISH_AUTH_CATALOGS = { en: EN, ru: RU, pt: PT }
