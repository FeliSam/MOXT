import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const root = path.resolve('packages/shared/src/i18n/locales')
const load = async (name) => {
  const mod = await import(pathToFileURL(path.join(root, name)).href + '?t=' + Date.now())
  return mod[name.replace('.js', '')]
}

const en = await load('en.js')
const fr = await load('fr.js')
const es = structuredClone(await load('es.js'))

function walk(obj, prefix = '', out = []) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
    out.push([prefix, obj])
    return out
  }
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (obj[k] != null && typeof obj[k] === 'object' && !Array.isArray(obj[k])) walk(obj[k], p, out)
    else out.push([p, obj[k]])
  }
  return out
}

function get(obj, pathStr) {
  return pathStr.split('.').reduce((a, k) => (a == null ? a : a[k]), obj)
}

function set(obj, pathStr, value) {
  const parts = pathStr.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]]
  cur[parts[parts.length - 1]] = value
}

const mangledRe =
  /(permity|naveguey|cuentacty|Seleciony|marketplacy|Marketplacy|despuess|valeídac|valeíd|ficará|atravess|comprovact|telesfoen|enviadel|submetidel|mostrady|definidy|intercambiodas|monedy|nomy |nible |Escolly|Subscreva|mesmo quy|geralmenty|aceites|visuallízy|Anallísi|necessário|estiver|aparecy|escollê|comprovativos|sempry|as sus|os sus|os próximos|os documentos|os procesos|os anuncios|os perfiles|os ejemplos|pelo meen|pela |pelo |Olá|So a Moxi|artigos|encontros|orienta-o|Preencha|Indiquy|filtry|dy la|dy o |dy a |dy um|entry os|hacer-si|síples|beneficiário|percentagen|Incluem|cady la|mesdio|equipa|para o nuevo|pendienty|hacy más|tiver alguma|recrutador|autorizady|pedidy|viajy|guardato|poderón|verificacción|eliminacción|adiciony|removy|definitivamenty|pody crear|pody consultar|um |uma |Uma )/i

