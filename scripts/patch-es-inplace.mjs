import fs from 'fs'
import path from 'path'

const esPath = path.resolve('packages/shared/src/i18n/locales/es.js')
let src = fs.readFileSync(esPath, 'utf8')

/** Replace a JSON string literal value exactly once (or all). */
function replaceLiteral(from, to, { all = false } = {}) {
  const needle = JSON.stringify(from)
  const repl = JSON.stringify(to)
  if (!src.includes(needle)) return 0
  if (all) {
    const parts = src.split(needle)
    const n = parts.length - 1
    src = parts.join(repl)
    return n
  }
  src = src.replace(needle, repl)
  return 1
}

const pairs = [
  [
    'Uma captura ajuda a equipa a tratar más depressa.',
    'Una captura ayuda al equipo a resolver más rápido.',
  ],
  ['Ajuda e cuentacto con a equipa MOXT', 'Ayuda y contacto con el equipo MOXT'],
  [
    'O seu pedido foi enviado. A nossa equipa trata-o em 24–48 h.',
    'Tu solicitud fue enviada. Nuestro equipo la procesará en 24–48 h.',
  ],
  ['A nossa equipa vai analisar este evento.', 'Nuestro equipo analizará este evento.'],
  ['A nossa equipa vai analisar esta oferta.', 'Nuestro equipo analizará esta oferta.'],
  ['Material e equipamento', 'Material y equipo'],
  ['A nossa equipa irá analisar este anuncio.', 'Nuestro equipo analizará este anuncio.'],
  [
    'Visible apenas pela equipa MOXT para verificación, nunca publicado publicamente. Máx. 5 MB.',
    'Visible solo para el equipo MOXT para verificación, nunca se publica. Máx. 5 MB.',
  ],
  [
    'A sua viaje ficará visible imediatamente na sección Envíos. Os remetentes poderao cuentactá-lo diretamente.',
    'Tu viaje será visible de inmediato en la sección Envíos. Los remitentes podrán contactarte directamente.',
  ],
  [
    'Cuenta no verificada: a viaje ficará visible após validacción MOXT.',
    'Cuenta no verificada: el viaje será visible tras la validación MOXT.',
  ],
  [
    'Misiones, responsabilidades, contexto da equipa...',
    'Misiones, responsabilidades, contexto del equipo…',
  ],
  [
    'A sua oferta ficará visible imediatamente na sección Empleos. Poderá editá-la no seu espacio profesional.',
    'Tu oferta será visible de inmediato en la sección Empleos. Podrás editarla en tu espacio profesional.',
  ],
  [
    'Cuenta no verificada: a oferta ficará visible após validacción MOXT.',
    'Cuenta no verificada: la oferta será visible tras la validación MOXT.',
  ],
  [
    'O seu evento será publicado imediatamente e ficará visible na sección Eventos do MOXT.',
    'Tu evento se publicará de inmediato y será visible en la sección Eventos de MOXT.',
  ],
  [
    'Cuenta no verificada: o evento ficará visible após validacción MOXT.',
    'Cuenta no verificada: el evento será visible tras la validación MOXT.',
  ],
  [
    'Histórico de manutención, equipamentos, pontos fortes, motivo da venda…',
    'Historial de mantenimiento, equipamiento, puntos fuertes, motivo de la venta…',
  ],
  [
    'Cuenta no verificada: o anuncio ficará visible após validacción da MOXT.',
    'Cuenta no verificada: el anuncio será visible tras la validación de MOXT.',
  ],
  [
    'Nenhum perfil favorito para este país. Preencha manualmente.',
    'Ningún perfil favorito para este país. Complétalo manualmente.',
  ],
  [
    'A nossa equipa analisa cada reclamacción e cuentacta-o em 48h a través da mensajes MOXT.',
    'Nuestro equipo analiza cada reclamación y te contacta en 48 h a través de la mensajería MOXT.',
  ],
  [
    'Pedidos, reclamacciones e aconpanhamento con a equipa de suporte.',
    'Solicitudes, reclamaciones y seguimiento con el equipo de soporte.',
  ],
  [
    'Descreva a sua situacción con precisao para a equipa responder rapidamente.',
    'Describe tu situación con precisión para que el equipo responda rápidamente.',
  ],
  [
    'Descreva o problema e anexe uma captura de ecra para ajudar a equipa.',
    'Describe el problema y adjunta una captura de pantalla para ayudar al equipo.',
  ],
  [
    'Cuenta no verificada: o post ficará visible após validacción MOXT.',
    'Cuenta no verificada: la publicación será visible tras la validación MOXT.',
  ],
  [
    'Perfil conpleto = os campos estao preenchidos (nome, cuentacto, ciudad, país…). Perfil verificado = a equipa MOXT validou a sua identidad via documentos (KYC): distintivo verde, limites más elevados e operaciones sensibles. Um perfil pode estar conpleto sin estar verificado.',
    'Perfil completo = los campos están rellenados (nombre, contacto, ciudad, país…). Perfil verificado = el equipo MOXT validó tu identidad con documentos (KYC): insignia verde, límites más altos y operaciones sensibles. Un perfil puede estar completo sin estar verificado.',
  ],
  [
    'Cuentacte o administrador a través do suporte MOXT con o identificador da sua cuenta. A equipa poderá acelerar o tratamento.',
    'Contacta al administrador a través del soporte MOXT con el identificador de tu cuenta. El equipo podrá acelerar el tratamiento.',
  ],
  [
    'Con o dossier conpleto, a equipa MOXT verifica a empresa.',
    'Con el expediente completo, el equipo MOXT verifica la empresa.',
  ],
  [
    'Aún sin empresas verificadas. Os perfis aparecem aquí após validacción da equipa MOXT, mesmo que o membro partilhe o seu país de origem.',
    'Aún no hay empresas verificadas. Los perfiles aparecen aquí tras la validación del equipo MOXT, aunque el miembro comparta su país de origen.',
  ],
  [
    'A ficha ficará visible após validacción',
    'La ficha será visible tras la validación',
  ],
  [
    'está registada no MOXT. A equipa validará a ficha antes da publicación no diretório — já pode preparar o espacio pro.',
    'está registrada en MOXT. El equipo validará la ficha antes de la publicación en el directorio — ya puedes preparar el espacio pro.',
  ],
  [
    'Pedidos, equipa, documentos, publicaciones e desinpenho num espacio adaptado à atividad.',
    'Pedidos, equipo, documentos, publicaciones y rendimiento en un espacio adaptado a la actividad.',
  ],
  [
    'A eliminacción remove definitivamente a empresa do seu espacio. A equipa MOXT aún a pode consultar. Depois pode crear uma nova.',
    'La eliminación quita definitivamente la empresa de tu espacio. El equipo MOXT aún puede consultarla. Después puedes crear una nueva.',
  ],
  ['Que tipos de artigos sao aceites?', '¿Qué tipos de artículos se aceptan?'],
  ['Nenhuma empresa validada', 'Ninguna empresa validada'],
  ['Nenhuma publicación da empresa', 'Ninguna publicación de la empresa'],
  ['Nenhum', 'Ninguno'],
  ['Capaciudad', 'Capacidad'],
  ['Viajantes, transportadores e servicios de logística.', 'Viajeros, transportistas y servicios de logística.'],
  [
    'Mostre os trajetos, as capaciudades e as condiciones de depósito.',
    'Muestra los trayectos, las capacidades y las condiciones de depósito.',
  ],
  ['Descreva a especialidad principal.', 'Describe la especialidad principal.'],
  [
    'Apresente os eventos, a conunidad e os próximos encuentros.',
    'Presenta los eventos, la comunidad y los próximos encuentros.',
  ],
  ['Descreva o tipo de eventos organizados.', 'Describe el tipo de eventos organizados.'],
  [
    '{count} avaliacción(ones) publicada(s) pela conunidad.',
    '{count} valoración(es) publicada(s) por la comunidad.',
  ],
  [
    'Descreva a empresa, especialidad e zona. Clique no raio para gerar texto a partir dos dados.',
    'Describe la empresa, especialidad y zona. Pulsa el rayo para generar texto a partir de los datos.',
  ],
  [
    'Propomos... A nossa especialidad é... Intervenimos em...',
    'Ofrecemos… Nuestra especialidad es… Intervenimos en…',
  ],
  // Labels
  ['Marketplace', 'Mercado'],
  ['"Online"', '"En línea"'],
  ['"Off"', '"Desactivado"'],
  ['"Jobs"', '"Empleos"'],
  ['"Post"', '"Publicación"'],
]

