/**
 * Build packages/shared/src/i18n/locales/es.js from:
 * - existing es.js (keep already-good Spanish, esp. auth)
 * - pt.js (primary meaning source) via PT→ES transforms for keys still === en
 * Preserves arrays / structure via JSON round-trip of a plain object then pretty print as ESM.
 */
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const root = path.resolve('packages/shared/src/i18n/locales')
const load = async (name) => {
  const mod = await import(pathToFileURL(path.join(root, name)).href + '?t=' + Date.now())
  return structuredClone(mod[name.replace('.js', '')])
}

const en = await load('en.js')
const pt = await load('pt.js')
const esExisting = await load('es.js')

function walk(obj, prefix = '', out = []) {
  if (obj == null || typeof obj !== 'object') {
    out.push([prefix, obj])
    return out
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, `${prefix}[${i}]`, out))
    return out
  }
  for (const k of Object.keys(obj)) walk(obj[k], prefix ? `${prefix}.${k}` : k, out)
  return out
}

function parsePath(pathStr) {
  const parts = []
  pathStr.replace(/([^.\[\]]+)|\[(\d+)\]/g, (_, key, idx) => {
    parts.push(idx !== undefined ? Number(idx) : key)
  })
  return parts
}

function get(obj, pathStr) {
  return parsePath(pathStr).reduce((a, k) => (a == null ? a : a[k]), obj)
}

function set(obj, pathStr, value) {
  const parts = parsePath(pathStr)
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    const next = parts[i + 1]
    if (cur[k] == null) cur[k] = typeof next === 'number' ? [] : {}
    cur = cur[k]
  }
  cur[parts[parts.length - 1]] = value
}

function protect(s) {
  const tokens = []
  const out = String(s)
    .replace(/\{[^}]+\}/g, (m) => {
      tokens.push(m)
      return `\uE000${tokens.length - 1}\uE001`
    })
    .replace(/\*\*[^*]+\*\*/g, (m) => {
      tokens.push(m)
      return `\uE000${tokens.length - 1}\uE001`
    })
  return { out, tokens }
}

function restore(s, tokens) {
  return s.replace(/\uE000(\d+)\uE001/g, (_, i) => tokens[Number(i)])
}

