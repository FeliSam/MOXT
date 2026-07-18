import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const root = path.resolve('packages/shared/src/i18n/locales')
const esPath = path.join(root, 'es.js')
const es = structuredClone((await import(pathToFileURL(esPath).href + '?t=' + Date.now())).es)
const en = (await import(pathToFileURL(path.join(root, 'en.js')).href)).en

Object.assign(es.nav, {
  home: 'Inicio',
  brand: 'Moxt',
  moxt: 'MOXT',
  more: 'Más',
  transfer: 'Transferencia',
  transfers: 'Transferencias',
  marketplace: 'Mercado',
  parcels: 'Envíos',
  jobs: 'Empleos',
  business: 'Empresa',
  businesses: 'Empresas',
  news: 'Actualidad',
  finances: 'Finanzas',
  services: 'Servicios',
  community: 'Comunidad',
  communication: 'Comunicación',
  account: 'Cuenta',
  administration: 'Administración',
  p2p: 'Intercambio P2P',
  exchangers: 'Cambiadores',
  professional: 'Espacio profesional',
  events: 'Eventos',
  notifications: 'Notificaciones',
  subscriptions: 'Suscripciones',
  favorites: 'Favoritos',
  myPublications: 'Mis publicaciones',
  controlCenter: 'Centro de control',
  featureMatrix: 'Cobertura funcional',
  systemPilotage: 'Control del sistema',
  servicesSupplementaires: 'Servicios adicionales',
  qrInvitation: 'QR e invitación',
  mainAria: 'Navegación principal',
  mobileQuickAria: 'Navegación móvil rápida',
  closeNavigation: 'Cerrar navegación',
  languageAria: 'Idioma: {language}',
  moreServicesAria: 'Más servicios',
  moreServicesUnreadAria: 'Más servicios ({count} sin leer)',
  notificationsUnreadAria: 'Notificaciones ({count} sin leer)',
  messagesUnreadAria: 'Mensajes ({count} sin leer)',
  messages: 'Mensajes',
  enableLightTheme: 'Activar tema claro',
  enableDarkTheme: 'Activar tema oscuro',
  profile: 'Perfil',
  settings: 'Ajustes',
  signOut: 'Cerrar sesión',
  closeServices: 'Cerrar servicios',
  accountSession: 'Cuenta y sesión',
  itemUnreadAria: '{label} ({count} sin leer)',
})

Object.assign(es.moxtHub, {
  eyebrow: 'Plataforma',
  description:
    'Todos los servicios esenciales, acciones rápidas y tus espacios personales, en un solo lugar.',
  primaryServices: 'Servicios esenciales',
  primaryServicesDesc: 'Los nueve recorridos principales de MOXT.',
  quickActions: 'Acciones rápidas',
  quickActionsDesc: 'Publica o inicia en un toque.',
  secondary: 'Espacios personales',
  secondaryDesc: 'Tu cuenta, actividad y preferencias.',
  admin: 'Administración',
  adminDesc: 'Centro de control, cobertura funcional y pilotaje del sistema.',
})

if (es.dashboard?.hero) {
  Object.assign(es.dashboard.hero, {
    welcome: 'Te damos la bienvenida, {name}',
    title: 'Todos tus servicios esenciales, juntos.',
    subtitle:
      'Transferencias, envíos, ventas, empleos y eventos en una experiencia simple e instantánea, pensada para tus intercambios entre África y Rusia.',
    createTransfer: 'Crear una transferencia',
    marketplace: 'Mercado',
  })
}

if (es.messages) {
  if (es.messages.empty) {
    es.messages.empty.title = 'Aún no hay conversaciones'
    es.messages.empty.description =
      'Contacta a un vendedor, viajero o profesional desde una ficha MOXT para iniciar una conversación.'
    es.messages.empty.marketplace = 'Mercado'
  }
  es.messages.writePlaceholder = 'Escribe un mensaje…'
  es.messages.writeAria = 'Escribir un mensaje'
  es.messages.searchConversationAria = 'Buscar en la conversación'
  es.messages.noPinned = 'Ninguna conversación fijada.'
  es.messages.noUnread = 'Ninguna conversación sin leer.'
  es.messages.noMatch = 'Ninguna conversación encontrada.'
  es.messages.requireContent = 'Añade un mensaje o un archivo adjunto.'
}

if (es.marketplace?.common) es.marketplace.common.name = 'Mercado'