let total = 0
const report = []
for (const [from, to] of pairs) {
  const all = from === 'Marketplace' || from.startsWith('"')
  // For Marketplace as bare word inside JSON strings — replace the JSON-encoded form
  if (from === 'Marketplace') {
    const n = replaceLiteral('Marketplace', 'Mercado', { all: true })
    // also brand line
    const n2 = replaceLiteral('MOXT Mercado', 'MOXT Mercado') // no-op if already
    total += n
    report.push(['Marketplace→Mercado', n])
    continue
  }
  if (from === '"Online"') {
    const n = replaceLiteral('Online', 'En línea', { all: true })
    total += n
    report.push(['Online', n])
    continue
  }
  if (from === '"Off"') {
    const n = replaceLiteral('Off', 'Desactivado', { all: true })
    total += n
    report.push(['Off', n])
    continue
  }
  if (from === '"Jobs"') {
    const n = replaceLiteral('Jobs', 'Empleos', { all: true })
    total += n
    report.push(['Jobs', n])
    continue
  }
  if (from === '"Post"') {
    // only exact Post labels
    const n = replaceLiteral('Post', 'Publicación', { all: true })
    total += n
    report.push(['Post', n])
    continue
  }
  const n = replaceLiteral(from, to, { all: true })
  total += n
  if (n === 0) report.push(['MISS', from.slice(0, 60)])
  else report.push(['ok', n, from.slice(0, 40)])
}

