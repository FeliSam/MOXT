/** Spanish locale */
export const es = {
  auth: {
    login: {
      eyebrow: "MOXT · Iniciar sesión",
      title: "Iniciar sesión",
      description: "Accede a tu espacio con un número ruso (+7) y contraseña, o con correo electrónico.",
      modePhonePassword: "Teléfono + contraseña",
      modeEmail: "Correo",
      errorTitle: "Error al iniciar sesión",
      email: "Correo electrónico",
      password: "Contraseña",
      phoneLabel: "Número ruso",
      phoneHint: "Usa tu número +7 y tu contraseña.",
      forgot: "¿Olvidaste tu contraseña?",
      submit: "Iniciar sesión",
      submitting: "Iniciando sesión…",
      demoAccounts: "Cuentas demo",
      demoUser: "Usuario",
      demoAdmin: "Admin",
      demoSuper: "Super",
      newToMoxt: "¿Nuevo en MOXT?",
      createAccount: "Crear una cuenta"
    },
    register: {
      steps: {
        identity: "Identidad",
        language: "Idioma y país",
        security: "Residencia",
        verification: "Verificación"
      },
      eyebrow: "MOXT · Registro",
      oauthEyebrow: "MOXT · Perfil",
      title: "Crea tu cuenta MOXT",
      oauthTitle: "Completa tu perfil",
      description: "Correo obligatorio; la cuenta se confirma por SMS a tu número +7.",
      oauthDescription: "Añade tu país, ciudad y número ruso para usar MOXT.",
      firstName: "Nombre",
      lastName: "Apellidos",
      email: "Correo electrónico",
      continue: "Continuar",
      back: "Atrás",
      uiLanguage: "Idioma de la interfaz",
      originCountry: "País de origen",
      residenceCity: "Ciudad de residencia",
      russianPhone: "Número ruso (+7)",
      originPhone: "Número local (país de origen)",
      password: "Contraseña",
      confirmPassword: "Confirmar",
      acceptTermsPrefix: "Acepto los",
      termsOfUse: "términos de uso",
      acceptTermsAnd: "y la",
      privacyPolicy: "política de privacidad",
      fallbackCountry: "País de origen",
      fallbackRussia: "Rusia",
      oauthLastStepAlert: "Último paso: indica tu residencia en Rusia y tu número +7 para activar tu cuenta.",
      submit: "Crear mi cuenta",
      submitting: "Enviando SMS...",
      oauthSubmit: "Terminar mi perfil",
      oauthSubmitting: "Guardando...",
      haveAccount: "¿Ya tienes una cuenta?",
      loginLink: "Iniciar sesión",
      verify: {
        title: "Confirma tu número",
        body: "Se envió un código de 6 dígitos a {phone} por SMS. Puede tardar 1–2 minutos. Solo un código a la vez: la cuenta se crea tras la confirmación.",
        sendingTitle: "Enviando SMS…",
        sendingBody:
          "Preparando el código para {phone}. Puede tardar unos segundos según la red o un VPN.",
        sendingAction: "Enviando…",
        codeLabel: "Código recibido por SMS",
        confirm: "Confirmar y acceder a MOXT",
        emailTitle: "Confirma tu correo",
        emailBody: "Se envió un código de 6 dígitos a {email}. Introdúcelo para crear tu cuenta.",
        emailCodeLabel: "Código recibido por correo",
      },
      emailFallback: {
        title: "SMS no disponible para este número",
        body: "El operador de este número no puede recibir el código SMS. Continúa con el correo ya indicado para crear tu cuenta.",
        emailLabel: "Correo",
        sendButton: "Recibir el código por correo",
        switchedTitle: "Registro por correo",
        switchedBody: "Se envió un código a {email}. Introdúcelo para crear tu cuenta.",
        afterSmsResends:
          "Demasiados reenvíos SMS. Se envió un código a {email} para terminar el registro por correo.",
        smsResendLimitHint:
          "SMS ya reenviado una vez. Puedes introducir el código si llega, o recibirlo por correo ahora (cambio automático tras 90 s).",
      },
      toasts: {
        alreadyExistsTitle: "La cuenta ya existe",
        alreadyExistsBody: "Este número o correo ya está vinculado a una cuenta confirmada. Inicia sesión con tu contraseña. Si nunca recibiste el SMS, vuelve a registrarte en unos minutos tras la limpieza automática de registros incompletos.",
        identityLimitTitle: "No es posible volver a registrarse",
        identityLimitBody: "Este correo o número ya se ha usado para dos cuentas MOXT. Tras eliminarlas, solo es posible un nuevo registro con las mismas credenciales.",
        otpLimitedTitle: "Límite de envíos alcanzado",
        verifyFailedTitle: "Verificación fallida",
        oauthFailedTitle: "Perfil incompleto",
        registerFailedTitle: "Error en el registro",
        profileDoneTitle: "Perfil completado",
        profileDoneBody: "Tu perfil está completo. Bienvenido a MOXT.",
        resendFailedTitle: "No se pudo reenviar el SMS",
        resendFailedFallback: "No se pudo reenviar el código.",
        welcomeTitle: "Bienvenido a MOXT",
        welcomeDeferredBody: "Número confirmado. Confirma tu correo en Seguridad cuando quieras.",
        welcomeReadyBody: "Número confirmado. Tu cuenta está lista — ¡bienvenido!",
        welcomeEmailBody: "Correo confirmado. Confirma tu número +7 en Seguridad antes de publicar.",
        emailPendingTitle: "Correo por confirmar",
        emailPendingBody: "Abre Seguridad para vincular y verificar tu dirección de correo.",
        phonePendingTitle: "Número por confirmar",
        phonePendingBody: "Confirma tu número ruso (+7) en Seguridad antes de publicar un anuncio, paquete, empleo, evento u oferta P2P.",
      },
      loginNoticePendingOtp: "Si el registro está completo, inicia sesión con tu número +7 y la contraseña elegida. Si no, introduce primero el código SMS recibido arriba.",
      resendSms: "Reenviar SMS",
      resendEmail: "Reenviar correo",
      resendCooldown: "Reenviar en {seconds}s",
      codeNotReceivedSms: "¿No recibiste el SMS?",
      codeNotReceivedEmail: "¿No recibiste el código?",
      codeResentTitle: "Código reenviado",
      codeResentEmail: "Se envió un nuevo correo a {email}.",
      codeResentSms: "Se envió un nuevo SMS a {phone}.",
      abandonOtp: "Volver al formulario",
      otpCapTitle: "Límite de envíos alcanzado"
    },
    forgot: {
      eyebrow: "MOXT · Contraseña olvidada",
      title: "Contraseña olvidada",
      description: "Introduce tu correo: te enviaremos un enlace para crear una nueva contraseña.",
      email: "Correo electrónico",
      phoneAccountHint: "¿Cuenta creada con un número ruso? Inicia sesión con tu número y contraseña; esta página es solo para cuentas vinculadas a un correo.",
      submit: "Enviar enlace",
      submitting: "Enviando…",
      sentTitle: "Correo enviado",
      sentBody: "Revisa tu bandeja de entrada (y spam) para el enlace de restablecimiento.",
      sentHint: "El enlace es válido poco tiempo. Si no recibes nada, solicita un nuevo correo.",
      resend: "Reenviar correo",
      resendCooldown: "Reenviar en {seconds}s",
      backToLogin: "Volver a iniciar sesión",
      toastSuccessTitle: "Correo enviado",
      toastSuccessBody: "Revisa tu bandeja para restablecer la contraseña.",
      toastErrorTitle: "No se pudo enviar",
      toastErrorFallback: "Inténtalo de nuevo más tarde."
    },
    reset: {
      eyebrow: "Seguridad",
      invalidTitle: "Enlace caducado o no válido",
      invalidDescription: "Solicita un nuevo enlace desde la página de inicio de sesión.",
      invalidAlert: "Este enlace ya no es válido. Los enlaces de recuperación caducan en poco tiempo.",
      requestNewLink: "Solicitar un nuevo enlace",
      backToLogin: "Volver a iniciar sesión",
      checkingTitle: "Comprobando el enlace…",
      checkingDescription: "Un momento, estamos asegurando tu acceso.",
      title: "Nueva contraseña",
      description: "Elige una contraseña segura que no uses en otro sitio.",
      password: "Nueva contraseña",
      confirmPassword: "Confirmar contraseña",
      passwordRules: "Al menos 8 caracteres, con una mayúscula, una minúscula y un dígito.",
      submit: "Guardar contraseña",
      submitting: "Guardando…",
      toastSuccessTitle: "Contraseña actualizada",
      toastSuccessBody: "Inicia sesión con tu nueva contraseña.",
      loginNotice: "Tu contraseña se ha restablecido. Ya puedes iniciar sesión.",
      toastErrorTitle: "Error al restablecer",
      toastErrorFallback: "Inténtalo de nuevo más tarde."
    },
    callback: {
      eyebrow: "MOXT · Seguridad",
      title: "Verificación de cuenta",
      confirming: "Confirmando…",
      sessionMissing: "Sesión no encontrada. Inicia sesión para continuar.",
      completeProfile: "Completa tu perfil para continuar.",
      confirmFailed: "La confirmación falló.",
      redirectHint: "Espera un momento — redirección automática.",
      toastEmailTitle: "Correo confirmado",
      toastEmailBody: "Tu dirección de correo está verificada. Puedes gestionar la seguridad de la cuenta.",
      toastLoginTitle: "Sesión iniciada correctamente",
      toastLoginBody: "Tu sesión está activa."
    }
  },
  errors: {
    auth: {
      generic: "Se produjo un error. Inténtalo de nuevo en un momento.",
      alreadyRegistered: "Ya existe una cuenta con este identificador. Inicia sesión o usa otro número o correo.",
      identityLimitReached: "Este correo o número ya se ha usado para dos cuentas MOXT. Tras eliminarlas, solo es posible un nuevo registro con las mismas credenciales.",
      identityCheckUnavailable: "Comprobación de identidad no disponible. Inténtalo de nuevo en un momento.",
      smsConfig: "El envío del código SMS no está disponible (configuración). Inténtalo en unos minutos o contacta con soporte.",
      smsBalance: "El envío de SMS no está disponible temporalmente. Inténtalo más tarde o contacta con soporte.",
      smsTimeout: "El operador SMS tarda demasiado en responder. Espera un momento y vuelve a enviar el código.",
      smsRejected: "Este número no pudo recibir el SMS. Comprueba el formato +7… e inténtalo de nuevo, o contacta con soporte.",
      smsFailed: "El envío del código SMS falló. Reenvía el código. Si no llega en 2–3 minutos, contacta con soporte.",
      emailUnavailable: "El envío de correo no está disponible temporalmente. Elige verificación por SMS o inténtalo más tarde.",
      serviceUnavailable: "Servicio temporalmente no disponible. Inténtalo más tarde o contacta con soporte.",
      otpCooldown: "Espera {seconds} segundos antes de reenviar un código.",
      otpCap: "Límite alcanzado: máximo {max} códigos por periodo de 3 horas. Inténtalo en unos {minutes} minutos.",
    },
    app: {
      network: "Sin conexión. Comprueba tu red e inténtalo de nuevo.",
      sessionExpired: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
      permissionDenied: "No tienes permiso para esta acción.",
      notFound: "Elemento no encontrado o ya eliminado.",
      conflict: "Esta acción entra en conflicto con datos existentes. Actualiza e inténtalo de nuevo.",
      timeout: "El servidor tarda demasiado. Inténtalo en un momento.",
      technical: "Se produjo un error técnico. Inténtalo de nuevo o contacta con soporte.",
    },
    network: {
      eyebrow: "Problema de conexión",
      title: "Conexión interrumpida",
      body: "Esta página no se pudo mostrar por un problema de red. Comprueba tu conexión a internet y vuelve a conectarte para continuar.",
      retry: "Reconectar",
      close: "Cerrar",
    },
    display: {
      eyebrow: "Error de visualización",
      title: "Esta página no se pudo mostrar.",
      body: "Un error inesperado impide la visualización. Inténtalo de nuevo o vuelve al inicio.",
      home: "Volver al panel",
    },
  },
  validation: {
    password: {
      min: "Usa al menos 8 caracteres.",
      uppercase: "Añade una letra mayúscula.",
      lowercase: "Añade una letra minúscula.",
      digit: "Añade un número.",
      required: "La contraseña es obligatoria.",
      mismatch: "Las contraseñas no coinciden.",
      confirm: "Confirma la contraseña.",
      confirmReset: "Confirma tu contraseña."
    },
    identifier: {
      invalid: "Introduce un correo válido o un número ruso en formato +7XXXXXXXXXX.",
      required: "El correo o el número ruso es obligatorio."
    },
    email: {
      invalid: "Correo electrónico no válido.",
      required: "El correo es obligatorio."
    },
    phone: {
      russianFormat: "Usa el formato ruso +7 seguido de 10 dígitos.",
      russianRequired: "El número ruso es obligatorio.",
      originInvalid: "El número de tu país de origen no es válido."
    },
    name: {
      min: "Mínimo 2 caracteres.",
      firstRequired: "El nombre es obligatorio.",
      lastRequired: "Los apellidos son obligatorios."
    },
    country: {
      originRequired: "El país de origen es obligatorio.",
      residenceRussia: "La residencia debe estar en Rusia."
    },
    city: {
      invalid: "Ciudad no válida.",
      required: "La ciudad es obligatoria."
    },
    terms: {
      required: "Debes aceptar los términos."
    },
    avatar: {
      invalid: "La URL de la imagen no es válida."
    },
    transfer: {
      amountType: "Introduza un importe.",
      amountInvalid: "Importe inválido.",
      amountPositive: "O importe deve ser positivo.",
      amountMinimum: "O mínimo é {amount}.",
      amountCeiling: "O tu limite é {amount}.",
      amountMonthlyRemaining: "O tu limite mensal restante é {amount}.",
      exchangerRequired: "Elige un parceiro.",
      firstNameShort: "Nome demasiado curto.",
      firstNameRequired: "O nome é obligatorio.",
      lastNameShort: "Apelido demasiado curto.",
      lastNameRequired: "O apelido é obligatorio.",
      phoneRequired: "O teléfono é obligatorio.",
      paymentMethodRequired: "O meio de pagamento é obligatorio.",
      receiveMethodRequired: "O meio de receción é obligatorio.",
      receivedAmountRequired: "O importe recebido é obligatorio.",
      receiveMethodChoose: "Elige un método de receción.",
      receiveMethodInvalid: "Método inválido."
    },
    p2p: {
      methodRequired: "O método é obligatorio.",
      fromCurrencyRequired: "A moneda proposta é obrigatória.",
      toCurrencyRequired: "A moneda pretendida é obrigatória.",
      differentCurrency: "Elige otra moneda.",
      originRubPair: "El par debe ser {currency} ↔ RUB.",
      amountRequired: "O importe é obligatorio.",
      amountCeiling: "O tu limite é {amount}.",
      rateRequired: "A tarifa é obrigatória.",
      marginInvalid: "Margen no válido.",
      marginRange: "El margen debe estar entre −{max} % y +{max} %.",
      commentMax: "Máximo de 300 caracteres.",
      receiveNameRequired: "Indica el nombre y apellido(s) del beneficiario."
    },
    address: {
      labelRequired: "A etiqueta é obrigatória.",
      countryRequired: "O país é obligatorio.",
      cityRequired: "A ciudad é obrigatória.",
      addressRequired: "A dirección é obrigatória.",
      phoneRequired: "O teléfono é obligatorio.",
      emailRequired: "O correo é obligatorio.",
      emailInvalid: "E-mail inválido."
    },
    identity: {
      firstNamesRequired: "Os nomes próprios são obligatorios.",
      lastNameRequired: "O sobrenome é obligatorio.",
      companyNameRequired: "A razão social é obrigatória.",
      docTypeInvalid: "Tipo de documento inválido.",
      passportRequired: "O número do pasaporte é obligatorio.",
      passportInvalid: "Formato inválido (6 a 12 caracteres alfanuméricos, ex. AB1234567).",
      issuedByRequired: "O local de emissão é obligatorio.",
      issuedAtRequired: "A data de emissão é obrigatória.",
      expiresAtRequired: "A data de validade é obrigatória.",
      expiresAfterIssued: "A data de validade deve ser posterior à data de emissão.",
      userRequired: "Usuario obligatorio."
    }
  },
  nav: {
    home: "Inicio",
    brand: "Moxt",
    moxt: "MOXT",
    more: "Más",
    transfer: "Transferencia",
    transfers: "Transferencias",
    marketplace: "Mercado",
    parcels: "Envíos",
    jobs: "Empleos",
    business: "Mi empresa",
    businesses: "Empresas",
    news: "Actualidad",
    finances: "Finanzas",
    services: "Servicios",
    community: "Comunidad",
    communication: "Comunicación",
    account: "Cuenta",
    administration: "Administración",
    moderation: "Moderación",
    moderationSpace: "Espacio moderador",
    guide: "Guía",
    guideAdmin: "Gestión de la guía",
    p2p: "Intercambio P2P",
    exchangers: "Cambiadores",
    professional: "Mi empresa",
    events: "Eventos",
    notifications: "Notificaciones",
    subscriptions: "Suscripciones",
    favorites: "Favoritos",
    myPublications: "Mis publicaciones",
    controlCenter: "Centro de control",
    featureMatrix: "Cobertura funcional",
    systemPilotage: "Control del sistema",
    servicesSupplementaires: "Servicios adicionales",
    qrInvitation: "QR e invitación",
    mainAria: "Navegación principal",
    mobileQuickAria: "Navegación móvil rápida",
    closeNavigation: "Cerrar navegación",
    languageAria: "Idioma: {language}",
    moreServicesAria: "Más servicios",
    moreServicesUnreadAria: "Más servicios ({count} sin leer)",
    notificationsUnreadAria: "Notificaciones ({count} sin leer)",
    messagesUnreadAria: "Mensajes ({count} sin leer)",
    messages: "Mensajes",
    enableLightTheme: "Activar tema claro",
    enableDarkTheme: "Activar tema oscuro",
    profile: "Perfil",
    settings: "Ajustes",
    signOut: "Cerrar sesión",
    closeServices: "Cerrar servicios",
    morePanelTitle: "Todos los servicios",
    morePanelSubtitle: "Accede a los módulos fuera de la barra inferior.",
    searchServicePlaceholder: "Buscar un servicio...",
    accountSession: "Cuenta y sesión",
    itemUnreadAria: "{label} ({count} sin leer)"
  },
  moxtHub: {
    eyebrow: "Plataforma",
    description: "Todos los servicios esenciales, acciones rápidas y tus espacios personales, en un solo lugar.",
    primaryServices: "Servicios esenciales",
    primaryServicesDesc: "Los nueve recorridos principales de MOXT.",
    quickActions: "Acciones rápidas",
    quickActionsDesc: "Publica o inicia en un toque.",
    secondary: "Espacios personales",
    secondaryDesc: "Cuenta, finanzas, mensajes, documentos y seguridad — por categoría.",
    admin: "Administración",
    adminDesc: "Centro de control, cobertura funcional y piloto del sistema.",
    groups: {
      account: "Cuenta",
      finance: "Finanzas y documentos",
      communication: "Comunicación y ayuda",
      security: "Seguridad y ajustes"
    }
  },
  share: {
    title: "QR code y invitación",
    eyebrow: "Partilha",
    description: "Un solo lugar para invitar amigos, compartir tu perfil o seguir a MOXT en Instagram.",
    tabTypeLabel: "Tipo de partilha",
    inviteTab: "Convidar",
    profileTab: "O meu perfil",
    instagramTab: "Instagram",
    invitationSubtitle: "Invitación MOXT",
    instagramSubtitle: "@MOXTAPP · Cuenta oficial",
    inviteCountOne: "pessoa convidada",
    inviteCountMany: "pessoas convidadas",
    copyLink: "Copiar ligación",
    copied: "Copiado",
    share: "Compartir",
    publicProfile: "Meu perfil público",
    qrProfile: "QR code do perfil",
    qrBusiness: "QR code da empresa",
    qrToShare: "QR code para compartir",
    showProfileQr: "Mostrar QR code do perfil",
    showBusinessQr: "Mostrar QR code da empresa",
    badge: {
      download: "Descargar la insignia",
      generating: "Generando…",
      error: "Error, inténtalo de nuevo",
      taglineLine1: "Uso MOXT",
      taglineLine2Personal: "Únete a mí en MOXT",
      taglineLine2Business: "Únete a nosotros en MOXT",
    },
    hints: {
      invite: "Digitalize para entrar no MOXT",
      profile: "Digitalize para ver as minhas publicaciones",
      business: "Digitalize para descobrir esta empresa",
      instagram: "Escanea para seguir a MOXT en Instagram"
    },
    shareTitles: {
      invite: "Junte-se ao MOXT",
      onMoxt: "{name} no MOXT",
      publications: "Publicaciones de {name}",
      instagram: "MOXT en Instagram"
    },
    shareTexts: {
      invite: "Transferencias, paquetes y servicios entre África y Rusia. Junte-se a mim no MOXT:",
      profile: "Veja as publicaciones de {name} no MOXT.",
      business: "Descubra {name} no MOXT.",
      instagram: "Sigue la cuenta oficial de MOXT en Instagram:"
    },
    steps: {
      step1Title: "Partilhe o tu QR",
      step1Desc: "Mostre o código o envie a ligación.",
      step2Title: "Eles entram no MOXT",
      step2Desc: "Registo rápido pelo link o scan.",
      step3Title: "Tudo num só lugar",
      step3Desc: "Transferencias, paquetes, mercado y servicios da diáspora."
    },
    privateProfileWarning: {
      title: "Perfil privado",
      description: "A tu atividade está oculta: quem digitalizar este QR code no conseguirá ver o tu perfil.",
      settingsLink: "Alterar a visibilidade nas ajustes"
    },
    scanTab: "Digitalizar",
    scanner: {
      eyebrow: "Leitura inteligente",
      title: "Digitalizar QR MOXT",
      description: "Enquadre un QR de perfil, empresa o invitación. Detetamos automaticamente o destino.",
      starting: "A activar a câmara…",
      hint: "Alinhe o QR no quadro — a deteción é automática.",
      deniedTitle: "Acesso à câmara recusado",
      deniedDescription: "Autorize a câmara no navegador para digitalizar. O acesso só é pedido neste separador.",
      unsupportedTitle: "Câmara indisponible",
      unsupportedDescription: "O navegador no consegue aceder à câmara nesta página.",
      errorTitle: "No foi possível abrir a câmara",
      errorDescription: "Verifique se otra app no está a usar a câmara y tente nuevamente.",
      unknownTitle: "QR no reconhecido",
      unknownDescription: "Este código no corresponde a un perfil, empresa o invitación MOXT.",
      scanAgain: "Digitalizar nuevamente",
      sessionLoading: "A verificar sesión…",
      targets: {
        user: "Perfil de membro",
        business: "Empresa",
        invite: "Invitación MOXT"
      },
      descriptions: {
        user: "Perfil MOXT detetado. Abra as publicaciones.",
        business: "Empresa MOXT detetada. Veja as publicaciones.",
        invite: "Invitación MOXT detetado ({id})."
      },
      actions: {
        user: "Abrir perfil",
        business: "Ver empresa",
        invite: "Entrar pelo invitación"
      },
      permission: {
        title: "Acesso à câmara necessário",
        description: "Para digitalizar un QR MOXT, autorize o acesso à câmara. Só é usada neste separador y desliga ao sair.",
        allow: "Autorizar câmara",
        requesting: "A pedir autorización…",
        retry: "Tentar autorización nuevamente",
        deniedHint: "O acesso à câmara foi recusado. Autorize o MOXT nas ajustes do navegador o dispositivo y tente de nuevo."
      }
    }
  },
  messages: {
    syncing: "A sincronizar…",
    loadOlder: "Carregar mensajes anteriores",
    loadingOlder: "A cargar…",
    typing: "a escribir",
    typingAria: "{name} está a escribir",
    closeConversation: "Cerrar conversación",
    filterAll: "Todas",
    filterUnread: "No leídas",
    filterPinned: "Fixadas",
    filterAria: "Filtrar conversaciones",
    filterShow: "Mostrar",
    searchPlaceholder: "Buscar conversaciones y mensajes",
    searchConversationAria: "Buscar en la conversación",
    closeSearch: "Cerrar búsqueda",
    searchInThread: "Buscar na conversación",
    closeSearchInThread: "Cerrar búsqueda na conversación",
    searchInConversation: "Buscar nesta conversación",
    clearSearch: "Limpar búsqueda",
    resultsCount: "Resultados ({count})",
    conversations: "Conversaciones",
    active: "activas",
    archived: "arquivadas",
    noPinned: "Ninguna conversación fijada.",
    noUnread: "Ninguna conversación sin leer.",
    noMatch: "Ninguna conversación encontrada.",
    archives: "Arquivo",
    pinnedAria: "Fixada",
    mutedAria: "Silenciada",
    viewProfile: "Ver perfil",
    pin: "Fixar",
    unpin: "Desafixar",
    mute: "Silenciar",
    unmute: "Reactivar",
    block: "Bloquear",
    unblock: "Desbloquear",
    viewListing: "Ver ficha",
    scrollToBottom: "Ir para o fim da conversación",
    removeAttachment: "Remover {name}",
    removeAllAttachments: "Remover todos os anexos",
    cancelReplyListing: "Cancelar resposta ao anuncio",
    cancelReply: "Cancelar resposta",
    cancelEdit: "Cancelar edición",
    addAttachments: "Adicionar imagens o un documento",
    writePlaceholder: "Escribe un mensaje…",
    blockedPlaceholder: "Esta conversación está bloqueada",
    writeAria: "Escribir un mensaje",
    send: "Enviar",
    maxImagesTitle: "Demasiadas imagens",
    maxImages: "Máximo de {count} imagens por mensaje.",
    mixedFilesTitle: "Ficheiros mistos",
    mixedFiles: "Elige imagens o un documento.",
    sendFailedTitle: "Mensaje no enviada",
    sendFailed: "No foi possível enviar esta mensaje de momento.",
    retryFailed: "No foi possível reenviar esta mensaje de momento.",
    imageFailedTitle: "Imagem no enviada",
    imageFailed: "No foi possível enviar esta imagem de momento.",
    requireContent: "Añade un mensaje o un archivo adjunto.",
    tooLong: "Mensaje demasiado longa.",
    copiedTitle: "Mensaje copiada",
    copied: "O conteúdo foi copiado para a área de transferencia.",
    copyFailedTitle: "Cópia impossível",
    copyFailed: "No foi possível copiar a mensaje neste dispositivo.",
    deleteConfirmTitle: "Eliminar esta mensaje?",
    statusSent: "Enviada",
    statusSending: "Enviando",
    statusDelivered: "Entregue",
    statusRead: "Lida",
    retrySendAria: "Falha no envio — tentar nuevamente",
    retrySendTitle: "Falha no envio — toque para reenviar",
    retry: "Reenviar",
    delete: "Eliminar",
    reply: "Responder",
    copy: "Copiar",
    edit: "Editar",
    reactAria: "Reagir {emoji}",
    reactionAria: "Reación {emoji}",
    securityNotice: "Verifique a identidad do interlocutor y os detalhes do anuncio antes de cuálquer compromisso.",
    imagePreview: "Pré-visualización da imagem",
    closePreview: "Cerrar pré-visualización",
    prevImage: "Imagem anterior",
    nextImage: "Imagem siguiente",
    viewImage: "Ver imagem {name}",
    imageAlt: "Imagem enviada",
    imagesCount: "{count} imagens",
    viewImageN: "Ver imagem {index} de {count}",
    openListing: "Abrir ficha",
    replyToListing: "Responder a este anuncio — abrir via →",
    linkedListing: "Anuncio ligado à conversación — abrir ficha",
    empty: {
      title: "Aún no hay conversaciones",
      description: "Contacta a un vendedor, viajero o profesional desde una ficha MOXT para iniciar una conversación.",
      marketplace: "Mercado",
      parcels: "Paquetes",
      activities: "A minha atividade"
    },
    notFound: {
      title: "Conversa indisponible",
      description: "Este tópico no existe o já no está acessível a partir desta ligación.",
      back: "Voltar às conversaciones"
    },
    exchangeCount: "{count} troca(s)",
    unreadCount: " · {count} no lida",
    unreadCountPlural: " · {count} no leídas",
    actives: "Ativas",
    archive: "Arquivar",
    restore: "Restaurar",
    showSuggestions: "Sugerencias",
    hideSuggestions: "Sugerencias",
    conversationOptionsAria: "Opciones da conversación",
    archivedBanner: "Conversa arquivada — pode restaurá-la a partir do menu ⋯",
    blockedBanner: "Esta conversación está bloqueada. Já no pode enviar mensajes.",
    removeAllVisible: "Remover tudo",
    replyToListingLabel: "Resposta ao anuncio",
    replyToMessage: "Resposta a {name}",
    replyToMessageFallback: "una mensaje",
    editingTitle: "A editar a mensaje",
    editingHint: "Edite o texto y confirme para guardar.",
    draftSaved: "Rascunho guardado",
    youPrefix: "Tú: ",
    startConversation: "Inicie a conversación",
    messageCount: "{count} mensaje",
    messageCountPlural: "{count} mensajes",
    unreadSeparator: "Mensaje no lida",
    unreadSeparatorPlural: "{count} mensajes no leídas",
    threadStart: "Inicio da conversación",
    securityTitle: "Indicaciones de seguridad",
    date: {
      today: "Hoje",
      yesterday: "Ontem"
    },
    activity: {
      online: "En línea",
      new: "Nueva conversación",
      recent: "Activo recentemente",
      seenMinutes: "Visto há {minutes} min",
      activeToday: "Activo hoy · {time}",
      activeYesterday: "Activo ontem",
      last: "Última atividade · {time}"
    },
    assistant: {
      name: "Assistente MOXT",
      alwaysThere: "Sempre disponible",
      preview: "Como posso ayudar hoy?",
      subtitle: "Assistente local contextual",
      greeting: "Olá — posso buscar nos tus dados MOXT y guiá-lo para a ación certa.",
      backAria: "Voltar às conversaciones",
      clearHistoryAria: "Limpar histórico",
      removeDocAria: "Remover documento",
      addDocAria: "Adicionar un documento",
      placeholder: "Peça algo ao assistente…",
      sendAria: "Enviar ao assistente",
      sources: "Fontes: {list}",
      error: "O assistente local no conseguiu responder. {detail}",
      suggestions: {
        transfer: "Como efetuar una transferencia de dinero?",
        publishListing: "Como publicar un anuncio no mercado?",
        parcel: "Como enviar una paquete a través de un viajero?",
        verify: "Como verificar a minha identidad?",
        dispute: "Como contactar o soporte em caso de disputa?",
        admin: "Quiero hablar con un administrador",
        business: "Como crear una cuenta profesional?"
      },
      contactAdmin: "Contactar a un administrador",
      contactAdminAria: "Contactar a un administrador de MOXT",
      adminTicketSubject: "Solicitud vía asistente MOXT",
      adminTicketDefault: "Solicitud de contacto con un administrador vía el asistente MOXT.",
      adminEscalated:
        "Tu solicitud fue enviada al equipo MOXT (ticket {id}). Un administrador responderá desde Soporte.",
      adminFollowUp: "Seguir mi solicitud"
    },
    attachment: {
      photo: "📷 Foto",
      photos: "📷 {count} fotos",
      file: "📎 {name}",
      fileFallback: "Anexo",
      searchPhoto: "foto imagem",
      searchPhotos: "{count} fotos foto imagens",
      searchFileFallback: "anexo"
    },
    replyQuoteListing: "Anuncio",
    sendFailedBanner: "Falha de envio",
    retryAction: "Tentar nuevamente",
    notSynced: "No sincronizado",
    deleteConfirmDescription: "A mensaje será removida da tu conversación. Esta ación é definitiva.",
    threadEmptyTitle: "Aún sin mensajes",
    threadEmptyDescription: "Escreva a primeira mensaje para iniciar a troca.",
    searchNoMatch: "Ninguna mensaje corresponde à tu búsqueda.",
    userFallback: "Usuario",
    suggestions: {
      fallback: {
        listing: "este anuncio",
        job: "este posto",
        parcel: "este trajeto",
        event: "este evento",
        business: "a tu empresa"
      },
      listing: {
        owner: {
          thanks: "Olá, gracias pelo interesse em «{item}».",
          available: "Olá {peer}, o artigo aún está disponible.",
          price: "O precio indicado ({subtitle}) mantém-se válido.",
          details: "Posso dar más detalhes sobre o artigo.",
          questions: "No hesite se tiver otras perguntas."
        },
        contact: {
          available: "Olá, «{item}» aún está disponible?",
          price: "Olá, o precio indicado ({subtitle}) é negociável?",
          details: "Olá, pode dar-me más detalhes?",
          interest: "Olá {peer}, estou interessado(a) neste anuncio.",
          visit: "Seria possível organizar una visita o un ensaio?",
          location: "Cuál é a localización para a entrega?",
          payment: "Aceita pagamento seguro via MOXT?"
        }
      },
      job: {
        owner: {
          thanks: "Olá, gracias pela candidatura a «{item}».",
          open: "Olá {peer}, a vaga aún está aberta.",
          cv: "Pode enviar o tu CV y una breve apresentación?",
          sector: "O setor pretendido: {subtitle}.",
          profile: "Estou disponible para falar sobre o perfil pretendido."
        },
        contact: {
          available: "Olá, a vaga «{item}» aún está disponible?",
          apply: "Olá {peer}, gostaria de me candidatar a esta oferta.",
          process: "Pode precisar o processo de recrutamento?",
          sector: "A área «{subtitle}» encaixa bem comigo.",
          cv: "Posso enviar o meu CV de imediato."
        }
      },
      parcel: {
        owner: {
          thanks: "Olá, gracias pela mensaje sobre {item}.",
          space: "Olá {peer}, aún há espacio disponible.",
          rate: "Tarifa atual: {subtitle}.",
          weight: "Indica-me o peso y o conteúdo da tu paquete.",
          deadlines: "Cuáles são os plazos de depósito y de levantamento?"
        },
        contact: {
          space: "Olá, aún tem espacio para {item}?",
          rate: "A tarifa indicada ({subtitle}) serve-me.",
          book: "Olá {peer}, gostaria de reservar un envio.",
          items: "Que tipos de objetos aceitam?",
          dates: "Pode confirmar as datas de partida y de chegada?"
        }
      },
      event: {
        owner: {
          thanks: "Olá, gracias pelo interesse em «{item}».",
          seats: "Olá {peer}, aún há lugares disponibles.",
          access: "Precio / acesso: {subtitle}.",
          explain: "Posso explicar o desenrolar do evento.",
          program: "Quer que eu envie o programa?"
        },
        contact: {
          seats: "Olá, aún há lugares para «{item}»?",
          register: "Olá {peer}, como me inscrevo no evento?",
          access: "Sobre o acesso: {subtitle}.",
          place: "Pode precisar o local y o horário?",
          public: "O evento é acessível y aberto ao público?"
        }
      },
      business: {
        owner: {
          thanks: "Olá, gracias pela tu mensaje.",
          help: "Olá {peer}, como posso ayudar?",
          about: "Teremos todo o gosto em responder às tus perguntas sobre {item}.",
          meeting: "Gostaria de una reunião o de un orçamento personalizado?"
        },
        contact: {
          services: "Olá, que servicios oferece {item}?",
          hours: "Olá {peer}, pode indicar o horário?",
          quote: "Gostaria de un orçamento — é possível?",
          custom: "Oferecem un serviço adaptado à minha necessidade?"
        }
      },
      transfer: {
        owner: {
          status: "Olá {peer}, estou a consultar o estado da tu transferencia.",
          received: "Pode confirmar a receción dos fundos?",
          proof: "Já enviou a prova de pagamento?",
          safe: "Mantenho-me disponible para finalizar a operación em seguridad."
        },
        contact: {
          status: "Olá, pode confirmar o estado da transferencia?",
          proof: "Olá {peer}, a prova de pagamento é suficiente?",
          deadline: "Cuál é o plazo restante para finalizar a operación?",
          update: "Gracias por me manter informado(a) do andamento."
        }
      },
      p2p: {
        owner: {
          active: "Olá {peer}, a minha oferta aún está activa.",
          rate: "A tarifa proposta é {subtitle}.",
          terms: "Posso confirmar as condiciones da troca.",
          payment: "Que modo de pagamento prefere?",
          safe: "Mantemo-nos atentos y trocamos solo via MOXT."
        },
        contact: {
          available: "Olá, a tu oferta aún está disponible?",
          rate: "A tarifa indicada ({subtitle}) serve-me.",
          exchange: "Olá {peer}, gostaria de trocar consigo.",
          payment: "Que modos de pagamento aceita?",
          confirm: "Pode confirmar o importe y as condiciones?"
        }
      },
      general: {
        owner: {
          thanks: "Olá {peer}, gracias pela tu mensaje.",
          help: "Como posso ayudar?",
          available: "Mantenho-me disponible para responder às tus perguntas."
        },
        contact: {
          more: "Olá {peer}, gostaria de saber más.",
          thanks: "Gracias pelo tu retorno.",
          clarify: "Pode precisar o tu pedido?"
        }
      }
    }
  },
  public: {
    nav: {
      home: "Inicio",
      solution: "A solución",
      discover: "Descobrir",
      trust: "Confiança",
      faq: "FAQ",
      aria: "Navegación pública",
      homeAria: "Inicio MOXT",
      searchAria: "Buscar"
    },
    auth: {
      login: "Iniciar sesión",
      register: "Crear una cuenta"
    },
    footer: {
      tagline: "Plataforma de servicios para a diáspora. Troque con cuidado.",
      security: "Seguridad",
      help: "Ayuda",
      instagram: "Instagram",
      copyright: "© {year} MOXT. Todos os direitos reservados."
    },
    home: {
      badge: "Benim · Rusia · Comunidad",
      title: "As tus trocas, servicios y oportunidades numa plataforma clara.",
      subtitle: "O MOXT reúne transferencias, paquetes, empresas, mercado, empleos y eventos con acompanhamento comum.",
      ctaStart: "Começar",
      ctaDiscover: "Descobrir a solución",
      ctaExplore: "Explorar servicios",
      freeNote: "Navegación gratuita. As operaciones financeiras são rastreadas y protegidas no MOXT.",
      estimatorEyebrow: "Estimactiva rápida",
      estimatorTitle: "Calculadora de transferencia",
      direction: "Direción",
      bjToRu: "Benim para Rusia",
      ruToBj: "Rusia para Benim",
      amount: "Importe",
      receivedLabel: "Importe estimado recebido",
      feesLabel: "Taxas indicactivas: {fees}",
      createToSend: "Crear una cuenta para enviar",
      servicesTitle: "Todo o MOXT, sin una página gigante",
      servicesSubtitle: "Cada serviço mantém o tu percurso y as tus regras.",
      recentTitle: "Para descobrir",
      recentSubtitle: "Conteúdos públicos activos y verificados.",
      showAll: "Mostrar tudo",
      signInToView: "Iniciar sesión para consultar",
      trustTitle: "A confiança faz parte do percurso"
    },
    presentation: {
      badge: "Web · Mobile · PWA",
      title: "MOXT, a solución para ligar a África y a Rusia.",
      subtitle: "Uma plataforma única para transferencias, transporte de paquetes, mercado, empresas da diáspora y comunicación — no computador y no telemóvel.",
      ctaStart: "Começar gratuitamente",
      ctaExplore: "Explorar servicios",
      bulletSame: "A misma experiência no navegador y na aplicación nactiva",
      bulletLang: "Interface em russo por predfinición, alterável con un haz clic",
      servicesTitle: "Todos os servicios no mismo lugar",
      servicesSubtitle: "O MOXT reúne os usos quotidianos da diáspora: enviar dinero, encontrar un transportador, publicar un anuncio o contactar un profesional verificado.",
      whyTitle: "Por qué elegir o MOXT?",
      createAccount: "Crear a minha cuenta",
      learnMore: "Saber más",
      preview: {
        tagline: "Transferencias · Paquetes · Servicios",
        estimatedTransfer: "Transferencia estimada",
        routeExample: "África → Rusia",
        discover: "Descubrir",
        verifiedPartnerTitle: "Empresa verificada",
        verifiedPartnerSubtitle: "Socio MOXT"
      }
    },
    pillars: {
      transfers: {
        title: "Transferencias rastreadas",
        description: "Estimactiva, parceiros verificados y histórico numa só interface."
      },
      community: {
        title: "Comunidad diáspora",
        description: "Perfis, empresas, empleos, eventos y mensajes para trocar con confiança."
      },
      trust: {
        title: "Confiança integrada",
        description: "Verificación de teléfono, identidad y empresa antes de operaciones sensíveis."
      },
      i18n: {
        title: "Multilingue",
        description: "Russo, francês, inglês y português — mudança instantânea na aplicación."
      }
    },
    services: {
      transfers: {
        label: "Transferencias",
        description: "Estime y acompanhe as tus operaciones entre África y Rusia."
      },
      parcels: {
        label: "Paquetes",
        description: "Encontre capaciudad de transporte y reserve quilos."
      },
      marketplace: {
        label: "Marketplace",
        description: "Descubra produtos, servicios, arrendamentos y oportunidades."
      },
      businesses: {
        label: "Empresas",
        description: "Consulte perfis profissionais y os tus servicios."
      },
      community: {
        label: "Comunidad",
        description: "Empleos, eventos y trocas P2P no mismo espacio."
      },
      messages: {
        label: "Comunicación",
        description: "Contacte a pessoa certa a partir de cada ficha."
      }
    },
    trust: {
      phone: {
        title: "Número russo verificado para publicar",
        description: "Anuncios, paquetes, empleos y eventos exigem un número +7 confirmado por SMS. Um número por cuenta."
      },
      identity: {
        title: "Identidad MOXT para operaciones sensíveis",
        description: "Crear una empresa o usar contas de transferencia exige identidad validada y registo válido."
      },
      messaging: {
        title: "Trocas no MOXT",
        description: "Mensajes, favoritos y contacto permanecen acessíveis sin verificación reforçada."
      },
      validation: {
        title: "Nunca antecipar una validación",
        description: "Uma declaración local no substitui a confirmación oficial de un pagamento o estatuto."
      }
    },
    trustPage: {
      eyebrow: "Confiança y seguridad",
      title: "Usar o MOXT con os hábitos certos",
      subtitle: "O MOXT aplica três níveis de verificación: número russo para publicar, identidad para operaciones sensíveis, nível reforçado para limites elevados. As mensajes permanecen abertas a todos os membros ligados.",
      publishTitle: "Publicación protegida",
      publishBody: "Anuncios, paquetes, empleos, eventos y posts exigem un número russo único confirmado por OTP y un correo confirmado. Sem confirmación de correo, a publicación permanece bloqueada.",
      delayTitle: "Atraso na verificación de identidad",
      delayBefore: "Se o tu processo de identidad permanecer pendiente más de 24 h, contacte o administrador via",
      supportLink: "o soporte",
      delayAfter: ".",
      cards: {
        data: {
          title: "Dados pessoais",
          description: "Os tus documentos são tratados para verificación y seguridad da cuenta."
        },
        business: {
          title: "Empresas y transferencias",
          description: "Criación de empresa y contas de transferencia reservadas a perfis con identidad verificada."
        },
        badge: {
          title: "Distintivo verificado",
          description: "O distintivo verde = identidad validada pela MOXT (KYC). No confundir con un perfil « completo » (solo campos preenchidos)."
        },
        reports: {
          title: "Denúncias",
          description: "Denuncie cuálquer conteúdo suspeito a partir das fichas em causa."
        }
      }
    }
  },
  dashboard: {
    calculatorTitle: "Calculadora de transferencia",
    search: {
      title: "Búsqueda rápida",
      hint: "Paquetes, empresa, oferta, empleo, evento, ajustes o perfil.",
      placeholder: "Buscar: Cotonou, paquete, empleo, ajustes, seguridad, perfil...",
      noResults: "Ningún resultado para « {query} »."
    },
    hero: {
      welcome: "Te damos la bienvenida, {name}",
      title: "Todos tus servicios esenciales, juntos.",
      subtitle: "Transferencias, envíos, ventas, empleos y eventos en una experiencia simple e instantánea, pensada para tus intercambios entre África y Rusia.",
      subtitleShort: "Envía dinero, encuentra un paquete o un anuncio.",
      createTransfer: "Crear una transferencia",
      news: "Actualidad",
      install: "Instalar la App",
      guide: "Guía",
    },
    discovery: {
      eyebrow: "Descobrir MOXT",
      latestListings: "Anuncios recentes",
      viewMarket: "Ver o mercado",
      availableParcels: "Paquetes disponibles",
      recentTrips: "",
      kgAvailable: "{kg} kg disponibles",
      pricePerKg: "{price} {currency}/kg",
      recentJobs: "Jobs recentes",
      recentMissions: "",
      upcomingEvents: "Próximos eventos",
      upcomingMeetups: "",
      online: "En línea",
      newsTitle: "Actualidad MOXT",
      readAll: "Ler tudo",
      noNews: "Sin noticias.",
      newsLink: "Ver actualidad",
      emptyRecent: "Nada por ahora.",
      viewAria: "Ver {title}"
    },
    activity: {
      title: "Tu actividad",
      description: "Transferencias, mensajes y seguimientos.",
      transfers: "Transferencias",
      discussions: "Discussões",
      activity: "Atividade",
      myActivities: "As minhas actividades",
      messages: "Mensajes"
    },
    postTypes: {
      listing: "Anuncio",
      parcel: "Paquete",
      business: "Empresa",
      event: "Evento",
      job: "Job",
      news: "Post"
    },
    services: {
      title: "Servicios esenciales",
      exploreAll: "Explorar tudo"
    },
    quickActions: {
      title: "Aciones rápidas",
      activitiesLink: "As minhas actividades"
    },
    scroll: {
      left: "Deslizar para a esquerda",
      right: "Deslizar para a direita"
    },
    identityBanner: {
      title: "Verifique a tu identidad",
      short: "Verifica tu identidad para desbloquear límites.",
      description: "O distintivo verde « Verificado » confirma que a MOXT validou a tu identidad (documentos KYC). Isto desbloqueia limites más altos, empresa y ofertas P2P — no é o preenchimento do perfil.",
      verify: "Verificar a minha identidad"
    },
    overview: {
      todoTitle: "Aciones a fazer",
      todoDescription: "O que espera a tu intervención.",
      allUpToDate: "Tudo atualizado — ninguna ación pendiente.",
      transfersTitle: "As minhas transferencias em curso",
      transfersDescription: "Acompanhe as tus operaciones activas.",
      history: "Ver o histórico de transferencias",
      transfer: "Transferencia",
      noTransfers: "Ninguna transferencia em curso.",
      noTransfersShort: "Ninguna transferencia en curso.",
      createTransfer: "Crear una transferencia",
      rateTitle: "Taxa do dia",
      referenceRate: "Taxa de referência",
      today: "hoy",
      sendMoney: "Enviar dinero",
      profileCompletion: "Perfil preenchido",
      profileFields: "Campos preenchidos (nome, contacto, ciudad…). Completo ≠ verificado: isto no atesta a tu identidad.",
      completeProfile: "Completar o meu perfil",
      profileComplete: "O tu perfil está completo.",
      professionalSpace: "O tu espacio profesional · {status}",
      openProfessional: "Abrir o espacio pro",
      onboardingTitle: "Primeiros pasos na MOXT",
      onboardingDescription: "Ative todo o potencial da tu cuenta.",
      todoPendingTransfers: "{count} transferencia(s) a declarar",
      todoParcelRequests: "{count} pedido(s) de paquete a tratar",
      todoApplications: "{count} candidatura(s) recebida(s)",
      onboardingVerify: "Verificar a tu identidad",
      onboardingProfile: "Preencher o tu perfil",
      onboardingTransfer: "Fazer una primeira transferencia"
    },
    config: {
      quickActions: {
        transfer: {
          label: "Crear una transferencia",
          description: "Enviar dinero em poucos pasos"
        },
        listing: {
          label: "Publicar un anuncio",
          description: "Produto, serviço o arrendamento"
        },
        parcel: {
          label: "Enviar una paquete",
          description: "Encontrar o propor una viagem"
        },
        job: {
          label: "Publicar un job",
          description: "Missão o oportunidade"
        },
        event: {
          label: "Crear un evento",
          description: "Encontro, workshop o formación"
        }
      },
      services: {
        transfers: {
          title: "Transferencias",
          description: "Envie, acompanhe y gira as tus operaciones de forma simples.",
          tag: "Essencial"
        },
        marketplace: {
          title: "Marketplace",
          description: "Compre y venda entre particulares y empresas.",
          tag: "Descobrir"
        },
        parcels: {
          title: "Paquetes",
          description: "Publique, encontre y reserve quilos disponibles.",
          tag: "Viagens"
        },
        jobs: {
          title: "Jobs",
          description: "Descubra missões, jobs y oportunidades profissionais.",
          tag: "Carreira"
        },
        exchangers: {
          title: "Cambiadors",
          description: "Encontre parceiros fiáveis y verificados.",
          tag: "Verificados"
        },
        p2p: {
          title: "P2P",
          description: "Publique y encontre ofertas entre usuarioes verificados.",
          tag: "Trocas"
        },
        businesses: {
          title: "Empresas",
          description: "Explore os servicios dos profissionais MOXT.",
          tag: "Profesional"
        },
        events: {
          title: "Eventos",
          description: "Participe nos encontros, workshops y actividades da comunidad.",
          tag: "Agenda"
        },
        news: {
          title: "Atualidade",
          description: "Empleos, eventos, noticias y oportunidades.",
          tag: "Em direto"
        }
      },
      trust: {
        verifiedProfiles: {
          title: "Perfis verificados",
          description: "Identifique más facilmente usuarioes y empresas controlados."
        },
        centralizedContext: {
          title: "Contexto centralizado",
          description: "Mensajes, recibos y reclamaciones ficam ligados a cada operación."
        },
        localServices: {
          title: "Servicios locais",
          description: "Ferramentas pensadas para as trocas entre a África y a Rusia."
        },
        controlledData: {
          title: "Dados controlados",
          description: "As tus preferências y rascunhos permanecen acessíveis neste dispositivo."
        }
      }
    }
  },
  common: {
    loadingMoxt: "A cargar MOXT",
    loadingMoxtEllipsis: "A cargar MOXT…",
    cancel: "Cancelar",
    save: "Guardar",
    validate: "Validar",
    failure: "Falha",
    account: "Cuenta",
    notProvided: "No indicado",
    back: "Voltar",
    close: "Cerrar",
    closeWindow: "Cerrar a janela",
    confirm: "Confirmar",
    continue: "Continuar",
    loading: "Cargando…",
    pullToRefresh: {
      pull: "Puxe para atualizar",
      release: "Solte para atualizar",
      refreshing: "A atualizar"
    },
    poster: {
      removeImage: "Quitar la imagen",
      addImages: "Añadir imágenes",
      primary: "Principal"
    },
    upload: {
      fileOf: "{current}/{total}",
      phases: {
        preparing: "Preparación",
        compressing: "Optimización",
        uploading: "Envío",
        finalizing: "Finalización",
        done: "Listo",
        error: "Error de envío",
      },
    },
    update: {
      title: "Actualización MOXT",
      body: "Nueva versión disponible — recarga automática en cuanto sea posible."
    },
    lightbox: {
      title: "Vista previa de la imagen",
      close: "Cerrar vista previa",
      previous: "Imagen anterior",
      next: "Imagen siguiente"
    },
    edit: "Editar",
    delete: "Eliminar",
    add: "Adicionar",
    open: "Abrir",
    remove: "Remover",
    select: "Selecionar",
    country: "País",
    city: "Ciudad",
    all: "Todos",
    send: "Enviar",
    share: "Compartir",
    view: "Ver",
    previous: "Anterior",
    error: "Error",
    kb: "KB",
    firstName: "Nome",
    lastName: "Apelido",
    phone: "Número de teléfono",
    finances: "Finanzas",
    community: "Comunidad",
    benin: "Benim",
    russia: "Rusia",
    saveChanges: "Guardar alteraciones",
    member: "Membro",
    business: "Empresa",
    memberMoxt: "Membro MOXT",
    notifications: "Notificaciones",
    actions: "Aciones",
    retryLater: "Tente nuevamente más tarde."
  },
  catalog: {
    search: {
      label: "Buscar",
      placeholder: "Buscar",
      clearSearch: "Limpar búsqueda",
      filters: "Filtros",
      liveHint: "Búsqueda dinâmica, sin recargar a página.",
      results: "{count} resultado",
      resultsPlural: "{count} resultados",
      advancedTitle: "Filtros avançados",
      advancedDescription: "Afine os resultados con vários critérios.",
      clearAll: "Limpar tudo"
    }
  },
  report: {
    title: "Denunciar",
    reasonLabel: "Motivo da denúncia",
    reasonPlaceholder: "Describe el problema (contenido engañoso, spam, acoso…)",
    screenshotLabel: "Captura de ecrã (opcional)",
    addImage: "Adicionar una imagem",
    previewAlt: "Pré-visualización da denúncia",
    screenshotHint: "Uma captura ayuda a equipo a tratar más depressa.",
    submit: "Enviar denúncia",
    errors: {
      imagesOnly: "Apenas imagens (capturas de ecrã) são aceites.",
      imageTooLarge: "A imagem no deve exceder 5 MB.",
      reasonTooShort: "Explique o motivo (pelo menos 8 caracteres).",
      submitFailed: "No foi possível enviar a denúncia."
    }
  },
  publications: {
    types: {
      listing: "Anuncio",
      job: "Empleo",
      event: "Evento",
      parcel: "Paquete"
    },
    strip: {
      title: "Outras publicaciones",
      viewAll: "Ver tudo"
    },
    publisher: {
      businessMoxt: "Empresa MOXT",
      individual: "Particular",
      memberMoxt: "Membro MOXT",
      descriptionFallback: "Membro activo no MOXT.",
      viewAllPublications: "Ver todas as publicaciones",
      viewBusinessProfile: "Ver a ficha da empresa",
      viewBusiness: "Ver a empresa",
      shares: "{count} partilha(s)",
      updatedAt: "Atualizado em {date}",
      stats: {
        rating: "Nota",
        contacts: "Contactos",
        publications: "Anuncios",
        listings: "Anuncios",
        trips: "Viagens",
        events: "Eventos",
        offers: "Ofertas"
      },
      fallbacks: {
        listing: "Vendedor activo no Mercado MOXT.",
        parcel: "Transportador activo no MOXT.",
        event: "Organizador activo no MOXT.",
        job: "Recrutador activo no MOXT."
      },
      cta: {
        listings: "Ver todos os anuncios",
        publications: "Ver todas as publicaciones"
      }
    },
    profile: {
      businessBadge: "Empresa",
      memberBadge: "Membro",
      memberSince: "Membro desde: {date}",
      activeCount: "{count} activas",
      archivedCount: "{count} arquivadas",
      totalCount: "{count} no total",
      reviewCount: "{average}/5 · {count} avaliaciones",
      listingViews: "{count} visualizaciones de anuncios"
    },
    scope: {
      business: "Empresa",
      personalProfile: "Perfil pessoal",
      businessProfile: "Ficha da empresa"
    },
    mine: {
      publish: {
        listing: "Publicar un anuncio",
        parcel: "Publicar una paquete",
        job: "Publicar un empleo",
        event: "Publicar un evento",
        post: "Publicar no feed",
        other: "Explorar os servicios"
      },
      republishDenied: {
        title: "Republicación impossível",
        message: "A tu empresa deve ser verificada pelo MOXT para republicar este conteúdo em nome da empresa."
      },
      profileFallback: "O meu perfil",
      eyebrow: "Cuenta",
      title: "As minhas publicaciones",
      description: {
        subscribers: "Membros subscritos aos tus anuncios y publicaciones.",
        business: "Publicaciones publicadas em nome de {name}.",
        personal: "Anuncios, paquetes, empleos, eventos y publicaciones do tu perfil pessoal."
      },
      stats: {
        active: "Ativas",
        archived: "Arquivos",
        views: "Vistas de anuncios"
      },
      publicView: "Vista pública",
      tabs: {
        publications: "Publicaciones",
        subscribers: "Os meus subscritores"
      },
      types: {
        listing: "Anuncios",
        parcel: "Paquetes",
        job: "Empleos",
        event: "Eventos",
        post: "Publicación",
        other: "Outros"
      },
      empty: {
        active: "Ninguna publicación activa",
        archived: "Ningún arquivo",
        category: "esta categoría",
        description: "Ningún conteúdo em {category}."
      },
      delete: {
        title: "Eliminar este anuncio?",
        description: "Esta eliminación local é definitiva y remove también as respetivas denúncias."
      }
    },
    user: {
      memberFallback: "Membro MOXT",
      preview: {
        loading: "A cargar a pré-visualización",
        loadingDescription: "A obter as publicaciones públicas deste membro..."
      },
      notFound: {
        title: "Perfil no encontrado",
        description: "Este membro MOXT no existe o já no está disponible."
      },
      backHome: "Voltar ao inicio",
      eyebrow: "Comunidad",
      title: {
        owner: "As minhas publicaciones públicas",
        member: "Publicaciones de {name}",
        default: "Publicaciones do membro"
      },
      restricted: {
        description: "Este membro restringiu a visibilidade da tu atividade.",
        title: "Perfil no acessível",
        memberDescription: "Só os contactos autorizados o o próprio membro pueden consultar estas publicaciones.",
        guestDescription: "Crie una cuenta MOXT para pedir acesso o descobrir otros membros."
      },
      createAccount: "Crear una cuenta",
      guestAction: "consultar este conteúdo",
      description: {
        ownerBusiness: "Vista pública das publicaciones de {name}.",
        ownerPersonal: "Vista pública das tus publicaciones pessoais — partilhe este perfil con a comunidad.",
        business: "Publicaciones publicadas por {name}.",
        personal: "Anuncios, paquetes, empleos, eventos y publicaciones do perfil pessoal.",
        noPublications: "Consulte as publicaciones y as avaliaciones deixadas neste membro."
      },
      manage: "Gerir as minhas publicaciones",
      discover: "Descobrir o MOXT",
      back: "Voltar",
      tabs: {
        publications: "Publicaciones",
        reviews: "Avaliaciones"
      },
      empty: {
        title: "Sem publicaciones",
        description: "Os anuncios, paquetes, empleos, eventos y publicaciones deste membro aparecerão aquí."
      }
    },
    cards: {
      open: "Abrir",
      edit: "Editar",
      archive: "Arquivar",
      republish: "Republicar",
      free: "Grátis",
      badge: "Publicación",
      fallbackTitle: "Publicación",
      likes: "{count} gostos",
      comments: "{count} comentários",
      delete: "Eliminar"
    }
  },
  settings: {
    pageEyebrow: "Cuenta",
    pageTitle: "Ajustes",
    pageDescription: "Preferencias simples y control de tus datos locales.",
    appearance: {
      title: "Aparência",
      description: "Elige o tema da interface.",
      light: "Claro",
      dark: "Escuro",
      ariaLabel: "Tema da interface"
    },
    languagePrivacy: {
      title: "Idioma y privacidad"
    },
    language: {
      label: "Idioma preferido"
    },
    visibility: {
      label: "Visibilidade da atividade",
      hint: "Controle quem pode ver as tus publicaciones públicas na página de membro. Guardado na cuenta.",
      public: "Pública",
      publicDesc: "Toda a comunidad MOXT",
      contacts: "Os meus contactos",
      contactsDesc: "Os tus interlocutores nas mensajes",
      private: "Privada",
      privateDesc: "Só tú"
    },
    notifications: {
      title: "Notificaciones",
      description: "Controle o que recebe y con que prioridade.",
      newSubscribers: "Nuevos subscritores",
      newSubscribersDesc: "Quando un membro se subscreve às tus publicaciones",
      email: "Notificaciones por correo",
      emailDesc: "Resumos y alertas por correo",
      emailNeedsConfirm: "Confirme o correo (Seguridad) para activar os alertas por correo",
      emailUnconfirmedTitle: "E-mail no confirmado",
      emailUnconfirmedBody: "Confirme o dirección em Seguridad antes de activar os correos.",
      priorityHeading: "Prioridade por categoría",
      cat: {
        messages: "Mensajes",
        messagesDesc: "Nuevas mensajes recebidas",
        transfers: "Transferencias",
        transfersDesc: "Atualizaciones das tus operaciones",
        parcels: "Paquetes",
        parcelsDesc: "Reservas y confirmaciones",
        jobs: "Empleos",
        jobsDesc: "Candidaturas y ofertas",
        events: "Eventos",
        eventsDesc: "Inscriciones y lembretes",
        marketplace: "Marketplace",
        marketplaceDesc: "Interesse nos tus anuncios",
        news: "Actualidad",
        newsDesc: "Publicaciones y novidades",
        statuses: "Estados",
        statusesDesc: "Nuevos estados, reacciones y respuestas",
        other: "Otros",
        otherDesc: "El resto de las notificaciones sin clasificar",
        system: "Sistema",
        systemDesc: "Seguridad y alertas da cuenta"
      },
      legend: {
        high: "Alta — imediata",
        normal: "Normal — agrupada",
        low: "Baixa — silenciosa",
        off: "Off — desactivada"
      },
      priority: {
        high: "Alta",
        normal: "Normal",
        low: "Baixa",
        off: "Desactivado"
      }
    },
    data: {
      title: "Os meus dados",
      description: "Exporte solo as informaciones ligadas à tu cuenta neste dispositivo.",
      export: "Exportar os meus dados"
    },
    profileSecurity: {
      title: "Perfil y seguridad",
      description: "Faça a gestão dos contactos y do nível de verificación.",
      openProfile: "Abrir o meu perfil"
    },
    version: {
      title: "Versão da aplicación",
      description: "Histórico de melhorias y atualizaciones.",
      open: "Ver a versão atual"
    },
    danger: {
      title: "Zona sensível",
      description: "O pedido fica guardado solo localmente y pode ser cancelado.",
      cancelRequest: "Cancelar o pedido",
      requestDeletion: "Pedir eliminación",
      confirmTitle: "Pedir eliminación da cuenta",
      confirmBody: "A tu cuenta será marcada para eliminación. A moderación da MOXT processará o pedido no plazo de 30 días.",
      toastTitle: "Pedido registado",
      toastBody: "O tu pedido de eliminación foi enviado."
    },
    push: {
      unavailableTitle: "Notificaciones indisponibles",
      enabledTitle: "Notificaciones activadas",
      enabledMessage: "Receberá alertas MOXT neste dispositivo.",
      deniedTitle: "Notificaciones recusadas",
      incompleteTitle: "Ativación incompleta",
      permissionRequiredTitle: "Autorización necessária",
      permissionRequiredBody: "Toque para mostrar o pedido iOS/Safari y recibir alertas neste dispositivo.",
      allowButton: "Autorizar notificaciones",
      bannerTitle: "Activar notificaciones",
      bannerBody: "Mensajes, candidaturas y alertas importantes no ecrã principal.",
      allow: "Autorizar",
      later: "Más tarde",
      label: "Notificaciones push",
      descNative: "Alertas em tempo real no dispositivo",
      descWebReady: "Alertas offline via a aplicación web instalada",
      descIosInstall: "Instale o MOXT a partir do Safari (ecrã principal) para activar alertas no iPhone",
      descDefault: "Alertas em tempo real neste dispositivo",
      nativeDenied: "Autorize as notificaciones MOXT nas ajustes do telemóvel.",
      installRequiredTitle: "Instalación necessária",
      installRequiredBody: "No iPhone, adicione o MOXT ao ecrã principal via Safari y reative as notificaciones push.",
      errors: {
        permissionTimeout: "O pedido iOS expirou. Tente nuevamente o autorize o MOXT em Ajustes → Notificaciones.",
        serviceWorker: "O serviço de notificaciones no iniciou. Feche y reabra a app instalada y tente nuevamente.",
        subscribeFailed: "A suscripción push falhou. Verifique a ligación y tente nuevamente.",
        dbSync: "Notificaciones autorizadas no dispositivo, mas a sincronización con o servidor falhou. Tente nuevamente.",
        denied: "Autorize o MOXT em Ajustes do Safari → Notificaciones.",
        missingVapid: "Chave VAPID em falta. Localmente: npm run push:generate-vapid y reinicie npm run web. Em produción: npm run setup:push.",
        generic: "No é possível activar as notificaciones de momento. Tente más tarde."
      }
    }
  },
  security: {
    pageEyebrow: "Cuenta",
    pageTitle: "Seguridad",
    pageDescription: "Contraseña, confirmación de correo y sesiones activas.",
    postSignupEmailTitle: "Confirme o tu correo",
    postSignupEmailBody: "Pode fazê-lo ahora o más tarde. Sem confirmación, no podrá publicar no MOXT nem realizar otras aciones importantes (empresa, verificación de identidad…).",
    postSignupEmailLater: "Más tarde",
    emailConfirmedToastTitle: "E-mail confirmado",
    emailConfirmedToastBody: "O dirección está verificado. Pode alterar a contraseña y activar alertas.",
    passwordTitle: "Contraseña",
    passwordHintOtp: "Alteración protegida por un código OTP enviado para o tu correo confirmado.",
    passwordHintConfirmEmail: "Confirme primero o tu correo para alterar a contraseña.",
    changePassword: "Alterar a contraseña",
    passwordModalTitle: "Alterar a contraseña",
    passwordModalIntro: "Um código OTP será enviado para {email}. Introduza-o con a nueva contraseña.",
    sendOtpEmail: "Enviar código por correo",
    otpCodeLabel: "Código recebido por correo",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar a contraseña",
    email: {
      changeTitle: "Alterar o tu correo",
      confirmTitle: "Confirmar o tu correo",
      changeSubtitle: "Introduza o nuevo dirección y valide o código recebido por correo.",
      confirmSubtitle: "Pode confirmar más tarde. Sem correo verificado, a publicación y otras aciones importantes ficam limitadas. Introduza o código de 6 dígitos recebido por correo.",
      addressLabel: "Dirección de correo",
      hintChange: "Só é editável após confirmación por código OTP enviado para o nuevo dirección.",
      hintConfirm: "Confirme este dirección con o código recebido por correo.",
      otpLabel: "Código recebido por correo",
      otpHint: "O código valida o dirección acima y atualiza o perfil se for diferente.",
      confirmButton: "Confirmar correo",
      resendCooldown: "Reenviar ({seconds}s)",
      resend: "Reenviar código",
      cancel: "Cancelar",
      sendValidation: "Enviar código de validación",
      sendConfirmation: "Enviar código de confirmación",
      errorTitle: "No foi possível processar o correo",
      invalidTitle: "E-mail inválido",
      invalidBody: "Introduza un dirección de correo válido.",
      alreadyConfirmedTitle: "Já confirmado",
      alreadyConfirmedBody: "Este dirección de correo já está verificado.",
      confirmedTitle: "E-mail confirmado",
      alreadyVerifiedBody: "Este dirección de correo já está verificado na tu cuenta.",
      codeSentTitle: "Código enviado",
      codeSentBody: "Foi enviado un código para {email}. Verifique a pasta de spam.",
      confirmedUpdatedBody: "O tu dirección foi atualizado: {email}.",
      confirmedBody: "O tu dirección de correo está ahora verificado.",
      verifiedInline: "E-mail verificado: {email}",
      changeButton: "Alterar dirección de correo",
      verifiedTitle: "E-mail confirmado",
      verifiedBody: "{email} está verificado. Pode crear una empresa y enviar o tu pedido de verificación de identidad."
    },
    phone: {
      errorTitle: "No foi possível enviar o SMS",
      verifiedTitle: "Número russo verificado",
      verifiedBody: "{phone} está confirmado. Pode publicar anuncios, paquetes, empleos y eventos.",
      invalidTitle: "Número inválido",
      invalidBody: "Utilize un número russo no formato +7XXXXXXXXXX.",
      alreadyConfirmedTitle: "Número confirmado",
      alreadyConfirmedBody: "O tu número russo já está verificado na tu cuenta.",
      codeSentTitle: "Código enviado",
      codeSentBody: "Foi enviado un código de 6 dígitos para {phone}. A entrega pode demorar 1–2 minutos; caso contrário, reenvie após 90 segundos.",
      confirmedTitle: "Número confirmado",
      confirmedBody: "O tu número russo está verificado. Pode publicar no MOXT.",
      title: "Confirme o tu número russo",
      description: "Necessário solo se o número aún no estiver confirmado. Após o registo por SMS, o teléfono já está verificado — avance para a confirmación do correo em Seguridad. É diferente da verificación de identidad (KYC) na página Identidad.",
      numberLabel: "Número russo (+7)",
      sendCode: "Enviar código por SMS",
      sentAlert: "Foi enviado un código de 6 dígitos para {phone} por SMS.",
      otpLabel: "Código recebido por SMS",
      confirm: "Confirmar número",
      notReceived: "No recebeu o SMS?",
      resendCooldown: "Reenviar dentro de {seconds}s",
      resend: "Reenviar código",
      changeNumber: "Alterar número"
    },
    toasts: {
      emailRequiredTitle: "E-mail necessário",
      emailRequiredBody: "Confirme o dirección de correo acima antes de alterar a contraseña.",
      otpSentTitle: "Código enviado",
      otpSentBody: "Foi enviado un código para {email}. Verifique o spam.",
      failure: "Falha",
      invalidOtpTitle: "Código inválido",
      invalidOtpBody: "Introduza o código de 6 dígitos.",
      passwordMismatchTitle: "Error",
      passwordMismatchBody: "As palabras-passe no coincidem.",
      passwordUpdatedTitle: "Contraseña actualizada",
      passwordUpdatedBody: "A tu contraseña foi alterada."
    },
    mfa: {
      unavailableTitle: "2FA indisponible",
      enabledTitle: "2FA activada",
      enabledBody: "A autenticación de dois fatores está activa.",
      disabledTitle: "2FA desactivada",
      disabledBody: "A autenticación de dois fatores foi removida.",
      title: "Autenticación de dois fatores",
      statusOn: "Estado: activada (TOTP).",
      statusOff: "Estado: desactivada.",
      comingSoonBody: "Esta funcionalidade aún no está disponible. Será proposta em breve.",
      comingSoon: "Em breve",
      disable: "Desactivar 2FA",
      enable: "Activar 2FA",
      modalTitle: "Activar autenticación de dois fatores",
      modalIntro: "Leia o código QR con a aplicación de autenticación y introduza o código de 6 dígitos.",
      qrAlt: "Código QR 2FA",
      verifyCodeLabel: "Código de verificación",
      validate: "Validar"
    },
    alerts: {
      title: "Alertas de seguridad",
      checkbox: "Receber alertas importantes",
      emailHint: "Os alertas por correo exigem un dirección confirmado."
    },
    sessions: {
      title: "Sessões",
      description: "Termine sesión notros dispositivos ligados à tu cuenta MOXT.",
      signOutOthers: "Terminar sesión notros dispositivos",
      closedTitle: "Sessões encerradas",
      closedBody: "Os otros dispositivos foram desligados."
    }
  },
  profile: {
    hero: {
      eyebrow: "Perfil MOXT",
      unverifiedBadge: "Identidad a verificar",
      edit: "Editar",
      verifyCta: "Peça a verificación da identidad pelo MOXT (selo verde)",
      completionLabel: "Perfil preenchido",
      completionAria: "Preenchimento do perfil",
      completeLink: "Completar o meu perfil"
    },
    security: {
      title: "Seguridad da cuenta",
      description: "Sesión, verificación y proteción dos tus dados.",
      manage: "Gerir a seguridad",
      sessionActive: "Sesión persistente activa",
      passwordNotInSession: "La contraseña no se guarda en la sesión",
      verified: "Identidad verificada — selo de confiança activo no perfil",
      unverified: "Identidad no verificada — necessária para empresa y transferencias"
    },
    personal: {
      toastSavedTitle: "Perfil atualizado",
      toastSavedBody: "As tus informaciones pessoais foram guardadas.",
      toastAvatarTitle: "Foto adicionada",
      toastAvatarBody: "A nueva foto de perfil está pronta a guardar.",
      toastUploadFailTitle: "Falha no envio",
      toastUploadFailBody: "No foi possível enviar a foto.",
      pageEyebrow: "O meu perfil",
      pageTitle: "Informaciones pessoais",
      pageDescription: "Faça a gestão da identidad, residência na Rusia y dados de origem.",
      avatarAlt: "Foto de perfil",
      changePhotoAria: "Alterar a foto",
      uploading: "A enviar...",
      choosePhoto: "Escolher una foto",
      removePhoto: "Remover a foto",
      accountCard: "Cuenta",
      emailLabel: "E-mail",
      emailHint: "Editável no formulario con validación por código OTP.",
      sectionIdentity: "Identidad",
      firstName: "Nome próprio",
      lastName: "Apelido",
      sectionResidence: "Residência na Rusia",
      residenceCountry: "País de residência",
      russia: "Rusia",
      fixedAtSignup: "Fixado no registo.",
      city: "Ciudad na Rusia",
      russianPhone: "Número russo",
      russianPhoneHint: "Formato: +7 seguido de 10 dígitos (sin espacios).",
      sectionOrigin: "País de origem",
      originCountry: "País de origem",
      adminOriginAlert: "Como administrador, pode alterar o país de origem.",
      originFixedHint: "Fixado na criación da cuenta. Contacte o soporte para o alterar.",
      secondaryPhone: "Teléfono {country} (opcional)",
      secondaryPhoneHint: "Opcional: {code} seguido de 7 a 12 dígitos.",
      saving: "A guardar...",
      save: "Guardar alteraciones"
    },
    roles: {
      user: "Usuario",
      professional: "Profesional",
      admin: "Administrador",
      superadmin: "Superadministrador"
    },
    sections: {
      account: "Mi cuenta",
      trust: "Confianza",
      documents: "Documentos"
    },
    links: {
      personalInfo: "Informaciones pessoais",
      personalInfoDesc: "Identidad y contactos",
      favorites: "Os meus favoritos",
      favoritesDesc: "Conteúdos y perfis de transferencia",
      subscriptions: "Subscriciones",
      subscriptionsDesc: "Membros y empresas seguidos, y os tus subscritores",
      activities: "As minhas actividades",
      activitiesDesc: "Candidaturas, reservas y seguimentos",
      referral: "QR code y invitación",
      referralDesc: "Convide amigos o partilhe o tu perfil",
      verification: "Verificación",
      verificationDesc: "Documentos y nível de confiança",
      security: "Seguridad",
      securityDesc: "Proteción da tu cuenta",
      settings: "Ajustes",
      settingsDesc: "Preferências y privaciudad",
      documents: "Documentos",
      documentsDesc: "Ficheiros y comprobantes pessoais",
      receipts: "Recibos",
      receiptsDesc: "Histórico y comprobantes de transferencia",
      disputes: "Os meus disputas",
      disputesDesc: "Acompanhamento de contestaciones y resoluciones",
      support: "Soporte",
      supportDesc: "Ayuda y contacto con a equipo MOXT",
      legal: "Información legal",
      legalDesc: "Avisos, condiciones, empresas, anuncios y privacidad",
      localData: "Dados locais",
      localDataDesc: "Diagnóstico, cópia de seguridad y reposición"
    },
    stats: {
      transfers: "Transferencias",
      publications: "Publicaciones",
      parcels: "Paquetes",
      favorites: "Favoritos"
    }
  },
  verification: {
    consent: {
      before: "Aceito que os meus documentos de verificación sejam tratados de acordo con a",
      privacyLink: "política de privaciudad",
      and: "y os",
      termsLink: "termos de utilización",
      after: "."
    },
    admin: {
      navLabel: "Verificaciones",
      title: "Verificaciones de identidad",
      description: "Analise os processos, visualize os anexos y después aprove o recuse.",
      examine: "Examinar",
      approve: "Aprovar",
      reject: "Recusar",
      rejectConfirm: "Confirmar recusa",
      rejectReasonLabel: "Motivo da recusa (opcional)",
      rejectReasonPlaceholder: "Ex. foto ilegível, documento expirado…",
      documentsTitle: "Documentos enviados",
      empty: "Ningún pedido de verificación.",
      softDeleted: "removido (mantido para análise)",
      openDocument: "Abrir",
      notifyTitle: "Nueva verificación de cuenta",
      notifyMessage: "{name} enviou un processo ({level}).",
      statusVerified: "aprovada",
      statusRejected: "recusada"
    },
    eyebrow: "Cuenta",
    title: "Verificación",
    description: "Três níveis: número russo (publicar), identidad MOXT (empresa/transferencias), reforçada (limites elevados).",
    levels: {
      identity: "Identidad",
      identityDesc: "Documento de identidad y selfie. Desbloqueia a criación de empresa y transferencias.",
      enhanced: "Reforçada",
      enhancedDesc: "Identidad + comprobante de dirección. Desbloqueia limites más elevados."
    },
    idTypes: {
      passport: "Passaporte",
      residence: "Autorización de residência russa (ВНЖ / РВП)",
      migration: "Cartão de migración / patente",
      consular: "Cartão consular"
    },
    steps: {
      level: "Nível",
      phone: "Teléfono",
      email: "E-mail",
      identity: "Identidad",
      selfie: "Selfie",
      address: "Morada",
      review: "Confirmación"
    },
    toast: {
      sentTitle: "Pedido enviado",
      sentMessage: "O tu pedido foi enviado. A nuestra equipo trata-o em 24–48 h."
    },
    overdue: {
      title: "Prazo de tratamento ultrapassado",
      before: "O tu pedido está pendiente há más de 24 h. Contacte o administrador a través de",
      link: "o soporte MOXT"
    },
    request: {
      heading: "Pedido {level}",
      docs: "{count} documento(s) associado(s)"
    },
    stepProgress: "Paso {step}/{total} · {label}",
    chooseLevel: "Elige o tu nível",
    chooseLevelHint: "O número russo já deve estar confirmado. O nível reforçado desbloqueia limites más elevados.",
    identity: {
      heading: "Documento de identidad",
      hint: "Em nome de {name}.",
      docType: "Tipo de documento",
      upload: "Foto do documento de identidad",
      uploadHint: "Imagem o PDF, frente legível."
    },
    selfie: {
      heading: "Selfie de verificación",
      hint: "Uma foto tu a segurar o documento, para confirmar que lhe pertence.",
      upload: "Adicionar una selfie",
      uploadHint: "Rosto y documento visíveis."
    },
    address: {
      heading: "Comprobante de dirección",
      hint: "Registo migratório, contrato de arrendamento o fatura recente na Rusia.",
      upload: "Adicionar un comprobante",
      uploadHint: "Documento con menos de 3 meses."
    },
    review: {
      heading: "Confirmación",
      level: "Nível pedido",
      idDoc: "Documento de identidad",
      selfie: "Selfie de verificación",
      phone: "Teléfono russo",
      email: "E-mail",
      address: "Comprobante de dirección",
      provided: "Fornecido",
      verified: "Verificado",
      toConfirm: "A confirmar",
      notice: "Verifique se os documentos respeitam os exemplos aceites. O tratamento demora geralmente 24–48 h úteis. Após 24 h em espera, contacte o administrador."
    },
    submit: "Enviar o pedido",
    guide: {
      eyebrow: "Guia fotográfico",
      accepted: "Exemplos aceites",
      avoid: "A evitar",
      identity: {
        title: "Documento de identidad",
        intro: "Fotografe a frente do documento numa superfície plana, sin reflexos.",
        accepted: {
          idClear: {
            title: "Documento inteiro y nítido",
            desc: "Os 4 cantos estão visíveis, o texto é legível y a iluminación é uniforme."
          },
          idPassport: {
            title: "Passaporte o título de residência",
            desc: "Página principal con foto, nome y número claramente visíveis."
          }
        },
        rejected: {
          idCrop: {
            title: "Documento cortado",
            desc: "Uma parte do documento está fora do enquadramento o falta un canto."
          },
          idBlur: {
            title: "Foto desfocada o escura",
            desc: "O texto no é legível o a imagem está demasiado escura."
          },
          idScreen: {
            title: "Captura de ecrã",
            desc: "Foto de un ecrã, digitalización de má cuálidade o documento plastificado con reflexos."
          }
        }
      },
      selfie: {
        title: "Selfie de verificación",
        intro: "Tire una selfie a segurar o documento junto ao rosto, num local bem iluminado.",
        accepted: {
          selfieGood: {
            title: "Rosto + documento visíveis",
            desc: "O rosto y o documento estão nítidos, sin filtro nem acessório a tapar."
          },
          selfieLight: {
            title: "Boa luminosidade",
            desc: "Luz natural de frente, sin sombra forte no rosto o no documento."
          }
        },
        rejected: {
          selfieNoDoc: {
            title: "Sem documento",
            desc: "A selfie no mostra o documento de identidad na mão."
          },
          selfieHidden: {
            title: "Rosto tapado",
            desc: "Óculos de sol, máscara, boné o rosto fora do enquadramento."
          },
          selfieDark: {
            title: "Foto demasiado escura",
            desc: "No se distingue o rosto nem as informaciones do documento."
          }
        }
      },
      address: {
        title: "Comprobante de dirección",
        intro: "Anexe un documento recente (menos de 3 meses) em tu nome, con dirección na Rusia.",
        accepted: {
          addressMigration: {
            title: "Registo migratório",
            desc: "Carimbo o atestado de registo con nome, dirección y data váleídos."
          },
          addressBill: {
            title: "Fatura o contrato recente",
            desc: "Contrato de arrendamento, fatura de energia o telecomunicaciones em tu nome."
          }
        },
        rejected: {
          addressOld: {
            title: "Documento demasiado antigo",
            desc: "Data con más de 3 meses o período no identificável."
          },
          addressName: {
            title: "Nome o dirección em falta",
            desc: "O documento no menciona o tu nome completo o a dirección atual."
          },
          addressUnrelated: {
            title: "Documento no admitido",
            desc: "Cartão bancário, carta de condución isolada o documento sin ligación à dirección."
          }
        }
      }
    }
  },
  legal: {
    pageEyebrow: "Informaciones legais",
    copyright: "© {year} MOXT. Todos os direitos reservados.",
    footer: "Plataforma MOXT — diáspora afro-russa. Use os servicios con cautela y verifique os tus contactos.",
    nav: {
      mentions: "Avisos legales",
      cgu: "Condiciones de uso",
      entreprises: "Empresas",
      annonces: "Anuncios",
      privacy: "Privacidad",
    },
    sections: {
      mentions: {
        title: "Avisos legales",
        paragraphs: [
          "MOXT es una plataforma digital de puesta en relación destinada en particular a la diáspora afro-rusa. Ofrece herramientas para transferencias entre particulares y profesionales, envíos, marketplace, empleos, eventos, empresas y mensajería.",
          "Sitio web: https://moxtapp.ru. Aplicaciones móviles: MOXT para Android e iOS (vía Capacitor).",
          "Editor / explotador del servicio: MOXT. Contacto general y jurídico: support@moxtapp.ru. Incluye el identificador de cuenta, correo o teléfono verificado.",
          "CEO: FANOU S. Feliciano — médico cardiólogo, desarrollador fullstack, certificación AI. Dirección general y responsabilidad técnica de la plataforma MOXT.",
          "Cofundador y colaborador: Ricardo OKE — ingeniero en robótica, desarrollador fullstack y diseñador. Emisor de ideas, con aportaciones de producto, técnica y diseño en el equipo MOXT.",
          "Equipo MOXT: el servicio es diseñado y operado por el equipo MOXT bajo la dirección del CEO, con la colaboración de los cofundadores y colaboradores técnicos.",
          "Naturaleza del servicio: MOXT es una plataforma técnica de intermediación y comunicación. MOXT no es un banco, ni una entidad de dinero electrónico, ni un notario, ni un asegurador. MOXT no es parte de los contratos celebrados entre usuarios (transferencias, ventas, alquileres, servicios, viajes, empleos, etc.), salvo disposición escrita clara en el producto.",
          "Alojamiento y tratamiento de datos: infraestructura cloud segura (incluido backend Supabase para autenticación, base de datos y almacenamiento de archivos), conforme a los requisitos aplicables de protección de datos personales. Proveedores técnicos (correo / SMS, notificaciones push) intervienen solo para operar el servicio.",
          "Propiedad intelectual: la marca MOXT, el logo, la interfaz, el código y los contenidos editoriales están protegidos. Queda prohibida toda reproducción, extracción o uso comercial no autorizado. Los contenidos publicados por los usuarios siguen siendo su responsabilidad; al publicar, conceden a MOXT una licencia no exclusiva de visualización y difusión necesaria para el funcionamiento del servicio.",
          "Denuncias y abusos: para reportar contenido ilícito, fraude, usurpación de identidad o conducta peligrosa, contacta support@moxtapp.ru o usa las herramientas de denuncia en la app. MOXT puede retirar contenidos, suspender cuentas y transmitir información a las autoridades competentes.",
          "Limitación de responsabilidad del editor: en la medida permitida por la ley aplicable, MOXT no garantiza la exactitud de la información publicada por los usuarios, ni el buen desarrollo de intercambios fuera de la plataforma, ni la solvencia de los miembros. El uso de MOXT se realiza bajo la vigilancia de cada usuario.",
          "Derecho aplicable: estos avisos y el uso del servicio se rigen por el derecho aplicable al lugar de explotación del servicio, sin perjuicio de las normas imperativas de protección del consumidor. Los litigios se tratarán, en la medida de lo posible, de forma amistosa; en su defecto, ante los tribunales competentes.",
          "Para cualquier pregunta jurídica, reclamación o solicitud de información adicional sobre el editor, escribe a support@moxtapp.ru.",
        ],
      },
      cgu: {
        title: "Condiciones de uso",
        paragraphs: [
          "Al crear una cuenta MOXT, aceptas usar la plataforma de forma leal, proporcionar información exacta y respetar las reglas de verificación (teléfono, identidad, empresa cuando corresponda). Debes tener la edad y capacidad jurídica necesarias para contratar según la ley aplicable.",
          "Eres responsable de la confidencialidad de tus credenciales, códigos OTP y sesiones. Toda acción realizada desde tu cuenta se presume efectuada por ti, salvo prueba creíble de compromiso reportada sin demora a MOXT.",
          "Te comprometes a no publicar contenido fraudulento, engañoso, ilícito o que vulnere derechos de terceros. Quedan prohibidos, entre otros: estafas, usurpación de identidad, blanqueo, financiación de actividades ilegales, acoso, amenazas, contenido de odio, pornografía ilegal, venta de armas, drogas o bienes robados, y cualquier falsificación.",
          "Ningún usuario tiene derecho a estafar, engañar o intentar perjudicar de cualquier forma a otro miembro de la plataforma. Toda persona implicada en una actividad ilícita (fraude, estafa, usurpación de identidad, chantaje, etc.) a través de MOXT se expone a que su información sea transmitida a la justicia y a las autoridades competentes, para que la víctima o MOXT puedan presentar una denuncia en su contra.",
          "Las operaciones sensibles (transferencias, cuentas profesionales, publicaciones de empresa) pueden exigir identidad verificada. Una declaración en la app, un distintivo «verificado» o un estado mostrado no sustituyen una confirmación oficial de pago, entrega o estatus legal ante las autoridades.",
          "MOXT conecta a los miembros y facilita la comunicación; cada usuario sigue siendo responsable de sus compromisos, pagos, entregas, condiciones contractuales e intercambios con otros miembros. MOXT no garantiza el resultado de las transacciones entre usuarios.",
          "Autorizas a MOXT a moderar, ocultar, suspender o eliminar contenidos y cuentas para proteger la seguridad de la plataforma, hacer cumplir estas condiciones o cumplir una obligación legal. Las decisiones de moderación pueden impugnarse en support@moxtapp.ru.",
          "MOXT puede actualizar estos términos; la versión vigente está disponible en la app y en https://moxtapp.ru/legal/cgu. El uso continuado tras una actualización implica la aceptación de los nuevos términos. En caso de desacuerdo, debes dejar de usar el servicio y puedes solicitar la eliminación de tu cuenta.",
        ],
      },
      entreprises: {
        title: "Empresas — normas y responsabilidades",
        paragraphs: [
          "Creación: toda persona que cree una ficha de empresa en MOXT declara actuar de buena fe, disponer de los derechos necesarios para representar esa actividad y aportar información exacta (nombre, contactos, servicios, documentos).",
          "Estatus verificado: toda empresa que desee un estatus verificado en MOXT debe aportar pruebas de su actividad (documento de identidad del responsable, justificantes de existencia / actividad, y todo elemento solicitado por la moderación). Estos documentos pueden ser revisados por el equipo MOXT y, en su caso, transmitidos a las autoridades competentes.",
          "Alcance del distintivo «verificado»: la verificación atestigua que se aportaron y controlaron elementos según los procedimientos MOXT. No constituye certificación de solvencia, licencia bancaria, garantía de calidad ni asociación oficial con MOXT, salvo mención escrita en contrario.",
          "Responsabilidad del creador: la persona que crea una empresa asume la responsabilidad de toda actividad bajo esa enseña en MOXT (publicaciones, tarifas, mensajes, compromisos, litigios con clientes o socios). Debe asegurarse de que las personas autorizadas a publicar en nombre de la empresa cumplan estas normas.",
          "Actividades ilícitas y estafas: si una empresa utiliza su notoriedad o la plataforma para actividades ilícitas, o estafa a otra persona, se expone al baneo de su cuenta de empresa, a la suspensión del estatus verificado y a la transmisión de la información facilitada a la justicia.",
          "Cesión y cambio de control: una persona no puede ceder o «vender» su empresa a una persona desconocida cuyos datos no figuren en la base MOXT, bajo pena de acciones judiciales. Todo cambio de control debe ser trazable, realizarse mediante los procedimientos previstos (si existen) y conforme a las reglas de la plataforma. El creador sigue siendo responsable de los actos anteriores a una cesión irregular.",
          "Visibilidad y cierre: ocultar la visibilidad pública, cerrar la actividad o soft-eliminar una ficha no elimina la responsabilidad jurídica de los actos ya realizados. MOXT puede conservar elementos necesarios para la seguridad, los litigios y las obligaciones legales.",
          "Exactitud de la información: la empresa debe mantener actualizada su información (coordenadas, servicios, tarifas mostradas, documentos). Las declaraciones falsas, documentos falsificados o la usurpación de una enseña real exponen a sanciones y acciones judiciales.",
          "Prohibición de actividades ilegales: una empresa no debe utilizar la plataforma para actividades ilícitas. Toda actividad ilegal está formalmente prohibida en MOXT, bajo pena de acciones judiciales y medidas inmediatas (suspensión, baneo, denuncia).",
          "Cooperación con las autoridades: MOXT coopera con las autoridades competentes en caso de sospecha de fraude, blanqueo, estafa u otra infracción vinculada a una empresa presente en la plataforma, conforme al derecho aplicable.",
          "Contacto empresas: para cualquier cuestión relativa a la verificación, una cesión, un litigio o una denuncia — support@moxtapp.ru.",
        ],
      },
      annonces: {
        title: "Anuncios — responsabilidades de los editores",
        paragraphs: [
          "Ámbito: toda persona que publique un anuncio en MOXT (marketplace, envíos / trayectos, empleo, evento, publicación social, oferta de transferencia, oferta P2P, oferta vinculada a empresa, etc.) se considera editor de ese contenido.",
          "Responsabilidad del contenido: el editor es el único responsable de las descripciones, fotos, vídeos, precios, divisas, disponibilidad, condiciones, plazos, lugares de entrega y de todo compromiso con otros miembros. La información debe ser exacta, actualizada y no engañosa.",
          "Papel de MOXT: MOXT no asume ninguna responsabilidad sobre la procedencia, conformidad legal, calidad, seguridad o conformidad normativa de los artículos o servicios publicados. Los anuncios son contenidos aportados por los usuarios; MOXT actúa como plataforma de puesta en relación y visualización.",
          "Diligencia del comprador / contacto: antes de cualquier transacción, verifique la identidad del interlocutor, las pruebas disponibles, las valoraciones / el historial, y priorice los intercambios y pruebas a través de MOXT. Desconfíe de pagos exigidos fuera de un marco claro o de urgencias artificiales.",
          "Prohibiciones: quedan prohibidos, entre otros, los anuncios de bienes robados, falsificados o peligrosos sin autorización, sustancias ilícitas, armas, servicios ilegales, ofertas de empleo falsas, estafas financieras, pirámides / inversiones fraudulentas, y cualquier publicación engañosa o discriminatoria.",
          "Fotos y medios: las imágenes y archivos adjuntos deben representar fielmente el objeto o servicio. El uso de fotos robadas, medios generados para engañar o documentos falsificados está prohibido y puede conllevar baneo y denuncia.",
          "Usurpación de identidad: si una persona usurpa la identidad de otra (persona física, marca o empresa), asume sola la responsabilidad de sus actos. La usurpación, el fraude y los anuncios falsos exponen a sus autores a sanciones en la plataforma y a acciones judiciales.",
          "Transacciones y pagos: las condiciones de venta, entrega, pago y reembolso se acuerdan entre las partes. MOXT no garantiza los pagos realizados fuera de las herramientas claramente indicadas como proporcionadas por la plataforma. Conserve sus pruebas (capturas, recibos, mensajes).",
          "Modificación y retirada: el editor debe corregir o retirar un anuncio que se vuelva inexacto, vendido, no disponible o ilícito. MOXT puede ocultar, suspender o eliminar un anuncio por propia iniciativa para proteger a los usuarios o cumplir la ley.",
          "Denuncia: cualquier miembro puede denunciar un anuncio sospechoso. MOXT se compromete a colaborar estrechamente con las autoridades competentes en caso de sospecha, fraude o actividad ilegal cometida a través del sitio, y a transmitir los elementos útiles conforme al derecho aplicable.",
          "Seguridad: MOXT pone un especial énfasis en la seguridad de los bienes y las personas que usan la plataforma: verificación, denuncias, moderación y cooperación con las autoridades forman parte de este compromiso. Reporte cualquier contenido sospechoso vía la app o support@moxtapp.ru.",
          "Conservación: la eliminación de un anuncio no hace desaparecer automáticamente la responsabilidad de los actos ya realizados; MOXT puede conservar elementos necesarios para litigios, seguridad y obligaciones legales.",
        ],
      },
      privacy: {
        title: "Política de privacidad",
        paragraphs: [
          "Esta política de privacidad describe cómo MOXT («nosotros») recopila, usa, almacena y protege tus datos personales cuando usas el sitio https://moxtapp.ru y la app móvil MOXT (Android / iOS vía Capacitor), destinada en particular a la diáspora afro-rusa (transferencias, envíos, mercado, empleos, empresas y mensajería).",
          "Responsable del tratamiento: MOXT. Privacidad y solicitudes de usuarios: support@moxtapp.ru. Incluye el correo o identificador de tu cuenta para que podamos responder en un plazo razonable.",
          "Finalidades: crear y administrar tu cuenta; habilitar las funciones de la plataforma (perfiles, anuncios, mensajería, transferencias, envíos, verificación de identidad o de empresa); garantizar la seguridad, la prevención del fraude y el cumplimiento de nuestras reglas; enviar avisos técnicos o, si das tu consentimiento, alertas push; cumplir obligaciones legales.",
          "Datos de cuenta: identidad (nombre cuando corresponda), correo, número de teléfono, foto de perfil, preferencias de idioma y privacidad, historial de actividad en la plataforma, documentos de verificación de identidad o de empresa cuando los proporciones voluntariamente.",
          "Datos técnicos: identificadores de sesión, registros de acceso, tipo de dispositivo / navegador, tokens de notificaciones push (FCM / APNs) si los activas, y metadatos necesarios para operar y asegurar el servicio.",
          "Infraestructura y encargados: los datos de cuenta y el contenido de la app se procesan mediante nuestro backend Supabase (autenticación, base de datos, almacenamiento de archivos). Proveedores técnicos (hosting cloud, entrega de correo / SMS, push Firebase / Apple) actúan solo para operar el servicio. No vendemos tus datos personales.",
          "Cámara: se usa solo para escanear códigos QR MOXT (perfiles, empresas, invitaciones) cuando abres la pestaña Escáner. La cámara no se activa en segundo plano y no se usa para geolocalización.",
          "Notificaciones push (app móvil): si las activas, se genera un identificador técnico del dispositivo (token FCM / APNs) para enviarte alertas (mensajes, transferencias, suscripciones, etc.). Puedes desactivar las notificaciones push en la configuración de MOXT o en la del teléfono.",
          "Fotos y archivos: al verificar la identidad, publicar anuncios o subir comprobantes, puedes seleccionar imágenes de tu dispositivo. Estos archivos se almacenan de forma segura para las finalidades correspondientes.",
          "Mensajería y contenido publicado: los mensajes y publicaciones que intercambias o muestras en MOXT se procesan para prestar el servicio y hacer cumplir nuestros términos de uso.",
          "Permisos explícitamente excluidos: MOXT no solicita acceso a ubicación precisa ni lectura de SMS en Android. No leemos tus SMS ni accedemos a tu ubicación GPS.",
          "Bases legales y compartición: el tratamiento se basa en la ejecución del contrato (prestación del servicio), tu consentimiento cuando sea necesario (p. ej. push) y nuestros intereses legítimos de seguridad y mejora del servicio, conforme a la ley aplicable. Los datos pueden comunicarse a las autoridades competentes si la ley lo exige.",
          "Conservación y eliminación: un correo o teléfono verificado puede usarse como máximo en dos cuentas. Puedes solicitar la eliminación de la cuenta desde la configuración; algunos datos pueden conservarse el tiempo exigido por ley, por seguridad de la plataforma o para resolver disputas.",
          "Tus derechos: según la ley aplicable, puedes solicitar acceso a tus datos, rectificación, eliminación, limitación del tratamiento u oponerte a ciertos tratamientos. Contacta a support@moxtapp.ru. También puedes solicitar la eliminación de la cuenta desde la app.",
          "Menores: el servicio está destinado a usuarios mayores de edad o con capacidad conforme a la ley aplicable. Si crees que un menor proporcionó datos sin autorización, contáctanos para eliminarlos.",
          "Actualizaciones: podemos actualizar esta política; la versión vigente siempre está disponible en https://moxtapp.ru/legal/privacy. El uso continuado tras una actualización implica que has sido informado de la nueva versión.",
          "Contacto: para cualquier pregunta sobre esta política o tus datos personales — support@moxtapp.ru."
        ]
      }
    }
  },
  events: {
    browse: {
      eyebrow: "Comunidad",
      title: "Eventos",
      description: "Encontros, workshops, formaciones y inscriciones.",
      showAll: "Todos os eventos",
      showMine: "Os meus eventos",
      create: "Crear un evento",
      searchLabel: "Buscar",
      searchPlaceholder: "Evento, organizador, local o ciudad...",
      city: "Ciudad",
      category: "Categoría",
      allCategories: "Todas",
      access: "Acesso",
      allAccess: "Todos",
      free: "Gratuitos",
      paid: "Pagos",
      freePrice: "Gratuito",
      empty: "Ningún evento publicado."
    },
    categories: {
      networking: "Networking",
      training: "Formación",
      culture: "Cultura",
      business: "Business",
      community: "Comunidad"
    },
    publisher: {
      business: "Empresa",
      individual: "Particular"
    },
    detail: {
      notFound: "Evento no encontrado.",
      publishedOn: "Publicado em {date}",
      edit: "Editar",
      date: "Data",
      location: "Local",
      seatsRemaining: "Lugares restantes",
      access: "Acesso",
      free: "Gratuito",
      imageAlt: "{title} — cartaz {index}",
      full: "Esgotado",
      seatsAvailable: "Lugares disponibles",
      about: "Sobre",
      organizerLabel: "Organizador",
      priceLabel: "Precio",
      seatsLabel: "Lugares",
      registration: "Inscrición",
      report: "Denunciar",
      ownerHint: "Gira as inscriciones na sección « Participantes inscritos » abaixo.",
      registrationTracked: "A tu inscrición é acompanhada y será notificado de cada alteración.",
      nextStep: "Próximo paso",
      cancelRegistration: "Cancelar a minha inscrición",
      eventFull: "Este evento está esgotado.",
      register: "Inscribirme y escribir",
      registering: "Inscribiendo…",
      registerChatMessage: "Hola, me gustaría inscribirme en su evento.",
      practicalInfo: "Informaciones práticas",
      facts: {
        organizer: "Organizador",
        profile: "Perfil",
        category: "Categoría",
        venue: "Local",
        city: "Ciudad",
        capacity: "Capaciudad",
        status: "Estado"
      },
      capacityValue: "{count} pessoas",
      trustTitle: "Antes de participar",
      trust: {
        venue: "Verifique o local y o horário antes de se deslocar.",
        confirmation: "Guarde a confirmación da tu inscrición.",
        contact: "Contacte o organizador a través das mensajes MOXT."
      },
      reportTitle: "Denunciar este evento",
      reportToastTitle: "Denúncia enviada",
      reportToastMessage: "A nuestra equipo vai analisar este evento."
    },
    registration: {
      registered: {
        title: "Inscrición confirmada",
        description: "Guarde a confirmación y contacte o organizador se tiver alguma dúvida."
      },
      checkedIn: {
        title: "Presença confirmada",
        description: "A tu presença foi validada pelo organizador."
      },
      cancelled: {
        title: "Inscrición cancelada",
        description: "Pode voltar a inscrever-se se aún houver lugares disponibles."
      }
    },
    status: {
      published: "Publicado",
      draft: "Rascunho",
      registered: "Inscrito",
      cancelled: "Cancelado",
      full: "Esgotado"
    },
    participants: {
      title: "Participantes inscritos",
      activeSummary: "{active} inscrición(ões) activa(s) em {capacity} lugares.",
      placesBadge: "{active}/{capacity} lugares",
      memberFallback: "Membro MOXT",
      registeredAt: "Inscrito em {date}",
      present: "Presente",
      cancel: "Cancelar",
      emptyTitle: "Ninguna inscrición",
      emptyDescription: "As pessoas inscritas neste evento aparecerão aquí.",
      cancelledSummary: "Inscriciones canceladas ({count})"
    },
    registrationsPanel: {
      title: "Participantes inscritos",
      description: "Acompanhe as inscriciones nos tus eventos publicados.",
      emptyDescription: "As nuevas inscriciones nos tus eventos aparecerão aquí."
    }
  },
  parcels: {
    browse: {
      eyebrow: "Transporte",
      title: "Paquetes y viagens",
      description: "Publique capaciudad de transporte o reserve un lugar disponible.",
      stats: {
        availableTrips: "Viagens disponibles"
      },
      actions: {
        allParcels: "Todas as paquetes",
        myParcels: "As minhas paquetes",
        publish: "Publicar una viagem"
      },
      search: {
        placeholder: "País, ciudad, viajero, empresa..."
      },
      filters: {
        country: "País",
        origin: "Partida",
        destination: "Destino",
        cityPlaceholder: "Ciudad o país",
        status: "Estado",
        allStatuses: "Todos",
        available: "Disponíveis",
        full: "Completos",
        defaultCountry: "O meu país predfinido",
        allCountries: "Todos os países",
        russia: "Rusia"
      },
      tabs: {
        active: "Viagens activas",
        archived: "Arquivo"
      }
    },
    card: {
      proofVerified: "Comprobante verificado",
      proofPending: "Comprobante en verificación",
      proofRejected: "Comprobante rechazado",
      proofMissing: "Comprobante no verificado",
      business: "Empresa",
      individual: "Particular",
      available: "Disponible",
      perKg: "Por kg",
      departure: "Partida {date}",
      depositBefore: "Depósito até {date}",
      pickupFrom: "Recolha a partir de {date}",
      viewDetail: "Ver detalhes",
      archived: "Arquivado"
    },
    empty: {
      activeTitle: "Ninguna viagem publicada",
      activeDescription: "Seja o primero a propor un trajeto o ajuste os filtros.",
      archivedTitle: "Sem arquivo",
      archivedDescription: "As viagens passadas o concluídas aparecerão aquí."
    },
    meta: {
      departure: "Partida {date}"
    },
    detail: {
      notFound: "Viagem no encontrada.",
      publishedOn: "Publicado em {date}",
      routeTitle: "{origin} para {destination}",
      toast: {
        requestAccepted: "Pedido aceite",
        requestRejected: "Pedido recusado",
        invalidWeightTitle: "Peso inválido",
        invalidWeightMessage: "Indica un peso entre 1 y {max} kg.",
        messageRequiredTitle: "Mensaje obligatorio",
        messageRequiredBody: "Añade un mensaje corto para el transportista.",
        requestSentTitle: "Pedido enviado",
        requestSentMessage: "O tu pedido de {kg} kg foi enviado ao transportador."
      },
      descriptionWithDistribution: "Partida a {departure} · depósito até {deposit} · recolha a partir de {distribution}",
      descriptionWithoutDistribution: "Partida a {departure} · depósito até {deposit}",
      edit: "Editar",
      proofVerified: "Comprobante verificado",
      origin: "Origem",
      destination: "Destino",
      metrics: {
        remainingCapacity: "Capaciudad restante",
        departure: "Partida",
        depositDeadline: "Prazo de depósito",
        distribution: "Distribuición",
        route: "Trajeto"
      },
      toConfirm: "A confirmar",
      kgAvailable: "{kg} kg disponibles",
      perKilogram: "{price} por quilograma",
      depositDeadlineLabel: "Prazo de depósito: {date}",
      pickupFromDate: "Recolha possível a partir de {date}",
      carrier: "Transportador: {name} · {contact}",
      business: "Empresa",
      reserve: {
        title: "Reservar lugar",
        description: "Indica el peso y un mensaje: la solicitud va al chat del transportista.",
        pending: "Pedido em curso · {kg} kg · à espera de resposta",
        weightLabel: "Peso (kg)",
        messageLabel: "Mensaje (opcional)",
        messagePlaceholder: "Contenido del paquete, ciudad de entrega, restricciones…",
        chatRoute: "{origin} → {destination}",
        chatKg: "{kg} kg",
        chatMessage: "{origin} → {destination}\n{kg} kg",
        submit: "Enviar en mensajes",
        sending: "Enviando…"
      },
      requests: {
        title: "Pedidos recebidos",
        clientFallback: "Cliente",
        kgRequested: "{kg} kg solicitados",
        accept: "Aceitar",
        reject: "Recusar",
        empty: "Ningún pedido recebido."
      },
      message: {
        greeting: "Olá {name},",
        accepted: "A tu reserva de {kg} kg no trajeto {origin} → {destination} foi aceite.",
        followUp: "Escreva-me aquí para más informaciones (local de depósito, horários, condiciones)."
      },
      info: {
        title: "Informaciones do transporte",
        origin: "Origem",
        destination: "Destino",
        depositDeadline: "Prazo de depósito",
        distributionDate: "Data de distribuición / recolha",
        initialCapacity: "Capaciudad inicial",
        rate: "Tarifa",
        profile: "Perfil",
        status: "Estado",
        carrier: "Transportador"
      },
      profile: {
        business: "Empresa",
        individual: "Particular"
      },
      proof: {
        title: "Comprobante de viagem",
        visibilityNote: "(visível solo para si y o administrador)",
        defaultName: "Documento de viagem",
        sizeKb: "{size} KB",
        download: "Transferir",
        empty: "Ningún documento fornecido.",
        validate: "Validar comprobante",
        reject: "Rejeitar"
      },
      trust: {
        title: "Transporte seguro",
        item1: "Os comprobantes de viagem permanecen privados y reservados à administración.",
        item2: "Os objetos transportados devem ser declarados.",
        item3: "A reserva é confirmada pelo transportador."
      }
    },
    my: {
      perKg: "{price} / kg",
      departure: "Partida {date}",
      remainingKg: "{kg} kg restantes",
      edit: "Editar",
      close: "Encerrar",
      reactivate: "Reactivar"
    },
    favorite: {
      badge: "Paquete",
      departureOn: "Partida em {date}",
      availableKg: "{kg} kg",
      availableLabel: "disponibles",
      perKg: "{price} / kg",
      open: "Abrir"
    },
    snapshot: {
      reservedKg: "{kg} kg reservados",
      reservationAccepted: "Reserva aceite",
      remainingKg: "{kg} kg restantes",
      reservedWeight: "Peso reservado: {kg} kg",
      departure: "Partida {date}",
      client: "Cliente: {name}"
    }
  },
  jobs: {
    browse: {
      eyebrow: "Oportunidades",
      title: "Empleos y missões",
      description: "Ofertas publicadas por empresas y membros do MOXT.",
      activeOffers: "Ofertas activas",
      allJobs: "Todos os empleos",
      myJobs: "Os meus empleos",
      receivedRequests: "Pedidos recebidos",
      publish: "Publicar un empleo",
      searchPlaceholder: "Profissão, empresa, setor, competência...",
      location: "Local",
      sector: "Setor",
      contract: "Contrato",
      allContracts: "Todos os contratos",
      activeTab: "Empleos activos",
      archivesTab: "Arquivo",
      emptyActiveTitle: "Ningún empleo publicado",
      emptyArchiveTitle: "Ningún arquivo",
      emptyActiveDescription: "Volte em breve o publique a tu própria oferta.",
      emptyArchiveDescription: "As ofertas expiradas o encerradas aparecerão aquí."
    },
    card: {
      salaryToConfirm: "Remuneración a confirmar",
      archived: "Arquivado",
      business: "Empresa",
      individual: "Particular",
      salary: "Remuneración",
      contractType: "Tipo de contrato",
      viewOffer: "Ver oferta"
    },
    labels: {
      empty: "No indicado",
      remote: "Trabalho remoto",
      remotePossible: "Trabalho remoto possível",
      offerFallback: "Oferta de empleo"
    },
    detail: {
      notFound: "Empleo no encontrado.",
      publishedOn: "Publicado em {date}",
      edit: "Editar",
      imageAlt: "{title} — imagem {index}",
      metrics: {
        contract: "Contrato",
        location: "Local",
        applications: "Candidaturas",
        salary: "Remuneración"
      },
      description: "Descripción",
      requirements: "Perfil pretendido",
      benefits: "Benefícios",
      application: "Candidatura",
      report: "Denunciar",
      receivedCount: "{count} candidatura(s) recebida(s).",
      applicationTracked: "A tu candidatura está a ser acompanhada y será notificado de cada alteración.",
      nextStepLabel: "Próximo paso",
      nextStep: {
        submittedTitle: "Candidatura enviada",
        submittedDescription: "Tu mensaje se envió al reclutador en la mensajería MOXT.",
        acceptedTitle: "Candidatura aceite",
        acceptedDescription: "Contacte o reclutador para organizar os próximos pasos.",
        rejectedTitle: "Candidatura recusada",
        rejectedDescription: "Pode guardar esta oferta nos favoritos o contactar o reclutador se necessário."
      },
      withdraw: "Retirar a minha candidatura",
      message: "Mensaje",
      apply: "Candidatarme y escribir",
      applying: "Enviando…",
      infoTitle: "Informaciones sobre o posto",
      facts: {
        company: "Empresa",
        profile: "Perfil",
        sector: "Setor",
        contractType: "Tipo de contrato",
        experience: "Experiência",
        language: "Língua",
        location: "Localización",
        start: "Inicio",
        deadline: "Prazo",
        status: "Estado",
        reference: "Referência"
      },
      tipsTitle: "Conselhos aos candidatos",
      tips: {
        noPayment: "No envie cuálquer pagamento para se candidatar.",
        useMessaging: "Troque mensajes con o reclutador na caixa de mensajes.",
        checkConditions: "Verifique as condiciones antes de aceitar una missão."
      },
      reportTitle: "Denunciar esta oferta",
      reportToastTitle: "Denúncia enviada",
      reportToastMessage: "A nuestra equipo vai analisar esta oferta."
    },
    applications: {
      eyebrow: "Empleos",
      title: "Pedidos de empleo",
      description: "Trate as candidaturas ligadas às tus ofertas publicadas.",
      back: "Voltar aos empleos",
      defaultApplicant: "Membro MOXT",
      accept: "Aceitar",
      reject: "Recusar",
      emptyTitle: "Ninguna candidatura",
      emptyDescription: "Os nuevos pedidos ligados às tus ofertas aparecerão aquí.",
      panelTitle: "Candidaturas recebidas",
      panelDescription: "Trate os pedidos ligados às tus ofertas publicadas."
    },
    sectors: {
      tech: "Tecnologia y informática",
      commerce: "Comércio y vendas",
      transport: "Transporte y logística",
      hospitality: "Restauración y hotelaria",
      education: "Ensino y formación",
      health: "Saúde y bem-estar",
      construction: "Construción y obras",
      services: "Servicios à pessoa",
      finance: "Finanzas y contabilidade",
      arts: "Artes y comunicación",
      realEstate: "Imobiliário",
      other: "Outro"
    },
    contracts: {
      fullTime: "Tempo completo",
      partTime: "Tempo parcial",
      contract: "Contrato",
      internship: "Estágio",
      freelance: "Freelance"
    }
  },
  marketplace: {
    common: {
      name: "Mercado",
      type: "Tipo",
      category: "Categoría",
      title: "Título",
      description: "Descripción",
      price: "Precio",
      originalPrice: "Precio original",
      discount: "Desconto",
      photos: "Fotos",
      city: "Ciudad",
      currency: "Moneda",
      country: "País",
      russia: "Rusia",
      district: "Bairro",
      contact: "Contacto",
      whatsapp: "WhatsApp",
      warranty: "Garantia",
      returnPolicy: "Política de devolución",
      brand: "Marca",
      model: "Modelo",
      color: "Cor",
      condition: "Estado",
      stock: "Stock",
      quantity: "Quantidade",
      address: "Dirección completo",
      optional: "Opcional",
      select: "Selecionar",
      all: "Todos",
      allPlural: "Todos",
      allFeminine: "Todas",
      cancel: "Cancelar",
      save: "Guardar",
      edit: "Editar",
      delete: "Eliminar",
      archive: "Arquivar",
      publish: "Publicar",
      previous: "Anterior",
      next: "Seguinte",
      continue: "Continuar",
      add: "Adicionar",
      freeOrNegotiable: "Grátis o a negociar",
      negotiable: "A negociar",
      onQuote: "Sob consulta",
      viewed: "Visto",
      viewDetails: "Ver ficha",
      consult: "Consultar",
      duplicate: "Duplicar",
      republish: "Republicar",
      markSold: "Marcar como vendido",
      yes: "Sim",
      no: "No",
      views: "{count} visualizaciones",
      favorites: "{count} favoritos",
      availableCount: "{count} disponible(is)",
      outOfStock: "Esgotado",
      reference: "Ref. {id}",
      publishedOn: "Publicado em {date}",
      stepProgress: "Paso {step}/{total} · {label}",
      requiredMinChars: "(mín. {count} caracteres)",
      rub: "RUB"
    },
    types: {
      product: {
        label: "Produto",
        hint: "Objeto físico para venda"
      },
      service: {
        label: "Serviço",
        hint: "Prestación de serviço, aconselhamento, mão de obra"
      },
      rental: {
        label: "Aluguer",
        hint: "Bem colocado em aluguer"
      },
      vehicle: {
        label: "Veículo",
        hint: "Carro, moto, scooter"
      },
      digital: {
        label: "Digital",
        hint: "Ficheiro, software, curso en línea"
      },
      realEstate: {
        label: "Imobiliário",
        hint: "Apartamento, casa, terreno"
      },
      food: {
        label: "Alimentación",
        hint: "Produto alimentar, refeición preparada"
      },
      other: {
        label: "Outro",
        hint: "Tudo o que no se encaixa numa categoría"
      }
    },
    categories: {
      product: {
        electronics: "Eletrónica",
        fashion: "Moda y vestuário",
        home: "Casa y decoración",
        beauty: "Beleza y higiene",
        sport: "Desporto y lazer",
        books: "Livros y papelaria",
        other: "Outro produto"
      },
      food: {
        fresh: "Produtos frescos",
        prepared: "Refeiciones preparadas",
        dry: "Mercearia seca",
        drink: "Bebidas",
        other: "Outros alimentos"
      },
      service: {
        personal: "Servicios à pessoa",
        education: "Aulas y formación",
        it: "Informática y web",
        transport: "Transporte y mudanças",
        beauty: "Cabeleireiro y estética",
        repair: "Reparación y bricolage",
        other: "Outro serviço"
      },
      rental: {
        vehicle: "Veículo",
        equipment: "Material y equipomento",
        event: "Material para eventos",
        other: "Outro aluguer"
      },
      vehicle: {
        car: "Carro",
        moto: "Moto / Scooter",
        truck: "Camião / Utilitário",
        bicycle: "Bicicleta",
        other: "Outro veículo"
      },
      digital: {
        software: "Software / App",
        course: "Curso en línea",
        template: "Template / Design",
        ebook: "Ebook / Documento",
        other: "Outro digital"
      },
      realEstate: {
        apartment: "Apartamento",
        house: "Casa",
        studio: "Estúdio",
        land: "Terreno",
        office: "Escritório / Loja",
        room: "Quarto"
      },
      other: "Outro"
    },
    conditions: {
      new: "Nuevo",
      likeNew: "Como nuevo",
      used: "Usado",
      refurbished: "Recondicionado"
    },
    delivery: {
      pickup: "Recolha no local",
      local: "Entrega local",
      shipping: "Envio",
      home: "Entrega em casa",
      onSite: "No local do cliente",
      remote: "À distância",
      workshop: "Em atelier / loja",
      handDelivery: "Entrega em mãos",
      possible: "Entrega possível",
      online: "Descarregamento en línea",
      visit: "Visita con marcación"
    },
    extra: {
      weight: {
        label: "Peso / Volume",
        placeholder: "Ex.: 500 g, 1 L"
      },
      expiryDate: {
        label: "Data de validade (opcional)"
      },
      ingredients: {
        label: "Composición / Alergénios",
        placeholder: "Ex.: farinha, ovos, sin glúten…"
      },
      availability: {
        label: "Disponibilidade",
        placeholder: "Ex.: seg-sex 9h-18h, con marcación"
      },
      duration: {
        label: "Duración do serviço",
        placeholder: "Ex.: 1h, meio-dia"
      },
      remote: {
        label: "Possível à distância"
      },
      deposit: {
        label: "Caución (RUB)",
        placeholder: "0"
      },
      minDuration: {
        label: "Duración mínima",
        placeholder: "Ex.: 1 mês"
      },
      availableFrom: {
        label: "Disponible a partir de"
      },
      year: {
        label: "Ano",
        placeholder: "Ex.: 2020"
      },
      mileage: {
        label: "Quilometragem",
        placeholder: "Ex.: 45000"
      },
      fuel: {
        label: "Combustível",
        gasoline: "Gasolina",
        diesel: "Gasóleo",
        electric: "Elétrico",
        hybrid: "Híbrido",
        gas: "GPL"
      },
      transmission: {
        label: "Caixa de velociudads",
        manual: "Manual",
        automatic: "Automática"
      },
      digitalFormat: {
        label: "Formato",
        placeholder: "Ex.: PDF, MP4, ZIP"
      },
      fileSize: {
        label: "Tamanho do ficheiro",
        placeholder: "Ex.: 250 MB"
      },
      reType: {
        label: "Tipo de imóvel",
        apartment: "Apartamento",
        house: "Casa",
        studio: "Estúdio",
        land: "Terreno",
        office: "Escritório / Loja",
        room: "Quarto"
      },
      surface: {
        label: "Área (m²)",
        placeholder: "Ex.: 45"
      },
      rooms: {
        label: "Número de quartos",
        placeholder: "Ex.: 3"
      },
      floor: {
        label: "Andar",
        placeholder: "Ex.: 2 (0 = rés-do-chão)"
      },
      furnished: {
        label: "Mobilado",
        yes: "Mobilado",
        no: "No mobilado",
        partial: "Parcialmente mobilado"
      },
      reTransaction: {
        label: "Transación",
        sale: "Venda",
        rent: "Aluguer"
      },
      reState: {
        label: "Estado do imóvel",
        new: "Nuevo / Em construción",
        good: "Bom estado",
        renovated: "Renuevado",
        toRenovate: "A necessitar de obras"
      }
    },
    page: {
      description: "Produtos, servicios, alugueres y ofertas publicados pela comunidad.",
      stats: {
        activeListings: "Anuncios activos",
        categories: "Categorías"
      },
      myPublications: "As minhas publicaciones",
      publishListing: "Publicar un anuncio",
      searchPlaceholder: "Buscar: iPhone, cabeleireiro, apartamento, eletricista...",
      chooseTypeFirst: "Elige primero un tipo",
      category: "Categoría",
      cityDistrict: "Ciudad / bairro",
      minPrice: "Precio mínimo",
      maxPrice: "Precio máximo",
      emptyTitle: "Ningún anuncio encontrado",
      emptyDescription: "Tente alargar a tu búsqueda o publique já o tu anuncio."
    },
    detail: {
      notFound: "Anuncio no encontrado.",
      breadcrumb: "Trilho de navegación",
      tabs: {
        description: "Descripción",
        details: "Características",
        delivery: "Entrega y garantia",
        questions: "Perguntas",
        history: "Histórico"
      },
      tabsLabel: "Detalhe do anuncio",
      meta: "{city} · Publicado em {date} · Ref. {id}",
      share: "Compartir",
      shareSuccessTitle: "Anuncio partilhado",
      shareSuccessBody: "O link foi partilhado o copiado.",
      shareCancelledTitle: "Partilha cancelada",
      shareCancelledBody: "O anuncio no foi partilhado.",
      characteristics: "Características",
      about: "Sobre este anuncio",
      deliveryModes: "Modos de entrega",
      deliveryFee: "Taxa de entrega",
      delay: "Prazo",
      paymentsAccepted: "Pagamentos aceites",
      stockAvailable: "Stock disponible",
      location: "Localización",
      consultations: "Consultas",
      interest: "Interesse",
      paymentWarning: "Pagamento via MOXT. Verifique o produto antes de cuálquer transación.",
      verifyWarning: "Verifique o produto, o tu estado, a identidad do vendedor y as condiciones de entrega antes de cuálquer transación real.",
      buyCarefully: "Compre con prudência",
      buyTip1: "• Comunique solo a través da mensaje do MOXT.",
      buyTip2: "• Verifique o estado, o precio y a identidad do vendedor.",
      buyTip3: "• Recuse cuálquer pedido suspeito de pagamento antecipado.",
      editListing: "Editar anuncio",
      report: "Denunciar",
      adminActions: "Aciones de administrador",
      adminDescription: "Moderación direta do anuncio a partir da tu ficha detalhada.",
      similarTitle: "Anuncios semelhantes",
      similarDescription: "Mesma categoría o misma zona geográfica.",
      gallery: "Galeria",
      previousImage: "Imagem anterior",
      nextImage: "Imagem siguiente",
      previous: "Anterior",
      next: "Seguinte",
      imageCount: "Imagem {current} / {total}",
      showPhoto: "Mostrar a foto {index} de {title}",
      openGallery: "Abrir a galeria em ecrã inteiro",
      noPhotoYet: "O vendedor aún no adicionou una foto real.",
      brandMarketplace: "MOXT Marketplace",
      estimatedTotal: "Total estimado:",
      favorite: "Favorito",
      favoriteActive: "Favorito ✓",
      favorites: "Favoritos",
      openActionsMenu: "Abrir menu de aciones",
      closeActionsMenu: "Cerrar menu de aciones",
      soldConfirmTitle: "Marcar este anuncio como vendido?",
      soldConfirmDescription: "O anuncio deixará de estar visível nos resultados activos.",
      reportTitle: "Denunciar este anuncio",
      reportToastTitle: "Denúncia enviada",
      reportToastBody: "A nuestra equipo irá analisar este anuncio.",
      askQuestion: "Fazer una pergunta pública",
      askPlaceholder: "Peça un esclarecimento sobre o estado, a entrega o a disponibilidade...",
      publishQuestion: "Publicar a pergunta",
      ownerQuestionsHint: "Responda publicamente às perguntas dos compradores para tranquilizar futuros visitantes.",
      sellerAnswer: "Resposta do vendedor",
      yourPublicAnswer: "A tu resposta pública",
      answerPlaceholder: "Responda de forma clara para ayudar otros compradores...",
      publishAnswer: "Publicar a resposta",
      reply: "Responder",
      waitingSellerAnswer: "A aguardar a resposta do vendedor.",
      noPublicQuestions: "Sem perguntas públicas.",
      saveAmount: "Poupe {amount}"
    },
    edit: {
      notFound: "Anuncio no encontrado.",
      title: "Editar anuncio",
      description: "Atualize as informaciones, o precio y a galeria.",
      specificInfo: "Informaciones específicas",
      titlePlaceholder: "Ex.: iPhone 14 Pro 256 GB Preto",
      stockPlaceholder: "Ex.: 10",
      brandPlaceholder: "Ex.: Samsung, Nike…",
      modelPlaceholder: "Ex.: Galaxy S23, Air Max…",
      colorPlaceholder: "Ex.: Preto, Branco…",
      priceInRub: "Precio em RUB",
      cityInRussia: "Ciudad na Rusia",
      cityPlaceholder: "Ex.: Moscovo, São Petersburgo…",
      districtPlaceholder: "Ex.: Tverskoy, Arbat…",
      fullAddress: "Dirección completo na Rusia",
      addressPlaceholder: "Ex.: Tverskaya 12, apartamento 45, Moscovo",
      imagesMax: "Imagens, máximo 3",
      deliveryFee: "Taxa de entrega",
      deliveryFeePlaceholder: "Ex.: 300 (em RUB)",
      deliveryDelay: "Prazo de entrega",
      deliveryDelayPlaceholder: "Ex.: 2-3 días",
      warrantyPlaceholder: "Ex.: 12 meses do fabricante",
      returnPolicyPlaceholder: "Ex.: Devolución em 7 días, estado nuevo"
    }
  },
  publish: {
    common: {
      previous: "Anterior",
      continue: "Continuar",
      saveChanges: "Guardar alteraciones",
      emDash: "-",
      business: {
        unverifiedTitle: "Empresa no verificada",
        continueAsIndividual: "Pode continuar como particular.",
        pendingReview: "A tu empresa está em verificación. Podrá publicar em nome da empresa após validación pela MOXT.",
        rejected: "A tu empresa no está autorizada a publicar de momento. Contacte o soporte MOXT.",
        needsVerification: "A tu empresa deve ser verificada pela MOXT antes de cuálquer publicación em nome da empresa.",
        serviceNotDeclaredTitle: "Servicio no declarado",
        serviceNotDeclared: "Tu empresa no está declarada para este servicio — solo publicación personal.",
        editServices: "Editar los servicios de la empresa"
      },
      toasts: {
        businessBlockedTitle: "Publicación de empresa indisponible",
        businessServiceBlockedMessage: "Tu empresa no está declarada para este servicio. Publica como particular o modifica tus servicios.",
        imagesFailedTitle: "Imagens no enviadas",
        retry: "Tente nuevamente."
      }
    },
    parcel: {
      back: "Paquetes",
      title: "Publicar una viagem",
      steps: {
        route: "Percurso",
        cargo: "Paquetes",
        terms: "Condiciones",
        review: "Validar"
      },
      countries: {
        russia: "Rusia",
        benin: "Benim",
        africa: "África"
      },
      direction: {
        title: "Sentido da viagem",
        originPrefix: "A Rusia é siempre o ponto de partida o de chegada. O tu país de origem:",
        notProvided: "no indicado",
        fromRussia: "🇷🇺 Rusia",
        toRussia: "🇷🇺 Rusia",
        hintRuToOrigin: "Viajo da Rusia para o meu país de origem",
        hintOriginToRu: "Viajo do meu país de origem para a Rusia",
        selected: "Selecionado"
      },
      alert: {
        airportOnly: "Só são propostas ciudads con aeroporto: o transporte é feito por avião."
      },
      fields: {
        departureHeading: "Partida · {country}",
        arrivalHeading: "Chegada · {country}",
        originCity: "Ciudad de partida",
        destinationCity: "Ciudad de chegada",
        departureDate: "Data de partida",
        depositDeadline: "Prazo de entrega (opcional)",
        distributionDate: "Data de distribuición / levantamento",
        distributionHint: "A data de distribuición indica cuando os destinatários poderão começar a levantar a paquete à chegada.",
        acceptedTypesTitle: "Tipos de paquete aceites",
        acceptedTypesHint: "Selecciona tudo o que aceita transportar. É possível elegir várias opciones.",
        capacityKg: "Capaciudad total (kg)",
        maxWeightPerItem: "Peso máximo por paquete (kg, opcional)",
        maxWeightPlaceholder: "Ex.: 5",
        pricePerKg: "Precio por kg",
        pricePerKgRub: "Precio por kg (RUB)",
        currency: "Moneda",
        rejectedTypes: "Tipos recusados / restriciones (opcional)",
        rejectedTypesPlaceholder: "Ex.: Sem líquidos, sin materiais perigosos...",
        conditionsTitle: "Condiciones y contacto",
        travelProof: "Comprobante de viagem (bilhete, reserva...)",
        travelProofChoose: "Escolher ficheiro (PDF o imagem)",
        travelProofHint: "Visível solo pela equipo MOXT para verificación, nunca publicado publicamente. Máx. 5 MB.",
        travelProofReady: "Pronto",
        travelProofUploading: "A enviar...",
        travelProofRemove: "Remover ficheiro",
        travelProofKb: "{size} KB",
        conditions: "Condiciones de transporte",
        conditionsPlaceholder: "Fotos pedidas, embalagem exigida, modalidades de entrega...",
        contact: "Teléfono de contacto (russo)",
        publishAs: "Publicar como",
        publishAsBusiness: "{name} (empresa)",
        publishAsPerson: "Particular",
        publishAsHint: "La asociación a una empresa solo es posible si el módulo Paquetes está activado."
      },
      defaults: {
        conditions: "Objetos autorizados solo após verificación. Fotos pedidas antes da aceitación."
      },
      types: {
        clothes: {
          label: "Roupa",
          sub: "y têxteis"
        },
        food: {
          label: "Alimentar",
          sub: "Produtos frescos / secos"
        },
        electronics: {
          label: "Eletrónica",
          sub: "Aparelhos y acessórios"
        },
        documents: {
          label: "Documentos",
          sub: "Papéis y correo"
        },
        cosmetics: {
          label: "Cosméticos",
          sub: "Beleza y cuidados"
        },
        gifts: {
          label: "Presentes",
          sub: "Objetos diversos"
        },
        medicine: {
          label: "Medicamentos",
          sub: "Apenas declarados"
        }
      },
      review: {
        title: "Resumo",
        route: "Percurso",
        departure: "Partida",
        distribution: "Distribuición / levantamento",
        capacity: "Capaciudad total",
        capacityValue: "{kg} kg",
        pricePerKg: "Precio / kg",
        priceValue: "{price} RUB",
        acceptedTypes: "Tipos aceites",
        contact: "Contacto",
        travelProof: "Comprobante de viagem",
        travelProofValue: "{name} ✓",
        successHint: "A tu viagem será visível imediatamente na sección Paquetes. Os remetentes poderão contactá-lo diretamente."
      },
      nav: {
        publish: "Publicar viagem"
      },
      conditionsAcceptedPrefix: "Tipos aceites: {types}. {conditions}",
      validation: {
        originRequired: "Ciudad de partida (aeroporto) obrigatória.",
        destinationRequired: "Ciudad de destino (aeroporto) obrigatória.",
        departureDateRequired: "Data de partida obrigatória.",
        departureDatePast: "A data de partida no pode ser anterior a hoy.",
        depositDeadlinePast: "O plazo de entrega no pode estar no passado.",
        depositDeadlineAfterDeparture: "O plazo de entrega no pode ultrapassar a data de partida.",
        distributionAfterDeparture: "A data de distribuición deve ser a partir da data de partida.",
        distributionRequired: "Data de distribuición / levantamento obrigatória.",
        acceptedTypesRequired: "Selecciona pelo menos un tipo.",
        capacityRequired: "Capaciudad obrigatória.",
        priceRequired: "Precio obligatorio.",
        contactRequired: "Contacto obligatorio.",
        travelProofRequired: "É obligatorio un comprobante de viagem (bilhete, reserva...).",
        origin: "Origem obrigatória.",
        destination: "Destino obligatorio.",
        futureDate: "Elige una data futura.",
        depositBeforeDeparture: "O plazo deve preceder a partida.",
        depositRequired: "Prazo de entrega obligatorio.",
        distributionFromDeparture: "A distribuición deve ser a partir da data de partida.",
        conditionsMin: "Indica as condiciones."
      },
      toasts: {
        fileTooLarge: {
          title: "Ficheiro demasiado grande",
          message: "O comprobante de viagem no deve exceder 5 MB.",
          inline: "O ficheiro no deve exceder 5 MB."
        },
        proofAdded: {
          title: "Comprobante adicionado",
          message: "O documento de viagem foi enviado."
        },
        uploadFailed: {
          inline: "Falha no envio do ficheiro. Tente nuevamente.",
          title: "Envio impossível",
          message: "No foi possível enviar o comprobante de viagem."
        },
        businessBlockedMessage: "Tu empresa debe estar verificada y tener el módulo Paquetes antes de publicar.",
        publishedTitle: "Viagem publicada",
        pendingTitle: "Viagem enviada",
        publishedMessage: "A tu viagem está en línea.",
        pendingMessage: "Cuenta no verificada: a viagem será visível após validación MOXT."
      },
      edit: {
        notFound: "Paquete no encontrada.",
        eyebrow: "Paquetes",
        title: "Editar anuncio de viagem",
        description: "Atualize as informaciones do tu anuncio de transporte."
      }
    },
    job: {
      back: "Empleos",
      title: "Publicar una oferta de empleo",
      steps: {
        offer: "A oferta",
        details: "Detalhes",
        location: "Local",
        review: "Validar"
      },
      sections: {
        role: "Cargo y área",
        contract: "Tipo de contrato y idioma",
        details: "Detalhes do cargo",
        location: "Local y modalidades",
        review: "Resumo"
      },
      fields: {
        title: "Título do cargo",
        titlePlaceholder: "Ex.: Programador web, professor de francês, cozinheiro...",
        sector: "Setor de atividade",
        sectorSelected: "Setor selecionado:",
        contractType: "Tipo de contrato",
        experience: "Experiência exigida",
        language: "Idioma de trabalho",
        description: "Descripción",
        descriptionMin: "(mín. 30 caracteres)",
        descriptionPlaceholder: "Missões, responsabilidades, contexto da equipo...",
        requirements: "Perfil procurado",
        requirementsPlaceholder: "Competências, diplomas, cuálidades esperadas...",
        benefits: "Benefícios (opcional)",
        benefitsPlaceholder: "Alojamento, refeiciones, transporte, prémio...",
        salary: "Remuneración",
        salaryPlaceholder: "Ex.: 95 000 RUB",
        salaryPeriod: "Período",
        location: "Ciudad / Local",
        locationShort: "Local",
        remote: "Teletrabalho possível",
        remoteHint: "O cargo pode ser exercido à distância",
        startDate: "Data de inicio (opcional)",
        deadline: "Prazo de candidatura",
        posters: "Cartazes da oferta (opcional)",
        postersHint: "Adicione una o más imagens (logótipo, cartaz, visual). A primeira será a imagem principal.",
        publisherProfile: "Perfil de publicación",
        publisherPersonal: "Perfil pessoal · {name}",
        publisherBusiness: "Empresa · {name}",
        publisherHint: "Cualquier persona puede publicar una oferta. La asociación a una empresa solo es posible si el módulo Empleos está activado.",
        publisherName: "Nome do empregador apresentado"
      },
      sectors: {
        tech: {
          label: "Tecnologia"
        },
        commerce: {
          label: "Comércio"
        },
        transport: {
          label: "Transporte"
        },
        hospitality: {
          label: "Restauración"
        },
        education: {
          label: "Ensino"
        },
        health: {
          label: "Saúde"
        },
        construction: {
          label: "Construción"
        },
        services: {
          label: "Servicios"
        },
        finance: {
          label: "Finanzas"
        },
        arts: {
          label: "Artes y comunicación"
        },
        realEstate: {
          label: "Imobiliário"
        },
        other: {
          label: "Outro"
        }
      },
      experience: {
        none: {
          label: "Sem experiência",
          sub: "Principiante bem-vindo",
          option: "Sem experiência"
        },
        junior: {
          label: "1-2 anos",
          sub: "Júnior",
          option: "1-2 anos (Júnior)"
        },
        mid: {
          label: "3-5 anos",
          sub: "Experiente",
          option: "3-5 anos (Experiente)"
        },
        senior: {
          label: "5+ anos",
          sub: "Especialista",
          option: "5+ anos (Especialista)"
        }
      },
      languages: {
        fr: "Francês",
        ru: "Russo",
        en: "Inglês",
        frRu: "Francês + Russo"
      },
      contracts: {
        fullTime: "Tempo inteiro",
        partTime: "Tempo parcial",
        contract: "Contrato",
        internship: "Estágio",
        freelance: "Freelance"
      },
      salaryPeriods: {
        hour: "Por hora",
        day: "Por dia",
        month: "Por mês",
        project: "Por projeto"
      },
      review: {
        role: "Cargo",
        sector: "Setor",
        contract: "Contrato",
        salary: "Remuneración",
        salaryValue: "{salary} / {period}",
        location: "Local",
        locationRemote: "{location} · Teletrabalho possível",
        publisher: "Publicado por",
        successHint: "A tu oferta será visível imediatamente na sección Empleos. Podrá editá-la no tu espacio profesional."
      },
      nav: {
        publish: "Publicar a oferta"
      },
      validation: {
        titleRequired: "Título do cargo obligatorio.",
        sectorRequired: "Setor obligatorio.",
        descriptionMin: "Descripción demasiado curta (mín. 30 caracteres).",
        salaryRequired: "Remuneración obrigatória.",
        locationRequired: "Local obligatorio.",
        title: "Título obligatorio.",
        sector: "Setor obligatorio.",
        location: "Local obligatorio.",
        contractType: "Tipo obligatorio.",
        salary: "Remuneración obrigatória.",
        descriptionChars: "Adicione pelo menos 30 caracteres.",
        requirements: "Perfil procurado obligatorio.",
        applicationMessage: "Adicione pelo menos 20 caracteres."
      },
      toasts: {
        businessBlockedMessage: "A tu empresa deve estar verificada y ter o módulo Empleos antes da publicación.",
        publishedTitle: "Oferta publicada",
        pendingTitle: "Oferta enviada",
        publishedMessage: "A tu oferta está en línea.",
        pendingMessage: "Cuenta no verificada: a oferta será visível após validación MOXT."
      },
      edit: {
        notFound: "Oferta no encontrada.",
        eyebrow: "Empleos",
        title: "Editar oferta de empleo",
        description: "Atualize as informaciones da tu oferta."
      }
    },
    event: {
      back: "Eventos",
      title: "Crear un evento",
      steps: {
        basics: "O evento",
        program: "Programa",
        location: "Local y acesso",
        review: "Validar"
      },
      sections: {
        basics: "O evento",
        format: "Formato do evento",
        program: "Programa y descripción",
        posters: "Cartazes do evento",
        venue: "Local físico",
        online: "Acesso en línea",
        access: "Acesso y organizador",
        review: "Resumo"
      },
      fields: {
        title: "Título do evento",
        titlePlaceholder: "Ex.: Festa nacional do Benim em Moscovo, curso de russo...",
        category: "Categoría",
        selectCategory: "Selecionar",
        start: "Inicio",
        end: "Fim (opcional)",
        registrationDeadline: "Prazo de inscrición",
        capacity: "Capaciudad (pessoas)",
        capacityPlaceholder: "Ex.: 100",
        formatChosen: "Formato escolhido:",
        description: "Descripción",
        descriptionMin: "(mín. 20 caracteres)",
        descriptionPlaceholder: "Describe el evento, el ambiente y lo que vivirán los participantes…",
        program: "Programa / agenda (opcional)",
        programPlaceholder: "18h00 - Receción · 18h30 - Discursos · 19h00 - Refeición...",
        speakers: "Intervenientes / Artistas (opcional)",
        speakersPlaceholder: "Ex.: DJ Soulful, conferencista Sr. Dupont...",
        posters: "Cartazes / visuais (opcional)",
        postersHint: "Adicione un o más cartazes. O primero será a imagem principal.",
        city: "Ciudad",
        venue: "Nome do local",
        venuePlaceholder: "Ex.: Casa da cultura africana, Hotel Cosmos...",
        address: "Dirección completo",
        addressPlaceholder: "Ex.: Prospekt Mira 150, Moscovo",
        onlineLink: "Ligación de acesso",
        onlineLinkPlaceholder: "https://zoom.us/j/... o https://meet.google.con/...",
        onlineLinkHint: "A ligación será partilhada con os participantes inscritos. Verifique se continua válida.",
        freeEntry: "Entrada gratuita",
        freeEntryHint: "Desmarque para definir un precio",
        price: "Precio de entrada (RUB)",
        currency: "Moneda",
        organizerName: "Organizador (nome apresentado)",
        organizerNamePlaceholder: "Ex.: Associación MOXT, Clube Africano...",
        organizerContact: "Contacto do organizador",
        organizerContactPlaceholder: "Teléfono o correo",
        publishAs: "Publicar como",
        publishAsBusiness: "{name} (empresa)",
        publishAsPerson: "Particular",
        publishAsHint: "La asociación a una empresa solo es posible si el módulo Eventos está activado.",
        format: "Formato"
      },
      categories: {
        networking: "Networking",
        training: "Formación",
        culture: "Cultura",
        business: "Business",
        community: "Comunidad"
      },
      formats: {
        inPerson: {
          label: "Presencial",
          sub: "Local físico obligatorio"
        },
        online: {
          label: "Online",
          sub: "Ligación de acesso obrigatória"
        },
        hybrid: {
          label: "Híbrido",
          sub: "Presencial + streaming"
        }
      },
      review: {
        titleLabel: "Título",
        category: "Categoría",
        format: "Formato",
        start: "Inicio",
        location: "Local",
        onlineLocation: "Online",
        venueCity: "{venue}, {city}",
        capacity: "Capaciudad",
        capacityValue: "{count} pessoas",
        price: "Precio",
        free: "Gratuito",
        priceValue: "{price} RUB",
        organizer: "Organizador",
        successHint: "O tu evento será publicado imediatamente y será visível na sección Eventos do MOXT."
      },
      nav: {
        publish: "Crear evento"
      },
      validation: {
        titleRequired: "Título do evento obligatorio.",
        categoryRequired: "Categoría obrigatória.",
        startRequired: "Data de inicio obrigatória.",
        descriptionMin: "Descripción demasiado curta.",
        venueRequired: "Local obligatorio.",
        onlineLinkRequired: "Ligación obrigatória.",
        cityRequired: "Ciudad obrigatória.",
        title: "Título obligatorio.",
        category: "Categoría obrigatória.",
        city: "Ciudad obrigatória.",
        venue: "Local obligatorio.",
        futureDate: "Elige una data futura.",
        description: "Descripción obrigatória."
      },
      toasts: {
        businessBlockedMessage: "Tu empresa debe estar verificada y tener el módulo Eventos antes de publicar.",
        publishedTitle: "Evento publicado",
        pendingTitle: "Evento enviado",
        publishedMessage: "O tu evento está en línea.",
        pendingMessage: "Cuenta no verificada: o evento será visível após validación MOXT."
      },
      edit: {
        notFound: "Evento no encontrado.",
        eyebrow: "Eventos",
        title: "Editar evento",
        description: "Atualize as informaciones do tu evento."
      }
    },
    listing: {
      title: "Publicar un anuncio",
      steps: {
        type: "Tipo",
        details: "Detalhes",
        photos: "Fotos",
        location: "Localización"
      },
      chooseType: "Que tipo de anuncio?",
      categoryHeading: "Categoría",
      listingTitle: "Título do anuncio",
      titlePlaceholder: {
        realEstate: "Ex.: Apartamento T2 mobilado, Centro de Moscovo",
        vehicle: "Ex.: Toyota Camry 2020, 45.000 km, excelente estado",
        service: "Ex.: Aulas de francês para russófonos — 1h",
        food: "Ex.: Arroz aromático do Benim — entrega em Moscovo",
        default: "Ex.: iPhone 14 Pro 256 GB – Excelente estado"
      },
      detailsHeading: "Detalhes do anuncio",
      descriptionMin: "Descripción",
      descriptionPlaceholder: {
        realEstate: "Área, número de quartos, comodidades, proximidade de transportes, encargos…",
        vehicle: "Histórico de manutención, equipomentos, pontos fortes, motivo da venda…",
        service: "Como decorre a prestación, competências, experiência, tarifa horária…",
        food: "Composición, origem, alergénios, modo de conservación…",
        default: "Describe tu anuncio: estado, accesorios incluidos, motivo de la venta…"
      },
      priceMonthly: "Precio / Renda mensal (RUB)",
      priceService: "Tarifa (RUB)",
      priceDefault: "Precio (RUB)",
      currencyRussia: "RUB — Mercado da Rusia",
      applyDiscount: "Aplicar un desconto",
      applyDiscountHint: "O precio con desconto será apresentado con o precio original rasurado",
      originalPrice: "Precio original (RUB)",
      discountPercent: "Desconto (%)",
      originalPricePlaceholder: "Ex.: 15.000",
      discountPercentPlaceholder: "Ex.: 20",
      productCondition: "Estado do produto",
      availableQuantity: "Quantidade disponible",
      specificInfo: "Informaciones específicas · {type}",
      photosHint: "Máximo de 6 fotos · a primeira será a foto principal · haz clic para reordenar.",
      mainPhoto: "Principal",
      dropPhotos: "Haz clic o arraste as tus fotos aquí",
      dropPhotosHint: "JPG, PNG, WebP — máx. 6 fotos",
      addMorePhotos: "Adicionar más fotos",
      locationContact: "Localización y contacto",
      cityInRussia: "Ciudad na Rusia",
      districtInRussia: "Bairro na Rusia",
      districtPlaceholder: "Ex.: Tverskoy, Zamoskvorechye…",
      addressPlaceholder: "Ex.: Tverskaya 12, apart. 45, Moscovo",
      russianPhone: "Número de teléfono russo",
      whatsappOptional: "WhatsApp (opcional)",
      deliveryOptions: "Opciones de entrega",
      publishAs: "Publicar como",
      asBusiness: "{name} (empresa)",
      asIndividual: "Particular",
      publishAsHint: "La asociación a una empresa solo es posible si el módulo Marketplace está activado.",
      summary: "Resumo",
      publishing: "A publicar...",
      publishCta: "Publicar anuncio",
      businessBlockedTitle: "Publicación como empresa impossível",
      businessBlockedBody: "Tu empresa debe estar verificada y tener el módulo Marketplace antes de publicar.",
      publishedTitle: "Anuncio publicado",
      sentTitle: "Anuncio enviado",
      publishedBody: "O tu anuncio está en línea.",
      pendingBody: "Cuenta no verificada: o anuncio será visível após validación da MOXT."
    }
  },
  marketplaceValidation: {
    chooseListingType: "Elige un tipo de anuncio.",
    chooseCategory: "Elige una categoría.",
    titleTooShort: "Título demasiado curto (mín. 4 caracteres).",
    descriptionTooShort: "Descripción demasiado curta (mín. 20 caracteres).",
    priceRequired: "Precio obligatorio.",
    photosRequired: "Adicione pelo menos una foto.",
    cityRequired: "Ciudad obrigatória.",
    districtRequired: "Bairro obligatorio.",
    addressTooShort: "Dirección demasiado curto.",
    contactRequired: "Contacto obligatorio.",
    invalidType: "Elige un tipo de anuncio válido.",
    categoryMismatch: "Esta categoría no é compatível con o tipo de anuncio.",
    conditionRequired: "Indica o estado do bem.",
    stockMin: "A quantidade disponible deve ser superior a zero.",
    fieldRequired: "{field} é obligatorio.",
    roomsRequired: "Indica o número de quartos.",
    invalidVehicleYear: "O ano do veículo é inválido.",
    categoryRequired: "Categoría obrigatória.",
    titleShort: "Título demasiado curto.",
    titleRequired: "Título obligatorio.",
    descriptionMin: "Adicione pelo menos 20 caracteres.",
    pricePositive: "O precio deve ser superior a 0.",
    currencyRubOnly: "O mercado utiliza solo RUB.",
    districtArrondissementRequired: "Bairro obligatorio.",
    addressCompleteMin: "Adicione un dirección completo.",
    addressCompleteRequired: "Dirección completo obligatorio."
  },
  transfers: {
    direction: {
      bjToRu: "Benim para Rusia",
      ruToBj: "Rusia para Benim",
      africaToRu: "África → Rusia",
      ruToAfrica: "Rusia → África"
    },
    status: {
      pending: "Pagamento pendiente",
      declared: "Pagamento declarado",
      received: "Pagamento recebido",
      processing: "Em processamento",
      paidOut: "Transferencia efetuada",
      completed: "Concluído",
      cancelled: "Cancelado",
      expired: "Expirado"
    },
    progress: {
      created: "Criado",
      declared: "Declarado",
      received: "Recebido",
      paymentReceived: "Pagamento recebido",
      paidOut: "Pago",
      completed: "Concluído"
    },
    timeline: {
      pending: "Transferencia criada, pagamento pendiente",
      declared: "Pagamento declarado pelo cliente",
      received: "Pagamento recebido pelo parceiro",
      processing: "Transferencia antiga em processamento",
      paidOut: "Transferencia efetuada pela empresa",
      completed: "Pagamento validado, transferencia concluída",
      cancelled: "Transferencia cancelada",
      expired: "Prazo de pagamento expirado"
    },
    nextStep: {
      pending: {
        title: "Ación do cliente necessária",
        description: "Adicione un comprobante y declare o pagamento. A empresa será notificada automaticamente."
      },
      declared: {
        title: "Ación da empresa necessária",
        description: "O parceiro deve confirmar a receción do pagamento no painel."
      },
      received: {
        title: "Transferencia em preparación",
        description: "A empresa deve efetuar a transferencia y pode adicionar o comprobante do envio."
      },
      paidOut: {
        title: "Validación final pendiente",
        description: "A empresa deve validar o fim da transferencia. O recibo será después guardado."
      },
      completed: {
        title: "Operación concluída",
        description: "O recibo está disponible y a transferencia já no pode ser cancelada."
      },
      cancelled: {
        title: "Operación cancelada",
        description: "No é possível cuálquer otra ación nesta transferencia."
      },
      expired: {
        title: "Prazo ultrapassado",
        description: "O pagamento no foi declarado no plazo previsto."
      }
    },
    wizard: {
      steps: {
        amount: "Importe",
        sender: "Remetente",
        recipient: "Destinatário",
        confirm: "Confirmar"
      }
    },
    history: {
      eyebrow: "Histórico",
      title: "Transferencias",
      description: "Estime, crie y acompanhe as tus transferencias entre o Benim y a Rusia.",
      calculator: "Calculadora",
      newTransfer: "Nueva transferencia",
      sectionTitle: "Histórico",
      operationsCount: "{count} operación(ões)",
      searchPlaceholder: "Referência, destinatário o operación...",
      statusLabel: "Estado",
      allStatuses: "Todos os estados",
      sent: "Enviado",
      fees: "Taxas",
      received: "Recebido",
      emptyTitle: "Ninguna transferencia",
      emptySearch: "Ningún resultado corresponde à búsqueda.",
      emptyDefault: "Crie a tu primeira operación.",
      calculatorModalTitle: "Calculadora de transferencia",
      tabTransfers: "Transferencias",
      tabP2p: "Intercambios P2P",
      p2pSearchPlaceholder: "Referencia, contraparte o moneda…",
      p2pSectionTitle: "Intercambios P2P",
      p2pOperationsCount: "{count} intercambio(s) P2P",
      p2pWith: "Con {name}",
      p2pEmptyTitle: "Ningún intercambio P2P",
      p2pEmptyDefault: "Tus pedidos P2P aparecerán aquí tras aceptar una oferta.",
      p2pBrowse: "Ver ofertas P2P"
    },
    calculator: {
      title: "Calculadora",
      description: "Estimactiva à tarifa de referência disponible, antes da confirmación da empresa.",
      refreshing: "A atualizar…",
      direction: "Direción",
      xofToRub: "XOF para RUB",
      rubToXof: "RUB para XOF",
      amountIn: "Importe em {currency}",
      invertAria: "Inverter o sentido da transferencia",
      recipientReceives: "O destinatário recebe",
      feesPercent: "Taxas {percent}%",
      totalToPay: "Total a pagar",
      appliedRate: "Tipo aplicado",
      feesDetail: "Comisiones incluidas ({percent}%): {fees}",
      fixAmount: "Corrija o importe para obter una estimactiva.",
      dateUnavailable: "data indisponible",
      rateNote: "1 {from} = {rate} {to} · {date} · reducción {margin}%",
    },
    dashboardCalc: {
      eyebrow: "Transferencia rápida",
      title: "Estime o tu envio",
      youSend: "Envia",
      receivedEstimate: "Estimactiva recebida",
      openCalculator: "Abrir calculadora"
    },
    proof: {
      sectionTitle: "Comprobantes",
      sectionDescription: "Provas guardadas para esta transferencia — siempre descarregáveis.",
      payment: {
        label: "Comprobante de pagamento (cliente)",
        short: "Pagamento do cliente"
      },
      business: {
        label: "Comprobante de transferencia (empresa)",
        short: "Transferencia da empresa"
      },
      received: {
        label: "Comprobante de receción",
        short: "Receción"
      },
      addedOn: "Adicionado em {date}",
      download: "Descargar",
      downloadFailedTitle: "Download impossível",
      downloadFailedMessage: "No foi possível obter o ficheiro. Tente nuevamente dentro de momentos."
    },
    receipt: {
      header: "MOXT - RECIBO DE TRANSFERÊNCIA",
      reference: "Referência: {id}",
      status: "Estado: {status}",
      direction: "Direción: {direction}",
      business: "Empresa: {name}",
      notProvided: "No indicado",
      sender: "Remetente: {name}",
      recipient: "Destinatário: {name}",
      amountSent: "Importe enviado: {amount}",
      fees: "Taxas ({percent}%): {amount}",
      totalPaid: "Total pago: {amount}",
      amountReceived: "Importe recebido: {amount}",
      createdAt: "Criado em: {date}",
      processing: "PROCESSAMENTO",
      generatedLocally: "Documento gerado localmente pelo MOXT.",
      windowTitle: "Recibo {id}",
      printHint: "Utilize \"Guardar como PDF\" na janela de impressão.",
      shareTitle: "Recibo MOXT {id}",
      storedTitle: "Recibo de transferencia {id}"
    },
    receivingAccount: {
      unavailableTitle: "Dados de receción indisponibles",
      unavailableDescription: "Esta empresa aún no configurou a cuenta activa para {direction}.",
      thisDirection: "este sentido de transferencia",
      activeTitle: "Cuenta de receción activa",
      businessDetails: "Dados da empresa",
      active: "Activo",
      beneficiary: "Beneficiario",
      method: "Método",
      numberOrAccount: "Número o cuenta",
      bank: "Banco",
      copyDetails: "Copiar dados"
    },
    receive: {
      methods: {
        cash: "Numerário",
        mobileMoney: "Mobile money",
        bank: "Transferencia bancária",
        other: "Outro"
      },
      confirm: "Confirmar receción",
      amountLabel: "Importe recebido",
      amountPlaceholder: "Ex. 125000",
      methodLabel: "Método de receción",
      proofLabel: "Comprobante de receción (opcional)",
      saving: "A guardar…",
      impossibleTitle: "Ación impossível",
      impossibleMessage: "A empresa deve primero confirmar a transferencia con comprobante antes de declarar a receción.",
      waitBusinessTitle: "En espera de la empresa",
      waitBusinessMessage: "La empresa debe confirmar el envío antes de que puedas declarar la recepción.",
      alreadyDeclaredTitle: "Recepción ya declarada",
      alreadyDeclaredMessage: "Etapa terminada — consulta el seguimiento.",
      proofUploadFailed: "No foi possível enviar o comprobante.",
      copiedTitle: "Copiado",
      copiedMessage: "{label} copiado para a área de transferencia.",
      notFoundTitle: "Receción no encontrada",
      eyebrowTransfer: "Transferencia",
      notFoundDescription: "Esta transferencia no existe o já no está acessível.",
      backToTransfers: "Voltar às transferencias",
      successTitle: "Receción registada",
      successDescription: "Su declaración cierra la transferencia. Si hay un problema, abra una reclamación.",
      viewTransfer: "Ver transferencia",
      myTransfers: "As minhas transferencias",
      eyebrow: "Receción",
      title: "Declarar receción",
      description: "Transferencia {id}",
      summary: "Resumo",
      expectedAmount: "Importe recebido esperado",
      exchanger: "Cambiador",
      receivingAccount: "Cuenta de receción",
      holder: "Titular",
      phone: "Teléfono",
      method: "Método",
      coordinates: "Dados",
      copyCoordinates: "Copiar dados",
      walletTitle: "Saldo da carteira",
      walletBalance: "Saldo atual: {balance} — a confirmación de receción aún no ajusta automaticamente este saldo."
    },
    workflow: {
      journeyTitle: "Percurso da transferencia",
      stepsValidated: "{completed}/{total} etapas validadas",
      claimOnlyTitle: "Apenas reclamación",
      claimOnlyDescription: "Todas as etapas estão concluídas. Em caso de problema, abra una reclamación.",
      openClaim: "Abrir una reclamación",
      contactChat: "Contactar",
      payoutAccount: {
        title: "Cuenta de abono",
        help: "Realice la transferencia a este destinatario y adjunte el comprobante.",
        beneficiary: "Beneficiario",
        method: "Método",
        numberOrAccount: "N.º / cuenta",
      },
      confirmPaymentReception: "Confirmar receción do pagamento",
      transferProofRequired: "Comprobante de transferencia (obligatorio)",
      imageOrPdf: "Imagem o PDF da transferencia",
      confirmTransfer: "Confirmar transferencia",
      declarePaymentWithCountdown: "{description} Tempo restante: {countdown}.",
      paymentProof: "Comprobante de pagamento",
      declarePayment: "Declarar pagamento",
      deadline: "Prazo: {date}",
      businessProof: "Comprobante da empresa",
      declareReception: "Declarar receción",
      waitingTitle: "Em espera",
      cancelTransfer: "Cancelar transferencia",
      actionRequired: "Ación necessária",
      uploading: "A enviar…",
      waiting: {
        none: "Ninguna ación necessária de momento."
      },
      clientWaiting: {
        declared: "Su declaración fue enviada. Espere a que la empresa confirme la recepción del pago.",
        received: "La empresa recibió su pago. Espere a que confirme el envío con comprobante — solo entonces podrá declarar la recepción.",
        paidOut: "Espere el comprobante de envío de la empresa antes de declarar la recepción de los fondos.",
        completed: "Transferencia concluída."
      },
      businessWaiting: {
        pending: "A aguardar a declaración de pagamento do cliente.",
        paidOut: "Transferencia confirmada. A aguardar a declaración de receción.",
        completed: "Transferencia encerrada."
      },
      actions: {
        confirmPaymentReception: {
          title: "Confirmar receción do pagamento",
          description: "Verifique a tu cuenta y valide esta etapa para avançar para o envio."
        },
        confirmPayout: {
          title: "Confirmar transferencia",
          description: "Adicione o comprobante da transferencia para o destinatário y valide."
        },
        declarePayment: {
          title: "Declarar o tu pagamento",
          description: "Adicione un comprobante y confirme a declaración."
        },
        declareReception: {
          title: "Declarar a receción dos fundos",
          description: "Confirme que o destinatário recebeu o importe."
        }
      }
    },
    new: {
      eyebrow: "Transferencia",
      title: "Crear una transferencia",
      description: "Elige una empresa validada. Ela recibirá a operación y acompanhará o tratamento até à validación.",
      calculator: "Calculadora",
      exchangers: "Cambiadors",
      ownBusinessActiveTitle: "A tu empresa de transferencias está activa",
      ownBusinessPendingTitle: "A tu empresa está em validación",
      ownBusinessActiveBody: "{name} é visível para os otros membros nesta lista. Como proprietário, no a pode usar para crear una transferencia — é a tu atividade de receción, no un parceiro a seleccionar.",
      ownBusinessPendingBody: "{name} aún no aparece aquí: o MOXT deve primero validar o tu perfil. Después do estado «Verificado», os membros poderão escolhê-lo como parceiro de transferencia.",
      directionTitle: "Sentido da transferencia",
      selected: "Selecionado",
      amountToSend: "Importe a enviar em {currency}",
      amountIn: "Importe em {currency}",
      amountMinPlaceholder: "Mín. {amount}",
      minimumLabel: "Mínimo",
      usedThisMonth: "Utilizado este mês: {amount}.",
      verifiedCeiling: "Cuenta verificada — limite aumentado.",
      choosePartner: "Escolher un parceiro",
      allExchangers: "Todos os cambiadors",
      noPartnerTitle: "Ningún parceiro no tu país",
      noPartnerBody: "Apenas os cambiadors de {flag} o tu país de origem são mostrados para garantir as monedas corretas.",
      ownBusinessReceivesTooltip: "A tu empresa recebe transferencias de otros membros.",
      yourBusiness: "A tu empresa",
      receptionOnly: "Apenas receción",
      proSpace: "Espacio pro",
      fees: "comisiones",
      estimation: "Estimactiva da transferencia",
      youPay: "Paga",
      recipientReceivesApprox: "O destinatário recebe ~",
      amountSent: "Importe enviado",
      feesPercent: "Taxas {percent}%",
      estimatedDelay: "Prazo estimado",
      dateUnavailable: "data indisponible",
      rateNote: "Tipo del {date} · margen {margin}%",
      enterAmountForEstimate: "Introduza un importe para ver a estimactiva.",
      stepSender: "2. Remetente",
      stepRecipient: "3. Destinatário",
      recapTitle: "Resumo y confirmación",
      youSend: "Envia",
      partnerBusiness: "Empresa parceira",
      sender: "Remetente",
      recipient: "Destinatário",
      acceptTerms: "Confirmo estas informaciones y autorizo a tu transmissão à empresa selecionada para o tratamento desta operación.",
      createAndSubmit: "Crear y enviar a transferencia",
      favoriteProfiles: "Perfis favoritos",
      firstName: "Nome",
      lastName: "Apelido",
      phone: "Teléfono",
      networkOrBank: "Red o banco",
      noFavoriteProfiles: "Ningún perfil favorito para este país. Crea uno o completa manualmente.",
      profileCreate: {
        button: "Crear un perfil",
        title: "Nuevo perfil — {party}",
        description: "Este contacto se podrá reutilizar en tus próximas transferencias.",
        submit: "Guardar perfil",
        errors: {
          name: "Nombre y apellido obligatorios.",
          method: "Elige una red o un banco.",
        },
      },
      errors: {
        createFailedTitle: "Transferencia no creada",
        chooseAvailableBusiness: "Elige una empresa disponible.",
        cannotUseOwnBusiness: "No pode utilizar a tu própria empresa.",
        businessMissingReceivingAccount: "Esta empresa aún no configurou a cuenta de receción para este sentido de transferencia.",
        ownBusinessReceivesOnly: "A tu empresa recebe transferencias de otros membros. Elige otro parceiro."
      }
    },
    detail: {
      title: "Detalhe da transferencia",
      description: "{direction} · criada em {date}",
      receiptTitle: "Transferencia {id}",
      relatedTitle: "Transferencia {id} · {contact}",
      copiedTitle: "Copiado",
      copiedMessage: "{label} copiado para a área de transferencia.",
      proofAddedTitle: "Comprobante adicionado",
      paymentProofReady: "O comprobante de pagamento está pronto.",
      payoutProofReady: "O comprobante de transferencia está pronto.",
      uploadFailedTitle: "Envio impossível",
      uploadFailedMessage: "No foi possível enviar o comprobante.",
      metrics: {
        direction: "Direción",
        created: "Criación",
        recipient: "Destinatário",
        partner: "Parceiro"
      },
      tabs: {
        tracking: "Acompanhamento",
        payment: "Pagamento",
        details: "Detalhes"
      },
      toasts: {
        paymentDeclaredTitle: "Pagamento declarado",
        paymentDeclaredMessage: "A empresa irá verificar a receción do tu pagamento.",
        actionImpossibleTitle: "Ación impossível",
        receptionAlreadyConfirmed: "A receción do pagamento já foi confirmada o o estado mudou.",
        addPayoutProof: "Adicione un comprobante de transferencia antes de confirmar.",
        receptionConfirmedTitle: "Receción confirmada",
        transferConfirmedTitle: "Transferencia confirmada",
        receptionConfirmedMessage: "Passe à etapa siguiente: comprobante y confirmación da transferencia.",
        transferConfirmedMessage: "O cliente pode declarar a receción dos fundos."
      },
      closedNotice: "Esta transferencia está {status}. No é possível cuálquer otra ación.",
      copy: {
        coordinates: "Os dados",
        reference: "A referência"
      },
      copyAria: "Copiar {label}",
      info: {
        title: "Informaciones da operación",
        reference: "Referência",
        status: "Estado",
        amountSent: "Importe enviado",
        amountReceivedEstimated: "Importe recebido (estimado)",
        totalToPay: "Total a pagar",
        mode: "Modo",
        modeValue: "Transferencia assistida MOXT"
      },
      trust: {
        title: "Proteción da operación",
        item1: "Verifique a identidad do cambiador y os dados de pagamento.",
        item2: "Guarde os comprobantes de pagamento no MOXT.",
        item3: "O recibo descarregável serve de referência para o acompanhamento da operación."
      },
      claim: {
        title: "Reclamación",
        reason: "Motivo da reclamación",
        motive: "Motivo",
        motivePlaceholder: "Elegir un motivo",
        transferNumber: "N.º de transferencia",
        message: "Mensaje",
        messagePlaceholder: "Describa el problema…",
        help: "A nuestra equipo analisa cada reclamación y contacta-o em 48h a través da mensajes MOXT.",
        submit: "Enviar reclamación",
        submittedTitle: "Reclamación enviada",
        submittedMessage: "Su caso ha sido enviado al equipo MOXT.",
        motives: {
          nonReceived: "Fondos no recibidos",
          wrongAmount: "Importe incorrecto",
          fraud: "Fraude sospechada",
          delay: "Retraso excesivo",
          paymentIssue: "Problema de pago / comprobante",
          other: "Otro",
        },
      },
      cancel: {
        title: "Cancelar esta transferencia?",
        description: "Esta ación é definitiva. A transferencia será marcada como cancelada y no podrá ser retomada."
      },
      hero: {
        sent: "Enviado",
        receivedEstimated: "Recebido (estimado)",
        processedBy: "Tratado por {name}"
      },
      financial: {
        title: "Resumo financeiro",
        appliedRate: "Taxa aplicada",
        feesPercent: "Taxas {percent}%",
        totalToPay: "Total a pagar",
        rateSource: "Fonte da tarifa",
        localRate: "Taxa local",
        partner: "Parceiro",
        historicPartner: "Parceiro histórico",
        paymentDetails: "Dados de pagamento",
        confirmWithBusiness: "A confirmar con a empresa",
        receivingCountry: "País de receción",
        copyReference: "Copiar referência",
        pdf: "PDF",
        image: "Imagem",
        share: "Compartir"
      },
      participants: {
        title: "Participantes",
        sender: "Remetente",
        recipient: "Destinatário",
        addFavorite: "Añadir a perfiles favoritos",
        removeFavorite: "Quitar de perfiles favoritos",
        favoriteSavedTitle: "Perfil favorito guardado",
        favoriteSavedMessage: "Este contacto está disponible para sus próximas transferencias.",
        favoriteRemovedTitle: "Perfil quitado de favoritos",
        favoriteRemovedMessage: "Este contacto ya no aparecerá en sus perfiles favoritos.",
        favoriteErrorTitle: "No se pudo guardar",
        favoriteIncomplete: "Nombre, apellido y teléfono son obligatorios para un favorito.",
      },
      timeline: {
        title: "Cronologia"
      },
      notFound: {
        title: "Transferencia no encontrada",
        back: "Voltar às transferencias"
      },
      admin: {
        title: "Aciones de administrador",
        description: "Intervención direta a partir da ficha de transferencia.",
        advanceTo: "Passar para {status}",
        forceCancel: "Forçar cancelamento"
      },
      status: {
        paySafely: "Pague em seguridad",
        paySafelyBody: "Nunca pague fora do MOXT, guarde todos os comprobantes de pagamento y verifique os dados do parceiro antes de cuálquer transación.",
        claimOnlyTitle: "Apenas reclamación",
        claimOnlyBody: "A receción foi declarada y a empresa confirmou a transferencia con comprobante. Só é possível una reclamación.",
        paymentExpectedTitle: "Pagamento pendiente",
        paymentExpectedBody: "Efetue o pagamento antes de {date}. Tempo restante: {countdown}.",
        declarationReceivedTitle: "Declaración recebida",
        declarationReceivedBody: "Foi registada una declaración de pagamento. Verifique a tu cuenta y valide a receción."
      },
      nextStep: {
        globalView: "Vista global",
        yourTurn: "A tu vez",
        tracking: "Acompanhamento"
      },
      actions: {
        title: "Aciones",
        description: "Cada ación é única y a próxima etapa depende do estado atual da operación.",
        clickToAddProof: "Haz clic para adicionar una imagem o PDF",
        receptionDeclared: "Receción declarada",
        amount: "Importe",
        onDate: "Em {date}",
        noneAvailable: "Ninguna ación disponible."
      }
    }
  },
  p2p: {
    noEscrowBanner:
      "MOXT nunca retiene tus fondos. Sigue los pasos, guarda tus pruebas y paga solo a los datos mostrados en el pedido.",
    acceptConfirm: {
      title: "¿Iniciar el intercambio?",
      body: "Vas a iniciar un intercambio. MOXT no retiene el dinero. Pago fuera de la app + prueba obligatorios. ¿Continuar?",
      cta: "Confirmar",
    },
    reputation: {
      noRating: "Sin valoración aún",
      completed: "{count} intercambios exitosos",
      successRate: "{rate} % de éxito",
    },
    page: {
      eyebrow: "Trocas comunitárias",
      title: "Trocas P2P",
      description: "Publique una oferta após verificar a tu cuenta, o aceite una oferta existente.",
      activeOffers: "Ofertas activas",
      proposeOffer: "Propor una oferta",
      safetyTitle: "Troque em seguridad",
      safetyBody: "Nunca pague fora do MOXT, guarde todos os comprobantes de pagamento y verifique a identidad do interlocutor antes de cuálquer transación.",
      searchPlaceholder: "Moneda, método, usuario o condición...",
      fromCurrency: "Moneda proposta",
      toCurrency: "Moneda pretendida",
      allCurrencies: "Todas",
      archives: "Arquivos",
      statusActive: "Ativa",
      statusArchived: "Arquivada",
      business: "Empresa",
      individual: "Particular",
      amountTo: "{amount} para {currency}",
      rateValue: "Taxa {rate}",
      estimatedFees: "Taxas estimadas",
      accept: "Aceitar",
      detail: "Detalhe",
      emptyActiveTitle: "Ninguna oferta P2P activa",
      emptyArchiveTitle: "Ningún arquivo",
      emptyActiveDescription: "Proponha a primeira oferta o ajuste os filtros.",
      emptyArchiveDescription: "As ofertas aceites o encerradas aparecerão aquí.",
      recentOrders: "As minhas transaciones recentes",
      orderDirection: "{seller} para {buyer}",
      publishedOn: "Publicada el {date}",
      leaveReview: "Deja tu valoración"
    },
    detail: {
      notFound: "Oferta P2P no encontrada",
      title: "{amount} para {currency}",
      description: "Oferta publicada por {name}",
      conversion: "Conversão",
      method: "Método",
      status: "Estado",
      proposedBy: "Proposto por",
      conditions: "Condiciones da oferta",
      proposedAmount: "Importe proposto",
      soughtCurrency: "Moneda pretendida",
      rate: "Taxa",
      estimatedFees: "Taxas estimadas",
      contactOrAccept: "Contactar o aceitar",
      relatedTitle: "{from} para {to}",
      acceptOffer: "Aceitar a oferta",
      acceptNote: "A aceitación cria una transación local. Ningún pagamento real é acionado.",
      exchangeDetails: "Detalhes da troca",
      availableAmount: "Importe disponible",
      requestedCurrency: "Moneda pedida",
      proposedRate: "Taxa proposta",
      fees: "Taxas",
      profile: "Perfil",
      reference: "Referência",
      trustTitle: "Seguridad P2P",
      trustItem1: "Esta operación é tratada via MOXT. Mantenha-se vigilante y guarde os comprobantes.",
      trustItem2: "Guarde os comprobantes na conversación.",
      trustItem3: "Confirme os importes antes de cuálquer entrega real."
    },
    order: {
      status: {
        created: "Criada",
        waitingPayment: "Pagamento enviado",
        completed: "Concluída",
        cancelled: "Cancelada",
        disputed: "Disputa em curso"
      },
      notFound: "Transación no encontrada.",
      title: "Transación P2P",
      description: "{seller} para {buyer}",
      summary: "Resumo",
      amount: "Importe",
      receivedCurrency: "Moneda recebida",
      rate: "Taxa",
      fees: "Taxas",
      waitingPayment: "Pagamento enviado",
      complete: "Concluir",
      cancel: "Cancelar",
      markPaid: "Envié el pago",
      markPaidHint: "Añade un comprobante de pago antes de continuar.",
      confirmReceived: "Confirmar recepción y finalizar",
      waitingSellerConfirmation: "Esperando la confirmación del vendedor.",
      waitingBuyerPayment: "Esperando que el comprador envíe el pago.",
      disputedBanner: "Hay una disputa abierta en esta transacción. Un moderador MOXT intervendrá — los estados quedan bloqueados hasta su resolución.",
      uploading: "Enviando…",
      addProof: "Adicionar comprobante",
      viewProof: "Ver",
      proofBuyer: "Comprador",
      proofSeller: "Vendedor",
      receiptTitle: "Transación P2P {id}",
      saveReceipt: "Guardar recibo",
      timeline: "Cronologia",
      dispute: "Disputa",
      disputeOpen: "Disputa {status}: {reason}",
      disputePlaceholder: "Describe el problema con precisión",
      openDispute: "Abrir un disputa",
      stepsLabel: "Pasos del intercambio",
      steps: {
        engagement: "Compromiso",
        payment: "Pago",
        confirmation: "Confirmación",
        done: "Hecho",
      },
      buyer: "Comprador",
      seller: "Vendedor",
      proofsTitle: "Pruebas",
      proofPreview: "Prueba de pago",
      openProofTab: "Abrir en una pestaña",
      noBuyerProofYet: "Aún no hay prueba del comprador.",
      disputeHelp: "Abre un litigio si el pago o la recepción es problemática.",
      disputeFrozen: "Litigio en curso — espera la resolución de MOXT.",
      disputeUnavailable: "Litigio no disponible en este pedido.",
      openDisputeNoReceive: "No lo recibí — Abrir litigio",
      expiredTitle: "Plazo de pago vencido",
      expiredBody: "El pedido se canceló automáticamente. La oferta puede volver a estar disponible.",
      countdown: {
        payment: "Tiempo restante para pagar",
        confirm: "Tiempo restante para confirmar",
      },
      hint: {
        disputed: "Hay un litigio abierto. Espera — MOXT revisa el caso.",
        cancelled: "Este pedido está cancelado.",
        completed: "Intercambio terminado. Puedes valorar a tu interlocutor.",
        buyerPay: "Paga a {name} con el método acordado y añade una prueba.",
        sellerWait: "Esperando el pago de {name}.",
        sellerConfirm: "{name} declaró haber pagado. Verifica y confirma.",
        buyerWait: "{name} está comprobando tu pago…",
      },
      confirm: {
        markPaidTitle: "¿Confirmar el envío del pago?",
        markPaidBody: "Confirma solo si la transferencia ya salió. Se requiere una prueba.",
        markPaidCta: "Sí, pagué",
        finalizeTitle: "¿Finalizar el intercambio?",
        finalizeBody: "Irreversible. El intercambio se marcará como terminado.",
        finalizeCta: "Confirmar recepción",
        cancelTitle: "¿Cancelar este intercambio?",
        cancelBody: "La cancelación solo es posible antes de enviar el pago.",
        cancelCta: "Cancelar intercambio",
        disputeTitle: "¿Abrir un litigio?",
        disputeBody: "Las acciones se congelarán hasta la decisión de un moderador.",
      },
      rateTitle: "Avaliar a transación",
      rateIntro: "¿Cómo fue el intercambio con {name}?",
      commentPlaceholder: "O tu comentário",
      saveRating: "Guardar avaliación",
      updateRating: "Actualizar evaluación",
      ratingVisibleHint: "Esta evaluación aparecerá en el perfil público de tu contraparte.",
      ratingSavedTitle: "Evaluación guardada",
      ratingSavedBody: "Gracias por evaluar a {name}.",
      createdAt: "Fecha",
      payToTitle: "Datos de pago",
      payToHint: "Paga solo a este número / cuenta, con el método indicado.",
      receivePhone: "Número de recepción",
      receiveName: "Nombre y apellidos",
      yourReceiveTitle: "Tus datos de recepción (mostrados al comprador)"
    },
    publish: {
      steps: {
        currencies: "Monedas",
        amount: "Importe",
        terms: "Modalidades"
      },
      backLabel: "P2P",
      title: "Propor una oferta P2P",
      currencyPair: "Par de monedas",
      swapCurrencies: "Invertir el par de monedas",
      currencyLimit: "Par fijo: {origin} ↔ RUB (monedas del perfil: {currencies}).",
      iOffer: "Proponho",
      iSeek: "Procuro",
      safetyNote: "Nunca pague fora do MOXT y verifique a identidad do interlocutor antes de cuálquer transación.",
      amountAndRate: "Importe y tarifa",
      currentCeiling: "Limite atual: {amount}",
      amountLabel: "Importe ({currency})",
      rateLabel: "Tasa propuesta ({from} → {to})",
      rateMarginLabel: "Margen sobre la tasa (−{max} % a +{max} %)",
      rateMarginHint:
        "La tasa Frankfurter se aplica directamente. Un margen positivo la sube, uno negativo la baja — en ambos sentidos del par.",
      rateMarginRecap: "Margen sobre la tasa",
      frankfurterRateHint:
        "Frankfurter: {rate} → aplicado {applied} ({from} → {to}) · margen {margin} % · {source} · {date}",
      receivedLabel: "Importe recibido estimado",
      receivedHint: "{amount} × {rate} = conversión a {to}",
      rateSource: "Fuente de la tasa",
      frankfurterRateLoading: "Cargando la tasa…",
      estimatedFees: "Comisión de plataforma ({percent} %): {amount}",
      exchangeTerms: "Modalidades da troca",
      method: "Método",
      methodAfrica: "Red / medio ({country})",
      methodRussia: "Banco ruso",
      methodLoading: "Cargando bancos…",
      methodPlaceholder: "Elegir un método",
      receiveSection: "Número de recepción",
      receiveHintAfrica:
        "Indica el número Mobile Money ({country}) al que el comprador debe enviar la transferencia.",
      receiveHintRussia:
        "Indica el número SBP / teléfono ruso y el nombre y apellido(s) del beneficiario.",
      receivePhone: "Número de recepción",
      receiveName: "Información (nombre y apellidos)",
      receiveNamePlaceholder: "Nombre y apellido(s) del beneficiario",
      conditionsOptional: "Condiciones (opcional)",
      conditionsPlaceholder: "Horários, plazos, detalhes…",
      recap: "Resumo",
      rate: "Taxa",
      estimatedFeesLabel: "Taxas estimadas",
      publishOffer: "Publicar a oferta",
      toastTitle: "Oferta P2P publicada",
      toastMessage: "A tu oferta está visível nas trocas P2P."
    }
  },
  favorites: {
    eyebrow: "Cuenta",
    title: "Os meus favoritos",
    description: "Anuncios, paquetes, empleos y otros conteúdos guardados — organizados por categoría.",
    stats: {
      items: "Itens"
    },
    actions: {
      transferProfile: "Perfil de transferencia"
    },
    empty: {
      title: "Sem conteúdos favoritos",
      description: "Guarde anuncios, paquetes, empleos o empresas a partir das respetivas fichas.",
      cta: "Explorar o mercado"
    },
    tabs: {
      all: "Todos"
    },
    categories: {
      listing: "Anuncios",
      parcel: "Paquetes",
      job: "Empleos",
      other: "Outros"
    },
    itemsCount: "{count} item",
    itemsCountPlural: "{count} itens",
    remove: "Remover",
    open: "Abrir",
    event: "Evento",
    business: "Empresa",
    free: "Grátis",
    onQuote: "Sob orçamento",
    saved: "Guardado",
    addToFavorites: "Adicionar aos favoritos",
    profiles: {
      title: "Perfis de transferencia",
      description: "Contactos reutilizáveis para preencher as tus transferencias más depressa.",
      add: "Adicionar",
      empty: {
        title: "Sem perfis de transferencia",
        description: "Adicione os tus contactos habituais para poupar tempo."
      },
      modal: {
        edit: "Editar perfil",
        create: "Nuevo perfil"
      },
      method: {
        network: "Red móvil",
        bank: "Banco"
      },
      submit: {
        edit: "Guardar alteraciones",
        create: "Guardar perfil"
      }
    },
    validation: {
      firstName: "O nome é obligatorio.",
      lastName: "O apelido é obligatorio.",
      phone: "O número é obligatorio.",
      method: "Red o banco é obligatorio."
    },
    button: {
      saved: "Guardado",
      add: "Adicionar aos favoritos"
    }
  },
  receipts: {
    eyebrow: "Finanzas",
    title: "Recibos",
    description: "Comprobantes das tus operaciones registadas no MOXT.",
    badge: "Recibo",
    processing: "Processamento",
    pdf: "Recibo PDF",
    image: "Recibo imagem",
    share: "Compartir",
    download: "Descargar",
    empty: "Ningún recibo guardado",
    txt: {
      header: "MOXT — RECIBO",
      reference: "Referência: {id}",
      subject: "Assunto: {title}",
      amount: "Importe: {amount}",
      status: "Estado: {status}",
      statusFallback: "no definido",
      createdAt: "Criado em: {date}",
      footer: "Guarde este documento como comprobante da tu operación."
    }
  },
  notifications: {
    eyebrow: "Alertas",
    title: "Notificaciones",
    description: "{count} notificación(ões) no lida(s).",
    markAllRead: "Marcar todas como leídas",
    priority: {
      urgent: "Urgente",
      standard: "Normal",
      low: "Baixa"
    },
    badge: {
      read: "Lida",
      new: "Nueva"
    },
    openConversation: "Abrir conversación",
    open: "Abrir",
    markRead: "Marcar como lida",
    archive: "Arquivar",
    empty: "Sem notificaciones."
  },
  support: {
    eyebrow: "Ayuda",
    title: "Soporte MOXT",
    description: "Pedidos, reclamaciones y acompanhamento con a equipo de soporte.",
    reportBug: "Reportar un error",
    newRequest: "Nuevo pedido",
    newRequestDesc: "Describe tu situación con precisión para que el equipo responda rápidamente.",
    subject: "Assunto",
    priority: {
      normal: "Normal",
      important: "Importante",
      critical: "Crítica",
      label: "Prioridade"
    },
    message: "Mensaje",
    send: "Enviar",
    myRequests: "Os meus pedidos",
    empty: "Ningún pedido de soporte.",
    createdTitle: "Pedido de soporte criado",
    createdMessage: "O tu pedido {id} foi registado.",
    invalidFormatTitle: "Formato inválido",
    invalidFormatMessage: "Elige una imagem.",
    tooShortTitle: "Descripción demasiado curta",
    tooShortMessage: "Describe el problema (mín. 10 caracteres).",
    bugSubject: "Reporte de error",
    bugSentTitle: "Reporte enviado",
    bugSentMessage: "O tu reporte {id} foi enviado ao soporte.",
    thanksTitle: "Gracias!",
    thanksMessage: "O tu reporte foi enviado.",
    sendFailedTitle: "Envio impossível",
    bugModalTitle: "Reportar un error",
    bugModalDesc: "Describe el problema y adjunta una captura de pantalla para ayudar al equipo.",
    bugDescription: "Descripción do problema",
    bugPlaceholder: "Ex.: o botão Publicar no responde na página do anuncio…",
    screenshotLabel: "Captura de ecrã (opcional)",
    screenshotAlt: "Pré-visualización da captura",
    removeScreenshot: "Remover captura",
    addScreenshot: "Adicionar captura de ecrã",
    sendBug: "Enviar reporte",
    attachedAlt: "Captura anexada",
    replyPlaceholder: "Responder",
    sendAria: "Enviar",
    closedAlert: "Este pedido está fechado."
  },
  documents: {
    eyebrow: "Cuenta",
    title: "Os meus documentos",
    description: "Prepare os comprobantes necessários para a verificación da tu cuenta.",
    typeLabel: "Tipo de documento",
    types: {
      identity: "Identidad",
      address: "Comprobante de dirección",
      income: "Comprobante de rendimentos",
      other: "Outro documento"
    },
    upload: "Adicionar un documento",
    hint: "Os ficheiros são armazenados no servidor MOXT y sincronizados con a tu cuenta.",
    remove: "Remover",
    empty: "Ningún documento",
    toast: {
      sentTitle: "Documento enviado",
      sentMessage: "Ficheiro guardado no servidor."
    }
  },
  addresses: {
    eyebrow: "Contactos",
    title: "Livro de direccións",
    description: "Perfis de identidad y direccións de destinatários para envios y transferencias.",
    tabs: {
      identity: "Identidad",
      recipient: "Destinatários",
      carrier: "Transportadores"
    },
    carrierSoon: "Os direccións de transportador estarão disponibles numa próxima atualización.",
    identity: {
      title: "Perfis de identidad",
      description: "Reutilizáveis para as tus direccións de destinatários.",
      new: "Nuevo perfil",
      edit: "Editar perfil",
      empty: "Ningún perfil guardado.",
      deleteConfirm: "Eliminar este perfil?",
      company: "Empresa",
      holderType: "Tipo de titular",
      firstNames: "Nomes próprios",
      lastName: "Apelido",
      companyName: "Firma",
      contact: "Contacto",
      docType: "Tipo de documento",
      docNumber: "N.º documento / pasaporte",
      issuedBy: "Emitido por",
      issuedAt: "Data de emissão",
      expiresAt: "Data de validade",
      scan: "Digitalización (opcional)"
    },
    recipient: {
      empty: "Ninguna dirección de destinatário.",
      add: "Adicionar una dirección",
      prev: "Morada anterior",
      next: "Morada siguiente",
      deleteConfirm: "Eliminar esta dirección?",
      modal: {
        edit: "Editar dirección do destinatário",
        create: "Nueva dirección do destinatário"
      },
      label: "Etiqueta",
      savedProfile: "Perfil guardado (opcional)",
      address: "Morada",
      email: "E-mail",
      identitySection: "Identidad do destinatário",
      docNumber: "N.º documento",
      issuedAt: "Emissão",
      expiresAt: "Validade"
    },
    carousel: {
      emptyIdentity: "Ningún perfil de identidad. Crie un no separador Identidad.",
      prevProfile: "Perfil anterior",
      nextProfile: "Perfil siguiente",
      profile: "Perfil"
    },
    doc: {
      passport: "Passaporte",
      idCard: "Cartão de cidadão",
      license: "Carta de condución",
      other: "Outro documento"
    },
    holder: {
      person: "Pessoa singular",
      company: "Pessoa coletiva"
    }
  },
  wallet: {
    eyebrow: "Finanzas",
    title: "Carteira",
    description: "Vista consolidada dos tus saldos y movimentos no MOXT.",
    warning: "Verifique siempre as tus operaciones y guarde os comprobantes. Em caso de dúvida, contacte o soporte MOXT.",
    empty: "Ningún lançamento registado"
  },
  disputes: {
    eyebrow: "Cuenta",
    title: "Os meus disputas",
    description: "Acompanhamento local dos problemas declarados em operaciones compatíveis.",
    empty: "Ningún disputa"
  },
  activities: {
    eyebrow: "Cuenta",
    title: "A minha atividade",
    description: "Favoritos, candidaturas, inscriciones, reservas y conversaciones.",
    label: {
      favorite: "Favorito",
      application: "Candidatura",
      registration: "Inscrición",
      reservation: "Reserva {kg} kg",
      conversation: "Conversa"
    },
    parcelTitle: "{origin} para {destination}",
    empty: {
      title: "Ninguna atividade",
      description: "As tus interaciones aparecerão aquí."
    }
  },
  discover: {
    eyebrow: "Descoberta pública",
    title: "Buscar no MOXT",
    description: "Empresas, anuncios, paquetes, empleos y eventos publicados. As publicaciones são reservadas a membros con número russo verificado.",
    securityTitle: "Seguridad MOXT em resumo",
    security: {
      phone: "Número +7 verificado para publicar",
      identity: "Identidad MOXT para empresa y transferencias",
      messaging: "Mensajes abertas sin verificación reforçada"
    },
    searchAria: "Buscar",
    placeholder: "Nome, serviço, ciudad...",
    typeAria: "Tipo de resultado",
    types: {
      all: "Tudo",
      business: "Empresas",
      listing: "Marketplace",
      parcel: "Paquetes",
      job: "Empleos",
      event: "Eventos",
      page: "Página"
    },
    recent: "Pesquisas recentes",
    clear: "Limpar",
    results: "{count} resultado",
    resultsPlural: "{count} resultados",
    loginCta: "Iniciar sesión para interagir",
    empty: {
      title: "Sem resultados",
      description: "Tente un termo o domínio diferente."
    }
  },
  statuses: {
    active: "Activo",
    approved: "Aprovado",
    archived: "Arquivado",
    blocked: "Bloqueado",
    cancelled: "Cancelado",
    closed: "Fechado",
    completed: "Concluído",
    draft: "Rascunho",
    expired: "Expirado",
    full: "Completo",
    inProgress: "Em curso",
    new: "Nuevo",
    pending: "Pendiente",
    pendingReview: "Em verificación",
    published: "Publicado",
    registered: "Inscrito",
    rejected: "Recusado",
    resolved: "Resolvido",
    sold: "Vendido",
    submitted: "Enviado",
    suspended: "Suspenso",
    verified: "Verificado",
    waitingAgent: "À espera do soporte",
    waitingUser: "A tu resposta é esperada"
  },
  subscriptions: {
    eyebrow: "Comunidad",
    title: "Subscriciones",
    tabs: {
      subscriptions: "As minhas subscriciones",
      subscribers: "Os meus subscritores"
    },
    tabsTypeLabel: "Tipo de suscripción",
    myProfile: "O meu perfil",
    stats: {
      members: "Membros",
      businesses: "Empresas",
      subscribers: "Subscritores"
    },
    desc: {
      subscribersCount: "{count} membro(s) seguem os tus anuncios y publicaciones.",
      subscribersEmpty: "Os membros que se suscribirseem ao tu perfil aparecerão aquí.",
      subscriptionsCount: "{count} suscripción(ões) activa(s). Configure as notificaciones para cada editor.",
      subscriptionsEmpty: "Siga membros o empresas para ver os respetivos anuncios em prioridade."
    },
    empty: {
      title: "Sem subscriciones",
      description: "Subscreva a partir da página de publicaciones de un membro o da ficha de una empresa — os respetivos avatares aparecerão aquí.",
      cta: "Explorar o diretório"
    },
    circleLabel: "O tu círculo de subscriciones",
    group: {
      members: "Membros",
      businesses: "Empresas"
    },
    viewAria: "Ver {name}",
    row: {
      businessBlurb: "Anuncios y publicaciones priorizados nas tus listas.",
      userBlurb: "Prioridade no mercado, paquetes, empleos, eventos y feed.",
      actionsAria: "Aciones para {name}",
      viewProfile: "Ver perfil",
      sendMessage: "Enviar mensaje",
      unblockMessages: "Desbloquear mensajes",
      blockMessages: "Bloquear mensajes",
      removeSubscriber: "Remover subscritor",
      ban: "Banir",
      report: "Denunciar",
      viewProfileAria: "Ver o perfil de {name}",
      since: "Desde {date}",
      removeConfirmTitle: "Remover este subscritor?",
      removeConfirmDesc: "{name} deixará de ver as tus publicaciones em prioridade y deixará de recibir notificaciones. Podrá voltar a suscribirse más tarde.",
      banTitle: "Banir este subscritor",
      banDesc: "{name} será removido y já no podrá suscribirse as tus publicaciones.",
      banReason: "Motivo (obligatorio)",
      banPlaceholder: "Comportamento abusivo, spam, assédio…",
      reportTitle: "Denunciar este subscritor",
      reportDesc: "Esta denúncia será enviada à moderación MOXT. A suscripción permanece activa, salvo se o remover o banir.",
      reportReason: "Descripción (obrigatória)",
      reportPlaceholder: "Describe el comportamiento problemático…",
      noConversationTitle: "Sem conversación",
      noConversationMessage: "No existe cuálquer conversación con este membro.",
      blockedTitle: "Membro bloqueado",
      unblockedTitle: "Membro desbloqueado",
      blockedMessage: "As respetivas mensajes estão bloqueadas nesta conversación.",
      unblockedMessage: "Já pode voltar a recibir as respetivas mensajes."
    },
    notifyAria: "Notificaciones: {pref}",
    notify: {
      menuAria: "Preferências de notificación da suscripción",
      heading: "Notificaciones recebidas",
      unsubscribe: "Cancelar suscripción",
      all: "Todos os anuncios",
      important: "Apenas importantes",
      muted: "Silenciado",
      allHint: "Mercado, paquetes, empleos, eventos y publicaciones",
      importantHint: "Anuncios do mercado y publicaciones do feed",
      mutedHint: "Prioridade nas listas, sin notificaciones"
    },
    subscribe: "Suscribirse",
    subscribed: "Subscrito",
    restricted: "Acesso restrito",
    deniedTitle: "Suscripción recusada",
    deniedMessage: "Já no pode suscribirse este editor.",
    subscribers: {
      empty: "Sem subscritores",
      emptyNamed: "Os membros que se suscribirseem a {name} aparecerão aquí con a respetiva foto de perfil.",
      emptySelf: "Os membros que o seguem aparecerão aquí con a respetiva foto de perfil.",
      count: "{count} subscritor",
      countPlural: "{count} subscritores",
      manageHint: "Faça a gestão de notificaciones, remociones, banimentos y denúncias.",
      bannedHeading: "Membros banidos ({count})",
      bannedHint: "Estes membros já no se pueden suscribirse às tus publicaciones.",
      emptyActive: "Sem subscritores activos",
      emptyActiveDesc: "Todos tus subscritores atuais estão banidos o foram removidos.",
      bannedOn: "Banido em {date}",
      unban: "Levantar banimento"
    }
  },
  news: {
    eyebrow: "Comunidad",
    title: "Feed de noticias",
    description: "Descubra as últimas publicaciones da comunidad MOXT.",
    stats: {
      publications: "Publicaciones"
    },
    writePost: "Escribir un post",
    filters: {
      all: "Todos",
      listing: "Anuncios",
      job: "Empleos",
      parcel: "Paquetes",
      event: "Eventos",
      business: "Empresas",
      free: "Posts livres"
    },
    empty: {
      title: "Aún sin posts",
      description: "Seja o primero a compartir algo con a comunidad!",
      type: "Aún sin posts do tipo \"{type}\"."
    },
    seeMore: "Ver más",
    seeLess: "Ver menos",
    pinned: "Publicación fijada",
    pin: {
      toastPinnedTitle: "Publicación fijada",
      toastPinnedBody: "Permanece en la parte superior del feed.",
      toastUnpinnedTitle: "Publicación desfijada",
      toastUnpinnedBody: "Vuelve a su lugar cronológico en el feed."
    },
    menu: {
      actions: "Acciones de la publicación",
      edit: "Editar",
      pin: "Fijar",
      unpin: "Desfijar",
      archive: "Archivar",
      delete: "Eliminar",
      deleteConfirm: "¿Eliminar esta publicación?"
    },
    archiveConfirm: "¿Archivar esta publicación? Dejará de aparecer en el feed.",
    types: {
      post: "Post",
      listing: "Anuncio",
      parcel: "Paquetes",
      business: "Empresa",
      event: "Evento",
      job: "Empleo"
    },
    templates: {
      businessHello: "Olá comunidad MOXT! 👋",
      businessIntroNamed: "{name} aquí — apresento {business}{sector}.",
      businessIntro: "Descubra {business}{sector}.",
      businessSector: "especializada em {sector}",
      businessCta: "👉 Encontre a nuestra ficha no MOXT. 🤝",
      listing: "Vendo \"{title}\"{price}. {description}{contact}",
      listingPrice: " a {price}",
      listingContact: " Interessado(a)? Contacte-me: {contact}",
      parcel: "📦 Envio de paquete {origin} → {destination}{date}. {kg}{contact}",
      parcelDate: " em {date}",
      parcelKg: "{kg} kg disponibles",
      parcelContact: " Contacto: {contact}",
      job: "{company}recruta: {title}{city}.{contact}",
      jobCity: " em {city}",
      jobContact: " Candidaturas: {contact}",
      jobApply: " Candidate-se via MOXT!",
      event: "🎉 No perca \"{title}\"{date}{place}. {description}",
      eventDate: " em {date}",
      eventPlace: " em {place}",
      online: "Online"
    },
    composer: {
      publishedTitle: "Post publicado!",
      sentTitle: "Post enviado",
      publishedMessage: "Tu publicación es visible en el feed de noticias.",
      pendingMessage: "Cuenta no verificada: o post será visível após validación MOXT.",
      title: "Compartir no feed",
      visibility: "{type} · visível por toda a comunidad",
      close: "Cerrar",
      feedName: "Feed de noticias MOXT",
      messageLabel: "Mensaje do post",
      messagePlaceholder: "Escreva a tu mensaje…",
      previewAlt: "Pré-visualización",
      previewAltIndexed: "Pré-visualización {index}",
      removeImage: "Remover imagem",
      removeImageIndexed: "Remover imagem {index}",
      addImage: "Adicionar una imagem",
      addImages: "Adicionar imágenes (máx. 4)",
      addAnother: "Adicionar",
      imagesHint: "{count}/{max} imágenes",
      link: "Ligación: {link}",
      publish: "Publicar"
    },
    feed: {
      prevImage: "Imagen anterior",
      nextImage: "Imagen siguiente",
      imageAlt: "Imagen {index} del post",
      openPreview: "Ver imagen en grande",
      closePreview: "Cerrar vista previa",
      previewTitle: "Vista previa de la imagen"
    },
    card: {
      cta: {
        listing: "Ver o anuncio",
        parcel: "Ver a paquete",
        business: "Ver a empresa",
        event: "Ver o evento",
        job: "Ver a oferta"
      },
      deleteConfirm: "Eliminar este post?",
      options: "Opciones do post",
      edit: "Editar",
      delete: "Eliminar",
      save: "Guardar",
      cancel: "Cancelar",
      imageAlt: "Imagem do post",
      unlike: "Remover gosto",
      like: "Gostar",
      deleteComment: "Eliminar comentário",
      commentPlaceholder: "Escribir un comentário…",
      commentAria: "Escribir un comentário",
      sendComment: "Enviar comentário"
    },
    edit: {
      eyebrow: "Actualidad",
      title: "Editar publicación",
      description: "Actualiza tu post en el feed de noticias.",
      notFound: "Publicación no encontrada.",
      titleLabel: "Título (opcional)",
      titlePlaceholder: "Dê un título apelactivo…",
      content: "Conteúdo",
      contentPlaceholder: "Partilhe una info, un anuncio, una actualidad…",
      image: "Imagem (URL, opcional)",
      imagePlaceholder: "https://…",
      tags: "Tags (separadas por vírgulas)",
      tagsPlaceholder: "Ex.: evento, moscovo, cultura",
      save: "Guardar alteraciones"
    }
  },
  status: {
    rail: {
      title: "Estados",
      addYours: "Tu estado",
      you: "Tú"
    },
    composer: {
      title: "Nuevo estado",
      description: "Visible para la comunidad durante 7 días.",
      captionPlaceholder: "Añadir una leyenda (opcional)…",
      publish: "Publicar estado",
      publishing: "Publicando…",
      publishedTitle: "Estado publicado",
      publishedMessage: "Tu estado es visible durante 7 días.",
      imagesRequired: "Añade al menos una imagen."
    },
    viewer: {
      justNow: "Ahora mismo",
      hoursAgo: "Hace {count} h",
      daysAgo: "Hace {count} d",
      delete: "Eliminar",
      close: "Cerrar",
      previous: "Anterior",
      next: "Siguiente",
      reply: "Responder por mensaje",
      deletedTitle: "Estado eliminado",
      viewersTitle: "Visto por {count}",
      noViewers: "Nadie ha visto este estado todavía.",
      someone: "Alguien",
      react: "Reaccionar",
      replyPlaceholder: "Responder al estado…",
      replySend: "Enviar",
      replySentTitle: "Respuesta enviada",
      deleteConfirmTitle: "¿Eliminar este estado?",
      deleteConfirmBody: "Esta acción es definitiva y no se puede deshacer.",
      deleteConfirmBodyMulti: "Solo se eliminará esta foto del estado. Las demás fotos siguen visibles."
    }
  },
  exchangers: {
    eyebrow: "Finanzas",
    title: "Cambiadors",
    description: {
      all: "Todos os parceiros de transferencia MOXT — compare antes de crear una operación.",
      country: "Parceiros do tu país de origem solo — compare antes de crear una operación."
    },
    stats: {
      partners: "Parceiros"
    },
    newTransfer: "Nueva transferencia",
    searchPlaceholder: "Cambiador, ciudad o plazo...",
    myCountry: "O meu país ({flag} {code})",
    allExchangers: "Todos os cambiadors",
    available: "Disponible",
    rating: "Nota",
    fees: "Taxas",
    toConfirm: "A confirmar",
    viewProfile: "Ver a ficha",
    empty: {
      search: "Ningún cambiador encontrado",
      country: "Ningún cambiador no tu país",
      searchDesc: "Ningún parceiro corresponde à tu búsqueda.",
      countryDesc: "Só os parceiros {flag} do tu país de origem estão listados aquí. Experimente «Todos os cambiadors»."
    },
    detail: {
      notFound: "Cambiador no encontrado",
      notFoundDesc: "Este parceiro no está disponible para o tu país de origem.",
      eyebrow: "Parceiro de transferencia",
      fallbackDesc: "Parceiro de câmbio MOXT.",
      evaluation: "Avaliación",
      avgDelay: "Prazo médio",
      fees: "Taxas",
      feesAnnounced: "Taxas anunciadas",
      country: "País",
      methods: "Meios suportados",
      startTitle: "Iniciar una operación",
      startBody: "As comisiones y coordenadas serão recalculadas y controladas pelo futuro backend.",
      choose: "Escolher este cambiador",
      viewBusiness: "Ver el perfil de la empresa",
      infoTitle: "Informaciones do parceiro",
      name: "Nome",
      type: "Tipo",
      typeBusiness: "Empresa MOXT",
      typePartner: "Parceiro MOXT",
      availability: "Disponibilidade",
      methodsLabel: "Métodos",
      trustBusiness: "Perfil de empresa presente no MOXT.",
      trustPartner: "Perfil de parceiro verificado no MOXT.",
      trustRates: "As comisiones definitivas serão controladas pelo futuro backend.",
      trustNoReal: "Ninguna transferencia real é executada nesta versão."
    }
  },
  payments: {
    eyebrow: "Finanzas",
    title: "Pagamentos",
    description: "Acompanhamento y confirmación dos tus pagamentos ligados a transferencias.",
    new: "Nuevo pagamento",
    warning: "Os pagamentos são registados na tu cuenta MOXT y sincronizados entre dispositivos. Verifique siempre o importe y as coordenadas antes de confirmar.",
    modal: {
      title: "Associar un pagamento",
      description: "Selecciona una transferencia existente para registar o pagamento."
    },
    walletLabel: "Pagamento {id}",
    badge: "Pagamento",
    confirm: "Confirmar o pagamento",
    empty: "Ningún pagamento registado"
  },
  faq: {
    title: "Perguntas frequentes",
    description: "Compreender os limites y o funcionamento atual do MOXT.",
    phone: {
      question: "Porque tenho de confirmar o meu número russo?",
      answer: "Para publicar un anuncio, paquete, empleo o evento, o MOXT exige un número +7 verificado por SMS. Isto limita contas falsas y protege a comunidad. As mensajes continuam acessíveis sin este paso."
    },
    levels: {
      question: "Cuáles são os três níveis de verificación?",
      answer: "1) Teléfono russo (OTP) para publicar. 2) Identidad MOXT (documento + selfie) para empresa y transferencias. 3) Reforçada (+ comprobante de dirección) para limites más elevados."
    },
    profile: {
      question: "Cuál a diferença entre perfil verificado y perfil completo?",
      answer: "Perfil completo = os campos estão preenchidos (nome, contacto, ciudad, país…). Perfil verificado = a equipo MOXT validou a tu identidad via documentos (KYC): distintivo verde, limites más elevados y operaciones sensíveis. Um perfil pode estar completo sin estar verificado."
    },
    email: {
      question: "Criei a cuenta con un correo — tenho de verificar o teléfono?",
      answer: "Sim, antes de cuálquer publicación. Confirme o número +7 em Perfil o Verificación y confirme también o correo em Seguridad. Sem correo confirmado, a publicación permanece bloqueada. Se mudar de número, é pedida una nueva confirmación."
    },
    contact: {
      question: "Como contactar una empresa o un vendedor?",
      answer: "Inicie sesión, abra a ficha pretendida y use o botão Contactar. Será criada una conversación ligada ao conteúdo."
    },
    pending: {
      question: "O meu pedido de verificación está pendiente há más de 24 h",
      answer: "Contacte o administrador a través do soporte MOXT con o identificador da tu cuenta. A equipo podrá acelerar o tratamento."
    },
    report: {
      question: "Como denunciar un conteúdo problemático?",
      answer: "Utilize a denúncia disponible nas fichas. Os moderadores MOXT tratam as denúncias prioritárias."
    }
  },
  communications: {
    related: {
      business: "Empresa",
      event: "Evento",
      job: "Empleo",
      listing: "Anuncio",
      parcel: "Paquetes",
      p2p: "Intercambio P2P",
      transfer: "Transferencia",
      general: "Discussão"
    },
    contact: "Contactar",
    contactOpening: "A abrir…",
    snapshot: {
      defaultTitle: "Anuncio",
      available: "Disponible",
      recruiting: "Recrutamento",
      freeEntry: "Entrada gratuita",
      business: "Empresa",
      transferTitle: "Transferencia {id}",
      rate: "Taxa {rate}",
      amount: "Importe {amount}"
    },
    chips: {
      business: {
        services: "Olá, que servicios oferecem?",
        hours: "Cuál é o vosso horário?",
        quote: "Gostaria de obter un orçamento."
      },
      event: {
        seats: "Olá, aún há lugares?",
        register: "Como funciona a inscrición?",
        access: "O local é acessível?"
      },
      job: {
        available: "Olá, a vaga aún está disponible?",
        cv: "Posso enviar o meu CV?",
        process: "Cuál é o processo de recrutamento?"
      },
      listing: {
        available: "Olá, este anuncio aún está disponible?",
        price: "O precio é negociável?",
        details: "Pode compartir más detalhes?"
      },
      parcel: {
        kg: "Olá, quantos quilos aún estão disponibles?",
        delay: "Cuál é o plazo previsto?",
        items: "Que objetos aceitam?"
      },
      transfer: {
        status: "Olá, pode confirmar o estado do pagamento?",
        proof: "A prova de pagamento é suficiente?",
        deadline: "Cuál é o plazo restante para finalizar a transferencia?"
      },
      p2p: {
        available: "Olá, esta oferta aún está disponible?",
        payment: "Que modo de pagamento prefere?",
        rate: "Pode confirmar a tarifa?"
      },
      general: {
        more: "Olá, gostaria de saber más.",
        thanks: "Gracias pela tu mensaje.",
        clarify: "Pode precisar o tu pedido?"
      }
    }
  },
  businesses: {
    common: {
      russia: "Rusia",
      city: "Ciudad",
      country: "País",
      phone: "Teléfono",
      email: "E-mail",
      address: "Morada",
      edit: "Editar",
      delete: "Eliminar",
      cancel: "Cancelar",
      save: "Guardar",
      continue: "Continuar",
      back: "Voltar",
      consult: "Consultar",
      emDash: "—",
      status: "Estado",
      location: "Localización",
      publications: "Publicaciones",
      directory: "Diretório",
      service: "Serviço",
      sector: "Setor",
      hours: "Horário",
      zones: "Zonas",
      toConfirm: "A confirmar",
      toComplete: "A completar",
      moxt: "MOXT"
    },
    services: {
      transfert: "Transferencia",
      colis: "Paquetes",
      marketplace: "Marketplace",
      jobs: "Empleos",
      events: "Eventos",
      p2p: "P2P",
      listings: "Anuncios",
      eventsLabel: "Eventos"
    },
    activities: {
      transfer: {
        label: "Transferencia",
        description: "Câmbio, transferencias y servicios financeiros entre usuarioes y empresas."
      },
      logistics: {
        label: "Paquetes y logística",
        description: "Transporte, depósito, entrega y coordenación de paquetes."
      },
      commerce: {
        label: "Comércio y mercado",
        description: "Venda de produtos, lojas, servicios comerciais y anuncios."
      },
      recruitment: {
        label: "Empleos y recrutamento",
        description: "Ofertas de empleo, missões, recrutamento y gestão de candidaturas."
      },
      events: {
        label: "Eventos",
        description: "Encontros, formaciones, feiras y eventos comunitários."
      },
      education: {
        label: "Formación",
        description: "Cursos, acompanhamento, coaching y workshops."
      },
      real_estate: {
        label: "Imobiliário",
        description: "Arrendamento, habitación, acompanhamento y servicios imobiliários."
      },
      services: {
        label: "Servicios administractivos",
        description: "Ayuda con documentos, formalidades, apoio local y servicios práticos."
      }
    },
    experience: {
      transfer: {
        audience: "Empresas de câmbio, transferencia y receción de pagamentos.",
        promise: "Destaque os plazos, as reds de câmbio, as comisiones y a disponibilidade.",
        onboarding: {
          "0": "Indica un nome público claro y tranquilizador.",
          "1": "Adicione contactos russos contactáveis rapidamente.",
          "2": "Ative as monedas y reds realmente disponibles."
        }
      },
      logistics: {
        audience: "Viajeros, transportadores y servicios de logística.",
        promise: "Mostre os trajetos, as capaciudads y as condiciones de depósito.",
        onboarding: {
          "0": "Precise as ciudads de depósito y de entrega.",
          "1": "Explique os tipos de paquetes aceites.",
          "2": "Indica as disponibilidades y a zona de recolha."
        }
      },
      commerce: {
        audience: "Lojas, vendedores profissionais y servicios comerciais.",
        promise: "Valorize a vitrine, as categorías y a reatividade comercial.",
        onboarding: {
          "0": "Describe la especialidad principal.",
          "1": "Adicione a zona de entrega o de levantamento.",
          "2": "Destaque a confiança y a disponibilidade."
        }
      },
      recruitment: {
        audience: "Gabinetes, empresas y reclutadores.",
        promise: "Centralize ofertas, candidaturas y necessidades de terreno.",
        onboarding: {
          "0": "Explique os perfis procurados.",
          "1": "Precise a ciudad de intervención.",
          "2": "Indica o horário de tratamento das candidaturas."
        }
      },
      events: {
        audience: "Organizadores, associaciones y promotores.",
        promise: "Apresente os eventos, a comunidad y os próximos encontros.",
        onboarding: {
          "0": "Describe el tipo de eventos organizados.",
          "1": "Adicione as ciudads y locais frequentes.",
          "2": "Mostre o ritmo de publicación."
        }
      },
      education: {
        audience: "Formadores, coaches y estruturas educactivas.",
        promise: "Valorize cursos, workshops y acompanhamentos.",
        onboarding: {
          "0": "Explique as áreas ensinadas.",
          "1": "Indica modalidades presenciais o en línea.",
          "2": "Adicione as disponibilidades típicas."
        }
      },
      real_estate: {
        audience: "Agências, senhorios y servicios imobiliários.",
        promise: "Estruture anuncios, zonas y ofertas de acompanhamento.",
        onboarding: {
          "0": "Precise as zonas de cobertura.",
          "1": "Indica o tipo de bens o servicios propostos.",
          "2": "Adicione un contacto direto y tranquilizador."
        }
      },
      services: {
        audience: "Prestadores administractivos y servicios práticos.",
        promise: "Torne a assistência concreta, visível y fácil de contactar.",
        onboarding: {
          "0": "Liste claramente as formalidades cobertas.",
          "1": "Adicione os horários de atendimento.",
          "2": "Precise a zona o a modalidade de serviço."
        }
      },
      default: {
        audience: "Empresas profissionais no MOXT.",
        promise: "Apresente claramente a atividade y os servicios."
      }
    },
    spotlight: {
      feeAnnounced: "Taxas anunciadas",
      averageDelay: "Prazo médio",
      activeNetworks: "Reds activas",
      serviceZone: "Zona de serviço",
      capacity: "Capaciudad",
      handlingDelay: "Prazo de atendimento",
      contact: "Contacto",
      catalog: "Catálogo",
      delivery: "Entrega",
      availability: "Disponibilidade",
      activeOffers: "Ofertas activas",
      responseDelay: "Prazo de resposta",
      city: "Ciudad",
      hrContact: "Contacto RH",
      upcomingEvents: "Próximos eventos",
      programs: "Programas",
      workshops: "Workshops",
      activeProperties: "Imóveis activos",
      zones: "Zonas",
      zone: "Zona",
      services: "Servicios",
      schedule: "Horário",
      value: {
        perOperation: "Por operación",
        parcelCapacity: "Visível nos anuncios de paquetes",
        linkedPublications: "Visível nas publicaciones ligadas",
        directContact: "Segundo contacto direto"
      }
    },
    schedules: {
      always_open: {
        label: "Sempre aberto",
        summary: "Todos os días, 24h/24"
      },
      weekdays: {
        label: "Segunda a sexta",
        summary: "Seg–Sex, 09:00–18:00"
      },
      weekdays_saturday: {
        label: "Segunda a sábado",
        summary: "Seg–Sáb, 10:00–20:00"
      },
      appointment: {
        label: "Com marcación",
        summary: "Disponible con marcación"
      }
    },
    documents: {
      registration: "Registo / estatutos (ОГРН, ИНН)",
      license: "Licença o autorización de atividade",
      tax: "Atestado fiscal",
      address: "Comprobante de dirección profesional",
      bank: "Dados bancários (RIB)",
      identity: "Documento de identidad do dirigente",
      other: "Outro comprobante",
      fallback: "Documento"
    },
    completion: {
      name: {
        label: "Nome da empresa",
        hint: "Indica o nome mostrado na ficha pública."
      },
      sector: {
        label: "Setor de atividade",
        hint: "Elige o domínio principal."
      },
      country: {
        label: "País",
        hint: "Precise o país de implantación."
      },
      city: {
        label: "Ciudad",
        hint: "Adicione a ciudad onde opera."
      },
      phone: {
        label: "Teléfono de contacto",
        hint: "Um número contactável para os clientes MOXT."
      },
      description: {
        label: "Descripción da atividade",
        hint: "Apresente a empresa em algumas linhas."
      },
      services: {
        label: "Módulos activados",
        hint: "Selecciona pelo menos un serviço (Mercado, Jobs, Transferencia…)."
      },
      averageDelay: {
        label: "Prazo médio de tratamento",
        hint: "Obrigatório para o módulo Transferencia."
      },
      documents: {
        label: "Comprobante depositado",
        hint: "Elige un tipo de documento (registo, licença, fiscal…) y carregue o ficheiro no separador Documentos do espacio pro."
      },
      verified: {
        label: "Validación MOXT",
        hint: "Com o dossier completo, a equipo MOXT verifica a empresa."
      }
    },
    page: {
      eyebrow: "Servicios profissionais",
      title: "Empresas y cambiadors",
      description: "Perfis profissionais validados pelo MOXT. Só aparecen empresas verificadas, independientemente do país de origem do membro.",
      stats: {
        verified: "Empresas verificadas"
      },
      editBusiness: "Editar a minha empresa",
      createBusiness: "Crear una empresa",
      pendingAlertTitle: "A tu empresa está em validación",
      pendingAlertBody: "aún no aparece no diretório para os otros membros. Com o estado «Verificado», será visível para toda a comunidad MOXT. Pode consultá-la y editá-la a partir do seu",
      professionalSpaceLink: "mi empresa",
      yourBusiness: "A tu empresa",
      professionalSpace: "Mi empresa",
      viewPublicProfile: "Ver a ficha pública",
      searchPlaceholder: "Empresa, serviço, domínio o ciudad...",
      filter: {
        domain: "Domínio",
        allDomains: "Todos os domínios",
        allServices: "Todos os servicios"
      },
      directoryTitle: "Diretório profesional",
      directoryDescription: "O diretório mostra solo empresas verificadas. O país da cuenta do membro no influencia esta lista: só cuenta o estado de validación.",
      viewBusinessCard: "Ver a ficha da empresa →",
      emptyTitle: "Ninguna empresa validada",
      emptyDescription: "Aún sin empresas verificadas. Os perfis aparecen aquí após validación da equipo MOXT."
    },
    detail: {
      notAccessible: "Empresa no acessível",
      notFoundPending: "Empresa no encontrada o em validación",
      restrictedVisibility: "Esta empresa restringiu a visibilidade das respetivas publicaciones.",
      reviewsCount: "{count} avaliaciones",
      feeAnnounced: "Taxas anunciadas",
      eyebrow: "Empresa MOXT",
      bannerAlt: "Banner {name}",
      logoAlt: "{name} logo",
      averageDelay: "Prazo médio",
      tabs: {
        informations: "Informaciones",
        subscriptions: "Subscriciones",
        reviews: "Avaliaciones"
      },
      professionalInfo: "Informaciones profissionais",
      trust: {
        status: "Perfil {status}.",
        reviews: "{count} avaliación(ões) publicada(s) pela comunidad.",
        contacts: "Os contactos sensíveis são partilhados nas operaciones confirmadas."
      },
      adminTitle: "Aciones de administrador",
      adminDescription: "Validación y control direto da empresa a partir da ficha pública.",
      validate: "Validar",
      activate: "Activar",
      reject: "Rejeitar",
      spotlightTitle: "Pontos em destaque",
      aboutActivity: "Sobre esta atividade",
      linkedPublications: "Publicaciones ligadas",
      linkedPublicationsHint: "Aceda aos conteúdos realmente publicados por esta empresa segundo a atividade.",
      publishedItems: "{count} elemento(s) publicados",
      viewPublishedList: "Ver a lista publicada"
    },
    publications: {
      loadingTitle: "A cargar a pré-visualización",
      loadingDescription: "A obter as publicaciones da empresa...",
      notFound: "Empresa no encontrada",
      notFoundDescription: "Esta empresa no existe o aún no está validada no MOXT.",
      discoverMoxt: "Descobrir o MOXT",
      notAccessibleDescription: "Crie una cuenta MOXT para pedir acesso o descobrir otras empresas.",
      createAccount: "Crear una cuenta",
      backToDirectory: "Voltar ao diretório",
      guestInteract: "consultar esta publicación",
      eyebrow: "Publicaciones da empresa",
      description: "{sector}{location} — conteúdos publicados solo em nome da empresa.",
      locationSuffix: " · {location}",
      businessCard: "Ficha da empresa",
      tabs: {
        active: "Ativas",
        archived: "Arquivos"
      },
      types: {
        listing: "Anuncios",
        parcel: "Paquetes",
        job: "Empleos",
        event: "Eventos"
      },
      emptyTitle: "Ninguna publicación da empresa",
      emptyDescription: "Os anuncios publicados em nome desta empresa aparecerão aquí."
    },
    setup: {
      steps: {
        identity: "Identidad",
        contact: "Contacto",
        services: "Servicios",
        review: "Validar"
      },
      preview: {
        title: "Pré-visualización da ficha",
        republish: "Republicar no diretório",
        companyNamePlaceholder: "Nome da empresa",
        qrAlt: "QR code de pré-visualización",
        logoAlt: "Logo",
        presentationPlaceholder: "A tu apresentación aparecerá aquí.",
        cityRussia: "{city}, Rusia",
        cityDotRussia: "{city} · Rusia",
        reviewsZero: "0 avaliaciones",
        fees: "Taxas",
        visibleAfterValidation: "A ficha será visível após validación"
      },
      eyebrow: "Espacio empresa",
      title: {
        edit: "Editar a minha empresa",
        create: "Crear a minha empresa"
      },
      description: "Percurso em várias etapas para configurar a atividade, contactos na Rusia y servicios.",
      validationAlertTitle: "Validación necessária",
      validationAlertBody: "A empresa permanece invisível no diretório até confirmación por un administrador.",
      saveChanges: "Guardar alteraciones",
      submitForValidation: "Enviar para validación",
      toast: {
        logoAddedTitle: "Logo adicionado",
        logoAddedBody: "O logo da empresa foi enviado.",
        logoFailedTitle: "Logo no enviado",
        logoFailedBody: "O logo no pôde ser enviado.",
        bannerAddedTitle: "Banner adicionado",
        bannerAddedBody: "O banner da empresa foi enviado.",
        bannerFailedTitle: "Banner no enviado",
        bannerFailedBody: "O banner no pôde ser enviado."
      },
      identity: {
        section: "Identidad da empresa",
        sectionHint: "O nome público que aparecerá no diretório MOXT.",
        name: "Nome público da empresa",
        namePlaceholder: "Ex.: Koudjo Transfer, Afrik Logistique...",
        domainSection: "Domínio principal",
        domainHint: "Elige o núcleo da atividade. Isto define os módulos y o posicionamento.",
        secondary: "Atividade secundária (opcional)",
        secondaryNone: "Sem atividade secundária",
        visualSection: "Identidad visual",
        visualHint: "Logo y banner mostrados na ficha pública.",
        logo: "Logo",
        changeLogo: "Alterar o logo",
        addLogo: "Adicionar un logo",
        banner: "Banner de fundo",
        bannerAlt: "Banner",
        changeBanner: "Alterar o banner",
        addBanner: "Adicionar un banner"
      },
      contact: {
        locationSection: "Localización",
        locationHint: "Ciudad y dirección da atividade na Rusia.",
        cityInRussia: "Ciudad na Rusia",
        fullAddress: "Morada completa",
        addressPlaceholder: "Rua, edifício, metro o referência",
        serviceZones: "Zonas servidas",
        serviceZonesPlaceholder: "Moscovo, São Petersburgo...",
        coordsSection: "Coordenadas",
        coordsHint: "Meios de contacto visíveis na ficha pública.",
        russianPhone: "Número russo",
        useAccountPhone: "Usar o número da cuenta",
        originPhone: "Número do país de origem",
        professionalEmail: "E-mail profesional",
        emailPlaceholder: "contact@minhaempresa.con",
        telegram: "Telegram",
        telegramPlaceholder: "@username",
        website: "Site web",
        websitePlaceholder: "https://...",
        presentationSection: "Apresentación",
        presentationHint: "Describe la empresa, especialidad y zona. Pulsa el rayo para generar texto a partir de los datos.",
        generateAria: "Gerar automaticamente a apresentación",
        about: "Sobre a tu empresa",
        aboutPlaceholder: "Propomos... A nuestra especialidade é... Intervenimos em..."
      },
      services: {
        modulesSection: "Módulos activados",
        modulesHint: "Definidos automaticamente segundo o domínio principal.",
        selectDomainFirst: "Selecciona un domínio principal (paso 1) para activar os módulos.",
        transferSection: "Configuración de transferencia",
        transferHint: "As monedas y reds seguem o país de origem do criador da empresa.",
        feePercent: "Taxas (%)",
        averageDelay: "Prazo médio",
        averageDelayPlaceholder: "Ex.: 30–60 min",
        currencies: "Monedas trocadas",
        networksTitle: "Reds africanas y bancos russos",
        networksHint: "Assinale os modos de pagamento que aceita dos dois lados.",
        africanNetworks: "Reds africanas",
        russianBanks: "Bancos russos"
      },
      review: {
        identity: "Identidad",
        contact: "Contacto",
        russianPhone: "Teléfono russo",
        originPhone: "Teléfono de origem",
        services: "Servicios",
        modules: "Módulos",
        none: "Ningún",
        fees: "Taxas",
        currencies: "Monedas",
        networksBanks: "Reds y bancos",
        readyTitle: "Pronto a enviar para validación",
        readyBody: "A ficha será examinada por un administrador. Pontos fortes: {spotlight}."
      },
      success: {
        congrats: "Parabéns",
        title: "A tu empresa está criada",
        body: "está registada no MOXT. A equipo validará a ficha antes da publicación no diretório — já pode preparar o espacio pro.",
        recap: "Resumo",
        nextSteps: "Próximos pasos",
        stepValidation: "Validación do administrador (24–48 h em média)",
        stepSpotlight: "Pontos fortes: {spotlight}",
        stepComplete: "Complete o espacio pro para acolher os primeros clientes",
        goProfessional: "Aceder ao meu espacio empresa",
        republish: "Republicar no diretório"
      },
      defaults: {
        serviceZones: "Moscovo y ciudads próximas",
        averageDelay: "30-60 min"
      }
    },
    verification: {
      completeTitle: "Empresa completa y verificada",
      completeBody: "Ficha preenchida a 100 % y identidad da empresa validada pelo MOXT.",
      compactTitle: "Verificación · {percent}%",
      compactBody: "{count} elemento(s) em falta: {items}.",
      title: "Progresso da verificación",
      progressHint: "{complete} de {total} critérios concluídos · faltam {missing} para 100%.",
      missingHeading: "Aún em falta",
      documents: "Documentos",
      proSpace: "Espacio pro",
      complete: "Completar",
      seeValidated: "Ver os {count} critério(s) já validados"
    },
    visibility: {
      title: "Visibilidade das publicaciones",
      description: "Controle quem pode ver a ficha pública y as publicaciones. Guardado no MOXT y sincronizado entre dispositivos.",
      hint: "Visitantes no autorizados verão una mensaje de acesso restrito."
    },
    subscription: {
      followTitle: "Seguir esta empresa",
      followBody: "Subscreva para no perder os anuncios y publicaciones de {name}. Escolhe o nível de notificaciones após a suscripción.",
      benefit: {
        priority: "Prioridade nas listas de mercado, paquetes, empleos y eventos",
        notifications: "Notificaciones configuráveis (todas, importantes o silenciadas)",
        access: "Acesso rápido às nuevas publicaciones desta empresa"
      },
      followedContent: "Conteúdos seguidos",
      noModules: "Os módulos activados determinam os conteúdos notificados.",
      notifyOptions: "Opciones de notificación",
      content: {
        listing: "Anuncios mercado",
        parcel: "Paquetes disponibles",
        job: "Ofertas de empleo",
        event: "Eventos",
        post: "Publicaciones da comunidad"
      },
      ownerTitle: "Mi empresa — suscriptores",
      ownerCount: "{count} membro(s) seguem atualmente a tu empresa.",
      ownerEmpty: "Aún sin subscritores — partilhe a ficha para desenvolver a audiência.",
      manage: "Gerir subscritores"
    }
  },
  businessesValidation: {
    nameTooShort: "Nome demasiado curto.",
    nameRequired: "O apelido é obligatorio.",
    activityInvalid: "Selecciona un domínio válido.",
    activityRequired: "Domínio principal obligatorio.",
    secondaryDifferent: "Elige una atividade diferente.",
    countryRussiaOnly: "Todas as empresas estão situadas na Rusia.",
    cityRequired: "Ciudad obrigatória.",
    addressMin: "Adicione una dirección completa.",
    addressRequired: "Morada completa obrigatória.",
    phoneRequired: "Teléfono russo obligatorio.",
    emailInvalid: "E-mail profesional inválido.",
    emailRequired: "E-mail profesional obligatorio.",
    descriptionMin: "Adicione pelo menos 20 caracteres.",
    websiteInvalid: "Dirección do site inválido.",
    scheduleRequired: "Horário obligatorio.",
    zonesTooLong: "Lista de zonas demasiado longa.",
    servicesMin: "Selecciona pelo menos un serviço.",
    feeRequired: "Taxas obrigatórias.",
    delayRequired: "Prazo obligatorio.",
    currenciesMin: "Selecciona as monedas trocadas.",
    exchangeMethodsMin: "Selecciona pelo menos una red o un banco."
  },
  professional: {
    page: {
      emptyTitle: "Crie a tu empresa",
      emptyDescription: "É necessário un perfil profesional para agrupar y gerir as publicaciones.",
      createBusiness: "Crear a minha empresa",
      eyebrow: "Mi empresa",
      description: "Pedidos, equipo, documentos, publicaciones y desempenho num espacio adaptado à atividade.",
      viewPublic: "Ver a ficha pública",
      tabsAria: "Secciones do espacio profesional",
      metrics: {
        profileComplete: "Perfil completado",
        requests: "Pedidos",
        publications: "Publicaciones",
        transfersReceived: "Transferencias recebidas",
        events: "Eventos",
        jobs: "Empleos",
        parcels: "Paquetes",
        listings: "Anuncios",
        reviews: "Avaliaciones",
        reviewsWithActivity: "Avaliaciones {activity}"
      }
    },
    tabs: {
      groups: {
        identity: "Identidad",
        activity: "Atividade",
        community: "Comunidad",
        compliance: "Conformidade",
        insights: "Pilotagem"
      },
      profile: "Perfil",
      overview: "Pré-visualización",
      publications: "Publicaciones",
      requests: "Pedidos",
      transfers: "Transferencias",
      subscriptions: "Subscriciones",
      reviews: "Avaliaciones",
      members: "Membros",
      documents: "Documentos",
      statistics: "Estatísticas",
      actions: "Aciones"
    },
    overview: {
      activityState: "Estado da atividade",
      modulesActivated: "{label} activados",
      modulesFallback: "Módulos",
      noModules: "Ningún módulo activado.",
      editProfile: "Editar perfil y módulos",
      cards: {
        openRequests: "Pedidos abertos",
        activePublications: "Publicaciones activas",
        activeMembers: "Membros activos",
        documents: "Documentos",
        transfersReceived: "Transferencias recebidas",
        publishedEvents: "Eventos publicados",
        publishedJobs: "Ofertas publicadas",
        publishedParcels: "Viagens publicadas",
        publishedListings: "Anuncios publicados"
      },
      message: {
        transfert: "Este painel segue operaciones, pagamentos declarados y ajustes de receción.",
        events: "Este painel segue eventos, visibilidade da agenda y pedidos relacionados.",
        jobs: "Este painel segue ofertas, candidaturas y ritmo de publicación.",
        colis: "Este painel segue viagens, capaciudads disponibles y pedidos de reserva.",
        marketplace: "Este painel segue anuncios, atividade comercial y visibilidade dos conteúdos.",
        default: "Este painel adapta-se aos módulos realmente activados pela empresa."
      }
    },
    profile: {
      bannerAlt: "Banner {name}",
      logoAlt: "{name} logo",
      eyebrow: "Perfil profesional",
      primaryDomain: "Domínio principal",
      secondaryActivity: "Atividade secundária",
      noSecondary: "Sem atividade secundária",
      city: "Ciudad",
      address: "Morada",
      addressMissing: "Morada a completar",
      russianPhone: "Teléfono russo",
      originPhone: "Número do país de origem",
      notProvided: "No indicado",
      email: "E-mail",
      hours: "Horário",
      zones: "Zonas",
      russia: "Rusia",
      shareTitle: "{name} no MOXT"
    },
    publications: {
      empty: "Ninguna publicación para os módulos activados",
      all: "Todas",
      listings: "Anuncios",
      jobs: "Empleos",
      events: "Eventos",
      parcels: "Paquetes",
      view: "Ver",
      edit: "Editar",
      publish: "Publicar",
      suspend: "Suspender",
      archive: "Arquivar",
      route: "{origin} para {destination}"
    },
    requests: {
      emptyTitle: "Sem pedidos",
      emptyDescription: "Os pedidos ligados aos servicios da empresa aparecerão aquí.",
      timeline: "Cronologia",
      process: "Tratar",
      complete: "Concluir"
    },
    transfers: {
      emptyTitle: "Ninguna transferencia recebida",
      emptyDescription: "As operaciones criadas con a tu empresa aparecerão aquí.",
      summary: "{total} · {sent} enviados · {sender} para {recipient}",
      client: "Cliente",
      recipient: "Destinatário",
      viewClaim: "Ver / reclamación",
      continue: "Continuar",
      viewTracking: "Ver o seguimento",
      step1Title: "Paso 1 — Receción do pagamento",
      step1Body: "Verifique a cuenta y confirme a receción.",
      confirmReception: "Confirmar a receción do pagamento",
      step2Title: "Paso 2 — Confirmar a transferencia",
      step2Body: "Adicione a prova da transferencia y confirme.",
      proofLabel: "Prova de transferencia",
      confirmTransfer: "Confirmar a transferencia",
      toast: {
        impossibleTitle: "Ación impossível",
        receptionAlready: "A receción já foi confirmada o a transferencia já no está nesta etapa.",
        receptionConfirmedTitle: "Receción confirmada",
        receptionConfirmedBody: "Adicione ahora a prova y confirme a transferencia.",
        proofRequired: "Adicione una prova antes de confirmar a transferencia.",
        confirmedTitle: "Transferencia confirmada",
        confirmedBody: "O cliente pode ahora declarar a receción dos fundos."
      }
    },
    accounts: {
      toast: {
        updatedTitle: "Dados atualizados",
        updatedBody: "Os clientes verão a cuenta predfinida segundo o sentido da transferencia.",
        profileEdited: "Perfil editado.",
        profileAdded: "Perfil adicionado à lista.",
        profileRemoved: "Perfil removido.",
        setDefault: "Este perfil é ahora a predfinición para este sentido."
      },
      eyebrow: "Ajustes de pagamento do cliente",
      title: "Dados de receción",
      description: "Duas contas predfinidas por sentido de transferencia, más perfis extra con seleción da cuenta activa.",
      ready: "Pronto",
      toComplete: "A completar",
      tabs: {
        defaults: "Contas predfinidas",
        extra: "Outros perfis"
      },
      addProfile: "Adicionar un perfil",
      profile: "Perfil",
      default: "Predfinición",
      hidden: "Oculto",
      setAsDefault: "Definir como predfinición",
      edit: "Editar",
      delete: "Eliminar",
      noProfiles: "Ningún perfil para este sentido.",
      modal: {
        edit: "Editar",
        add: "Adicionar",
        title: "Perfil de receción",
        hintExtra: "Perfil para {direction}. Pode defini-lo como predfinición na lista.",
        hintDefault: "Perfil para {direction}. Esta cuenta será usada por predfinición neste sentido.",
        save: "Guardar"
      },
      slot: {
        active: "Activo",
        missing: "Em falta",
        configured: "Cuenta configurada",
        configureHint: "Configure a cuenta predfinida para este sentido.",
        editDefault: "Editar a predfinición",
        configure: "Configurar",
        ruTitle: "Cuenta Rusia",
        originTitle: "Cuenta {country}"
      },
      form: {
        russianBank: "Banco russo",
        transferNetwork: "Red de transferencia",
        label: "Etiqueta",
        recipientName: "Nome do beneficiario",
        phone: "Número de receción",
        accountNumber: "Cuenta o identificador",
        bankDetail: "Banco o detalhe",
        instructions: "Instruciones"
      }
    },
    documents: {
      toast: {
        addedTitle: "Documento adicionado",
        addedBody: "{type} — sincronización con o espacio empresa."
      },
      title: "Documentos da empresa",
      description: "Selecciona o tipo de comprobante y adicione o ficheiro.",
      typeLabel: "Tipo de documento",
      add: "Adicionar",
      formatsHint: "Formatos: PDF y imagens. Um comprobante basta para completar a verificación.",
      sizeKb: "{size} KB",
      empty: "Ningún documento profesional",
      types: {
        registration: "Registo / estatutos (ОГРН, ИНН)",
        license: "Licença o autorización de atividade",
        tax: "Atestado fiscal",
        address: "Comprobante de dirección profesional",
        bank: "Dados bancários (RIB)",
        identity: "Documento de identidad do dirigente",
        other: "Outro comprobante",
        fallback: "Documento"
      }
    },
    members: {
      addTitle: "Adicionar un membro",
      name: "Apelido",
      email: "E-mail",
      role: "Función",
      roles: {
        manager: "Gestor",
        support: "Soporte",
        editor: "Editor"
      },
      add: "Adicionar",
      remove: "Remover",
      empty: "Ningún membro"
    },
    reviews: {
      empty: "Ninguna avaliación publicada"
    },
    stats: {
      types: {
        listings: "Anuncios",
        jobs: "Empleos",
        events: "Eventos",
        parcels: "Paquetes",
        p2p: "P2P",
        p2pOffers: "Ofertas P2P",
        transfers: "Transferencias"
      },
      title: "Desempenho local",
      subtitle: "Indicadores calculados a partir dos dados deste navegador.",
      kpi: {
        publications: "Publicaciones",
        averageRating: "Nota média",
        activeServices: "Servicios activos",
        completedRequests: "Pedidos concluídos",
        listingViews: "Vistas de anuncios",
        contacts: "Contactos recebidos",
        favorites: "Nos favoritos",
        transfers: "Transferencias"
      },
      activityTitle: "Atividade das publicaciones · últimos 6 meses",
      breakdownTitle: "Distribuición por tipo",
      transfersTitle: "Transferencias · últimos 6 meses"
    },
    subscriptions: {
      stat: {
        active: "Subscritores activos",
        fullNotify: "Notificaciones completas",
        importantOnly: "Apenas importantes",
        muted: "Em silêncio"
      },
      howTitle: "Como funcionam as subscriciones",
      howBody: "Os membros MOXT pueden seguir {name} para ver as publicaciones em prioridade nas listas y recibir notificaciones conforme as preferências.",
      content: {
        listing: "Anuncios mercado",
        parcel: "Paquetes",
        job: "Empleos",
        event: "Eventos",
        post: "Publicaciones do feed"
      },
      notifyPrefs: "Preferências de notificación",
      subscriberCount: "{count} subscritor(es)",
      publicCardTitle: "Ficha pública",
      publicCardBody: "A sección de subscriciones está visível na ficha. Os visitantes pueden suscribirse diretamente nessa página.",
      viewCard: "Ver a ficha",
      yourSubscribers: "Os tus subscritores",
      bannedCount: "{count} membro(s) banido(s) — listados no fundo do painel.",
      notifyLabel: {
        all: "Todos os anuncios",
        important: "Apenas importantes",
        muted: "Silenciado"
      },
      notifyHint: {
        all: "Mercado, paquetes, empleos, eventos y publicaciones",
        important: "Anuncios do mercado y publicaciones do feed",
        muted: "Prioridade nas listas, sin notificaciones"
      }
    },
    actions: {
      toast: {
        deletedTitle: "Empresa eliminada",
        deletedBody: "A ficha já no está visível para si. Pode crear una nueva a cuálquer momento."
      },
      manageTitle: "Gestão do perfil",
      manageBody: "Edite a ficha, consulte a versão pública o prepare una nueva publicación no diretório.",
      editBusiness: "Editar a minha empresa",
      viewPublic: "Ver a ficha pública",
      dangerTitle: "Zona sensível",
      dangerBody: "A eliminación remove definitivamente a empresa do tu espacio. A equipo MOXT aún a pode consultar. Después pode crear una nueva.",
      deleteBusiness: "Eliminar a minha empresa",
      confirmDelete: "Confirmar a eliminación de «{name}»?",
      yesDelete: "Sim, eliminar",
      cancel: "Cancelar"
    }
  },
  admin: {
    page: {
      eyebrow: "Administración",
      title: "Centro de control",
      description: "Supervisionar transferencias, conteúdos, contas, validaciones y tickets.",
      export: "Exportar"
    },
    confirm: {
      reactivateTitle: "Reactivar este usuario?",
      suspendTitle: "Suspender este usuario?",
      reactivateBody: "{name} voltará a ter acesso completo à plataforma.",
      suspendBody: "{name} no podrá iniciar sesión nem usar o MOXT enquanto estiver suspenso."
    },
    super: {
      eyebrow: "Superadmin",
      title: "Pilotagem do sistema",
      description: "Saúde local, compatibilidade dos dados y visibilidade global da plataforma.",
      cards: {
        redux: "Domínios Redux",
        businesses: "Empresas",
        reports: "Denúncias",
        audit: "Registos de auditoria"
      },
      migration: {
        title: "Migración de dados históricos",
        done: "{count} registo(s) recuperado(s), control em {date}.",
        empty: "Ningún relatório de migración disponible."
      },
      roles: {
        title: "Matriz de funciones",
        description: "Referência local das capaciudads visíveis na interface.",
        exportAudit: "Exportar auditoria",
        permission: "Permissão"
      },
      yes: "Sim",
      no: "No"
    },
    permissions: {
      catalogRead: "Consultar catálogos",
      contentPublish: "Publicar conteúdo",
      businessManage: "Gerir una empresa",
      requestsManage: "Tratar pedidos de negócio",
      moderationManage: "Moderar a plataforma",
      usersManage: "Gerir usuarioes",
      systemAudit: "Consultar y exportar auditoria",
      rolesManage: "Editar funciones sensíveis"
    },
    nav: {
      overview: "Vista geral",
      transfers: "Transferencias",
      p2p: "P2P",
      rates: "Tipos de cambio",
      content: "Conteúdos",
      publications: "Publicaciones",
      support: "Soporte",
      users: "Usuarioes",
      verifications: "Verificaciones",
      documents: "Documentos",
      queues: "Filas de ación",
      audit: "Auditoria"
    },
    content: {
      businesses: "Empresas",
      listings: "Anuncios",
      jobs: "Empleos",
      events: "Eventos",
      parcels: "Paquetes",
      posts: "Publicaciones",
      reports: "Denúncias"
    },
    filters: {
      searchPlaceholder: "Buscar...",
      all: "Tudo"
    },
    shell: {
      alertsPending: "Alertas pendientes",
      systemOk: "Sistema operacional",
      kpi: {
        transfersPending: "Transferencias em curso",
        contentPending: "Conteúdos a moderar",
        urgentQueues: "Filas urgentes",
        auditLogs: "Logs de auditoria"
      }
    },
    identity: {
      fallbackName: "Administrador"
    },
    kpi: {
      transfers: {
        label: "Transferencias",
        sub: "{count} em curso"
      },
      content: {
        label: "Conteúdos",
        sub: "{count} a moderar"
      },
      users: {
        label: "Usuarioes",
        sub: "{count} suspensos"
      },
      queues: {
        label: "Filas urgentes",
        sub: "{count} no total"
      },
      audit: {
        label: "Logs de auditoria",
        sub: "Diário completo"
      }
    },
    overview: {
      officialStatus: {
        title: "Estado oficial MOXT",
        description:
          "Publica un estado como MOXT, visible 7 días arriba del banner — sin usar tu cuenta personal.",
        action: "Publicar un estado MOXT",
      },
      tourPreview: {
        title: "Visita guiada (prueba)",
        description:
          "Relanza el onboarding en Inicio — móvil y escritorio tienen pasos distintos.",
        action: "Lanzar la visita",
      },
      actions: {
        transfers: {
          label: "Pilotar transferencias",
          value: "{count} em curso"
        },
        content: {
          label: "Moderar conteúdos",
          value: "{count} pendientes"
        },
        queues: {
          label: "Tratar filas",
          value: "{count} urgentes"
        }
      },
      modulesTitle: "Módulos de conteúdo",
      elementCount: "{count} elemento(s)",
      recentTransfers: "Transferencias recentes",
      viewAll: "Ver tudo",
      noTransfers: "Ninguna transferencia.",
      priorities: "Prioridades do momento",
      queue: {
        deletions: "Eliminaciones de cuenta",
        verifications: "Verificaciones",
        documents: "Documentos de empresas",
        disputes: "Disputas abertos",
        reviews: "Avaliaciones pendientes",
        reports: "Denúncias"
      }
    },
    detail: {
      title: "Vista detalhada",
      emptyLabel: "Selecciona un elemento",
      emptySub: "Haz clic num elemento da lista para ver a ficha y as aciones.",
      actionsLabel: "Aciones",
      replyLabel: "Resposta detalhada",
      replyPlaceholder: "Resposta ao ticket...",
      send: "Enviar",
      openFull: "Abrir a ficha completa",
      kind: {
        transfer: "Transferencia",
        support: "Ticket de soporte",
        user: "Usuario",
        verification: "Verificación",
        businessDocument: "Documento de empresa",
        dispute: "Disputa",
        review: "Avaliaciones",
        report: "Denúncia",
        businesses: "Empresa",
        listings: "Anuncio",
        jobs: "Empleo",
        events: "Evento",
        parcels: "Paquetes",
        audit: "Log de auditoria",
        default: "Detalhe"
      },
      desc: {
        transfer: "{partner} · {status}",
        support: "{name} · prioridade {priority} · {status}",
        user: "{email} · {role}",
        verification: "{name} · nível {level} · {status}",
        businessDocument: "{business} · {status}",
        businesses: "{city} · {services}"
      }
    },
    common: {
      partnerFallback: "Parceiro",
      servicesFallback: "Servicios a confirmar",
      russiaFallback: "Rusia"
    },
    facts: {
      status: "Estado",
      sent: "Enviado",
      received: "Recebido",
      partner: "Parceiro",
      date: "Data",
      priority: "Prioridade",
      requester: "Requerente",
      messages: "Mensajes",
      updatedAt: "Atualizado",
      role: "Función",
      city: "Ciudad",
      phone: "Tel.",
      createdAt: "Criado em",
      services: "Servicios",
      price: "Precio",
      category: "Categoría",
      condition: "Estado",
      salary: "Salário",
      location: "Local",
      sector: "Setor",
      contract: "Contrato",
      capacity: "Capaciudad",
      route: "Trajeto",
      departure: "Partida",
      pricePerKg: "Precio/kg",
      distribution: "Distribuición",
      level: "Nível",
      user: "Usuario",
      email: "E-mail",
      documents: "Documentos",
      note: "Nota",
      reviewReason: "Motivo review",
      reviewedAt: "Revisto em",
      type: "Tipo",
      reference: "Referência",
      evidence: "Prova",
      reporter: "Denunciante",
      target: "Alvo",
      author: "Autor",
      id: "ID",
      free: "Grátis",
      yes: "Sim",
      no: "No"
    },
    contentSubtitle: {
      businesses: "{city} · {status}",
      listings: "{city} · {price}",
      jobs: "{location} · {salary}",
      events: "{city} · {date}",
      parcels: "{origin} -> {destination} · {status}",
      reports: "{type} · {status}",
      default: "{status}"
    },
    empty: {
      noElement: "Ningún elemento.",
      noUsers: "Ningún usuario encontrado.",
      noAuditLog: "Ningún log de auditoria.",
      noTicket: "Ningún ticket.",
      allTicketsHandled: "Todos os tickets foram tratados.",
      noTransferFound: "Ninguna transferencia encontrada.",
      tryFilters: "Tente alterar os filtros."
    },
    actions: {
      view: "Ver",
      open: "Abrir",
      approve: "Validar",
      approved: "Validada",
      reject: "Recusar",
      rejected: "Recusada",
      rejectedMasc: "Recusado",
      publish: "Publicar",
      published: "Publicada",
      publishedMasc: "Publicado",
      archive: "Arquivar",
      archived: "Arquivada",
      archivedMasc: "Arquivado",
      activate: "Activar",
      activated: "Ativada",
      active: "Activo",
      resolveReport: "Tratar",
      resolvedReport: "Tratado",
      dismiss: "Ignorar",
      dismissed: "Ignorado",
      advanceTo: "Passar para {next}",
      promoteAdmin: "Tornar admin",
      reactivate: "Reactivar",
      suspend: "Suspender",
      rejectPrompt: "Motivo da recusa (opcional):",
      resolve: "Resolver",
      close: "Encerrar",
      removeReview: "Remover a avaliación",
      rejectContest: "Recusar a contestación",
      hide: "Ocultar",
      delete: "Eliminar",
      deletePostConfirm: "¿Eliminar definitivamente esta publicación?",
      archivePostConfirm: "¿Archivar esta publicación? Dejará de aparecer en el feed."
    },
    promote: {
      passwordPrompt: "Contraseña de promoción a administrador\\n(configurada en scripts/phase2.env → MOXT_ADMIN_PROMOTE_PASSWORD)",
      superadminOnly: "Só un superadmin pode promover un administrador."
    },
    users: {
      title: "Usuarioes y funciones",
      pendingDeletion: "eliminación pedida"
    },
    verifications: {
      meta: "Nível {level} · {count} documento(s) · {date}",
      noteLabel: "Nota: {note}",
      rejectNoteLabel: "Motivo da recusa: {note}"
    },
    documents: {
      none: "Ningún documento associado a este pedido.",
      notFound: "Documentos no encontrados ({count}). Verifique o carregamento admin.",
      previewUnavailable: "Pré-visualización indisponible para este tipo — use Abrir.",
      noSignedUrl: "No foi possível gerar una ligación assinada para este documento."
    },
    support: {
      title: "Tickets de soporte",
      meta: "{name} · {count} mensaje(ns)",
      replyPlaceholder: "Resposta rápida...",
      reply: "Responder"
    },
    transfers: {
      metric: {
        total: "Total",
        pending: "Em curso",
        volume: "Volume tratado"
      },
      listTitle: "Lista de transferencias",
      receivedSuffix: "{amount} recebido"
    },
    p2p: {
      metric: {
        activeOffers: "Ofertas activas",
        openOrders: "Pedidos abiertos",
        disputed: "Disputas"
      },
      offersTitle: "Ofertas P2P",
      ordersTitle: "Pedidos P2P",
      emptyOffers: "Ninguna oferta encontrada.",
      emptyOrders: "Ningún pedido encontrado.",
      proofsCount: "{count} prueba(s)",
      noProofs: "Sin pruebas",
      restoreOrder: "Restaurar",
      completeOrder: "Completar",
      cancelOrder: "Cancelar"
    },
    queues: {
      disputesLabel: "Disputas",
      contestedReviewsLabel: "Avaliaciones contestadas",
      viewProfile: "Ver perfil",
      levelMeta: "Nível {level} · {name}"
    },
    audit: {
      title: "Diário de auditoria",
      globalFallback: "global"
    }
  },
  install: {
    eyebrow: "Aplicación",
    title: "Instalar MOXT",
    description: "Descarga el APK Android o añade MOXT a la pantalla de inicio en iPhone.",
    tabs: { android: "Android", iphone: "iPhone" },
    android: {
      title: "Descargar para Android",
      body: "Instala el archivo APK directamente en tu teléfono Android.",
      loading: "Cargando la versión disponible…",
      available: "Disponible",
      download: "Descargar APK",
      hint: "Si Android bloquea la instalación, permite orígenes desconocidos para el navegador o el gestor de archivos.",
      unavailable: "Aún no hay versión Android publicada. Vuelve pronto.",
      rustoreLater: "El enlace de RuStore se añadirá más adelante.",
      loadError: "No se pudo cargar la versión Android.",
      staffTitle: "Publicación staff",
      staffBody: "Sube un archivo .apk para reemplazar la versión activa.",
      versionPlaceholder: "Versión (ej. 1.0.3)",
      upload: "Subir APK",
      uploading: "Subiendo…",
      uploadOkTitle: "APK publicado",
      uploadOkBody: "{name} ya se puede descargar.",
      uploadError: "Error al subir el APK.",
    },
    iphone: {
      title: "Cómo añadir MOXT en iPhone",
      body: "Añade MOXT a la pantalla de inicio desde Safari en unos pasos.",
      guideAlt: "Guía ilustrada: añadir MOXT a la pantalla de inicio desde Safari",
      note: "Las notificaciones push en iPhone requieren esta instalación.",
    },
  },
  shared: {
    contact: "Contactar",
    opening: "A abrir…",
    yes: "Sim",
    no: "No",
    all: "Tudo",
    viewAll: "Ver tudo",
    page: "Página",
    russia: "Rusia",
    securityGate: {
      publish: {
        titlePhone: "Número russo necessário para publicar",
        titleEmail: "E-mail confirmado necessário para publicar",
        title: "Verificación necessária para publicar"
      },
      voyage: {
        titlePhone: "Número ruso requerido para publicar un viaje",
        titleEmail: "Email confirmado requerido para publicar un viaje",
        title: "Identidad verificada requerida para publicar un viaje",
        back: "Volver a paquetes"
      },
      p2p: {
        titlePhone: "Número russo necessário para P2P",
        titleEmail: "E-mail confirmado necessário para P2P",
        title: "Identidad verificada necessária para P2P",
        back: "Voltar ao P2P"
      },
      business: {
        title: "Identidad verificada necessária",
        back: "Voltar às empresas"
      },
      transfer: {
        title: "Cuenta verificada necessária",
        back: "Voltar às transferencias"
      },
      alertTitle: "Verificación necessária",
      toastTitle: "Verificación necessária",
      centerTitle: "Centro de verificación MOXT",
      centerBody: "Complete os dados pessoais y envie o dossier de identidad.",
      openVerification: "Abrir a verificación",
      links: {
        verifyPhone: "Verificar o meu número",
        center: "Centro de verificación",
        confirmEmail: "Confirmar o meu correo",
        security: "Seguridad",
        verificationMoxt: "Verificación MOXT"
      }
    },
    pages: {
      groups: {
        finances: "Finanzas",
        services: "Servicios",
        community: "Comunidad",
        communication: "Comunicación",
        account: "Cuenta",
        admin: "Administración",
        superadmin: "Superadmin"
      },
      dashboard: {
        title: "Inicio",
        subtitle: "Painel de boas-vindas"
      },
      moxt: {
        title: "MOXT",
        subtitle: "Todos os servicios"
      },
      transfers: {
        title: "Nueva transferencia"
      },
      transfersHistory: {
        title: "Histórico de transferencias"
      },
      exchangers: {
        title: "Cambiadors"
      },
      p2p: {
        title: "Trocas P2P"
      },
      wallet: {
        title: "Carteira"
      },
      payments: {
        title: "Pagamentos"
      },
      receipts: {
        title: "Recibos"
      },
      disputes: {
        title: "Os meus disputas"
      },
      businesses: {
        title: "Empresas"
      },
      professional: {
        title: "Mi empresa"
      },
      parcels: {
        title: "Paquetes"
      },
      marketplace: {
        title: "Marketplace"
      },
      myPublications: {
        title: "As minhas publicaciones"
      },
      news: {
        title: "Actualidad"
      },
      jobs: {
        title: "Empleos"
      },
      events: {
        title: "Eventos"
      },
      messages: {
        title: "Mensajes"
      },
      notifications: {
        title: "Notificaciones"
      },
      support: {
        title: "Soporte"
      },
      activities: {
        title: "A minha atividade"
      },
      favorites: {
        title: "Os meus favoritos"
      },
      documents: {
        title: "Os meus documentos"
      },
      verification: {
        title: "Verificación"
      },
      security: {
        title: "Seguridad"
      },
      profile: {
        title: "O meu perfil"
      },
      profileInformation: {
        title: "Informaciones pessoais"
      },
      settings: {
        title: "Ajustes"
      },
      localData: {
        title: "Dados locais"
      },
      admin: {
        title: "Centro de control"
      },
      featureMatrix: {
        title: "Cobertura funcional"
      },
      superadmin: {
        title: "Pilotagem do sistema"
      }
    },
    notifications: {
      someone: "Um membro",
      someoneAlt: "Alguém",
      aBusiness: "Uma empresa",
      publisher: "Um editor",
      review: {
        createdTitle: "Nueva avaliación recebida",
        createdBody: "{name} deixou {rating}/5: «{comment}»",
        replyTitle: "Resposta à tu avaliación",
        replyBody: "O proprietário respondeu à tu avaliación: «{comment}»",
        contestTitle: "Contestación registada",
        contestBody: "A tu contestación foi enviada à moderación MOXT.",
        contestAdminTitle: "Contestación de avaliación",
        contestAdminBody: "{name} — avaliación contestada em {type}."
      },
      subscription: {
        newTitle: "Nuevo subscritor",
        newBody: "{name} subscreveu as tus publicaciones.",
        removedTitle: "Suscripción removida",
        removedBody: "{name} removeu a tu suscripción às respetivas publicaciones.",
        bannedTitle: "Acesso de suscripción restrito",
        bannedBody: "{name} proibiu-o de se suscribirse às respetivas publicaciones."
      },
      report: {
        subscriberTitle: "Denúncia de subscritor",
        subscriberBody: "{name} denunciou un subscritor: {reason}",
        contentTitle: "Denúncia {label}",
        contentFallback: "Conteúdo denunciado"
      },
      post: {
        likeTitle: "Nuevo gosto",
        likeBody: "{name} gostou da tu publicación.",
        commentTitle: "Nuevo comentário",
        commentBody: "{name}: «{text}»"
      },
      p2p: {
        newOrderTitle: "Nueva paquete P2P",
        newOrderBody: "{name} aceitou a tu oferta {offerId}.",
        statusTitle: "Paquete P2P atualizada",
        statusBody: "A paquete {id} está ahora: {label}.",
        proofTitle: "Prova P2P adicionada",
        proofBody: "Foi adicionada una prova na paquete {id}.",
        ratingTitle: "Avaliación P2P recebida",
        ratingBody: "A tu transación {id} recebeu una nota de {rating}/5.",
        status: {
          created: "Paquete criada",
          waitingPayment: "A aguardar pagamento",
          completed: "Transación concluída",
          cancelled: "Transación cancelada",
          disputed: "Disputa en curso",
        }
      },
      verification: {
        title: "Verificación de cuenta",
        body: "O tu pedido de verificación está {status}.{reason}",
        pendingReview: "em exame",
        reasonPrefix: " Motivo: {note}"
      },
      businessDocument: {
        submittedTitle: "Documento de empresa por revisar",
        submittedBody: "{business} ha enviado « {name} ».",
        reviewedTitle: "Documento de empresa actualizado",
        reviewedBody: "Tu documento « {name} » está {status}.{reason}",
        statusVerified: "aprobado",
        statusRejected: "rechazado",
        reasonPrefix: " Motivo: {note}"
      },
      dispute: {
        openedTitle: "Disputa aberto",
        openedBody: "Foi aberto un disputa relactivo a {type} {id}.",
        updatedTitle: "Disputa atualizado",
        updatedBody: "O disputa {id} está ahora: {status}."
      },
      account: {
        newTitle: "Nueva cuenta creada",
        newBody: "{name} acaba de crear una cuenta MOXT."
      }
    }
  },
  assistant: {
    responses: {
      transfert: {
        actions: {
          "0": "Nueva transferencia",
          "1": "As minhas transferencias"
        },
        suggestions: {
          "0": "Cuáles são os plazos de processamento?",
          "1": "Como envio o comprobante de pagamento?",
          "2": "Cuáles são as comisiones aplicadas?",
          "3": "Que países são cobertos?"
        },
        texts: {
          "0": "Para fazer una transferencia, ve a **Transferências** y después **Nova transferência**.\n\nPasos:\n- Elige a direción (África → Rusia o Rusia → África)\n- Selecciona un cambiador entre os disponibles\n- Indica o importe y os dados do destinatário\n- Confirme y envie o comprobante de pagamento em 30 minutos\n\nO cambiador valida después y é notificado de imediato.",
          "1": "Uma transferencia MOXT faz-se em poucos pasos simples.\n\nEm **Nova transferência**, elige o cambiador, o importe y os dados do beneficiario. Después de crear o pedido, tem 30 minutos para enviar o comprobante — após esse plazo, o pedido expira.\n\nAcompanhe o progresso em tempo real em **As minhas transferências**."
        }
      },
      preuve: {
        actions: {
          "0": "As minhas transferencias"
        },
        suggestions: {
          "0": "O que fazer se o comprobante for rechazado?",
          "1": "Quanto tempo demora a validación?",
          "2": "Como abrir un disputa?"
        },
        texts: {
          "0": "Para submeter un comprobante de pagamento, abra a transferencia em **As minhas transferências** y toque em **Declarar o pagamento**.\n\nAnexe una captura de ecrã o una foto nítida da transferencia. O cambiador é notificado y valida o más depressa possível.\n\nCertifique-se de que o importe, a data y o número de referência estão bem visíveis no documento."
        }
      },
      taux: {
        actions: {
          "0": "Nueva transferencia",
          "1": "Câmbio P2P"
        },
        suggestions: {
          "0": "Como crear una transferencia?",
          "1": "O que é o câmbio P2P?",
          "2": "Que cambiadors estão disponibles?"
        },
        texts: {
          "0": "As comisiones de câmbio no MOXT são definidas por cada cambiador registado y atualizadas regularmente. Cobrem as monedas dos países africanos parceiros (XOF, XAF, NGN, GHS, KES, RUB, etc.) para o rublo russo, y o inverso.\n\nAo crear una transferencia, o importe recebido pelo destinatário é calculado automaticamente à tarifa do dia, con as comissões claramente mostradas antes da confirmación.\n\nPode comparar as ofertas de vários cambiadors para elegir a más vantajosa."
        }
      },
      pays: {
        actions: {
          "0": "Nueva transferencia"
        },
        suggestions: {
          "0": "Como crear una transferencia?",
          "1": "Cuáles são as comisiones?",
          "2": "Como verificar a minha cuenta?"
        },
        texts: {
          "0": "O MOXT liga a **Rússia** aos países da **África subsariana francófona e anglófona**.\n\nEntre os países de origem cobertos:\n- África Ocidental: Benim, Burkina Faso, Costa do Marfim, Senegal, Mali, Níger, Togo, Gana, Nigéria\n- África Central: Camarões, Congo, R.D. Congo, Gabão, Chade\n- África Oriental: Quénia, Ruanda, Uganda, Tanzânia\n- E otros países africanos\n\nAs transferencias fazem-se entre estes países y a Rusia, nos dois sentidos."
        }
      },
      delai: {
        actions: {
          "0": "As minhas transferencias"
        },
        suggestions: {
          "0": "Como envio o comprobante de pagamento?",
          "1": "Como contacto o meu cambiador?",
          "2": "Como abrir un disputa?"
        },
        texts: {
          "0": "Os plazos de processamento dependem do cambiador selecionado. Cada ficha de cambiador indica o plazo médio habitual.\n\nEm geral:\n- Después de submetido o comprobante, o cambiador valida em minutos a algumas horas\n- Tem **30 minutos** após crear a transferencia para enviar o comprobante\n- Se ultrapassar o plazo, o pedido expira automaticamente y deve crear un nuevo\n\nSe a transferencia demorar demasiado, contacte o cambiador diretamente pela mensajes."
        }
      },
      frais: {
        actions: {
          "0": "Nueva transferencia"
        },
        suggestions: {
          "0": "Como crear una transferencia?",
          "1": "Cuáles são as comisiones de câmbio?",
          "2": "Como verificar a cuenta para limites más altos?"
        },
        texts: {
          "0": "As comisiones de serviço MOXT são transparentes y mostradas antes de confirmar cada transferencia.\n\nIncluem:\n- Uma **percentagem de serviço** definida pelo cambiador (visível na ficha)\n- Uma **margem de câmbio** aplicada à tarifa do dia\n\nO importe exacto que o destinatário recibirá é siempre calculado y mostrado antes de confirmar. Sem surpresas após a validación."
        }
      },
      colis: {
        actions: {
          "0": "Ver trajetos",
          "1": "Publicar un trajeto"
        },
        suggestions: {
          "0": "Cuál é o precio por quilo?",
          "1": "Como contacto un viajero?",
          "2": "Que tipos de artigos são aceites?",
          "3": "Como publico o meu próprio trajeto?"
        },
        texts: {
          "0": "O serviço de paquetes MOXT liga remetentes a viajeros con capaciudad nas bagagens, em trajetos entre a Rusia y os países africanos.\n\n**Para enviar uma encomenda:**\n- Consulte os trajetos em **Encomendas**\n- Elige un viajero pela data, peso disponible y tarifa\n- Envie un pedido de reserva con os detalhes do envio\n\n**Para propor um trajeto:**\n- Publique o trajeto con o peso disponible, o precio por quilo y os tipos de artigos aceites\n- Aceite os pedidos recebidos y coordene a entrega con o remetente.",
          "1": "A rubrica **Encomendas** permite transportar o enviar artigos entre a Rusia y a África via viajeros particulares.\n\nCada trajeto publicado indica a data de partida, a capaciudad restante, a tarifa por quilo y eventuais restriciones. A ligación faz-se diretamente na plataforma, sin intermediário."
        }
      },
      marketplace: {
        actions: {
          "0": "Marketplace",
          "1": "Publicar un anuncio"
        },
        suggestions: {
          "0": "Como contacto un vendedor?",
          "1": "Como gerir os meus anuncios?",
          "2": "Como denunciar un anuncio?"
        },
        texts: {
          "0": "O mercado MOXT permite comprar y vender artigos na comunidad afro-russa.\n\n**Para publicar um anúncio:**\n- Ve a **Marketplace** y después **Publicar um anúncio**\n- Completa o título, a descripción, o precio y as fotos\n- Indica se faz entrega o se é solo levantamento\n\nOs anuncios permanecen activos até os cerrar o até o artigo ser vendido.",
          "1": "Em **Marketplace**, navegue pelos anuncios, filtre por categoría o localización y contacte o vendedor diretamente pela mensajes integrada.\n\nPara pôr un artigo à venda, use **Publicar um anúncio**. O formulario orienta-o: tipo de produto, estado, precio y opciones de entrega."
        }
      },
      emploi: {
        actions: {
          "0": "Ofertas de empleo",
          "1": "Publicar una vaga"
        },
        suggestions: {
          "0": "Como candidatar-me a una oferta?",
          "1": "Como acompanhar as minhas candidaturas?",
          "2": "Como publicar una oferta de empleo?"
        },
        texts: {
          "0": "A sección **Empregos** reúne as ofertas da comunidad afro-russa: missões pontuais, contratos, freelance y muy más.\n\n**Para candidatar-se:**\n- Abra una oferta y leia os requisitos\n- Toque em **Candidatar-se** y escreva una mensaje personalizada\n- Acompanhe o estado da candidatura no tu espacio\n\n**Para recrutar:**\n- Publique a oferta con o tipo de contrato, a remuneración y as competências pedidas\n- Faça a gestão das candidaturas diretamente na ficha da vaga."
        }
      },
      evenement: {
        actions: {
          "0": "Eventos",
          "1": "Publicar un evento"
        },
        suggestions: {
          "0": "Como inscrever-me num evento?",
          "1": "Como cancelar a minha inscrición?",
          "2": "Como organizar un evento?"
        },
        texts: {
          "0": "A página **Eventos** reúne encontros, conferências, festas y workshops da comunidad afro-russa.\n\nPara se inscrever, abra a ficha y toque em **Inscrever-se**. Recebe una confirmación y un lembrete antes da data.\n\nPara organizar un evento, use **Publicar um evento** y completa o local, a data, a capaciudad y as informaciones práticas."
        }
      },
      entreprise: {
        actions: {
          "0": "Diretório de empresas",
          "1": "Crear perfil de empresa"
        },
        suggestions: {
          "0": "Como encontrar un cambiador fiável?",
          "1": "Como ler as avaliaciones de clientes?",
          "2": "Como registar a minha atividade?"
        },
        texts: {
          "0": "O diretório **Empresas** lista cambiadors, prestadores y sociedades activos na comunidad afro-russa na Rusia.\n\nPode consultar fichas, ler avaliaciones, comparar comisiones y plazos, y contactar diretamente pela mensajes.\n\nPara registar a tu atividade, ve a **Criar perfil de empresa**. Después de validado, o perfil fica visível para toda a comunidad."
        }
      },
      verification: {
        actions: {
          "0": "Verificar a minha identidad",
          "1": "Os meus documentos"
        },
        suggestions: {
          "0": "Que documentos são aceites?",
          "1": "Quanto tempo demora a validación?",
          "2": "Que vantagens após a verificación?"
        },
        texts: {
          "0": "O MOXT aplica **três níveis de verificação**:\n\n**1. Telefone russo (+7)** — obligatorio para publicar un anuncio, una paquete, un empleo o un evento. Um número único por cuenta, confirmado por SMS. Se se registou por correo, confirme o número em **Perfil** o **Verificação**.\n\n**2. Identidade MOXT** — documento de identidad + selfie. Necessário para crear una empresa y usar contas de transferencia.\n\n**3. Reforçada** — identidad + comprobante de dirección para limites de transferencia más altos.\n\nA **mensagens** y as interaciones sociais continuam acessíveis sin verificación reforçada.\n\nSe un processo estiver pendiente há más de 24 h, contacte o administrador via **Suporte**.",
          "1": "A verificación de identidad no MOXT faz-se na rubrica **Verificação**.\n\n**Antes de publicar**: confirme o número russo por OTP (nível 1).\n\n**Nível identidade**: pasaporte, cartão de residência russo o cartão consular + selfie.\n\n**Nível reforçado**: + comprobante de dirección recente na Rusia.\n\nMudança de número: é pedida una nueva confirmación por SMS."
        }
      },
      p2p: {
        actions: {
          "0": "Câmbio P2P",
          "1": "Propor una oferta"
        },
        suggestions: {
          "0": "Que monedas estão disponibles?",
          "1": "Como proteger a minha transación P2P?",
          "2": "Cuál a diferença face a una transferencia clássica?"
        },
        texts: {
          "0": "O câmbio **P2P** (peer-to-peer) permite comprar o vender monedas diretamente con otros membros da comunidad.\n\nExplore as ofertas, filtre por moneda y método de pagamento, y elige a que melhor se adequa. A transación é acompanhada pelo MOXT para garantir a seguridad de ambas as partes.\n\nTambién pode publicar a tu própria oferta se quiser vender moneda a una tarifa que definir."
        }
      },
      litige: {
        actions: {
          "0": "Os meus disputas",
          "1": "Soporte"
        },
        suggestions: {
          "0": "Que comprobantes anexar ao processo?",
          "1": "Cuál é o plazo de tratamento?",
          "2": "Como contactar o soporte diretamente?"
        },
        texts: {
          "0": "Si hay un problema con una transferencia, un envío o una transacción, abre una disputa en **Mis disputas**.\\n\\nPara ello:\\n- Selecciona la operación afectada\\n- Describe el problema con precisión\\n- Adjunta las pruebas disponibles (capturas, recibos, fotos)\\n\\nNuestro equipo interviene en un plazo de 24 a 72 horas. Todas las partes son informadas del avance."
        }
      },
      compte: {
        actions: {
          "0": "O meu perfil",
          "1": "Informaciones pessoais"
        },
        suggestions: {
          "0": "Como alterar a foto de perfil?",
          "1": "Como verificar a minha identidad?",
          "2": "Como gerir os meus perfis de transferencia?"
        },
        texts: {
          "0": "O espacio **Perfil** centraliza todas as informaciones da tu cuenta MOXT.\n\nPode:\n- Alterar dados pessoais (nome, teléfono, ciudad)\n- Atualizar a foto de perfil\n- Consultar o nível de verificación\n- Gerir documentos y perfis de transferencia guardados\n\nRecomendamos manter os contactos atualizados para una experiência ideal."
        }
      },
      recu: {
        actions: {
          "0": "As minhas transferencias",
          "1": "Finanzas"
        },
        suggestions: {
          "0": "Como descargar un recibo?",
          "1": "Como contestar una transferencia?",
          "2": "Onde ver o histórico completo?"
        },
        texts: {
          "0": "Os recibos das transferencias estão disponibles diretamente em cada operación em **As minhas transferências**.\n\nCada recibo contém:\n- O importe enviado y o importe recebido\n- A tarifa de câmbio aplicada\n- As informaciones do cambiador\n- A cronologia completa do tratamento\n\nPode consultá-lo o partilhá-lo diretamente na aplicación."
        }
      },
      finance: {
        actions: {
          "0": "Finanzas"
        },
        suggestions: {
          "0": "Como ler o histórico de pagamentos?",
          "1": "Onde ver as minhas transferencias?",
          "2": "Como verificar o meu saldo?"
        },
        texts: {
          "0": "A sección **Finanzas** dá una visão geral da tu atividade no MOXT: histórico de pagamentos, saldo da carteira y resumo das operaciones.\n\nCada movimento é registado con data, estado y detalhe. É o espacio ideal para acompanhar despesas y transferencias num período."
        }
      },
      admin: {
        actions: {
          "0": "Seguir mi solicitud"
        },
        suggestions: {
          "0": "Quiero hablar con un administrador",
          "1": "Como contactar o soporte?"
        },
        texts: {
          "0": "Para hablar con un **administrador MOXT**, usa el botón de auriculares en el asistente o describe tu solicitud aquí.\n\nTu mensaje abre un **ticket de soporte** enviado al equipo. Un administrador responderá desde **Soporte** o el centro de control admin."
        }
      },
      message: {
        actions: {
          "0": "Mensajes"
        },
        suggestions: {
          "0": "Como contactar un cambiador?",
          "1": "Como contactar o soporte?",
          "2": "Como encontrar una conversación arquivada?"
        },
        texts: {
          "0": "As mensajes MOXT permitem trocar mensajes diretamente con otros membros, cambiadors y prestadores.\n\nCada conversación está ligada a una operación o ficha profesional, o que facilita o contexto. También pode contactar o soporte nesta interface para cuálquer pedido de ayuda."
        }
      },
      fallback: {
        actions: {
          "0": "Descobrir o MOXT",
          "1": "Contactar o soporte"
        },
        suggestions: {
          "0": "Como fazer una transferencia?",
          "1": "Como enviar una paquete?",
          "2": "Como verificar a minha identidad?",
          "3": "Que países são cobertos?"
        },
        texts: {
          "0": "Olá! Sou a Moxi, a tu assistente MOXT. Posso ayudar con:\n\n- **Transferências** — enviar dinero entre a Rusia y a África\n- **Encomendas** — enviar artigos via viajeros\n- **Marketplace** — comprar y vender na comunidad\n- **Empregos e eventos** — candidatar-se o organizar encontros\n- **Empresas** — encontrar un cambiador o registar a atividade\n- **Verificação** — desbloquear limites de transferencia más altos\n- **Litígios e suporte** — obter ayuda em caso de problema\n\nCuál é a tu pergunta?",
          "1": "Estou aquí para o orientar na plataforma MOXT, que liga a **Rússia** y os **países da África subsariana**.\n\nDiga-me o que procura — transferencia, paquete, anuncio, empleo o otro — y eu indico a sección certa con as informaciones úteis."
        }
      }
    }
  },
  localData: {
    title: "Dados locais",
    description: "Controle os dados guardados neste navegador antes da ligación ao backend.",
    refresh: "Atualizar",
    downloadBackup: "Descargar una cópia de seguridad",
    backupFilename: "moxt-backup-local-{date}.json",
    schemaVersion: "Versão do esquema",
    spaceUsed: "Espacio usado",
    unreadableData: "Dados ilegíveis",
    domainsTitle: "Domínios guardados",
    domainsHint: "Selecciona solo as categorías que pretende repor.",
    reset: "Repor ({count})",
    itemCount: "{count} item(ns) · {size}",
    invalidKeys: "{count} chave(s) ilegível(eis)",
    readable: "Dados legíveis",
    aboutTitle: "O que faz esta página",
    aboutBody: "A cópia de seguridad contém solo os dados MOXT deste navegador. A reposición no altera a contraseña y no transmite quaisquer dados.",
    confirmTitle: "Repor os dados selecionados",
    confirmBody: "Esta operación remove as categorías escolhidas deste navegador. Descarregue una cópia de seguridad antes de confirmar.",
    messages: {
      genericError: "Ocorreu un error. Tente nuevamente.",
      invalidData: "Alguns dados locais estão ilegíveis.",
      saved: "As alteraciones foram guardadas.",
      storageUnavailable: "O armazenamento local está indisponible neste navegador.",
      storageReset: "Os dados selecionados foram repostos."
    },
    domains: {
      account: "Cuenta y preferências",
      businesses: "Empresas",
      communications: "Mensajes y notificaciones",
      community: "Mercado, empleos y eventos",
      services: "Transferencias, paquetes y P2P",
      administration: "Administración y auditoria",
      interface: "Interface y cache"
    }
  },
  version: {
    title: "Versão da aplicación",
    description: "MOXT v{version}",
    descriptionWithBuild: "MOXT v{version} · Build de {date}",
    channelLabel: "Canal {channel}",
    compiledOn: "Compilado em {date}",
    stats: {
      pages: "Páginas",
      languages: "Idiomas",
      build: "Build",
      channel: "Canal"
    },
    changelog: {
      v120: {
        date: "Julio 2026",
        h0: "Barra superior móvil: atajos contextuales, etiquetas al pasar el cursor y tamaños armonizados",
        h1: "Mensajes: el teclado se mantiene abierto al enviar, sin hueco bajo el compositor",
        h2: "Registro: OTP por correo si SMSC rechaza el número",
        h3: "Guía: se muestran todos los artículos publicados",
        h4: "Página Cartera eliminada; redirección a recibos",
        h5: "Perfil: Cuenta / Confianza / Documentos con icono y nombre en la misma línea"
      },
      v110: {
        date: "Julho 2026",
        h0: "Notificaciones push nactivas (Android / iOS) y permissões de câmara Capacitor",
        h1: "Política de privaciudad y CGU multilingues (FR, EN, RU, PT)",
        h2: "Filtragem de cambiadors por país de origem y bandeiras de parceiros",
        h3: "Página de apresentación MOXT con pré-visualizaciones mobile y desktop",
        h4: "Russo como idioma predfinido y seletor de idioma visível",
        h5: "Logótipo X unificado (aplicación, site, navegación)"
      },
      v100: {
        date: "Julho 2026",
        h0: "Scanner QR, visibilidade de perfil/empresa, botão Contactar",
        h1: "Internacionalización FR / EN / RU / PT",
        h2: "PWA, modo oscuro, búsqueda global"
      }
    }
  },
  social: {
    instagram: {
      eyebrow: "Comunidad",
      title: "Sigue a MOXT en Instagram",
      description:
        "Noticias, consejos y momentos de la diáspora — únete a @MOXTAPP para estar al día.",
      open: "Abrir Instagram",
      copy: "Copiar enlace",
      copied: "Enlace copiado",
      scanHint: "Escanea el QR",
      enlargeQr: "Ampliar el código QR de Instagram",
      qrAlt: "Código QR de Instagram @MOXTAPP"
    }
  },
  reviews: {
    reputation: "Reputación",
    communityTitle: "Avaliaciones da comunidad",
    communityDescription: "Nota global calculada nesta página y em cada publicación ligada ({count} avaliaciones).",
    embeddedSummary: "Nota global nesta página y publicaciones ligadas — {count} avaliaciones, média {average}.",
    leaveReview: "Deixar una avaliación",
    yourRating: "A tu nota",
    yourComment: "O tu comentário",
    commentPlaceholder: "Partilhe a tu experiência con este perfil…",
    publish: "Publicar a minha avaliación",
    update: "Atualizar a minha avaliación",
    ownerHint: "Pode responder o contestar avaliaciones recebidas na tu página y publicaciones.",
    allReviews: "Todas as avaliaciones",
    emptyTitle: "Aún sin avaliaciones",
    emptyDescription: "Seja o primero a compartir a tu experiência.",
    memberFallback: "Membro MOXT",
    reasons: {
      loginRequired: "Inicie sesión para deixar una avaliación.",
      ownContent: "No pode avaliar o tu próprio conteúdo.",
      targetMissing: "Alvo da avaliación no encontrado.",
      profileInteractionRequired: "Tem de ter interagido con este membro (transferencia, paquete, candidatura, paquete/parcel o mensaje) antes de avaliar.",
      businessClientOnly: "Só clientes que interagiram con esta empresa pueden deixar una avaliación.",
      listingContactRequired: "Faça una pergunta o contacte o vendedor antes de avaliar este anuncio.",
      jobApplicantOnly: "Só candidatos pueden avaliar esta oferta.",
      eventRegisterRequired: "Inscreva-se no evento antes de deixar una avaliación.",
      parcelReserveRequired: "Reserve esta paquete antes de deixar una avaliación.",
      postInteractRequired: "Interaja con a publicación antes de deixar una avaliación.",
      notAllowed: "Avaliación no autorizada para este alvo."
    }
  },
  toasts: {
    reviewNotAllowed: "Avaliación no autorizada",
    transferUpdated: "Transferencia atualizada",
    transferTimelineMessage: "A ación «{status}» foi adicionada à cronologia.",
    actionSaved: "Ación registada",
    requestTimelineUpdated: "A cronologia do pedido foi atualizada.",
    questionPublished: "Pergunta publicada",
    questionPublishedBody: "O vendedor podrá responder publicamente.",
    answerPublished: "Resposta publicada",
    answerPublishedBody: "A tu resposta está visível na ficha.",
    reportSent: "Denúncia enviada",
    reportSentBody: "A moderación MOXT analisará este conteúdo.",
    reportSentCaseBody: "A moderación MOXT analisará este processo.",
    alreadyReported: "Já denunciado",
    alreadyReportedBody: "A tu denúncia já está registada para este conteúdo.",
    alreadyReportedCaseBody: "Esta denúncia já está registada.",
    claimRegistered: "Reclamación registada",
    claimRegisteredBody: "O tu pedido será analisado.",
    claimAlreadyOpen: "Reclamación já aberta",
    claimAlreadyOpenBody: "Já existe una reclamación em curso para este processo.",
    businessSaved: "Empresa registada",
    businessSavedBody: "O perfil y os tus módulos foram atualizados.",
    eventPublished: "Evento publicado",
    eventPublishedBody: "O tu evento está ahora visível.",
    applicationSent: "Candidatura enviada",
    applicationSentBody: "A tu candidatura foi transmitida con éxito.",
    jobPublished: "Oferta publicada",
    jobPublishedBody: "A oferta de empleo está ahora visível.",
    listingPublished: "Anuncio publicado",
    listingPublishedBody: "O tu anuncio está ahora visível.",
    p2pOfferPublished: "Oferta P2P publicada",
    p2pOfferPublishedBody: "A tu oferta está ahora disponible.",
    parcelRequestSent: "Pedido enviado",
    parcelRequestSentBody: "O transportador recebeu o tu pedido de reserva.",
    parcelPublished: "Viagem publicada",
    parcelPublishedBody: "O tu trajeto está ahora visível.",
    receiptSaved: "Recibo registado",
    receiptSavedBody: "O recibo está disponible no tu perfil.",
    subscriberBanned: "Subscritor banido",
    subscriberBannedBody: "O subscritor já no podrá seguir as tus publicaciones.",
    subscriberRemoved: "Subscritor removido",
    subscriberRemovedBody: "A suscripción foi removida.",
    transferCreated: "Transferencia criada",
    transferCreatedBody: "A empresa selecionada pode ahora tratar da operación.",
    smsSendFailed: "Envio de SMS impossível",
    verificationFailed: "Verificación impossível",
    genericError: "Ocorreu un error",
    actionCouldNotComplete: "A ación no pôde ser concluída."
  },
  notificationsFeed: {
    newContentPublished: "Nuevo conteúdo publicado",
    newTransferReceived: "Nueva transferencia recebida",
    newTransferReceivedBody: "{name} escolheu a tu empresa para {id}.",
    transferUpdated: "Transferencia atualizada",
    transferUpdatedBody: "A tu operación {id} está ahora {status}.",
    paymentDeclared: "Pagamento declarado",
    paymentDeclaredBody: "O cliente declarou o pagamento para {id}.",
    requestUpdated: "Pedido atualizado",
    requestUpdatedBody: "O tu pedido está ahora {status}.",
    newApplication: "Nueva candidatura",
    newApplicationBody: "{name} candidatou-se a {title}.",
    applicationUpdated: "Candidatura atualizada",
    applicationUpdatedBody: "A tu candidatura para {title} está ahora {status}.",
    thisJob: "este empleo",
    newRegistration: "Nueva inscrición",
    newRegistrationBody: "{name} participa em {title}.",
    eventRegistrationUpdated: "Inscrición no evento atualizada",
    eventRegistrationUpdatedBody: "A tu inscrición em {title} está ahora {status}.",
    thisEvent: "este evento",
    newReservation: "Nueva reserva",
    newReservationBody: "{kg} kg foram reservados na tu viagem.",
    newParcelRequest: "Nuevo pedido de paquete",
    newParcelRequestBody: "{name} pede {kg} kg.",
    parcelRequestUpdated: "Pedido de paquete atualizado",
    parcelRequestUpdatedBody: "O tu pedido de {kg} kg está ahora {status}.",
    newListingQuestion: "Nueva pergunta no tu anuncio",
    newListingQuestionBody: "{name} fez una pergunta sobre «{title}».",
    questionAnswered: "Resposta à tu pergunta",
    questionAnsweredBody: "O vendedor respondeu sobre «{title}».",
    yourListing: "o tu anuncio",
    businessVerified: "Empresa verificada",
    businessVerifiedBody: "«{name}» está ahora verificada. Pode publicar em nome da empresa y aparecer no diretório.",
    businessRejected: "Empresa recusada",
    businessRejectedBody: "A validación de «{name}» foi recusada. Contacte o soporte MOXT para más informaciones.",
    businessUpdated: "Empresa atualizada",
    businessUpdatedBody: "Nuevo estado: {status}.",
    resourceUpdated: "{label} atualizado(a)",
    newStatus: "Nuevo estado: {status}.",
    labelEvent: "Evento",
    labelJob: "Empleo",
    labelListing: "Anuncio",
    labelJobOffer: "Oferta de empleo",
    fanOutListing: "Nuevo anuncio",
    fanOutJob: "Nuevo empleo",
    fanOutEvent: "Nuevo evento",
    fanOutParcel: "Nueva paquete",
    fanOutPost: "Nueva publicación"
  },
  help: {
    page: {
      eyebrow: "Vivir en Rusia",
      title: "Guía práctica",
      description: "Documentos, trámites, seguridad y consejos para estudiantes y extranjeros que viven en Rusia, verificados y traducidos.",
      stats: {
        article: "Artículo",
        articles: "Artículos"
      },
      searchPlaceholder: "Buscar un documento, un trámite, un tema...",
      emptyTitle: "No se encontró ningún artículo",
      emptyDescription: "Prueba con otra categoría o palabra clave."
    },
    categories: {
      all: "Todo",
      documents: "Documentos",
      studentLife: "Vida estudiantil",
      money: "Dinero",
      safety: "Seguridad",
      laws: "Leyes"
    },
    article: {
      pinned: "Destacado",
      publishedOn: "Publicado el {date} en MOXT",
      verifiedOn: "Verificado el {date}",
      notFound: "Este artículo no se encontró o fue eliminado.",
      officialSource: "Ver la fuente oficial"
    }
  },
  adminHelp: {
    eyebrow: "Guía práctica",
    title: "Gestión de la guía",
    description: "Añade, edita o traduce los artículos de ayuda para estudiantes y extranjeros.",
    newArticle: "Nuevo artículo",
    editArticle: "Editar artículo",
    savedTitle: "Artículo guardado",
    empty: "Todavía no hay artículos.",
    deleteConfirmTitle: "¿Eliminar este artículo?",
    deleteConfirmBody: "Esta acción es definitiva y retirará todas sus traducciones de la guía pública.",
    validation: {
      required: "El título, el resumen y el contenido en francés son obligatorios."
    },
    status: {
      published: "Publicado",
      draft: "Borrador"
    },
    fields: {
      category: "Categoría",
      language: "Idioma",
      translations: "Traducciones",
      title: "Título",
      summary: "Resumen",
      content: "Contenido",
      sourceName: "Nombre de la fuente",
      sourceUrl: "Enlace de la fuente",
      pinned: "Fijar arriba",
      status: "Estado"
    },
    copyFromFr: "Copiar FR",
    incompleteWarning: "Falta traducción para: {languages}. Los visitantes en esos idiomas verán la versión FR por defecto.",
    sourceHint: "Indica siempre una fuente oficial verificable (gobierno, embajada, universidad) para mantener la confianza de los lectores."
  },
  guest: {
    previewBanner: {
      title: "Inicia sesión para interactuar",
      body: "Estás viendo este perfil en modo público. Inicia sesión para contactar, seguir, marcar como favorito o publicar.",
      createAccount: "Crear una cuenta",
      login: "Iniciar sesión"
    }
  },
  onboarding: {
    title: "Bienvenido a MOXT",
    later: "Más tarde",
    skip: "Omitir",
    next: "Siguiente",
    start: "Empezar",
    tour: {
      eyebrow: "Visita guiada",
      stepOf: "{current} / {total}",
      secure: "Proteger mi cuenta",
      welcome: {
        title: "Bienvenido, {name}",
        body: "En menos de un minuto, descubre dónde están las herramientas esenciales de MOXT. Puedes omitir en cualquier momento.",
      },
      mobile: {
        bottomNav: {
          title: "Navegación principal",
          body: "Esta barra te acompaña: transferencias, inicio Moxt, marketplace, paquetes y Más.",
        },
        home: {
          title: "Inicio Moxt",
          body: "Tu panel: actividad reciente, accesos directos y una visión clara de la plataforma.",
        },
        transfers: {
          title: "Transferencias",
          body: "Envía y recibe dinero entre África y Rusia con confianza.",
        },
        marketplace: {
          title: "Marketplace",
          body: "Compra, vende y explora anuncios cerca de ti.",
        },
        parcels: {
          title: "Paquetes",
          body: "Encuentra un viajero u ofrece un trayecto para mover un paquete.",
        },
        more: {
          title: "Menú Más",
          body: "Abre aquí el resto de servicios: MOXT, empleos, empresa y más.",
        },
        morePanel: {
          title: "Todos los servicios",
          body: "Este panel reúne lo que no está en la barra inferior. Explora las tarjetas o busca.",
        },
        headerNews: {
          title: "Noticias",
          body: "Acceso rápido a las noticias desde la barra superior.",
        },
        header: {
          title: "Barra superior",
          body: "Notificaciones, mensajes y atajos esenciales — siempre visibles mientras navegas.",
        },
      },
      news: {
        title: "Noticias",
        body: "Sigue las novedades y publicaciones de la comunidad MOXT — África y Rusia.",
      },
      moxt: {
        title: "MOXT",
        body: "Este botón reúne todos los enlaces esenciales del sitio: un solo lugar para llegar rápido a los servicios clave.",
      },
      desktop: {
        sidebar: {
          title: "Rail de navegación",
          body: "Accede a las secciones clave desde este rail flotante. Pasa el cursor para ver la etiqueta.",
        },
        more: {
          title: "Más servicios",
          body: "El menú Más abre el catálogo completo: MOXT, eventos, empleos y otros módulos.",
        },
        morePanel: {
          title: "Catálogo de servicios",
          body: "Encuentra aquí todo lo que no está en el rail — organizado por temas.",
        },
        search: {
          title: "Búsqueda global",
          body: "Encuentra rápido personas, anuncios, paquetes o servicios desde cualquier página.",
        },
        actions: {
          title: "Acciones rápidas",
          body: "Notificaciones, favoritos y tema — tus herramientas diarias, siempre a mano.",
        },
        profile: {
          title: "Tu cuenta",
          body: "Perfil, seguridad y ajustes: gestiona tu identidad y confianza desde aquí.",
        },
      },
      done: {
        title: "Ya estás listo",
        body: "Explora a tu ritmo. Podrás confirmar email e identidad más tarde en Seguridad.",
        bodyEmail:
          "Confirma primero tu email en Seguridad para publicar, luego explora libremente.",
      },
    },
  },
}
