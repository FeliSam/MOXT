import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const root = path.resolve('packages/shared/src/i18n/locales')
const esPath = path.join(root, 'es.js')
const es = structuredClone(
  (await import(pathToFileURL(esPath).href + '?t=' + Date.now())).es,
)

function get(obj, pathStr) {
  return pathStr.split('.').reduce((a, k) => (a == null ? a : a[k]), obj)
}
function set(obj, pathStr, value) {
  const parts = pathStr.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    if (cur[key] == null || typeof cur[key] !== 'object') return false
    cur = cur[key]
  }
  cur[parts[parts.length - 1]] = value
  return true
}

const fixes = {
  'report.screenshotHint': 'Una captura ayuda al equipo a resolver más rápido.',
  'profile.links.supportDesc': 'Ayuda y contacto con el equipo MOXT',
  'verification.toast.sentMessage':
    'Tu solicitud fue enviada. Nuestro equipo la procesará en 24–48 h.',
  'events.detail.reportToastMessage': 'Nuestro equipo analizará este evento.',
  'jobs.detail.reportToastMessage': 'Nuestro equipo analizará esta oferta.',
  'marketplace.categories.rental.equipment': 'Material y equipo',
  'marketplace.detail.reportToastBody': 'Nuestro equipo analizará este anuncio.',
  'publish.parcel.fields.travelProofHint':
    'Visible solo para el equipo MOXT para verificación, nunca se publica. Máx. 5 MB.',
  'publish.parcel.review.successHint':
    'Tu viaje será visible de inmediato en la sección Envíos. Los remitentes podrán contactarte directamente.',
  'publish.parcel.toasts.pendingMessage':
    'Cuenta no verificada: el viaje será visible tras la validación MOXT.',
  'publish.job.fields.descriptionPlaceholder':
    'Misiones, responsabilidades, contexto del equipo…',
  'publish.job.review.successHint':
    'Tu oferta será visible de inmediato en la sección Empleos. Podrás editarla en tu espacio profesional.',
  'publish.job.toasts.pendingMessage':
    'Cuenta no verificada: la oferta será visible tras la validación MOXT.',
  'publish.event.review.successHint':
    'Tu evento se publicará de inmediato y será visible en la sección Eventos de MOXT.',
  'publish.event.toasts.pendingMessage':
    'Cuenta no verificada: el evento será visible tras la validación MOXT.',
  'publish.listing.descriptionPlaceholder.vehicle':
    'Historial de mantenimiento, equipamiento, puntos fuertes, motivo de la venta…',
  'publish.listing.pendingBody':
    'Cuenta no verificada: el anuncio será visible tras la validación de MOXT.',
  'transfers.new.noFavoriteProfiles':
    'Ningún perfil favorito para este país. Complétalo manualmente.',
  'transfers.detail.claim.help':
    'Nuestro equipo analiza cada reclamación y te contacta en 48 h a través de la mensajería MOXT.',
  'support.description': 'Solicitudes, reclamaciones y seguimiento con el equipo de soporte.',
  'support.newRequestDesc':
    'Describe tu situación con precisión para que el equipo responda rápidamente.',
  'support.bugModalDesc':
    'Describe el problema y adjunta una captura de pantalla para ayudar al equipo.',
  'news.composer.pendingMessage':
    'Cuenta no verificada: la publicación será visible tras la validación MOXT.',
  'faq.profile.answer':
    'Perfil completo = los campos están rellenados (nombre, contacto, ciudad, país…). Perfil verificado = el equipo MOXT validó tu identidad con documentos (KYC): insignia verde, límites más altos y operaciones sensibles. Un perfil puede estar completo sin estar verificado.',
  'faq.pending.answer':
    'Contacta al administrador a través del soporte MOXT con el identificador de tu cuenta. El equipo podrá acelerar el tratamiento.',
  'businesses.completion.verified.hint':
    'Con el expediente completo, el equipo MOXT verifica la empresa.',
  'businesses.page.emptyDescription':
    'Aún no hay empresas verificadas. Los perfiles aparecen aquí tras la validación del equipo MOXT, aunque el miembro comparta su país de origen.',
  'businesses.setup.preview.visibleAfterValidation':
    'La ficha será visible tras la validación',
  'businesses.setup.success.body':
    'está registrada en MOXT. El equipo validará la ficha antes de la publicación en el directorio — ya puedes preparar el espacio pro.',
  'professional.page.description':
    'Pedidos, equipo, documentos, publicaciones y rendimiento en un espacio adaptado a la actividad.',
  'professional.actions.dangerBody':
    'La eliminación quita definitivamente la empresa de tu espacio. El equipo MOXT aún puede consultarla. Después puedes crear una nueva.',
  'assistant.responses.colis.suggestions.2': '¿Qué tipos de artículos se aceptan?',
  'assistant.responses.colis.texts.0':
    'El servicio de envíos MOXT conecta remitentes con viajeros que tienen capacidad en su equipaje, en trayectos entre Rusia y los países africanos.\n\n**Para enviar un paquete:**\n- Consulta los trayectos en **Envíos**\n- Elige un viajero según la fecha, el peso disponible y la tarifa\n- Envía una solicitud de reserva con los detalles de tu envío\n\n**Para ofrecer un trayecto:**\n- Publica tu viaje con el peso disponible, el precio por kilo y los tipos de artículos aceptados\n- Acepta las solicitudes recibidas y coordina la entrega con el remitente.',
  'assistant.responses.colis.texts.1':
    'La sección **Envíos** te permite transportar o enviar artículos entre Rusia y África a través de viajeros particulares.\n\nCada trayecto publicado indica la fecha de salida, la capacidad restante, la tarifa por kilo y las posibles restricciones. La puesta en contacto se hace directamente en la plataforma, sin intermediarios.',
  'assistant.responses.marketplace.texts.0':
    'El mercado MOXT permite comprar y vender artículos en la comunidad afro-rusa.\n\n**Para publicar un anuncio:**\n- Ve a **Mercado** y luego **Publicar un anuncio**\n- Completa el título, la descripción, el precio y las fotos\n- Indica si ofreces entrega o solo recogida\n\nLos anuncios permanecen activos hasta que los cierres o hasta que el artículo se venda.',
  'assistant.responses.marketplace.texts.1':
    'En **Mercado**, navega por los anuncios, filtra por categoría o ubicación y contacta al vendedor directamente con la mensajería integrada.\n\nPara poner un artículo a la venta, usa **Publicar un anuncio**. El formulario te guía: tipo de producto, estado, precio y opciones de entrega.',
  'assistant.responses.evenement.texts.0':
    'La página **Eventos** reúne encuentros, conferencias, fiestas y talleres de la comunidad afro-rusa.\n\nPara inscribirte, abre la ficha y toca **Inscribirse**. Recibirás una confirmación y un recordatorio antes de la fecha.\n\nPara organizar un evento, usa **Publicar un evento** y completa el lugar, la fecha, la portada y la descripción.',
  'assistant.responses.litige.texts.0':
    'Si hay un problema con una transferencia, un envío o una transacción, abre una disputa en **Mis disputas**.\n\nPara ello:\n- Selecciona la operación afectada\n- Describe el problema con precisión\n- Adjunta las pruebas disponibles (capturas, recibos, fotos)\n\nNuestro equipo interviene en un plazo de 24 a 72 horas. Todas las partes son informadas del avance.',
  'assistant.responses.fallback.texts.0':
    '¡Hola! Soy Moxi, tu asistente MOXT. Puedo ayudarte con:\n\n- **Transferencias** — enviar dinero entre Rusia y África\n- **Envíos** — enviar artículos a través de viajeros\n- **Mercado** — comprar y vender en la comunidad\n- **Empleos y eventos** — postularte u organizar encuentros\n- **Empresas** — encontrar un cambiador o registrar tu actividad\n- **Verificación** — desbloquear límites de transferencia más altos\n- **Disputas y soporte** — obtener ayuda si hay un problema\n\n¿Cuál es tu pregunta?',
  'messages.empty.marketplace': 'Mercado',
  'nav.marketplace': 'Mercado',
  'public.services.marketplace.label': 'Mercado',
  'dashboard.hero.marketplace': 'Mercado',
  'dashboard.config.services.marketplace.title': 'Mercado',
  'dashboard.config.services.jobs.title': 'Empleos',
  'dashboard.discovery.online': 'En línea',
  'dashboard.postTypes.job': 'Empleo',
  'dashboard.postTypes.news': 'Publicación',
  'settings.notifications.cat.marketplace': 'Mercado',
  'settings.notifications.priority.off': 'Desactivado',
  'marketplace.common.name': 'Mercado',
}