es.legal.sections.mentions.paragraphs = [
  'MOXT es una plataforma digital de servicios para la diáspora afro-rusa (transferencias, envíos, mercado, empleos, eventos y mensajería).',
  'Editor del servicio: MOXT. Contacto: support@moxtapp.ru.',
  'Alojamiento y tratamiento de datos: infraestructura cloud segura conforme a los requisitos aplicables de protección de datos personales.',
  'Para cualquier pregunta legal o reclamación, escribe a support@moxtapp.ru indicando el identificador de tu cuenta.',
]
es.legal.sections.cgu.paragraphs = [
  'Al crear una cuenta MOXT, aceptas usar la plataforma de forma leal, proporcionar información exacta y respetar las reglas de verificación (teléfono, identidad, empresa cuando corresponda).',
  'Te comprometes a no publicar contenido fraudulento, engañoso, ilícito o que vulnere derechos de terceros. MOXT puede suspender o eliminar una cuenta en caso de infracciones graves o reiteradas.',
  'Las operaciones sensibles (transferencias, cuentas profesionales, publicaciones de empresa) pueden exigir identidad verificada. Una declaración en la app no sustituye una confirmación oficial de pago o de estatus legal.',
  'MOXT conecta a los miembros y facilita la comunicación; cada usuario sigue siendo responsable de sus compromisos, pagos e intercambios con otros miembros.',
  'MOXT puede actualizar estos términos; la versión vigente está disponible en la app. El uso continuado tras una actualización implica la aceptación de los nuevos términos.',
]
es.legal.sections.privacy.paragraphs = [
  'Esta política de privacidad describe cómo MOXT («nosotros») recopila, usa, almacena y protege tus datos personales cuando usas el sitio https://moxtapp.ru y la app móvil MOXT (Android / iOS vía Capacitor), destinada en particular a la diáspora afro-rusa (transferencias, envíos, mercado, empleos, empresas y mensajería).',
  'Responsable del tratamiento: MOXT. Privacidad y solicitudes de usuarios: support@moxtapp.ru. Incluye el correo o identificador de tu cuenta para que podamos responder en un plazo razonable.',
  'Finalidades: crear y administrar tu cuenta; habilitar las funciones de la plataforma (perfiles, anuncios, mensajería, transferencias, envíos, verificación de identidad o de empresa); garantizar la seguridad, la prevención del fraude y el cumplimiento de nuestras reglas; enviar avisos técnicos o, si das tu consentimiento, alertas push; cumplir obligaciones legales.',
  'Datos de cuenta: identidad (nombre cuando corresponda), correo, número de teléfono, foto de perfil, preferencias de idioma y privacidad, historial de actividad en la plataforma, documentos de verificación de identidad o de empresa cuando los proporciones voluntariamente.',
  'Datos técnicos: identificadores de sesión, registros de acceso, tipo de dispositivo / navegador, tokens de notificaciones push (FCM / APNs) si los activas, y metadatos necesarios para operar y asegurar el servicio.',
  'Infraestructura y encargados: los datos de cuenta y el contenido de la app se procesan mediante nuestro backend Supabase (autenticación, base de datos, almacenamiento de archivos). Proveedores técnicos (hosting cloud, entrega de correo / SMS, push Firebase / Apple) actúan solo para operar el servicio. No vendemos tus datos personales.',
  'Cámara: se usa solo para escanear códigos QR MOXT (perfiles, empresas, invitaciones) cuando abres la pestaña Escáner. La cámara no se activa en segundo plano y no se usa para geolocalización.',
  'Notificaciones push (app móvil): si las activas, se genera un identificador técnico del dispositivo (token FCM / APNs) para enviarte alertas (mensajes, transferencias, suscripciones, etc.). Puedes desactivar las notificaciones push en la configuración de MOXT o en la del teléfono.',
  'Fotos y archivos: al verificar la identidad, publicar anuncios o subir comprobantes, puedes seleccionar imágenes de tu dispositivo. Estos archivos se almacenan de forma segura para las finalidades correspondientes.',
  'Mensajería y contenido publicado: los mensajes y publicaciones que intercambias o muestras en MOXT se procesan para prestar el servicio y hacer cumplir nuestros términos de uso.',
  'Permisos explícitamente excluidos: MOXT no solicita acceso a ubicación precisa ni lectura de SMS en Android. No leemos tus SMS ni accedemos a tu ubicación GPS.',
  'Bases legales y compartición: el tratamiento se basa en la ejecución del contrato (prestación del servicio), tu consentimiento cuando sea necesario (p. ej. push) y nuestros intereses legítimos de seguridad y mejora del servicio, conforme a la ley aplicable. Los datos pueden comunicarse a las autoridades competentes si la ley lo exige.',
  'Conservación y eliminación: un correo o teléfono verificado puede usarse como máximo en dos cuentas. Puedes solicitar la eliminación de la cuenta desde la configuración; algunos datos pueden conservarse el tiempo exigido por ley, por seguridad de la plataforma o para resolver disputas.',
  'Tus derechos: según la ley aplicable, puedes solicitar acceso a tus datos, rectificación, eliminación, limitación del tratamiento u oponerte a ciertos tratamientos. Contacta a support@moxtapp.ru. También puedes solicitar la eliminación de la cuenta desde la app.',
  'Menores: el servicio está destinado a usuarios mayores de edad o con capacidad conforme a la ley aplicable. Si crees que un menor proporcionó datos sin autorización, contáctanos para eliminarlos.',
  'Actualizaciones: podemos actualizar esta política; la versión vigente siempre está disponible en https://moxtapp.ru/legal/privacy. El uso continuado tras una actualización implica que has sido informado de la nueva versión.',
  'Contacto: para cualquier pregunta sobre esta política o tus datos personales — support@moxtapp.ru.',
]