const dict = [
  ['Transferts', 'Transferencias'],
  ['transfert', 'transferencia'],
  ['Transfert', 'Transferencia'],
  ['Marketplace', 'Mercado'],
  ['Messagerie', 'Mensajería'],
  ['Messages', 'Mensajes'],
  ['messages', 'mensajes'],
  ['Message', 'Mensaje'],
  ['message', 'mensaje'],
  ['Annonces', 'Anuncios'],
  ['Annonce', 'Anuncio'],
  ['annonce', 'anuncio'],
  ['Emplois', 'Empleos'],
  ['Emploi', 'Empleo'],
  ['emploi', 'empleo'],
  ['Événements', 'Eventos'],
  ['Événement', 'Evento'],
  ['événement', 'evento'],
  ['Colis', 'Paquetes'],
  ['colis', 'paquete'],
  ['Entreprises', 'Empresas'],
  ['Entreprise', 'Empresa'],
  ['entreprise', 'empresa'],
  ['Paramètres', 'Ajustes'],
  ['Réglages', 'Ajustes'],
  ['réglages', 'ajustes'],
  ['Profil', 'Perfil'],
  ['profil', 'perfil'],
  ['Favoris', 'Favoritos'],
  ['favoris', 'favoritos'],
  ['Notifications', 'Notificaciones'],
  ['notification', 'notificación'],
  ['Sécurité', 'Seguridad'],
  ['sécurité', 'seguridad'],
  ['Vérification', 'Verificación'],
  ['vérification', 'verificación'],
  ['vérifié', 'verificado'],
  ['Vérifié', 'Verificado'],
  ['Publication', 'Publicación'],
  ['publication', 'publicación'],
  ['Publier', 'Publicar'],
  ['publier', 'publicar'],
  ['Créer', 'Crear'],
  ['créer', 'crear'],
  ['Modifier', 'Editar'],
  ['modifier', 'editar'],
  ['Supprimer', 'Eliminar'],
  ['supprimer', 'eliminar'],
  ['Enregistrer', 'Guardar'],
  ['enregistrer', 'guardar'],
  ['Annuler', 'Cancelar'],
  ['annuler', 'cancelar'],
  ['Continuer', 'Continuar'],
  ['continuer', 'continuar'],
  ['Retour', 'Volver'],
  ['Rechercher', 'Buscar'],
  ['rechercher', 'buscar'],
  ['Filtrer', 'Filtrar'],
  ['filtrer', 'filtrar'],
  ['Contactez', 'Contacta'],
  ['contactez', 'contacta'],
  ['Contacter', 'Contactar'],
  ['contacter', 'contactar'],
  ['administrateur', 'administrador'],
  ['Administrateur', 'Administrador'],
  ['Support', 'Soporte'],
  ['support', 'soporte'],
  ['Équipe', 'Equipo'],
  ['équipe', 'equipo'],
  ['Compte', 'Cuenta'],
  ['compte', 'cuenta'],
  ['Utilisateur', 'Usuario'],
  ['utilisateur', 'usuario'],
  ['mot de passe', 'contraseña'],
  ['e-mail', 'correo'],
  ['email', 'correo'],
  ['Téléphone', 'Teléfono'],
  ['téléphone', 'teléfono'],
  ['Adresse', 'Dirección'],
  ['adresse', 'dirección'],
  ['Ville', 'Ciudad'],
  ['ville', 'ciudad'],
  ['Pays', 'País'],
  ['pays', 'país'],
  ['Prix', 'Precio'],
  ['prix', 'precio'],
  ['Description', 'Descripción'],
  ['description', 'descripción'],
  ['Titre', 'Título'],
  ['titre', 'título'],
  ['Photos', 'Fotos'],
  ['photos', 'fotos'],
  ['Photo', 'Foto'],
  ['photo', 'foto'],
  ['Catégorie', 'Categoría'],
  ['catégorie', 'categoría'],
  ['catégories', 'categorías'],
  ['Disponible', 'Disponible'],
  ['disponible', 'disponible'],
  ['disponibles', 'disponibles'],
  ['Actif', 'Activo'],
  ['actif', 'activo'],
  ['Active', 'Activa'],
  ['active', 'activa'],
  ['En attente', 'Pendiente'],
  ['en attente', 'pendiente'],
  ['Approuver', 'Aprobar'],
  ['approuver', 'aprobar'],
  ['Refuser', 'Rechazar'],
  ['refuser', 'rechazar'],
  ['Valider', 'Validar'],
  ['valider', 'validar'],
  ['Validation', 'Validación'],
  ['validation', 'validación'],
  ['Documents', 'Documentos'],
  ['documents', 'documentos'],
  ['Document', 'Documento'],
  ['document', 'documento'],
  ['pièces jointes', 'adjuntos'],
  ['pièce jointe', 'adjunto'],
  ['Organisateur', 'Organizador'],
  ['organisateur', 'organizador'],
  ['Recruteur', 'Reclutador'],
  ['recruteur', 'reclutador'],
  ['Voyageur', 'Viajero'],
  ['voyageur', 'viajero'],
  ['Vendeur', 'Vendedor'],
  ['vendeur', 'vendedor'],
  ['acheteur', 'comprador'],
  ['Bénéficiaire', 'Beneficiario'],
  ['bénéficiaire', 'beneficiario'],
  ['Changeur', 'Cambiador'],
  ['changeur', 'cambiador'],
  ['Cambiste', 'Cambiador'],
  ['cambiste', 'cambiador'],
  ['Frais', 'Comisiones'],
  ['frais', 'comisiones'],
  ['Délai', 'Plazo'],
  ['délai', 'plazo'],
  ['délais', 'plazos'],
  ['minutes', 'minutos'],
  ['minute', 'minuto'],
  ['heures', 'horas'],
  ['heure', 'hora'],
  ['jours', 'días'],
  ['jour', 'día'],
  ["aujourd'hui", 'hoy'],
  ['demain', 'mañana'],
  ['Après', 'Después'],
  ['après', 'después'],
  ['Avant', 'Antes'],
  ['avant', 'antes'],
  ['avec', 'con'],
  ['sans', 'sin'],
  ['pour', 'para'],
  ['dans', 'en'],
  ['sur ', 'en '],
  [' ou ', ' o '],
  [' et ', ' y '],
  ['Votre', 'Tu'],
  ['votre', 'tu'],
  ['Vos', 'Tus'],
  ['vos', 'tus'],
  ['Vous', 'Tú'],
  ['vous', 'tú'],
  ['aussi', 'también'],
  ['encore', 'aún'],
  ['déjà', 'ya'],
  ['toujours', 'siempre'],
  ['jamais', 'nunca'],
  ['maintenant', 'ahora'],
  ['bientôt', 'pronto'],
  ['Merci', 'Gracias'],
  ['merci', 'gracias'],
  ['Bonjour', 'Hola'],
  ['bonjour', 'hola'],
  ['Oui', 'Sí'],
  ['oui', 'sí'],
  ['Non', 'No'],
  ['Erreur', 'Error'],
  ['erreur', 'error'],
  ['Succès', 'Éxito'],
  ['succès', 'éxito'],
  ['Aucun', 'Ningún'],
  ['aucun', 'ningún'],
  ['Aucune', 'Ninguna'],
  ['aucune', 'ninguna'],
  ['Requis', 'Obligatorio'],
  ['requis', 'obligatorio'],
  ['obligatoire', 'obligatorio'],
  ['Optionnel', 'Opcional'],
  ['optionnel', 'opcional'],
  ['Suivant', 'Siguiente'],
  ['suivant', 'siguiente'],
  ['Précédent', 'Anterior'],
  ['précédent', 'anterior'],
  ['Fermer', 'Cerrar'],
  ['fermer', 'cerrar'],
  ['Ouvrir', 'Abrir'],
  ['ouvrir', 'abrir'],
  ['Envoyer', 'Enviar'],
  ['envoyer', 'enviar'],
  ['recevoir', 'recibir'],
  ['Partager', 'Compartir'],
  ['partager', 'compartir'],
  ['Suivre', 'Seguir'],
  ['suivre', 'seguir'],
  ['Abonnement', 'Suscripción'],
  ['abonnement', 'suscripción'],
  ['abonnements', 'suscripciones'],
  ["s'abonner", 'suscribirse'],
  ['Aide', 'Ayuda'],
  ['aide', 'ayuda'],
  ['Assistant', 'Asistente'],
  ['assistant', 'asistente'],
  ['Question', 'Pregunta'],
  ['question', 'pregunta'],
  ['Réponse', 'Respuesta'],
  ['réponse', 'respuesta'],
  ['Communauté', 'Comunidad'],
  ['communauté', 'comunidad'],
  ['Diaspora', 'Diáspora'],
  ['diaspora', 'diáspora'],
  ['Russie', 'Rusia'],
  ['Afrique', 'África'],
  ['En ligne', 'En línea'],
  ['en ligne', 'en línea'],
  ['Sélectionnez', 'Selecciona'],
  ['sélectionnez', 'selecciona'],
  ['sélectionner', 'seleccionar'],
  ['Choisissez', 'Elige'],
  ['choisir', 'elegir'],
  ['Indiquez', 'Indica'],
  ['indiquez', 'indica'],
  ['Remplissez', 'Completa'],
  ['remplissez', 'completa'],
  ['Cliquez', 'Haz clic'],
  ['cliquez', 'haz clic'],
  ['Allez', 'Ve'],
  ['allez', 've'],
  ['Puis', 'Luego'],
  ['puis', 'luego'],
  ['ensuite', 'después'],
  ['Étape', 'Paso'],
  ['étape', 'paso'],
  ['étapes', 'pasos'],
  ['Formulaire', 'Formulario'],
  ['formulaire', 'formulario'],
  ['Montant', 'Importe'],
  ['montant', 'importe'],
  ['Devise', 'Moneda'],
  ['devise', 'moneda'],
  ['devises', 'monedas'],
  ['Réseau', 'Red'],
  ['réseau', 'red'],
  ['Banque', 'Banco'],
  ['banque', 'banco'],
  ['Reçu', 'Recibo'],
  ['reçu', 'recibo'],
  ['Preuve', 'Comprobante'],
  ['preuve', 'comprobante'],
  ['Justificatif', 'Justificante'],
  ['justificatif', 'justificante'],
  ['Identité', 'Identidad'],
  ['identité', 'identidad'],
  ['passeport', 'pasaporte'],
  ['Litige', 'Disputa'],
  ['litige', 'disputa'],
  ['litiges', 'disputas'],
  ['Professionnel', 'Profesional'],
  ['professionnel', 'profesional'],
  ['Espace pro', 'Espacio pro'],
  ['Invitation', 'Invitación'],
  ['invitation', 'invitación'],
  ['Activités', 'Actividades'],
  ['activités', 'actividades'],
  ['Accueil', 'Inicio'],
  ['accueil', 'inicio'],
  ['Actualité', 'Actualidad'],
  ['actualité', 'actualidad'],
  ['Voir plus', 'Ver más'],
  ['voir plus', 'ver más'],
  ['Voir moins', 'Ver menos'],
  ['voir moins', 'ver menos'],
  ['Voir', 'Ver'],
  ['voir', 'ver'],
  ['également', 'también'],
  ['notamment', 'en particular'],
  ['depuis', 'desde'],
  ["jusqu'à", 'hasta'],
  ['pendant', 'durante'],
  ['afin de', 'para'],
  ['parce que', 'porque'],
  ['lorsque', 'cuando'],
  ['quand', 'cuando'],
  ['Comment', 'Cómo'],
  ['comment', 'cómo'],
  ['Pourquoi', 'Por qué'],
  ['pourquoi', 'por qué'],
  ['Quelle', 'Qué'],
  ['Quel', 'Qué'],
  ['Quels', 'Qué'],
  ['quelles', 'qué'],
  ['Toutes', 'Todas'],
  ['toutes', 'todas'],
  ['Tous', 'Todos'],
  ['tous', 'todos'],
  ['Toute', 'Toda'],
  ['tout', 'todo'],
  ['Autre', 'Otro'],
  ['autre', 'otro'],
  ['Autres', 'Otros'],
  ['autres', 'otros'],
  ['Nouveau', 'Nuevo'],
  ['nouveau', 'nuevo'],
  ['Nouvelle', 'Nueva'],
  ['nouvelle', 'nueva'],
  ['nouveaux', 'nuevos'],
  ['nouvelles', 'nuevas'],
  ['Dernier', 'Último'],
  ['dernier', 'último'],
  ['dernière', 'última'],
  ['plusieurs', 'varios'],
  ['Chaque', 'Cada'],
  ['chaque', 'cada'],
  ['Même', 'Mismo'],
  ['même', 'mismo'],
  ['Seule', 'Sola'],
  ['seul', 'solo'],
  ['Seulement', 'Solo'],
  ['seulement', 'solo'],
  ['très', 'muy'],
  ['ici', 'aquí'],
  ['ne ', 'no '],
  [' du ', ' del '],
  [' au ', ' al '],
  [' aux ', ' a los '],
  [' des ', ' de '],
  [' les ', ' los '],
  [' une ', ' una '],
  [' un ', ' un '],
  [' le ', ' el '],
  [' la ', ' la '],
  [" d'", ' de '],
  [" l'", ' el '],
  [" n'", ' no '],
  [" qu'", ' que '],
  ['œ', 'oe'],
  ['« ', '"'],
  [' »', '"'],
  ['«', '"'],
  ['»', '"'],
]

