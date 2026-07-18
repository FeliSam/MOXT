#!/usr/bin/env node
/**
 * Fill Spanish (es.js) from Portuguese (pt.js) for leaves still identical to English.
 *
 * - Only overwrite when es === en (never regress existing Spanish)
 * - Convert via SPANISH_PHRASES + light morphology
 * - Preserve {placeholders} and brand tokens
 * - Second pass scrubs obvious PT leftovers + curated fixups
 *
 * Usage:
 *   node scripts/i18n-fill-es-from-pt.mjs
 *   node scripts/i18n-fill-es-from-pt.mjs --dry
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { en } from '../packages/shared/src/i18n/locales/en.js'
import { es as currentEs } from '../packages/shared/src/i18n/locales/es.js'
import { pt } from '../packages/shared/src/i18n/locales/pt.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ES_FILE = path.join(ROOT, 'packages/shared/src/i18n/locales/es.js')
const dry = process.argv.includes('--dry')

function flatten(node, prefix = '', out = {}) {
  if (node == null || typeof node !== 'object' || Array.isArray(node)) {
    if (prefix) out[prefix] = node
    return out
  }
  for (const [k, v] of Object.entries(node)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v != null && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out)
    else out[p] = v
  }
  return out
}

function setPath(root, dotted, value) {
  const parts = dotted.split('.')
  let node = root
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (node[key] == null || typeof node[key] !== 'object' || Array.isArray(node[key])) node[key] = {}
    node = node[key]
  }
  node[parts[parts.length - 1]] = value
}

function escapeString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

function serialize(value, indent = 0) {
  const pad = '  '.repeat(indent)
  const padInner = '  '.repeat(indent + 1)
  if (typeof value === 'string') return `"${escapeString(value)}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value == null) return 'null'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    if (value.every((v) => typeof v === 'string')) {
      return `[\n${value.map((v) => `${padInner}"${escapeString(v)}",`).join('\n')}\n${pad}]`
    }
    return `[\n${value.map((v) => `${padInner}${serialize(v, indent + 1)},`).join('\n')}\n${pad}]`
  }
  const entries = Object.entries(value)
  if (entries.length === 0) return '{}'
  return `{\n${entries.map(([k, v]) => {
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k)
    return `${padInner}${key}: ${serialize(v, indent + 1)},`
  }).join('\n')}\n${pad}}`
}

const BRANDS = ['MOXT', 'WhatsApp', 'Telegram', 'RUB', 'PDF', 'P2P', 'FAQ', 'KB', 'SMS', 'Marketplace', 'Superadmin', 'Moxi']

function maskProtected(text) {
  const values = []
  let s = String(text)
  s = s.replace(/\{[^{}]+\}/g, (m) => {
    const i = values.length
    values.push(m)
    return `\0P${i}\0`
  })
  for (const brand of BRANDS) {
    const re = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    s = s.replace(re, (m) => {
      const i = values.length
      values.push(m)
      return `\0P${i}\0`
    })
  }
  return { masked: s, values }
}

function unmaskProtected(text, values) {
  return String(text).replace(/\0P(\d+)\0/g, (_, n) => values[Number(n)] ?? '')
}

/** Curated PT -> ES UI phrases (longest keys sorted at runtime). */
const SPANISH_PHRASES = [
  [
    "Bem-vindos",
    "Bienvenidos"
  ],
  [
    "Bem-vindas",
    "Bienvenidas"
  ],
  [
    "Bem-vindo",
    "Bienvenido"
  ],
  [
    "Bem-vinda",
    "Bienvenida"
  ],
  [
    "palavra-passe",
    "contraseña"
  ],
  [
    "Palavra-passe",
    "Contraseña"
  ],
  [
    "telemóvel",
    "móvil"
  ],
  [
    "Telemóvel",
    "Móvil"
  ],
  [
    "utilizadores",
    "usuarios"
  ],
  [
    "Utilizadores",
    "Usuarios"
  ],
  [
    "utilizador",
    "usuario"
  ],
  [
    "Utilizador",
    "Usuario"
  ],
  [
    "configurações",
    "ajustes"
  ],
  [
    "Configurações",
    "Ajustes"
  ],
  [
    "definições",
    "ajustes"
  ],
  [
    "Definições",
    "Ajustes"
  ],
  [
    "notificações",
    "notificaciones"
  ],
  [
    "Notificações",
    "Notificaciones"
  ],
  [
    "notificação",
    "notificación"
  ],
  [
    "Notificação",
    "Notificación"
  ],
  [
    "publicações",
    "publicaciones"
  ],
  [
    "Publicações",
    "Publicaciones"
  ],
  [
    "publicação",
    "publicación"
  ],
  [
    "Publicação",
    "Publicación"
  ],
  [
    "descrição",
    "descripción"
  ],
  [
    "Descrição",
    "Descripción"
  ],
  [
    "localização",
    "ubicación"
  ],
  [
    "Localização",
    "Ubicación"
  ],
  [
    "informação",
    "información"
  ],
  [
    "Informação",
    "Información"
  ],
  [
    "informações",
    "información"
  ],
  [
    "Informações",
    "Información"
  ],
  [
    "confirmação",
    "confirmación"
  ],
  [
    "Confirmação",
    "Confirmación"
  ],
  [
    "verificação",
    "verificación"
  ],
  [
    "Verificação",
    "Verificación"
  ],
  [
    "administração",
    "administración"
  ],
  [
    "Administração",
    "Administración"
  ],
  [
    "comunicação",
    "comunicación"
  ],
  [
    "Comunicação",
    "Comunicación"
  ],
  [
    "transações",
    "transacciones"
  ],
  [
    "Transações",
    "Transacciones"
  ],
  [
    "transação",
    "transacción"
  ],
  [
    "Transação",
    "Transacción"
  ],
  [
    "operações",
    "operaciones"
  ],
  [
    "Operações",
    "Operaciones"
  ],
  [
    "operação",
    "operación"
  ],
  [
    "Operação",
    "Operación"
  ],
  [
    "ações",
    "acciones"
  ],
  [
    "Ações",
    "Acciones"
  ],
  [
    "ação",
    "acción"
  ],
  [
    "Ação",
    "Acción"
  ],
  [
    "preferências",
    "preferencias"
  ],
  [
    "Preferências",
    "Preferencias"
  ],
  [
    "mensagens",
    "mensajes"
  ],
  [
    "Mensagens",
    "Mensajes"
  ],
  [
    "mensagem",
    "mensaje"
  ],
  [
    "Mensagem",
    "Mensaje"
  ],
  [
    "conversas",
    "conversaciones"
  ],
  [
    "Conversas",
    "Conversaciones"
  ],
  [
    "conversa",
    "conversación"
  ],
  [
    "Conversa",
    "Conversación"
  ],
  [
    "pesquisar",
    "buscar"
  ],
  [
    "Pesquisar",
    "Buscar"
  ],
  [
    "pesquisa",
    "búsqueda"
  ],
  [
    "Pesquisa",
    "Búsqueda"
  ],
  [
    "encomendas",
    "envíos"
  ],
  [
    "Encomendas",
    "Envíos"
  ],
  [
    "encomenda",
    "envío"
  ],
  [
    "Encomenda",
    "Envío"
  ],
  [
    "transferências",
    "transferencias"
  ],
  [
    "Transferências",
    "Transferencias"
  ],
  [
    "transferência",
    "transferencia"
  ],
  [
    "Transferência",
    "Transferencia"
  ],
  [
    "anúncios",
    "anuncios"
  ],
  [
    "Anúncios",
    "Anuncios"
  ],
  [
    "anúncio",
    "anuncio"
  ],
  [
    "Anúncio",
    "Anuncio"
  ],
  [
    "notícias",
    "noticias"
  ],
  [
    "Notícias",
    "Noticias"
  ],
  [
    "notícia",
    "noticia"
  ],
  [
    "Notícia",
    "Noticia"
  ],
  [
    "formações",
    "formaciones"
  ],
  [
    "Formações",
    "Formaciones"
  ],
  [
    "formação",
    "formación"
  ],
  [
    "Formação",
    "Formación"
  ],
  [
    "encontros",
    "encuentros"
  ],
  [
    "Encontros",
    "Encuentros"
  ],
  [
    "encontro",
    "encuentro"
  ],
  [
    "Encontro",
    "Encuentro"
  ],
  [
    "inscrições",
    "inscripciones"
  ],
  [
    "Inscrições",
    "Inscripciones"
  ],
  [
    "inscrição",
    "inscripción"
  ],
  [
    "Inscrição",
    "Inscripción"
  ],
  [
    "atualidade",
    "actualidad"
  ],
  [
    "Atualidade",
    "Actualidad"
  ],
  [
    "segurança",
    "seguridad"
  ],
  [
    "Segurança",
    "Seguridad"
  ],
  [
    "identidade",
    "identidad"
  ],
  [
    "Identidade",
    "Identidad"
  ],
  [
    "comunidade",
    "comunidad"
  ],
  [
    "Comunidade",
    "Comunidad"
  ],
  [
    "oportunidades",
    "oportunidades"
  ],
  [
    "oportunidade",
    "oportunidad"
  ],
  [
    "Oportunidade",
    "Oportunidad"
  ],
  [
    "disponíveis",
    "disponibles"
  ],
  [
    "Disponíveis",
    "Disponibles"
  ],
  [
    "disponível",
    "disponible"
  ],
  [
    "Disponível",
    "Disponible"
  ],
  [
    "indisponível",
    "no disponible"
  ],
  [
    "Indisponível",
    "No disponible"
  ],
  [
    "obrigatório",
    "obligatorio"
  ],
  [
    "Obrigatório",
    "Obligatorio"
  ],
  [
    "obrigatória",
    "obligatoria"
  ],
  [
    "Obrigatória",
    "Obligatoria"
  ],
  [
    "serviços",
    "servicios"
  ],
  [
    "Serviços",
    "Servicios"
  ],
  [
    "serviço",
    "servicio"
  ],
  [
    "Serviço",
    "Servicio"
  ],
  [
    "espaços",
    "espacios"
  ],
  [
    "Espaços",
    "Espacios"
  ],
  [
    "espaço",
    "espacio"
  ],
  [
    "Espaço",
    "Espacio"
  ],
  [
    "profissionais",
    "profesionales"
  ],
  [
    "Profissionais",
    "Profesionales"
  ],
  [
    "profissional",
    "profesional"
  ],
  [
    "Profissional",
    "Profesional"
  ],
  [
    "empregos",
    "empleos"
  ],
  [
    "Empregos",
    "Empleos"
  ],
  [
    "emprego",
    "empleo"
  ],
  [
    "Emprego",
    "Empleo"
  ],
  [
    "missões",
    "misiones"
  ],
  [
    "Missões",
    "Misiones"
  ],
  [
    "missão",
    "misión"
  ],
  [
    "Missão",
    "Misión"
  ],
  [
    "categorias",
    "categorías"
  ],
  [
    "Categorias",
    "Categorías"
  ],
  [
    "categoria",
    "categoría"
  ],
  [
    "Categoria",
    "Categoría"
  ],
  [
    "cidades",
    "ciudades"
  ],
  [
    "Cidades",
    "Ciudades"
  ],
  [
    "cidade",
    "ciudad"
  ],
  [
    "Cidade",
    "Ciudad"
  ],
  [
    "ficheiros",
    "archivos"
  ],
  [
    "Ficheiros",
    "Archivos"
  ],
  [
    "ficheiro",
    "archivo"
  ],
  [
    "Ficheiro",
    "Archivo"
  ],
  [
    "através",
    "a través"
  ],
  [
    "Através",
    "A través"
  ],
  [
    "também",
    "también"
  ],
  [
    "Também",
    "También"
  ],
  [
    "não",
    "no"
  ],
  [
    "Não",
    "No"
  ],
  [
    "você",
    "tú"
  ],
  [
    "Você",
    "Tú"
  ],
  [
    "vocês",
    "ustedes"
  ],
  [
    "Vocês",
    "Ustedes"
  ],
  [
    "Início",
    "Inicio"
  ],
  [
    "início",
    "inicio"
  ],
  [
    "selecionar",
    "seleccionar"
  ],
  [
    "Selecionar",
    "Seleccionar"
  ],
  [
    "criar",
    "crear"
  ],
  [
    "Criar",
    "Crear"
  ],
  [
    "voltar",
    "volver"
  ],
  [
    "Voltar",
    "Volver"
  ],
  [
    "seguinte",
    "siguiente"
  ],
  [
    "Seguinte",
    "Siguiente"
  ],
  [
    "receber",
    "recibir"
  ],
  [
    "Receber",
    "Recibir"
  ],
  [
    "aceitar",
    "aceptar"
  ],
  [
    "Aceitar",
    "Aceptar"
  ],
  [
    "recusar",
    "rechazar"
  ],
  [
    "Recusar",
    "Rechazar"
  ],
  [
    "rejeitar",
    "rechazar"
  ],
  [
    "Rejeitar",
    "Rechazar"
  ],
  [
    "apagar",
    "borrar"
  ],
  [
    "Apagar",
    "Borrar"
  ],
  [
    "e-mail",
    "correo"
  ],
  [
    "E-mail",
    "Correo"
  ],
  [
    "telefone",
    "teléfono"
  ],
  [
    "Telefone",
    "Teléfono"
  ],
  [
    "contas",
    "cuentas"
  ],
  [
    "Contas",
    "Cuentas"
  ],
  [
    "conta",
    "cuenta"
  ],
  [
    "Conta",
    "Cuenta"
  ],
  [
    "erro",
    "error"
  ],
  [
    "Erro",
    "Error"
  ],
  [
    "agora",
    "ahora"
  ],
  [
    "Agora",
    "Ahora"
  ],
  [
    "aqui",
    "aquí"
  ],
  [
    "Aqui",
    "Aquí"
  ],
  [
    "ainda",
    "aún"
  ],
  [
    "Ainda",
    "Aún"
  ],
  [
    "hoje",
    "hoy"
  ],
  [
    "Hoje",
    "Hoy"
  ],
  [
    "ontem",
    "ayer"
  ],
  [
    "Ontem",
    "Ayer"
  ],
  [
    "amanhã",
    "mañana"
  ],
  [
    "Amanhã",
    "Mañana"
  ],
  [
    "muito",
    "muy"
  ],
  [
    "Muito",
    "Muy"
  ],
  [
    "mais",
    "más"
  ],
  [
    "Mais",
    "Más"
  ],
  [
    "sem",
    "sin"
  ],
  [
    "Sem",
    "Sin"
  ],
  [
    "com",
    "con"
  ],
  [
    "Com",
    "Con"
  ],
  [
    "Olá",
    "Hola"
  ],
  [
    "olá",
    "hola"
  ],
  [
    "apresentar",
    "presentar"
  ],
  [
    "Apresentar",
    "Presentar"
  ],
  [
    "página",
    "página"
  ],
  [
    "Página",
    "Página"
  ],
  [
    "próximos",
    "próximos"
  ],
  [
    "Próximos",
    "Próximos"
  ],
  [
    "próximo",
    "próximo"
  ],
  [
    "Próximo",
    "Próximo"
  ],
  [
    "viagens",
    "viajes"
  ],
  [
    "Viagens",
    "Viajes"
  ],
  [
    "viagem",
    "viaje"
  ],
  [
    "Viagem",
    "Viaje"
  ],
  [
    "pagamento",
    "pago"
  ],
  [
    "Pagamento",
    "Pago"
  ],
  [
    "pendente",
    "pendiente"
  ],
  [
    "Pendente",
    "Pendiente"
  ]
]
SPANISH_PHRASES.sort((a, b) => b[0].length - a[0].length)

