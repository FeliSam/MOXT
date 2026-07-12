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
    inviteCountOne: 'personne invitée',
    inviteCountMany: 'personnes invitées',
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
    privateProfileWarning: {
      title: 'Profil en privé',
      description:
        'Votre activité est masquée : les personnes qui scannent ce QR code ne pourront pas consulter votre profil.',
      settingsLink: 'Modifier la visibilité dans les paramètres',
    },
    scanTab: 'Scanner',
    scanner: {
      eyebrow: 'Lecture intelligente',
      title: 'Scanner un QR MOXT',
      description:
        'Cadrez un QR code profil, entreprise ou invitation. Nous détectons automatiquement la destination.',
      starting: 'Activation de la caméra…',
      hint: 'Alignez le QR code dans le cadre — la détection est automatique.',
      deniedTitle: 'Accès caméra refusé',
      deniedDescription:
        'Autorisez la caméra dans votre navigateur pour scanner un QR code. L’accès est demandé uniquement sur cet onglet.',
      unsupportedTitle: 'Caméra indisponible',
      unsupportedDescription:
        'Votre navigateur ne permet pas d’accéder à la caméra sur cette page.',
      errorTitle: 'Impossible d’ouvrir la caméra',
      errorDescription: 'Vérifiez qu’aucune autre application n’utilise la caméra, puis réessayez.',
      unknownTitle: 'QR code non reconnu',
      unknownDescription: 'Ce code ne correspond pas à un profil, une entreprise ou une invitation MOXT.',
      scanAgain: 'Scanner à nouveau',
      targets: {
        user: 'Profil membre',
        business: 'Entreprise',
        invite: 'Invitation MOXT',
      },
      descriptions: {
        user: 'Profil membre MOXT détecté. Ouvrez ses publications.',
        business: 'Fiche entreprise MOXT détectée. Consultez ses publications.',
        invite: 'Invitation MOXT détectée ({id}).',
      },
      actions: {
        user: 'Ouvrir le profil',
        business: 'Voir l’entreprise',
        invite: 'Rejoindre via l’invitation',
      },
      permission: {
        title: 'Accès à la caméra requis',
        description:
          'Pour scanner un QR code MOXT, autorisez l’accès à la caméra. Elle n’est utilisée que sur cet onglet et s’arrête dès que vous le quittez.',
        allow: 'Autoriser la caméra',
        requesting: 'Demande d’autorisation en cours…',
        retry: 'Réessayer l’autorisation',
        deniedHint:
          'L’accès à la caméra a été refusé. Autorisez MOXT dans les réglages de votre navigateur ou de l’appareil, puis réessayez.',
      },
    },
  },
  messages: {
    syncing: 'Synchronisation…',
    loadOlder: 'Charger les messages précédents',
    loadingOlder: 'Chargement…',
    typing: 'écrit',
    typingAria: '{name} est en train d’écrire',
  },
}