// Long assistant blocks — replace if present
const longPairs = [
  [
    `O servicio de envíos MOXT liga remetentes a viajantes con capaciudad nas bagagens, em trajetos entre a Rússia e os países africanos.

**Para enviar uma envío:**
- Consulte os trajetos em **Envíos**
- Escolha um viajante pela data, peso disponible e tarifa
- Envie um pedido de reserva con os detalhes do seu envío

**Para propor um trajeto:**
- Publique o seu trajeto con o peso disponible, o preço por quilo e os tipos de artigos aceites
- Aceite os pedidos recebidos e coordene a entrega con o remetente.`,
    `El servicio de envíos MOXT conecta remitentes con viajeros que tienen capacidad en su equipaje, en trayectos entre Rusia y los países africanos.

**Para enviar un paquete:**
- Consulta los trayectos en **Envíos**
- Elige un viajero según la fecha, el peso disponible y la tarifa
- Envía una solicitud de reserva con los detalles de tu envío

**Para ofrecer un trayecto:**
- Publica tu viaje con el peso disponible, el precio por kilo y los tipos de artículos aceptados
- Acepta las solicitudes recibidas y coordina la entrega con el remitente.`,
  ],
]

for (const [from, to] of longPairs) {
  const n = replaceLiteral(from, to)
  report.push([n ? 'long-ok' : 'long-miss', from.slice(0, 40)])
  total += n
}