/** Ordered longest-first PT→ES phrase/word map */
const PT_ES = [
  ['palavra-passe', 'contraseña'],
  ['utilizador', 'usuario'],
  ['Utilizador', 'Usuario'],
  ['definições', 'ajustes'],
  ['Definições', 'Ajustes'],
  ['configurações', 'ajustes'],
  ['notificação', 'notificación'],
  ['Notificação', 'Notificación'],
  ['notificações', 'notificaciones'],
  ['mensagem', 'mensaje'],
  ['Mensagem', 'Mensaje'],
  ['mensagens', 'mensajes'],
  ['Mensagens', 'Mensajes'],
  ['conversa', 'conversación'],
  ['Conversas', 'Conversaciones'],
  ['anúncio', 'anuncio'],
  ['Anúncio', 'Anuncio'],
  ['anúncios', 'anuncios'],
  ['Anúncios', 'Anuncios'],
  ['emprego', 'empleo'],
  ['Emprego', 'Empleo'],
  ['empregos', 'empleos'],
  ['Empregos', 'Empleos'],
  ['evento', 'evento'],
  ['Eventos', 'Eventos'],
  ['transferência', 'transferencia'],
  ['Transferência', 'Transferencia'],
  ['transferências', 'transferencias'],
  ['Transferências', 'Transferencias'],
  ['encomenda', 'paquete'],
  ['Encomenda', 'Paquete'],
  ['encomendas', 'paquetes'],
  ['pacote', 'paquete'],
  ['Pacote', 'Paquete'],
  ['empresa', 'empresa'],
  ['Empresas', 'Empresas'],
  ['perfil', 'perfil'],
  ['Perfil', 'Perfil'],
  ['favoritos', 'favoritos'],
  ['Favoritos', 'Favoritos'],
  ['publicação', 'publicación'],
  ['Publicação', 'Publicación'],
  ['publicações', 'publicaciones'],
  ['verificação', 'verificación'],
  ['Verificação', 'Verificación'],
  ['verificado', 'verificado'],
  ['Verificado', 'Verificado'],
  ['segurança', 'seguridad'],
  ['Segurança', 'Seguridad'],
  ['palavra', 'palabra'],
  ['pesquisar', 'buscar'],
  ['Pesquisar', 'Buscar'],
  ['pesquisa', 'búsqueda'],
  ['filtrar', 'filtrar'],
  ['guardar', 'guardar'],
  ['Guardar', 'Guardar'],
  ['cancelar', 'cancelar'],
  ['Cancelar', 'Cancelar'],
  ['eliminar', 'eliminar'],
  ['Eliminar', 'Eliminar'],
  ['apagar', 'borrar'],
  ['criar', 'crear'],
  ['Criar', 'Crear'],
  ['editar', 'editar'],
  ['Editar', 'Editar'],
  ['enviar', 'enviar'],
  ['Enviar', 'Enviar'],
  ['receber', 'recibir'],
  ['partilhar', 'compartir'],
  ['Partilhar', 'Compartir'],
  ['seguir', 'seguir'],
  ['subscrever', 'suscribirse'],
  ['Subscrever', 'Suscribirse'],
  ['subscrição', 'suscripción'],
  ['Subscrição', 'Suscripción'],
  ['password', 'contraseña'],
  ['telefone', 'teléfono'],
  ['Telefone', 'Teléfono'],
  ['correio', 'correo'],
  ['Correio', 'Correo'],
  ['e-mail', 'correo'],
  ['email', 'correo'],
  ['morada', 'dirección'],
  ['endereço', 'dirección'],
  ['Endereço', 'Dirección'],
  ['cidade', 'ciudad'],
  ['Cidade', 'Ciudad'],
  ['país', 'país'],
  ['País', 'País'],
  ['preço', 'precio'],
  ['Preço', 'Precio'],
  ['descrição', 'descripción'],
  ['Descrição', 'Descripción'],
  ['título', 'título'],
  ['Título', 'Título'],
  ['categoria', 'categoría'],
  ['Categoria', 'Categoría'],
  ['categorias', 'categorías'],
  ['disponível', 'disponible'],
  ['Disponível', 'Disponible'],
  ['disponíveis', 'disponibles'],
  ['ativo', 'activo'],
  ['Ativo', 'Activo'],
  ['ativa', 'activa'],
  ['pendente', 'pendiente'],
  ['Pendente', 'Pendiente'],
  ['aprovado', 'aprobado'],
  ['rejeitado', 'rechazado'],
  ['validar', 'validar'],
  ['Validar', 'Validar'],
  ['validação', 'validación'],
  ['Validação', 'Validación'],
  ['documento', 'documento'],
  ['Documentos', 'Documentos'],
  ['organizador', 'organizador'],
  ['recrutador', 'reclutador'],
  ['viajante', 'viajero'],
  ['Viajante', 'Viajero'],
  ['viajantes', 'viajeros'],
  ['vendedor', 'vendedor'],
  ['comprador', 'comprador'],
  ['beneficiário', 'beneficiario'],
  ['Beneficiário', 'Beneficiario'],
  ['cambista', 'cambiador'],
  ['Cambista', 'Cambiador'],
  ['taxas', 'comisiones'],
  ['taxa', 'tarifa'],
  ['prazo', 'plazo'],
  ['prazos', 'plazos'],
  ['minuto', 'minuto'],
  ['minutos', 'minutos'],
  ['hora', 'hora'],
  ['horas', 'horas'],
  ['dia', 'día'],
  ['dias', 'días'],
  ['hoje', 'hoy'],
  ['amanhã', 'mañana'],
  ['depois', 'después'],
  ['Depois', 'Después'],
  ['antes', 'antes'],
  ['com ', 'con '],
  ['sem ', 'sin '],
  ['para ', 'para '],
  ['também', 'también'],
  ['Também', 'También'],
  ['ainda', 'aún'],
  ['Ainda', 'Aún'],
  ['agora', 'ahora'],
  ['Agora', 'Ahora'],
  ['sempre', 'siempre'],
  ['nunca', 'nunca'],
  ['aqui', 'aquí'],
  ['Aqui', 'Aquí'],
  ['obrigado', 'gracias'],
  ['Obrigado', 'Gracias'],
  ['olá', 'hola'],
  ['Olá', 'Hola'],
  ['sim', 'sí'],
  ['Sim', 'Sí'],
  ['não', 'no'],
  ['Não', 'No'],
  ['erro', 'error'],
  ['Erro', 'Error'],
  ['sucesso', 'éxito'],
  ['Sucesso', 'Éxito'],
  ['carregar', 'cargar'],
  ['vazio', 'vacío'],
  ['nenhum', 'ningún'],
  ['Nenhum', 'Ningún'],
  ['nenhuma', 'ninguna'],
  ['Nenhuma', 'Ninguna'],
  ['obrigatório', 'obligatorio'],
  ['opcional', 'opcional'],
  ['seguinte', 'siguiente'],
  ['anterior', 'anterior'],
  ['fechar', 'cerrar'],
  ['Fechar', 'Cerrar'],
  ['abrir', 'abrir'],
  ['Abrir', 'Abrir'],
  ['ver ', 'ver '],
  ['Ver ', 'Ver '],
  ['mais', 'más'],
  ['Mais', 'Más'],
  ['menos', 'menos'],
  ['bem', 'bien'],
  ['mal', 'mal'],
  ['novo', 'nuevo'],
  ['Novo', 'Nuevo'],
  ['nova', 'nueva'],
  ['Nova', 'Nueva'],
  ['novos', 'nuevos'],
  ['novas', 'nuevas'],
  ['todos', 'todos'],
  ['Todas', 'Todas'],
  ['todas', 'todas'],
  ['todo', 'todo'],
  ['outra', 'otra'],
  ['outro', 'otro'],
  ['outras', 'otras'],
  ['outros', 'otros'],
  ['primeiro', 'primero'],
  ['última', 'última'],
  ['último', 'último'],
  ['cada', 'cada'],
  ['mesmo', 'mismo'],
  ['mesma', 'misma'],
  ['só ', 'solo '],
  ['apenas', 'solo'],
  ['muito', 'muy'],
  ['já ', 'ya '],
  ['você', 'tú'],
  ['Você', 'Tú'],
  ['vocês', 'ustedes'],
  ['seu ', 'tu '],
  ['sua ', 'tu '],
  ['seus ', 'tus '],
  ['suas ', 'tus '],
  ['Seu ', 'Tu '],
  ['Sua ', 'Tu '],
  ['nosso', 'nuestro'],
  ['nossa', 'nuestra'],
  ['nossos', 'nuestros'],
  ['nossas', 'nuestras'],
  ['Nossa', 'Nuestra'],
  ['equipe', 'equipo'],
  ['equipa', 'equipo'],
  ['Equipa', 'Equipo'],
  ['suporte', 'soporte'],
  ['Suporte', 'Soporte'],
  ['ajuda', 'ayuda'],
  ['Ajuda', 'Ayuda'],
  ['contacto', 'contacto'],
  ['contatar', 'contactar'],
  ['Contactar', 'Contactar'],
  ['selecione', 'selecciona'],
  ['Selecione', 'Selecciona'],
  ['selecionar', 'seleccionar'],
  ['escolha', 'elige'],
  ['Escolha', 'Elige'],
  ['escolher', 'elegir'],
  ['preencha', 'completa'],
  ['Preencha', 'Completa'],
  ['indique', 'indica'],
  ['Indique', 'Indica'],
  ['clique', 'haz clic'],
  ['Clique', 'Haz clic'],
  ['vá a', 've a'],
  ['Vá a', 'Ve a'],
  ['depois', 'después'],
  ['em seguida', 'después'],
  ['passo', 'paso'],
  ['Passo', 'Paso'],
  ['passos', 'pasos'],
  ['formulário', 'formulario'],
  ['Formulário', 'Formulario'],
  ['montante', 'importe'],
  ['Montante', 'Importe'],
  ['moeda', 'moneda'],
  ['Moeda', 'Moneda'],
  ['moedas', 'monedas'],
  ['rede', 'red'],
  ['Rede', 'Red'],
  ['banco', 'banco'],
  ['Banco', 'Banco'],
  ['recibo', 'recibo'],
  ['comprovativo', 'comprobante'],
  ['Comprovativo', 'Comprobante'],
  ['identidade', 'identidad'],
  ['Identidade', 'Identidad'],
  ['passaporte', 'pasaporte'],
  ['litígio', 'disputa'],
  ['Litígio', 'Disputa'],
  ['litígios', 'disputas'],
  ['profissional', 'profesional'],
  ['Profissional', 'Profesional'],
  ['espaço', 'espacio'],
  ['Espaço', 'Espacio'],
  ['convite', 'invitación'],
  ['Convite', 'Invitación'],
  ['atividades', 'actividades'],
  ['Atividades', 'Actividades'],
  ['início', 'inicio'],
  ['Início', 'Inicio'],
  ['atualidade', 'actualidad'],
  ['comunidade', 'comunidad'],
  ['Comunidade', 'Comunidad'],
  ['diáspora', 'diáspora'],
  ['Rússia', 'Rusia'],
  ['África', 'África'],
  ['online', 'en línea'],
  ['Online', 'En línea'],
  ['Marketplace', 'Mercado'],
  ['marketplace', 'mercado'],
  ['através de', 'a través de'],
  ['através', 'a través'],
  ['até', 'hasta'],
  ['quando', 'cuando'],
  ['Porquê', 'Por qué'],
  ['Qual', 'Cuál'],
  ['qual', 'cuál'],
  ['Quais', 'Cuáles'],
  ['ficará', 'será'],
  ['Ficará', 'Será'],
  ['aparecem', 'aparecen'],
  ['permanecem', 'permanecen'],
  ['poderá', 'podrá'],
  ['Poderá', 'Podrá'],
  ['podem', 'pueden'],
]

