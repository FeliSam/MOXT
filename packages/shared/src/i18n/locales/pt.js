export const pt = {
  auth: {
    login: {
      title: 'Entrar',
      description:
        'Aceda ao seu espaço MOXT com sessão persistente e rotas protegidas.',
      email: 'Endereço de e-mail',
      password: 'Palavra-passe',
      forgot: 'Esqueceu a palavra-passe?',
      submit: 'Entrar',
      submitting: 'A entrar…',
      demoAccounts: 'Contas de demonstração',
      demoUser: 'Utilizador',
      demoAdmin: 'Admin',
      demoSuper: 'Super',
      newToMoxt: 'Novo no MOXT?',
      createAccount: 'Criar conta',
    },
    register: {
      resendSms: 'Reenviar SMS',
      resendEmail: 'Reenviar e-mail',
      resendCooldown: 'Reenviar em {seconds}s',
      codeNotReceivedSms: 'Não recebeu o SMS?',
      codeNotReceivedEmail: 'Não recebeu o código?',
      codeResentTitle: 'Código reenviado',
      codeResentEmail: 'Um novo e-mail foi enviado para {email}.',
      codeResentSms: 'Um novo SMS foi enviado para {phone}.',
    },
  },
  nav: {
    servicesSupplementaires: 'Serviços adicionais',
    qrInvitation: 'QR e convite',
  },
  share: {
    title: 'QR code e convite',
    eyebrow: 'Partilha',
    description: 'Um só lugar para convidar amigos ou partilhar o seu perfil MOXT.',
    tabTypeLabel: 'Tipo de partilha',
    inviteTab: 'Convidar',
    profileTab: 'O meu perfil',
    invitationSubtitle: 'Convite MOXT',
    inviteCountOne: 'pessoa convidada',
    inviteCountMany: 'pessoas convidadas',
    copyLink: 'Copiar ligação',
    copied: 'Copiado',
    share: 'Partilhar',
    publicProfile: 'Meu perfil público',
    qrProfile: 'QR code do perfil',
    qrBusiness: 'QR code da empresa',
    qrToShare: 'QR code para partilhar',
    showProfileQr: 'Mostrar QR code do perfil',
    showBusinessQr: 'Mostrar QR code da empresa',
    hints: {
      invite: 'Digitalize para entrar no MOXT',
      profile: 'Digitalize para ver as minhas publicações',
      business: 'Digitalize para descobrir esta empresa',
    },
    shareTitles: {
      invite: 'Junte-se ao MOXT',
      onMoxt: '{name} no MOXT',
      publications: 'Publicações de {name}',
    },
    shareTexts: {
      invite:
        'Transferências, encomendas e serviços entre África e Rússia. Junte-se a mim no MOXT:',
      profile: 'Veja as publicações de {name} no MOXT.',
      business: 'Descubra {name} no MOXT.',
    },
    steps: {
      step1Title: 'Partilhe o seu QR',
      step1Desc: 'Mostre o código ou envie a ligação.',
      step2Title: 'Eles entram no MOXT',
      step2Desc: 'Registo rápido pelo link ou scan.',
      step3Title: 'Tudo num só lugar',
      step3Desc: 'Transferências, encomendas, marketplace e serviços da diáspora.',
    },
    privateProfileWarning: {
      title: 'Perfil privado',
      description:
        'A sua atividade está oculta: quem digitalizar este QR code não conseguirá ver o seu perfil.',
      settingsLink: 'Alterar a visibilidade nas definições',
    },
    scanTab: 'Digitalizar',
    scanner: {
      eyebrow: 'Leitura inteligente',
      title: 'Digitalizar QR MOXT',
      description:
        'Enquadre um QR de perfil, empresa ou convite. Detetamos automaticamente o destino.',
      starting: 'A ativar a câmara…',
      hint: 'Alinhe o QR no quadro — a deteção é automática.',
      deniedTitle: 'Acesso à câmara recusado',
      deniedDescription:
        'Autorize a câmara no navegador para digitalizar. O acesso só é pedido neste separador.',
      unsupportedTitle: 'Câmara indisponível',
      unsupportedDescription: 'O navegador não consegue aceder à câmara nesta página.',
      errorTitle: 'Não foi possível abrir a câmara',
      errorDescription: 'Verifique se outra app não está a usar a câmara e tente novamente.',
      unknownTitle: 'QR não reconhecido',
      unknownDescription: 'Este código não corresponde a um perfil, empresa ou convite MOXT.',
      scanAgain: 'Digitalizar novamente',
      sessionLoading: 'A verificar sessão…',
      targets: {
        user: 'Perfil de membro',
        business: 'Empresa',
        invite: 'Convite MOXT',
      },
      descriptions: {
        user: 'Perfil MOXT detetado. Abra as publicações.',
        business: 'Empresa MOXT detetada. Veja as publicações.',
        invite: 'Convite MOXT detetado ({id}).',
      },
      actions: {
        user: 'Abrir perfil',
        business: 'Ver empresa',
        invite: 'Entrar pelo convite',
      },
      permission: {
        title: 'Acesso à câmara necessário',
        description:
          'Para digitalizar um QR MOXT, autorize o acesso à câmara. Só é usada neste separador e desliga ao sair.',
        allow: 'Autorizar câmara',
        requesting: 'A pedir autorização…',
        retry: 'Tentar autorização novamente',
        deniedHint:
          'O acesso à câmara foi recusado. Autorize o MOXT nas definições do navegador ou dispositivo e tente de novo.',
      },
    },
  },
  messages: {
    syncing: 'A sincronizar…',
    loadOlder: 'Carregar mensagens anteriores',
    loadingOlder: 'A carregar…',
    typing: 'a escrever',
    typingAria: '{name} está a escrever',
    closeConversation: 'Fechar conversa',
  },
  public: {
    nav: {
      home: 'Início',
      solution: 'A solução',
      discover: 'Descobrir',
      trust: 'Confiança',
      faq: 'FAQ',
      aria: 'Navegação pública',
      homeAria: 'Início MOXT',
      searchAria: 'Pesquisar',
    },
    auth: {
      login: 'Iniciar sessão',
      register: 'Criar uma conta',
    },
    footer: {
      tagline: 'Plataforma de serviços para a diáspora. Troque com cuidado.',
      security: 'Segurança',
      help: 'Ajuda',
      copyright: '© {year} MOXT. Todos os direitos reservados.',
    },
    home: {
      badge: 'Benim · Rússia · Comunidade',
      title: 'As suas trocas, serviços e oportunidades numa plataforma clara.',
      subtitle:
        'O MOXT reúne transferências, encomendas, empresas, marketplace, empregos e eventos com acompanhamento comum.',
      ctaStart: 'Começar',
      ctaDiscover: 'Descobrir a solução',
      ctaExplore: 'Explorar serviços',
      freeNote:
        'Navegação gratuita. As operações financeiras são rastreadas e protegidas no MOXT.',
      estimatorEyebrow: 'Estimativa rápida',
      estimatorTitle: 'Calculadora de transferência',
      direction: 'Direção',
      bjToRu: 'Benim para Rússia',
      ruToBj: 'Rússia para Benim',
      amount: 'Montante',
      receivedLabel: 'Montante estimado recebido',
      feesLabel: 'Taxas indicativas: {fees}',
      createToSend: 'Criar uma conta para enviar',
      servicesTitle: 'Todo o MOXT, sem uma página gigante',
      servicesSubtitle: 'Cada serviço mantém o seu percurso e as suas regras.',
      recentTitle: 'Para descobrir',
      recentSubtitle: 'Conteúdos públicos ativos e verificados.',
      showAll: 'Mostrar tudo',
      signInToView: 'Iniciar sessão para consultar',
      trustTitle: 'A confiança faz parte do percurso',
    },
    presentation: {
      badge: 'Web · Mobile · PWA',
      title: 'MOXT, a solução para ligar a África e a Rússia.',
      subtitle:
        'Uma plataforma única para transferências, transporte de encomendas, marketplace, empresas da diáspora e comunicação — no computador e no telemóvel.',
      ctaStart: 'Começar gratuitamente',
      ctaExplore: 'Explorar serviços',
      bulletSame: 'A mesma experiência no navegador e na aplicação nativa',
      bulletLang: 'Interface em russo por predefinição, alterável com um clique',
      servicesTitle: 'Todos os serviços no mesmo lugar',
      servicesSubtitle:
        'O MOXT reúne os usos quotidianos da diáspora: enviar dinheiro, encontrar um transportador, publicar um anúncio ou contactar um profissional verificado.',
      whyTitle: 'Porquê escolher o MOXT?',
      createAccount: 'Criar a minha conta',
      learnMore: 'Saber mais',
    },
    pillars: {
      transfers: {
        title: 'Transferências rastreadas',
        description: 'Estimativa, parceiros verificados e histórico numa só interface.',
      },
      community: {
        title: 'Comunidade diáspora',
        description:
          'Perfis, empresas, empregos, eventos e mensagens para trocar com confiança.',
      },
      trust: {
        title: 'Confiança integrada',
        description:
          'Verificação de telefone, identidade e empresa antes de operações sensíveis.',
      },
      i18n: {
        title: 'Multilingue',
        description:
          'Russo, francês, inglês e português — mudança instantânea na aplicação.',
      },
    },
    services: {
      transfers: {
        label: 'Transferências',
        description: 'Estime e acompanhe as suas operações entre África e Rússia.',
      },
      parcels: {
        label: 'Encomendas',
        description: 'Encontre capacidade de transporte e reserve quilos.',
      },
      marketplace: {
        label: 'Marketplace',
        description: 'Descubra produtos, serviços, arrendamentos e oportunidades.',
      },
      businesses: {
        label: 'Empresas',
        description: 'Consulte perfis profissionais e os seus serviços.',
      },
      community: {
        label: 'Comunidade',
        description: 'Empregos, eventos e trocas P2P no mesmo espaço.',
      },
      messages: {
        label: 'Comunicação',
        description: 'Contacte a pessoa certa a partir de cada ficha.',
      },
    },
    trust: {
      phone: {
        title: 'Número russo verificado para publicar',
        description:
          'Anúncios, encomendas, empregos e eventos exigem um número +7 confirmado por SMS. Um número por conta.',
      },
      identity: {
        title: 'Identidade MOXT para operações sensíveis',
        description:
          'Criar uma empresa ou usar contas de transferência exige identidade validada e registo válido.',
      },
      messaging: {
        title: 'Trocas no MOXT',
        description:
          'Mensagens, favoritos e contacto permanecem acessíveis sem verificação reforçada.',
      },
      validation: {
        title: 'Nunca antecipar uma validação',
        description:
          'Uma declaração local não substitui a confirmação oficial de um pagamento ou estatuto.',
      },
    },
    trustPage: {
      eyebrow: 'Confiança e segurança',
      title: 'Usar o MOXT com os hábitos certos',
      subtitle:
        'O MOXT aplica três níveis de verificação: número russo para publicar, identidade para operações sensíveis, nível reforçado para limites elevados. As mensagens permanecem abertas a todos os membros ligados.',
      publishTitle: 'Publicação protegida',
      publishBody:
        'Anúncios, encomendas, empregos e eventos exigem um número russo único confirmado por OTP. Contas criadas por e-mail também devem confirmar o telefone antes de publicar.',
      delayTitle: 'Atraso na verificação de identidade',
      delayBefore:
        'Se o seu processo de identidade permanecer pendente mais de 24 h, contacte o administrador via',
      supportLink: 'o suporte',
      delayAfter: '.',
      cards: {
        data: {
          title: 'Dados pessoais',
          description: 'Os seus documentos são tratados para verificação e segurança da conta.',
        },
        business: {
          title: 'Empresas e transferências',
          description:
            'Criação de empresa e contas de transferência reservadas a perfis com identidade verificada.',
        },
        badge: {
          title: 'Distintivo verificado',
          description: 'O distintivo verde indica uma identidade validada pela equipa MOXT.',
        },
        reports: {
          title: 'Denúncias',
          description: 'Denuncie qualquer conteúdo suspeito a partir das fichas em causa.',
        },
      },
    },
  },
  dashboard: {
    hero: {
      welcome: 'Bem-vindo {name}',
      title: 'Todos os seus serviços essenciais, reunidos.',
      subtitle:
        'Transferências, encomendas, vendas, empregos e eventos numa experiência simples e instantânea para as suas trocas entre África e Rússia.',
      createTransfer: 'Criar uma transferência',
      marketplace: 'Marketplace',
    },
  },
  legal: {
    pageEyebrow: 'Informações legais',
    copyright: '© {year} MOXT. Todos os direitos reservados.',
    footer:
      'Plataforma MOXT — diáspora afro-russa. Use os serviços com cautela e verifique os seus contactos.',
    nav: {
      mentions: 'Avisos legais',
      cgu: 'Termos de uso',
      privacy: 'Privacidade',
    },
    sections: {
      mentions: {
        title: 'Avisos legais',
        paragraphs: [
          'MOXT é uma plataforma digital de serviços para a diáspora afro-russa (transferências, encomendas, marketplace, empregos, eventos e comunicação).',
          'Editor do serviço: MOXT. Contacto: support@moxtapp.ru.',
          'Alojamento e tratamento de dados: infraestrutura cloud segura em conformidade com os requisitos aplicáveis de proteção de dados pessoais.',
          'Para questões jurídicas ou reclamações, escreva para support@moxtapp.ru indicando o identificador da sua conta.',
        ],
      },
      cgu: {
        title: 'Termos de uso',
        paragraphs: [
          'Ao criar uma conta MOXT, aceita utilizar a plataforma de forma leal, fornecer informações exatas e respeitar as regras de verificação (telefone, identidade, empresa quando aplicável).',
          'Compromete-se a não publicar conteúdos fraudulentos, enganosos, ilegais ou que violem direitos de terceiros. O MOXT pode suspender ou eliminar uma conta em caso de violação grave ou repetida.',
          'Operações sensíveis (transferências, contas profissionais, publicações em nome de empresa) podem exigir identidade verificada. Uma declaração na aplicação não substitui confirmação oficial de pagamento ou estatuto jurídico.',
          'O MOXT aproxima membros e facilita a comunicação; cada utilizador permanece responsável pelos seus compromissos, pagamentos e trocas com outros membros.',
          'O MOXT pode atualizar estes termos; a versão em vigor está acessível na aplicação. A utilização continuada após atualização constitui aceitação dos novos termos.',
        ],
      },
      privacy: {
        title: 'Política de privacidade',
        paragraphs: [
          'Esta política descreve como o MOXT recolhe e utiliza os seus dados quando usa o site e a aplicação móvel (Android / iOS via Capacitor).',
          'Dados de conta: identidade, e-mail, número de telefone, preferências, histórico de atividade na plataforma, documentos de verificação de identidade ou empresa quando os fornece voluntariamente.',
          'Câmara: utilizada apenas para digitalizar códigos QR MOXT (perfis, empresas, convites) quando abre o separador Digitalizar. A câmara não é ativada em segundo plano nem é usada para geolocalização.',
          'Notificações push (aplicação móvel): se as ativar, é gerado um identificador técnico do dispositivo (token FCM / APNs) para enviar alertas (mensagens, transferências, subscrições, etc.). Pode desativar as notificações push nas definições MOXT ou no telemóvel.',
          'Fotos e ficheiros: na verificação de identidade, publicação de anúncios ou envio de comprovativos, pode selecionar imagens do dispositivo. O MOXT não lê SMS nem acede à posição GPS.',
          'Permissões explicitamente excluídas: o MOXT não solicita localização precisa nem leitura de SMS no Android.',
          'Conservação e eliminação: um e-mail ou número verificado pode servir no máximo duas contas. Pode pedir eliminação da conta nas definições; alguns dados podem ser conservados pelo tempo exigido por lei ou para segurança da plataforma.',
          'Os seus direitos: pode aceder, corrigir ou pedir eliminação dos seus dados contactando support@moxtapp.ru.',
        ],
      },
    },
  },
}