dict.sort((a, b) => b[0].length - a[0].length)

function protectTokens(s) {
  const tokens = []
  const out = s
    .replace(/\{[^}]+\}/g, (m) => {
      tokens.push(m)
      return `__T${tokens.length - 1}__`
    })
    .replace(/\*\*[^*]+\*\*/g, (m) => {
      tokens.push(m)
      return `__T${tokens.length - 1}__`
    })
  return { out, tokens }
}

function restoreTokens(s, tokens) {
  return s.replace(/__T(\d+)__/g, (_, i) => tokens[Number(i)])
}

function frToEs(text) {
  const { out, tokens } = protectTokens(text)
  let s = out
  for (const [frW, esW] of dict) s = s.split(frW).join(esW)
  return restoreTokens(s, tokens)
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

let repaired = 0
let labelFixed = 0
const allPaths = walk(en)
  .filter(([, v]) => typeof v === 'string')
  .map(([p]) => p)

for (const p of allPaths) {
  const cur = get(es, p)
  const frV = get(fr, p)
  if (typeof cur !== 'string') continue

  if (mangledRe.test(cur) && typeof frV === 'string') {
    const next = frToEs(frV)
    if (next !== cur) {
      set(es, p, next)
      repaired++
    }
  } else if (cur === 'Marketplace') {
    set(es, p, 'Mercado')
    labelFixed++
  } else if (cur === 'Online') {
    set(es, p, 'En línea')
    labelFixed++
  } else if (cur === 'Jobs' && p.toLowerCase().includes('job')) {
    set(es, p, 'Empleos')
    labelFixed++
  } else if (cur === 'Off') {
    set(es, p, 'Desactivado')
    labelFixed++
  } else if (cur === 'Post' && (p.includes('news') || p.includes('postTypes') || p.endsWith('.post'))) {
    set(es, p, 'Publicación')
    labelFixed++
  }
}

for (const p of allPaths) {
  const v = get(es, p)
  if (typeof v === 'string' && /So a Moxi|Olá! So/i.test(v)) {
    set(
      es,
      p,
      '¡Hola! Soy Moxi, tu asistente MOXT. Puedo ayudarte con:\n\n- **Transferencias** — enviar dinero entre Rusia y África\n- **Envíos** — enviar artículos a través de viajeros\n- **Mercado** — comprar y vender en la comunidad\n- **Empleos y eventos** — postularte u organizar encuentros\n- **Empresas** — encontrar un cambiador o registrar tu actividad\n- **Verificación** — desbloquear límites de transferencia más altos\n- **Disputas y soporte** — obtener ayuda si hay un problema\n\n¿Cuál es tu pregunta?',
    )
    repaired++
  }
}

const hand = {
  'assistant.responses.marketplace.texts.0':
    'El mercado MOXT permite comprar y vender artículos en la comunidad afro-rusa.\n\n**Para publicar un anuncio:**\n- Ve a **Mercado** y luego **Publicar un anuncio**\n- Completa el título, la descripción, el precio y las fotos\n- Indica si ofreces entrega o solo recogida\n\nLos anuncios permanecen activos hasta que los cierres o hasta que el artículo se venda.',
  'assistant.responses.marketplace.texts.1':
    'En **Mercado**, navega por los anuncios, filtra por categoría o ubicación y contacta al vendedor directamente con la mensajería integrada.\n\nPara poner un artículo a la venta, usa **Publicar un anuncio**. El formulario te guía: tipo de producto, estado, precio y opciones de entrega.',
  'businesses.completion.services.hint':
    'Selecciona al menos un servicio (Mercado, Empleos, Transferencia…).',
  'marketplaceValidation.currencyRubOnly': 'El mercado utiliza solo RUB.',
  'messages.empty.description':
    'Contacta a un vendedor, viajero o profesional desde una ficha MOXT para iniciar una conversación.',
  'share.steps.step3Desc': 'Transferencias, envíos, mercado y servicios de la diáspora.',
}

for (const [p, v] of Object.entries(hand)) {
  if (get(es, p) != null) {
    set(es, p, v)
    repaired++
  }
}

const src = fs.readFileSync(path.join(root, 'es.js'), 'utf8')
const exportIdx = src.indexOf('export const es')
const header = exportIdx > 0 ? src.slice(0, exportIdx) : ''
fs.writeFileSync(path.join(root, 'es.js'), `${header}export const es = ${serialize(es)}\n`)

const es2 = (await import(pathToFileURL(path.join(root, 'es.js')).href + '?t=' + Date.now())).es
const left = walk(es2).filter(([, v]) => typeof v === 'string' && mangledRe.test(v))
const identical = walk(en).filter(([p, v]) => typeof v === 'string' && get(es2, p) === v).length

console.log(
  JSON.stringify(
    {
      repaired,
      labelFixed,
      mangledLeft: left.length,
      identicalToEn: identical,
      samples: left.slice(0, 20).map(([p, v]) => [p, String(v).slice(0, 100)]),
    },
    null,
    2,
  ),
)