// Legal: replace English array paragraphs with Spanish arrays (exact EN from HEAD)
const legalReplacements = [
  {
    from: `paragraphs: [
          "MOXT is a digital services platform for the Afro-Russian diaspora (transfers, parcels, marketplace, jobs, events and messaging).",
          "Service publisher: MOXT. Contact: support@moxtapp.ru.",
          "Hosting and data processing: secure cloud infrastructure compliant with applicable personal data protection requirements.",
          "For any legal question or complaint, write to support@moxtapp.ru including your account identifier.",
        ]`,
    to: `paragraphs: [
          "MOXT es una plataforma digital de servicios para la diáspora afro-rusa (transferencias, envíos, mercado, empleos, eventos y mensajería).",
          "Editor del servicio: MOXT. Contacto: support@moxtapp.ru.",
          "Alojamiento y tratamiento de datos: infraestructura cloud segura conforme a los requisitos aplicables de protección de datos personales.",
          "Para cualquier pregunta legal o reclamación, escribe a support@moxtapp.ru indicando el identificador de tu cuenta.",
        ]`,
  },
  {
    from: `paragraphs: [
          "By creating a MOXT account, you agree to use the platform fairly, provide accurate information and comply with verification rules (phone, identity, business where applicable).",
          "You agree not to publish fraudulent, misleading, unlawful content or content that infringes third-party rights. MOXT may suspend or delete an account in case of serious or repeated violations.",
          "Sensitive operations (transfers, professional accounts, business publications) may require verified identity. An in-app declaration does not replace official payment or legal status confirmation.",
          "MOXT connects members and facilitates communication; each user remains responsible for their commitments, payments and exchanges with other members.",
          "MOXT may update these terms; the current version is available in the app. Continued use after an update constitutes acceptance of the new terms.",
        ]`,
    to: `paragraphs: [
          "Al crear una cuenta MOXT, aceptas usar la plataforma de forma leal, proporcionar información exacta y respetar las reglas de verificación (teléfono, identidad, empresa cuando corresponda).",
          "Te comprometes a no publicar contenido fraudulento, engañoso, ilícito o que vulnere derechos de terceros. MOXT puede suspender o eliminar una cuenta en caso de infracciones graves o reiteradas.",
          "Las operaciones sensibles (transferencias, cuentas profesionales, publicaciones de empresa) pueden exigir identidad verificada. Una declaración en la app no sustituye una confirmación oficial de pago o de estatus legal.",
          "MOXT conecta a los miembros y facilita la comunicación; cada usuario sigue siendo responsable de sus compromisos, pagos e intercambios con otros miembros.",
          "MOXT puede actualizar estos términos; la versión vigente está disponible en la app. El uso continuado tras una actualización implica la aceptación de los nuevos términos.",
        ]`,
  },
]

for (const { from, to } of legalReplacements) {
  if (src.includes(from)) {
    src = src.replace(from, to)
    total++
    report.push(['legal-block', 'ok'])
  } else {
    report.push(['legal-block', 'MISS'])
  }
}

// Privacy: translate from EN block — read length carefully from file if MISS
const privacyEnStart = 'This privacy policy describes how MOXT'
const privacyIdx = src.indexOf(privacyEnStart)
if (privacyIdx !== -1) {
  // Find the paragraphs array containing this
  const arrStart = src.lastIndexOf('paragraphs: [', privacyIdx)
  const arrEnd = src.indexOf('],', privacyIdx) + 1
  if (arrStart !== -1 && arrEnd > arrStart) {
    const privacyEs = `paragraphs: [
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
          "Contacto: para cualquier pregunta sobre esta política o tus datos personales — support@moxtapp.ru.",
        ]`
    src = src.slice(0, arrStart) + privacyEs + src.slice(arrEnd)
    total++
    report.push(['privacy', 'ok'])
  } else {
    report.push(['privacy', 'MISS bounds'])
  }
} else {
  report.push(['privacy', 'already translated or missing'])
}

fs.writeFileSync(esPath, src)

// Verify
const { pathToFileURL } = await import('url')
const es = (await import(pathToFileURL(esPath).href + '?t=' + Date.now())).es
console.log(
  JSON.stringify(
    {
      total,
      misses: report.filter((r) => String(r[0]).includes('MISS') || r[1] === 'MISS' || r[0] === 'MISS').length,
      cguArray: Array.isArray(es.legal?.sections?.cgu?.paragraphs),
      privacyArray: Array.isArray(es.legal?.sections?.privacy?.paragraphs),
      navMarketplace: es.nav?.marketplace,
      legalCgu0: es.legal?.sections?.cgu?.paragraphs?.[0]?.slice?.(0, 50),
      report: report.filter((r) => r[0] === 'MISS' || r[1] === 'MISS' || r[0] === 'long-miss').slice(0, 30),
    },
    null,
    2,
  ),
)