// businesses.page.pendingAlertBody may be long — fix if still PT
const pending = get(es, 'businesses.page.pendingAlertBody')
if (typeof pending === 'string' && /equipa|ficará|membros|conunidad|diretório/i.test(pending)) {
  fixes['businesses.page.pendingAlertBody'] =
    'aún no aparece en el directorio para los demás miembros. Con el estado «Verificado», será visible para toda la comunidad MOXT. Puedes consultarla y editarla desde tu'
}

let applied = 0
for (const [p, v] of Object.entries(fixes)) {
  if (get(es, p) != null) {
    set(es, p, v)
    applied++
  }
}

// Label sweep
function walkSet(obj, fn, prefix = '') {
  if (obj == null || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        const n = fn(obj[i], `${prefix}[${i}]`)
        if (n !== obj[i]) obj[i] = n
      } else walkSet(obj[i], fn, `${prefix}[${i}]`)
    }
    return
  }
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (typeof obj[k] === 'string') {
      const n = fn(obj[k], p)
      if (n !== obj[k]) obj[k] = n
    } else walkSet(obj[k], fn, p)
  }
}

let swept = 0
walkSet(es, (v) => {
  if (v === 'Marketplace') {
    swept++
    return 'Mercado'
  }
  if (v === 'Online') {
    swept++
    return 'En línea'
  }
  if (v === 'Off') {
    swept++
    return 'Desactivado'
  }
  return v
})

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