// Only safe multi-char tokens — NEVER replace bare articles (na/no/da/do/a/o) which break "una", etc.
const SAFE_PT_ES = PT_ES.filter(([a]) => a.length >= 4)
SAFE_PT_ES.sort((a, b) => b[0].length - a[0].length)

function ptToEs(text) {
  if (typeof text !== 'string') return text
  const { out, tokens } = protect(text)
  let s = out
  for (const [ptW, esW] of SAFE_PT_ES) {
    if (s.includes(ptW)) s = s.split(ptW).join(esW)
  }
  s = s
    .replace(/ção\b/g, 'ción')
    .replace(/ções\b/g, 'ciones')
    .replace(/\bnão\b/gi, (m) => (m[0] === 'N' ? 'No' : 'no'))
    .replace(/\bvocê\b/gi, (m) => (m[0] === 'V' ? 'Tú' : 'tú'))
    .replace(/\btambém\b/gi, (m) => (m[0] === 'T' ? 'También' : 'también'))
    .replace(/\bum\b/g, 'un')
    .replace(/\buma\b/g, 'una')
    .replace(/\buns\b/g, 'unos')
    .replace(/\bumas\b/g, 'unas')
    .replace(/\bcom\b/g, 'con')
    .replace(/\bsem\b/g, 'sin')
    .replace(/\be\b/g, 'y')
    .replace(/\bou\b/g, 'o')
  return restore(s, tokens)
}