const CURATED_FIXUPS = [
  ['Por supuesto', 'Claro'],
  ['Soy a Moxi', 'Soy Moxi'],
  ['Rússia', 'Rusia'],
  ['rússia', 'rusia'],
  ['formacciones', 'formaciones'],
  ['Formacciones', 'Formaciones'],
  ['formacción', 'formación'],
  ['Formacción', 'Formación'],
  ['Encontros', 'Encuentros'],
  ['encontros', 'encuentros'],
  ['Encontro', 'Encuentro'],
  ['encontro', 'encuentro'],
]

function applyPhrases(s) {
  let out = s
  for (const [from, to] of SPANISH_PHRASES) {
    if (from && out.includes(from)) out = out.split(from).join(to)
  }
  return out
}

/** Light morphology only — avoid aggressive whole-grammar rewrites. */
function applyLightMorphology(s) {
  return s
    .replace(/ções\b/g, 'ciones')
    .replace(/Ções\b/g, 'Ciones')
    .replace(/ção\b/g, 'ción')
    .replace(/Ção\b/g, 'Ción')
    .replace(/ões\b/g, 'ones')
    .replace(/ães\b/g, 'anes')
    .replace(/dade\b/g, 'dad')
    .replace(/ável\b/g, 'able')
    .replace(/ível\b/g, 'ible')
    .replace(/íveis\b/g, 'ibles')
    .replace(/agem\b/g, 'aje')
    .replace(/ã/g, 'a')
    .replace(/Ã/g, 'A')
    .replace(/õ/g, 'o')
    .replace(/Õ/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
}

function ptToEs(ptText) {
  if (ptText == null || typeof ptText !== 'string') return ptText
  const { masked, values } = maskProtected(ptText)
  let s = applyPhrases(masked)
  s = applyLightMorphology(s)
  return unmaskProtected(s, values)
}

function scrubPtLeftovers(text) {
  if (typeof text !== 'string') return text
  const { masked, values } = maskProtected(text)
  let t = masked
  // Only obvious PT leftovers / known bad heuristics — do NOT run full phrase map
  // (short tokens like "com" would corrupt Spanish).
  const leftovers = [
    [/\bvocê\b/gi, 'tú'],
    [/\bVocê\b/g, 'Tú'],
    [/\bnão\b/g, 'no'],
    [/\bNão\b/g, 'No'],
    [/\bações\b/gi, 'acciones'],
    [/\bação\b/gi, 'acción'],
    [/configurações/gi, 'ajustes'],
    [/definições/gi, 'ajustes'],
    [/\butilizadores\b/gi, 'usuarios'],
    [/\butilizador\b/gi, 'usuario'],
    [/palavra-passe/gi, 'contraseña'],
    [/telemóvel/gi, 'móvil'],
    [/\bpesquisar\b/gi, 'buscar'],
    [/\bmensagens\b/gi, 'mensajes'],
    [/\bmensagem\b/gi, 'mensaje'],
    [/\btambém\b/gi, 'también'],
    [/\batravés\b/gi, 'a través'],
    [/\bdisponível\b/gi, 'disponible'],
    [/\bobrigatório\b/gi, 'obligatorio'],
    [/\bficheiro\b/gi, 'archivo'],
    [/\bBem-vindo\b/g, 'Bienvenido'],
    [/\bbem-vindo\b/g, 'bienvenido'],
    [/\bEncontros\b/g, 'Encuentros'],
    [/\bencontros\b/g, 'encuentros'],
    [/\bEncontro\b/g, 'Encuentro'],
    [/\bencontro\b/g, 'encuentro'],
    [/formações/gi, 'formaciones'],
    [/formação/gi, 'formación'],
    [/ções\b/g, 'ciones'],
    [/ção\b/g, 'ción'],
    [/ões\b/g, 'ones'],
    [/\bSou\b/g, 'Soy'],
    [/\bsou\b/g, 'soy'],
    [/\bPosso\b/g, 'Puedo'],
    [/\bposso\b/g, 'puedo'],
    [/\bajudar\b/gi, 'ayudar'],
    [/\bassistente\b/gi, 'asistente'],
    [/\bdinheiro\b/gi, 'dinero'],
    [/\bpágina\b/g, 'página'],
    [/\bPágien\b/g, 'Página'],
    [/\binscrever\b/gi, 'inscribir'],
    [/\binscrever-se\b/gi, 'inscribirse'],
    [/\bpara si\b/gi, 'para'],
    [/\bOlá\b/g, 'Hola'],
    [/\bolá\b/g, 'hola'],
    [/\ba sua\b/g, 'su'],
    [/\bA sua\b/g, 'Su'],
    [/\bo seu\b/g, 'su'],
    [/\bO seu\b/g, 'Su'],
    [/\bcomunidade\b/gi, 'comunidad'],
    [/\batravés\b/gi, 'a través'],
    [/\btambém\b/gi, 'también'],
  ]
  for (const [re, rep] of leftovers) t = t.replace(re, rep)
  for (const [from, to] of CURATED_FIXUPS) {
    if (t.includes(from)) t = t.split(from).join(to)
  }
  return unmaskProtected(t, values)
}

const enFlat = flatten(en)
const esFlat = flatten(currentEs)
const ptFlat = flatten(pt)

let beforeIdentical = 0
for (const [k, ev] of Object.entries(enFlat)) {
  if (typeof ev === 'string' && esFlat[k] === ev) beforeIdentical += 1
}

const next = structuredClone(currentEs)
let converted = 0
let skippedSame = 0
let skippedNoPt = 0
let alreadyDiff = 0
let leftoverFixed = 0

for (const key of Object.keys(enFlat)) {
  const ev = enFlat[key]
  const cur = esFlat[key]
  if (typeof ev !== 'string') continue

  if (cur !== ev) {
    alreadyDiff += 1
    if (typeof cur === 'string') {
      const scrubbed = scrubPtLeftovers(cur)
      if (scrubbed !== cur) {
        setPath(next, key, scrubbed)
        leftoverFixed += 1
      }
    }
    continue
  }

  const src = ptFlat[key]
  if (src == null || typeof src !== 'string') {
    skippedNoPt += 1
    continue
  }

  const out = scrubPtLeftovers(ptToEs(src))
  if (out !== ev) {
    setPath(next, key, out)
    converted += 1
  } else {
    skippedSame += 1
  }
}

const nextFlat = flatten(next)
let afterIdentical = 0
for (const [k, ev] of Object.entries(enFlat)) {
  if (typeof ev === 'string' && nextFlat[k] === ev) afterIdentical += 1
}

console.log(JSON.stringify({
  beforeIdenticalToEn: beforeIdentical,
  afterIdenticalToEn: afterIdentical,
  converted,
  leftoverFixed,
  alreadyDiff,
  skippedSame,
  skippedNoPt,
  phraseCount: SPANISH_PHRASES.length,
  dry,
}, null, 2))

if (dry) process.exit(0)

const header = '/** Spanish UI copy for MOXT. */\nexport const es = '
fs.writeFileSync(ES_FILE, `${header}${serialize(next, 0)}\n`, 'utf8')
console.log('Wrote', ES_FILE)
