// Langue source de référence. Toute clé doit exister ici (fallback final).
export const fr = {
  auth: {
    login: {
      title: 'Connexion',
      description:
        'Accédez à votre espace MOXT avec une session persistante et des routes protégées.',
      email: 'Adresse email',
      password: 'Mot de passe',
      forgot: 'Mot de passe oublié ?',
      submit: 'Se connecter',
      submitting: 'Connexion…',
      demoAccounts: 'Comptes de démo',
      demoUser: 'User',
      demoAdmin: 'Admin',
      demoSuper: 'Super',
      newToMoxt: 'Nouveau sur MOXT ?',
      createAccount: 'Créer un compte',
    },
    register: {
      resendSms: 'Renvoyer le SMS',
      resendEmail: "Renvoyer l'e-mail",
      resendCooldown: 'Renvoyer dans {seconds}s',
      codeNotReceivedSms: "Vous n'avez pas reçu le SMS ?",
      codeNotReceivedEmail: "Vous n'avez pas reçu le code ?",
      codeResentTitle: 'Code renvoyé',
      codeResentEmail: 'Un nouvel e-mail a été envoyé à {email}.',
      codeResentSms: 'Un nouveau SMS a été envoyé au {phone}.',
    },
  },
  nav: {
    servicesSupplementaires: 'Services supplémentaires',
    qrInvitation: 'QR & invitation',
  },
  share: {
    title: 'QR code & invitation',
    eyebrow: 'Partage',
    description:
      'Un seul endroit pour inviter vos proches ou partager votre profil MOXT.',
    tabTypeLabel: 'Type de partage',
    inviteTab: 'Inviter',
    profileTab: 'Mon profil',
    invitationSubtitle: 'Invitation MOXT',
    copyLink: 'Copier le lien',
    copied: 'Copié',
    share: 'Partager',
    publicProfile: 'Mon profil public',
    qrProfile: 'QR code profil',
    qrBusiness: 'QR code entreprise',
    qrToShare: 'QR code à partager',
    showProfileQr: 'Afficher le QR code du profil',
    showBusinessQr: 'Afficher le QR code entreprise',
    hints: {
      invite: 'Scannez pour rejoindre MOXT',
      profile: 'Scannez pour voir mes publications',
      business: 'Scannez pour découvrir cette entreprise',
    },
    shareTitles: {
      invite: 'Rejoignez MOXT',
      onMoxt: '{name} sur MOXT',
      publications: 'Publications de {name}',
    },
    shareTexts: {
      invite:
        'Transferts, colis et services entre l’Afrique et la Russie. Rejoignez-moi sur MOXT :',
      profile: 'Consultez les publications de {name} sur MOXT.',
      business: 'Découvrez {name} sur MOXT.',
    },
    steps: {
      step1Title: 'Partagez votre QR',
      step1Desc: 'Montrez le code ou envoyez le lien à vos proches.',
      step2Title: 'Ils rejoignent MOXT',
      step2Desc: 'Inscription rapide depuis le lien ou le scan.',
      step3Title: 'Tout au même endroit',
      step3Desc: 'Transferts, colis, marketplace et services diaspora.',
    },
  },
  messages: {
    syncing: 'Synchronisation…',
    loadOlder: 'Charger les messages précédents',
    loadingOlder: 'Chargement…',
  },
}