const src = fs.readFileSync(esPath, 'utf8')
const exportIdx = src.indexOf('export const es')
const header = exportIdx > 0 ? src.slice(0, exportIdx) : ''
fs.writeFileSync(esPath, `${header}export const es = ${serialize(es)}\n`)

const es2 = (await import(pathToFileURL(esPath).href + '?t=' + Date.now())).es
const en = (await import(pathToFileURL(path.join(root, 'en.js')).href)).en

function leaves(o, p = '', a = []) {
  if (o == null || typeof o !== 'object') {
    if (typeof o === 'string') a.push([p, o])
    return a
  }
  if (Array.isArray(o)) {
    o.forEach((v, i) => leaves(v, `${p}[${i}]`, a))
    return a
  }
  for (const k of Object.keys(o)) leaves(o[k], p ? `${p}.${k}` : k, a)
  return a
}

function get2(o, pathStr) {
  // support [i] in path lightly — only dot paths for identical count
  return pathStr.split('.').reduce((a, k) => a?.[k], o)
}

const mangledRe =
  /(permity|Seleciony|marketplacy|despuess|valeíd|cuentacty|pelo meen|Olá|So a Moxi|ficará|equipa|Preencha|artigos|Nenhum|Descreva|Sou a Moxi|conprar|conunidad|viajantes|capaciudad|remov e|remov)/i
const mangled = leaves(es2).filter(([, v]) => mangledRe.test(v) || /\b(a nossa|os seus|a sua |o seu |após |através|também|não )\b/i.test(v))
let identical = 0
const enLeaves = leaves(en)
for (const [p, v] of enLeaves) {
  // skip array indices in identical naive compare for top stats
  if (p.includes('[')) continue
  if (get2(es2, p) === v) identical++
}

console.log(
  JSON.stringify(
    {
      applied,
      swept,
      mangledLeft: mangled.length,
      identicalDotPaths: identical,
      cguIsArray: Array.isArray(es2.legal?.sections?.cgu?.paragraphs),
      privacyIsArray: Array.isArray(es2.legal?.sections?.privacy?.paragraphs),
      samples: mangled.slice(0, 15).map(([p, v]) => [p, v.slice(0, 100)]),
    },
    null,
    2,
  ),
)