const es = structuredClone(en) // start from en structure

// 1) overlay existing Spanish where it already differs from EN
for (const [p, v] of walk(esExisting)) {
  if (typeof v !== 'string') continue
  const enV = get(en, p)
  if (enV !== undefined && v !== enV) set(es, p, v)
}

// 2) fill remaining from PT→ES
let filled = 0
let kept = 0
for (const [p, enV] of walk(en)) {
  if (typeof enV !== 'string') continue
  const cur = get(es, p)
  if (cur !== enV) {
    kept++
    continue
  }
  const ptV = get(pt, p)
  if (typeof ptV === 'string' && ptV !== enV) {
    set(es, p, ptToEs(ptV))
    filled++
  }
}

// 3) force priority label polish
const forced = {
  'nav.home': 'Inicio',
  'nav.marketplace': 'Mercado',
  'nav.messages': 'Mensajes',
  'nav.transfers': 'Transferencias',
  'nav.parcels': 'Envíos',
  'nav.jobs': 'Empleos',
  'nav.events': 'Eventos',
  'nav.settings': 'Ajustes',
  'nav.profile': 'Perfil',
  'nav.favorites': 'Favoritos',
  'nav.logout': 'Cerrar sesión',
  'nav.moxt': 'MOXT',
  'nav.brand': 'Moxt',
  'moxtHub.eyebrow': 'Plataforma',
  'moxtHub.description':
    'Todos los servicios esenciales, acciones rápidas y tus espacios personales, en un solo lugar.',
  'moxtHub.primaryServices': 'Servicios esenciales',
  'moxtHub.primaryServicesDesc': 'Los nueve recorridos principales de MOXT.',
  'moxtHub.quickActions': 'Acciones rápidas',
  'moxtHub.quickActionsDesc': 'Publica o inicia en un toque.',
  'moxtHub.secondary': 'Espacios personales',
  'moxtHub.secondaryDesc': 'Tu cuenta, actividad y preferencias.',
  'dashboard.hero.welcome': 'Te damos la bienvenida, {name}',
  'dashboard.hero.marketplace': 'Mercado',
  'dashboard.discovery.online': 'En línea',
  'messages.empty.marketplace': 'Mercado',
  'marketplace.common.name': 'Mercado',
  'settings.notifications.priority.off': 'Desactivado',
}
for (const [p, v] of Object.entries(forced)) {
  if (get(es, p) != null || get(en, p) != null) set(es, p, v)
}

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

const outPath = path.join(root, 'es.js')
const header = `/** Spanish locale — generated/filled from PT + existing ES overrides. */\n`
fs.writeFileSync(outPath + '.tmp', `${header}export const es = ${serialize(es)}\n`)
fs.renameSync(outPath + '.tmp', outPath)

// verify
const es2 = (await import(pathToFileURL(outPath).href + '?t=' + Date.now())).es
let identical = 0
let total = 0
for (const [p, enV] of walk(en)) {
  if (typeof enV !== 'string') continue
  total++
  if (get(es2, p) === enV) identical++
}
console.log(
  JSON.stringify(
    {
      filled,
      keptExistingDiff: kept,
      total,
      identical,
      pctTranslated: +(((total - identical) / total) * 100).toFixed(1),
      navHome: es2.nav?.home,
      moxtHub: es2.moxtHub?.primaryServices,
      auth: es2.auth?.login?.title,
      cguArray: Array.isArray(es2.legal?.sections?.cgu?.paragraphs),
      cgu0: es2.legal?.sections?.cgu?.paragraphs?.[0]?.slice?.(0, 60),
    },
    null,
    2,
  ),
)