function walkFix(o) {
  if (typeof o === 'string') {
    return o
      .replace(/\bNotícias\b/g, 'Actualidad')
      .replace(/\bFinanças\b/g, 'Finanzas')
      .replace(/\bServiços\b/g, 'Servicios')
      .replace(/\bserviços\b/g, 'servicios')
      .replace(/\bConta\b/g, 'Cuenta')
      .replace(/\bconta\b/g, 'cuenta')
      .replace(/\bMinhas\b/g, 'Mis')
      .replace(/\bAtivar\b/g, 'Activar')
      .replace(/\bativar\b/g, 'activar')
      .replace(/\bescuro\b/g, 'oscuro')
      .replace(/\bsessão\b/g, 'sesión')
      .replace(/\bSessão\b/g, 'Sesión')
      .replace(/\bmóvel\b/g, 'móvil')
      .replace(/\blidos\b/g, 'leídos')
      .replace(/\blidas\b/g, 'leídas')
      .replace(/\bEscrever\b/g, 'Escribir')
      .replace(/\bescrever\b/g, 'escribir')
      .replace(/\bdinheiro\b/g, 'dinero')
      .replace(/\bconversacións\b/g, 'conversaciones')
      .replace(/\bPesquisa\b/g, 'Búsqueda')
      .replace(/\bpesquisa\b/g, 'búsqueda')
      .replace(/\bessenciais\b/g, 'esenciales')
      .replace(/\bTodos os tus\b/g, 'Todos tus')
      .replace(/\bcontrolo\b/g, 'control')
      .replace(/\bpilotagem\b/g, 'pilotaje')
      .replace(/\bTerminar sessão\b/g, 'Cerrar sesión')
      .replace(/\bCâmbios\b/g, 'Cambiadores')
      .replace(/\bTroca P2P\b/g, 'Intercambio P2P')
  }
  if (Array.isArray(o)) return o.map(walkFix)
  if (o && typeof o === 'object') {
    for (const k of Object.keys(o)) o[k] = walkFix(o[k])
  }
  return o
}
walkFix(es)

function serialize(value, indent = 0) {
  const pad = '  '.repeat(indent)
  const pad2 = '  '.repeat(indent + 1)
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value)
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    return `[\n${value.map((v) => pad2 + serialize(v, indent + 1)).join(',\n')}\n${pad}]`
  }
  const keys = Object.keys(value)
  if (!keys.length) return '{}'
  return `{\n${keys
    .map((k) => {
      const key = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)
      return `${pad2}${key}: ${serialize(value[k], indent + 1)}`
    })
    .join(',\n')}\n${pad}}`
}

const tmp = esPath + '.tmp'
fs.writeFileSync(tmp, `/** Spanish locale */\nexport const es = ${serialize(es)}\n`)
fs.renameSync(tmp, esPath)

const es2 = (await import(pathToFileURL(esPath).href + '?t=' + Date.now())).es
function walk(o, p = '', a = []) {
  if (o == null || typeof o !== 'object') {
    if (typeof o === 'string') a.push([p, o])
    return a
  }
  if (Array.isArray(o)) {
    o.forEach((v, i) => walk(v, `${p}[${i}]`, a))
    return a
  }
  for (const k of Object.keys(o)) walk(o[k], p ? `${p}.${k}` : k, a)
  return a
}
function get(o, p) {
  const parts = []
  p.replace(/([^.\[\]]+)|\[(\d+)\]/g, (_, k, i) => parts.push(i !== undefined ? Number(i) : k))
  return parts.reduce((a, k) => a?.[k], o)
}
let id = 0
let tot = 0
for (const [p, v] of walk(en)) {
  if (typeof v !== 'string') continue
  tot++
  if (get(es2, p) === v) id++
}
const ptLeft = walk(es2).filter(([, v]) =>
  /\b(você|não|também|ficará|equipa|Nenhum|Descreva|Preencha|Olá|Selecione|Escolha|utilizador|palavra-passe|dinheiro|sessão|serviços|Notícias|Finanças)\b/i.test(
    v,
  ),
)
console.log(
  JSON.stringify(
    {
      identical: id,
      total: tot,
      pct: +(((tot - id) / tot) * 100).toFixed(1),
      ptLeft: ptLeft.length,
      navHome: es2.nav.home,
      navSignOut: es2.nav.signOut,
      hub: es2.moxtHub.primaryServices,
      dash: es2.dashboard.hero.title,
      msg: es2.messages.writePlaceholder,
      market: es2.marketplace.common.name,
      cgu: es2.legal.sections.cgu.paragraphs[0].slice(0, 55),
      arraysOk: Array.isArray(es2.legal.sections.privacy.paragraphs),
    },
    null,
    2,
  ),
)
