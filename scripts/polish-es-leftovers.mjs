#!/usr/bin/env node
/**
 * Hand-fix obvious PT→ES conversion leftovers in high-traffic es.js sections.
 * Does NOT touch auth (already polished).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { en } from '../packages/shared/src/i18n/locales/en.js'
import { es as currentEs } from '../packages/shared/src/i18n/locales/es.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ES_FILE = path.join(__dirname, '../packages/shared/src/i18n/locales/es.js')

/** Prefixes to polish (high-traffic sections). */
const POLISH_PREFIXES = [
  'validation.transfer',
  'validation.p2p',
  'validation.address',
  'validation.identity',
  'settings',
  'profile',
  'events',
  'parcels',
  'jobs',
  'transfers',
  'legal.pageEyebrow',
  'legal.copyright',
  'legal.footer',
  'legal.nav',
]

/** Exact key overrides (path → proper Spanish). */
const OVERRIDES = {
  'validation.transfer.amountType': 'Introduce un importe.',
  'validation.transfer.amountInvalid': 'Importe no válido.',
  'validation.transfer.amountPositive': 'El importe debe ser positivo.',
  'validation.transfer.amountMinimum': 'El mínimo es {amount}.',
  'validation.transfer.amountCeiling': 'Tu límite es {amount}.',
  'validation.transfer.amountMonthlyRemaining': 'Tu límite mensual restante es {amount}.',
  'validation.transfer.exchangerRequired': 'Elige un socio.',
  'validation.transfer.firstNameShort': 'Nombre demasiado corto.',
  'validation.transfer.firstNameRequired': 'El nombre es obligatorio.',
  'validation.transfer.lastNameShort': 'Apellidos demasiado cortos.',
  'validation.transfer.lastNameRequired': 'Los apellidos son obligatorios.',
  'validation.transfer.phoneRequired': 'El teléfono es obligatorio.',
  'validation.transfer.paymentMethodRequired': 'El método de pago es obligatorio.',
  'validation.transfer.receiveMethodRequired': 'El método de recepción es obligatorio.',
  'validation.transfer.receivedAmountRequired': 'El importe recibido es obligatorio.',
  'validation.transfer.receiveMethodChoose': 'Elige un método de recepción.',
  'validation.transfer.receiveMethodInvalid': 'Método no válido.',
  'validation.p2p.methodRequired': 'El método es obligatorio.',
  'validation.p2p.fromCurrencyRequired': 'La moneda ofrecida es obligatoria.',
  'validation.p2p.toCurrencyRequired': 'La moneda solicitada es obligatoria.',
  'validation.p2p.differentCurrency': 'Elige otra moneda.',
  'validation.p2p.amountRequired': 'El importe es obligatorio.',
  'validation.p2p.amountCeiling': 'Tu límite es {amount}.',
  'validation.p2p.rateRequired': 'La tasa es obligatoria.',
  'validation.p2p.commentMax': 'Máximo 300 caracteres.',
  'validation.address.labelRequired': 'La etiqueta es obligatoria.',
  'validation.address.countryRequired': 'El país es obligatorio.',
  'validation.address.cityRequired': 'La ciudad es obligatoria.',
  'validation.address.addressRequired': 'La dirección es obligatoria.',
  'validation.address.phoneRequired': 'El teléfono es obligatorio.',
  'validation.address.emailRequired': 'El correo es obligatorio.',
  'validation.address.emailInvalid': 'Correo no válido.',
  'validation.identity.firstNamesRequired': 'Los nombres son obligatorios.',
  'validation.identity.lastNameRequired': 'El apellido es obligatorio.',
  'validation.identity.companyNameRequired': 'La razón social es obligatoria.',
  'validation.identity.docTypeInvalid': 'Tipo de documento no válido.',
  'validation.identity.passportRequired': 'El número de pasaporte es obligatorio.',
  'validation.identity.passportInvalid':
    'Formato no válido (6 a 12 caracteres alfanuméricos, ej. AB1234567).',
  'validation.identity.issuedByRequired': 'El lugar de emisión es obligatorio.',
  'validation.identity.issuedAtRequired': 'La fecha de emisión es obligatoria.',
  'validation.identity.expiresAtRequired': 'La fecha de caducidad es obligatoria.',
  'validation.identity.expiresAfterIssued':
    'La fecha de caducidad debe ser posterior a la fecha de emisión.',
  'validation.identity.userRequired': 'Usuario obligatorio.',
  'nav.controlCenter': 'Centro de control',
  'nav.moreServicesUnreadAria': 'Más servicios ({count} sin leer)',
  'nav.notificationsUnreadAria': 'Notificaciones ({count} sin leer)',
  'nav.messagesUnreadAria': 'Mensajes ({count} sin leer)',
  'nav.itemUnreadAria': '{label} ({count} sin leer)',
  'moxtHub.description':
    'Todos los servicios esenciales, acciones rápidas y tus espacios personales — en un solo lugar.',
  'moxtHub.primaryServicesDesc': 'Los nueve recorridos principales de MOXT.',
  'moxtHub.quickActionsDesc': 'Publica o inicia una operación con un toque.',
  'legal.pageEyebrow': 'Información legal',
  'legal.copyright': '© {year} MOXT. Todos los derechos reservados.',
  'legal.footer':
    'Plataforma MOXT — diáspora afro-rusa. Usa los servicios con cautela y verifica tus contactos.',
  'legal.nav.mentions': 'Aviso legal',
  'legal.nav.cgu': 'Términos de uso',
  'legal.nav.privacy': 'Privacidad',
  'legal.sections.cgu.title': 'Términos de uso',
  'legal.sections.privacy.title': 'Política de privacidad',
}

/** Ordered phrase replacements (longest first). Applied only in polish prefixes. */
const REPLACEMENTS = [
  ['Tody los os', 'Todos los'],
  ['tody los os', 'todos los'],
  ['Ninguen la', 'Ningún'],
  ['Ninguen la', 'Ninguna'],
  ['Publicadel en', 'Publicado el'],
  ['publicadel en', 'publicado el'],
  ['acompañady la', 'seguida'],
  ['notificadel dy', 'notificado de'],
  ['notificadel', 'notificado'],
  ['arquivady la', 'archivada'],
  ['arquivadas', 'archivadas'],
  ['Arquivado', 'Archivado'],
  ['verificadel', 'verificado'],
  ['Verificadel', 'Verificado'],
  ['inváleído', 'inválido'],
  ['inváleídel', 'inválido'],
  ['Inváleído', 'Inválido'],
  ['valeídacción', 'validación'],
  ['Valeídacción', 'Validación'],
  ['valeídady', 'validez'],
  ['valeídadel', 'validado'],
  ['valeídady la', 'validada'],
  ['comprovactivo', 'justificante'],
  ['Comprovactivo', 'Justificante'],
  ['Comprovactivos', 'Justificantes'],
  ['telesfoen el', 'teléfono'],
  ['Telesfoen el', 'Teléfono'],
  ['Telesfono', 'Teléfono'],
  ['mestodel', 'método'],
  ['Mestodel', 'Método'],
  ['Mestodo', 'Método'],
  ['Beneficiário', 'Beneficiario'],
  ['Numerário', 'Efectivo'],
  ['Mobily money', 'Dinero móvil'],
  ['formacción', 'formación'],
  ['Formacción', 'Formación'],
  ['esgotado', 'completo'],
  ['Esgotado', 'Completo'],
  ['Partidy la', 'Salida el'],
  ['partidy la', 'salida el'],
  ['Recogidy la', 'Recogida a partir del'],
  ['recogidy la', 'recogida a partir del'],
  ['Intesntelo', 'Inténtalo'],
  ['intesntelo', 'inténtalo'],
  ['digitallízar', 'escanear'],
  ['Digitallízy', 'Escanea'],
  ['Digitallízar', 'Escanear'],
  ['visibileídady', 'visibilidad'],
  ['Visibileídady', 'Visibilidad'],
  ['atuallízacción', 'actualización'],
  ['Atuallízacciones', 'Actualizaciones'],
  ['atuallízar', 'actualizar'],
  ['actuallízado', 'actualizado'],
  ['Actuallízado', 'Actualizado'],
  ['eliminação', 'eliminación'],
  ['Eliminação', 'Eliminación'],
  ['eliminação', 'eliminación'],
  ['moderacción', 'moderación'],
  ['procesamento', 'procesamiento'],
  ['Procesamento', 'Procesamiento'],
  ['efetuada', 'realizada'],
  ['efetuady la', 'realizada'],
  ['efetuar', 'realizar'],
  ['criada', 'creada'],
  ['criady la', 'creada'],
  ['Criado', 'Creado'],
  ['criada', 'creada'],
  ['declaradel', 'declarado'],
  ['recibidel', 'recibido'],
  ['Recibidel', 'Recibido'],
  ['enviadel', 'enviado'],
  ['Enviado', 'Enviado'],
  ['adicionadel', 'añadido'],
  ['Adicionadel', 'Añadido'],
  ['copiadel', 'copiado'],
  ['Copiadel', 'Copiado'],
  ['rechazodo', 'rechazado'],
  ['Rechazoda', 'Rechazada'],
  ['Pedidel', 'Solicitud'],
  ['pedidel', 'solicitud'],
  ['correspdóndy', 'corresponde'],
  ['acesible', 'accesible'],
  ['Aceso', 'Acceso'],
  ['aceso', 'acceso'],
  ['câmara', 'cámara'],
  ['Câmara', 'Cámara'],
  ['recoñecido', 'reconocido'],
  ['Olá', 'Hola'],
  ['gostaria dy my candidatar', 'me gustaría candidatarme'],
  ['gostaria dy reservar', 'me gustaría reservar'],
  ['cómo my inscrevo', 'cómo me inscribo'],
  ['poso ', 'puedo '],
  ['Poso ', 'Puedo '],
  ['pody ', 'puede '],
  ['Pody ', 'Puede '],
  ['Esty ', 'Este '],
  ['esty ', 'este '],
  ['nesty ', 'en este '],
  ['hacy ', 'hay '],
  ['Hacy ', 'Hay '],
  [' dy ', ' de '],
  [' Dy ', ' De '],
  [' en el leídos', ' sin leer'],
  [' en el leídas', ' sin leer'],
  ['A su ', 'Tu '],
  ['O su ', 'Tu '],
  ['a su ', 'tu '],
  ['o su ', 'tu '],
  ['los sus ', 'tus '],
  ['las sus ', 'tus '],
  ['Os mis ', 'Mis '],
  ['As mis ', 'Mis '],
  ['Os nuevos ', 'Las nuevas '],
  ['As nuevas ', 'Las nuevas '],
  ['Os otros ', 'Los otros '],
  ['O mi ', 'Mi '],
  ['A mi ', 'Mi '],
  ['O dirección', 'La dirección'],
  ['o dirección', 'la dirección'],
  ['O importy', 'El importe'],
  ['o importy', 'el importe'],
  ['Importy ', 'Importe '],
  ['A monedy la', 'La moneda'],
  ['a monedy la', 'la moneda'],
  ['O meio', 'El método'],
  ['o meio', 'el método'],
  ['Elección um', 'Elige un'],
  ['Elección uma', 'Elige una'],
  ['Elección o', 'Elige el'],
  ['Elección a', 'Elige la'],
  ['Elección ot', 'Elige ot'],
  ['Introduza', 'Introduce'],
  ['introduza', 'introduce'],
  ['Utilizy', 'Usa'],
  ['Verifiquy', 'Comprueba'],
  ['verifiquy', 'comprueba'],
  ['Confirmy', 'Confirma'],
  ['confirmy', 'confirma'],
  ['Publiquy', 'Publica'],
  ['publiquy', 'publica'],
  ['Faca a gestión', 'Gestiona'],
  ['Alterar a', 'Cambiar la'],
  ['Alterar o', 'Cambiar el'],
  ['Alteracción', 'Cambio'],
  ['alteracción', 'cambio'],
  ['Alteracciones', 'Cambios'],
  ['Peca ', 'Solicita '],
  ['peca ', 'solicita '],
  ['pesoa', 'persona'],
  ['Pesoas', 'Personas'],
  ['pesoais', 'personales'],
  ['Pesoais', 'Personales'],
  ['Nomy ', 'Nombre '],
  ['nomy ', 'nombre '],
  ['Apeleídel', 'Apellido'],
  ['apeleídel', 'apellido'],
  ['Apeleído', 'Apellido'],
  ['Data ', 'Fecha '],
  ['data ', 'fecha '],
  ['Aceso', 'Acceso'],
  ['Encontros', 'Encuentros'],
  ['Grátis', 'Gratis'],
  ['grátis', 'gratis'],
  ['Baixa', 'Baja'],
  ['baixa', 'baja'],
  ['Aparência', 'Apariencia'],
  ['Subscritores', 'Suscriptores'],
  ['subscrevy', 'se suscriba'],
  ['Cuándel', 'Cuando'],
  ['receby', 'recibes'],
  ['Receby', 'Recibes'],
  ['Resumens', 'Resúmenes'],
  ['Prioridady', 'Prioridad'],
  ['Imedíata', 'Inmediata'],
  ['Imedíatamenty', 'Inmediatamente'],
  ['Zoen la sensible', 'Zona sensible'],
  ['localmenty', 'localmente'],
  ['Pedidel registado', 'Solicitud registrada'],
  ['rechazodas', 'rechazadas'],
  ['Rechazodas', 'Rechazadas'],
  ['tempo real', 'tiempo real'],
  ['offliny', 'sin conexión'],
  ['Instaly', 'Instala'],
  ['reativy', 'reactiva'],
  ['Instalacción', 'Instalación'],
  ['Autorizy', 'Autoriza'],
  ['Toquy', 'Toca'],
  ['Fechy', 'Cierra'],
  ['chavy', 'clave'],
  ['Chavy', 'Clave'],
  ['reiniciy', 'reinicia'],
  ['No é posible', 'No es posible'],
  ['no é posible', 'no es posible'],
  [' é ', ' es '],
  ['É ', 'Es '],
  ['atravess', 'a través de'],
  ['Atravess', 'A través de'],
  ['Cuentacty', 'Contacta con'],
  ['cuentacty', 'contacta con'],
  ['anallísar', 'analizar'],
  ['anallísa', 'analiza'],
  ['Anallísi', 'Analiza'],
  ['Despuess', 'Después'],
  ['despuess', 'después'],
  ['nen ', 'ni '],
  ['reallízar', 'realizar'],
  ['haceê-lo', 'hacerlo'],
  ['Pody', 'Puedes'],
  ['pody', 'puedes'],
  ['guardato', 'guardado'],
  ['Guardato', 'Guardado'],
  ['marcady la', 'marcada'],
  ['procesará o solicitud', 'procesará la solicitud'],
  ['Um código', 'Un código'],
  ['um código', 'un código'],
  ['uma ', 'una '],
  ['Um ', 'Un '],
  ['um ', 'un '],
  ['Uma ', 'Una '],
  ['Os ', 'Los '],
  ['As ', 'Las '],
  ['O ', 'El '],
  ['A nuestra equipa', 'Nuestro equipo'],
  ['a nuestra equipa', 'nuestro equipo'],
  ['equipa', 'equipo'],
  ['Equipa', 'Equipo'],
  ['Entrega en mãos', 'Entrega en mano'],
  ['Porquê', 'Por qué'],
  ['Veja as', 'Consulta las'],
  ['consigo', 'contigo'],
  ['pelo ', 'por el '],
  ['pela ', 'por la '],
  ['pelos ', 'por los '],
  ['pelas ', 'por las '],
  ['nesty ', 'en este '],
  ['nesta ', 'en esta '],
  ['neste ', 'en este '],
  ['con um toque', 'con un toque'],
  ['con uma ', 'con una '],
  ['Tesrmien los', 'Términos de'],
  ['tesrmien los', 'términos de'],
  ['Información legais', 'Información legal'],
  ['información legais', 'información legal'],
  ['direitos reservados', 'derechos reservados'],
  ['Usi os servicios', 'Usa los servicios'],
  ['verifiquy os sus cuentactos', 'verifica tus contactos'],
  ['cuentactos', 'contactos'],
  ['Cuentacto', 'Contacto'],
  ['cuentacto', 'contacto'],
  ['Cuentacta-o', 'Te contactaremos'],
  ['Indique-my', 'Indícame'],
  ['Indiquy', 'Indica'],
  ['dar-my', 'darme'],
  ['Escriba-my', 'Escríbeme'],
  ['Seria posible', '¿Sería posible'],
  ['Troquy', 'Intercambia'],
  ['No enviy', 'No envíes'],
  ['Consellos', 'Consejos'],
  ['Remuneracción', 'Remuneración'],
  ['Benefícios', 'Beneficios'],
  ['Setor', 'Sector'],
  ['setor', 'sector'],
  ['Profisón', 'Profesión'],
  ['Oportunidads', 'Oportunidades'],
  ['Volty', 'Vuelve'],
  ['Traty', 'Gestiona'],
  ['traty', 'gestiona'],
  ['Tratadel', 'Gestionado'],
  ['tratadel', 'gestionado'],
  ['Encerrada', 'Cerrada'],
  ['encerrada', 'cerrada'],
  ['Encerradas', 'Cerradas'],
  ['Encerrados', 'Cerrados'],
  ['Encerrado', 'Cerrado'],
  ['Encerrady la', 'Cerrada'],
  ['Detally', 'Detalle'],
  ['Criacción', 'Creación'],
  ['criacción', 'creación'],
  ['Estimactiva', 'Estimación'],
  ['estimactiva', 'estimación'],
  ['Estime', 'Estima'],
  ['criy', 'crea'],
  ['Criy', 'Crea'],
  ['condicións', 'estados'],
  ['resultadel', 'resultado'],
  ['sentidel', 'sentido'],
  ['Sentidel', 'Sentido'],
  ['Inverter o', 'Invertir el'],
  ['Corrija o', 'Corrige el'],
  ['fonty', 'fuente'],
  ['ligeiramente', 'ligeramente'],
  ['Preencha', 'Rellena'],
  ['preencha', 'rellena'],
  ['própria', 'propia'],
  ['próprios', 'propios'],
  ['Própria', 'Propia'],
  ['Próximos', 'Próximos'],
  ['aparecerón', 'aparecerán'],
  ['Aparecerón', 'Aparecerán'],
  ['hover', 'queden'],
  ['tiver', 'tienes'],
  ['quy', 'qué'],
  ['Quy', 'Qué'],
  ['certa', 'correcta'],
  ['guiá-lo', 'guiarte'],
  ['efetuar uma transferencia', 'realizar una transferencia'],
  ['atravess dy um viajero', 'a través de un viajero'],
  ['litígio', 'disputa'],
  ['Fallo dy envio', 'Error de envío'],
  ['mensajy', 'mensaje'],
  ['removidy la', 'eliminado'],
  ['Respdónder', 'Responder'],
  ['sobry', 'sobre'],
  ['interesi', 'interés'],
  ['indicadel', 'indicado'],
  ['artigo', 'artículo'],
  ['vaga', 'vacante'],
  ['breve apresentacción', 'breve presentación'],
  ['recrutamento', 'reclutamiento'],
  ['contenidel', 'contenido'],
  ['depósito y dy levantamento', 'depósito y recogida'],
  ['aceitam', 'aceptáis'],
  ['deslocar', 'desplazarte'],
  ['lembretes', 'recordatorios'],
  ['Capaciudad', 'Capacidad'],
  ['capaciudad', 'capacidad'],
  ['transporty', 'transporte'],
  ['Comprovactivo verificado', 'Justificante verificado'],
  ['Seja o primer', 'Sé el primero'],
  ['trajeto', 'ruta'],
  ['Viajy', 'Viaje'],
  ['viajy', 'viaje'],
  ['Viajes', 'Viajes'],
  ['Ninguen la viajy', 'Ningún viaje'],
  ['marketplacy', 'marketplace'],
  ['meen los', 'menos'],
  ['Bairro', 'Distrito'],
  ['Desconto', 'Descuento'],
  ['Cor', 'Color'],
  ['visuallízacciones', 'visualizaciones'],
  ['Grátis o a negociar', 'Gratis o negociable'],
  ['Sob consulta', 'Bajo consulta'],
  ['venda', 'venta'],
  ['comesrcio', 'comercio'],
  ['Saúdy', 'Salud'],
  ['Construción', 'Construcción'],
  ['Imobiliário', 'Inmobiliario'],
  ['Ensien el', 'Enseñanza'],
  ['Restauracción', 'Hostelería'],
  ['Tempo completo', 'Tiempo completo'],
  ['Tempo parcial', 'Tiempo parcial'],
  ['Estágio', 'Prácticas'],
  ['Garantia', 'Garantía'],
  ['TRANSFERÊNCIA', 'TRANSFERENCIA'],
  ['janela dy impresón', 'ventana de impresión'],
  ['geradel', 'generado'],
  ['Numerário', 'Efectivo'],
  ['Outro', 'Otro'],
  ['registada', 'registrada'],
  ['Registada', 'Registrada'],
  ['Saldel', 'Saldo'],
  ['saldel', 'saldo'],
  ['fundos', 'fondos'],
  ['Percurso', 'Recorrido'],
  ['etapas', 'pasos'],
  ['estón', 'están'],
  ['breve poderá', 'pronto podrás'],
  ['brevy poderá', 'pronto podrás'],
  ['aguardar', 'esperar'],
  ['aguardar a', 'esperar la'],
  ['A aguardar', 'Esperando'],
  ['encerrada', 'cerrada'],
  ['encerrado', 'cerrado'],
  ['qualquer otra', 'ninguna otra'],
  ['qualquer pago', 'ningún pago'],
  ['escollê-lo', 'elegirte'],
  ['aparecy', 'aparece'],
  ['mostrady los', 'mostrados'],
  ['són ', 'son '],
  ['Són ', 'Son '],
  ['monedy las', 'monedas'],
  ['receby', 'recibe'],
  ['Receby', 'Recibe'],
  ['recebeu', 'recibió'],
  ['recebe', 'recibe'],
  ['Nome', 'Nombre'],
  ['Redy o banco', 'Red o banco'],
  ['parceira', 'asociada'],
  ['selecionady la', 'seleccionada'],
  ['assistidy la', 'asistida'],
  ['Proteción', 'Protección'],
  ['contestacciones', 'disputas'],
  ['Ayudy la', 'Ayuda'],
  ['Díagnóstico', 'Diagnóstico'],
  ['cópia', 'copia'],
  ['reposición', 'restauración'],
  ['Preenchimento', 'Completado'],
  ['Completar o mi perfil', 'Completar mi perfil'],
  ['selo verde', 'sello verde'],
  ['selo dy confianza', 'sello de confianza'],
  ['persistenty', 'persistentemente'],
  ['guardady la', 'guardada'],
  ['nible', 'nivel'],
  ['residência', 'residencia'],
  ['Residência', 'Residencia'],
  ['seguidel', 'seguido de'],
  ['Fijadel', 'Fijado'],
  ['fijadel', 'fijado'],
  ['Convidy', 'Invita'],
  ['contestacciones', 'reclamaciones'],
  ['asistência', 'asistencia'],
  ['utilizacción', 'utilización'],
  ['despuess aprovy', 'luego aprueba'],
  ['aprovy', 'aprueba'],
  ['recuse', 'rechaza'],
  ['visuallízy', 'visualiza'],
  ['bancário', 'bancario'],
  ['condución', 'conducción'],
  ['isolady la', 'solo'],
  ['enquadramento', 'encuadre'],
  ['plastificadel', 'plastificado'],
  ['qualidade', 'calidad'],
  ['legible', 'legible'],
  ['digitallízacción', 'digitalización'],
  ['qualeídady', 'calidad'],
  ['painel', 'panel'],
  ['Painel', 'Panel'],
  ['visibileídady dy la agendy la', 'visibilidad de la agenda'],
  ['agendy la', 'agenda'],
  ['ritmo dy publicación', 'ritmo de publicación'],
  ['anuncios, actividad comercial', 'anuncios, actividad comercial'],
  ['QR cody', 'código QR'],
  ['cody', 'código'],
  ['Cody', 'Código'],
  ['novy', 'nueve'],
  ['percursos', 'recorridos'],
  ['pesoais', 'personales'],
  ['rápidy las', 'rápidas'],
  ['Todel', 'Todo'],
  ['marketplacy', 'marketplace'],
  ['quiesn', 'quien'],
  ['intesntelo dy nuevo', 'inténtalo de nuevo'],
  ['está a escribir', 'está escribiendo'],
  ['está a usar', 'está usando'],
  ['está a ser', 'está siendo'],
  ['a ser acompañady la', 'siendo seguida'],
  ['a usar a câmara', 'usando la cámara'],
  ['a verificar', 'verificando'],
  ['a activar', 'activando'],
  ['a enviar', 'enviando'],
  ['a guardar', 'guardando'],
  ['a carregar', 'cargando'],
  ['A carregar', 'Cargando'],
  ['A enviar', 'Enviando'],
  ['A guardar', 'Guardando'],
]

REPLACEMENTS.sort((a, b) => b[0].length - a[0].length)

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
    if (node[key] == null || typeof node[key] !== 'object' || Array.isArray(node[key])) {
      node[key] = {}
    }
    node = node[key]
  }
  node[parts[parts.length - 1]] = value
}

function shouldPolish(key) {
  return POLISH_PREFIXES.some((p) => key === p || key.startsWith(`${p}.`))
}

function maskPlaceholders(text) {
  const values = []
  const masked = String(text).replace(/\{[^{}]+\}/g, (m) => {
    values.push(m)
    return `__PH${values.length - 1}__`
  })
  return { masked, values }
}

function unmaskPlaceholders(text, values) {
  let out = text
  values.forEach((v, i) => {
    out = out.split(`__PH${i}__`).join(v)
  })
  return out
}

function applyReplacements(text) {
  const { masked, values } = maskPlaceholders(text)
  let s = masked
  for (const [from, to] of REPLACEMENTS) {
    if (s.includes(from)) s = s.split(from).join(to)
  }
  return unmaskPlaceholders(s, values)
}

const next = structuredClone(currentEs)
const flat = flatten(next)
let overrideCount = 0
let replaceCount = 0

for (const [key, override] of Object.entries(OVERRIDES)) {
  if (flat[key] !== undefined && flat[key] !== override) {
    setPath(next, key, override)
    overrideCount += 1
  }
}

const nextFlat = flatten(next)
for (const [key, value] of Object.entries(nextFlat)) {
  if (!shouldPolish(key)) continue
  if (typeof value !== 'string') continue
  if (OVERRIDES[key]) continue
  const polished = applyReplacements(value)
  if (polished !== value) {
    setPath(next, key, polished)
    replaceCount += 1
  }
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
  return `{\n${entries
    .map(([k, v]) => {
      const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k)
      return `${padInner}${key}: ${serialize(v, indent + 1)},`
    })
    .join('\n')}\n${pad}}`
}

const header = '/** Spanish UI copy for MOXT. */\nexport const es = '
fs.writeFileSync(ES_FILE, `${header}${serialize(next, 0)}\n`, 'utf8')

const enFlat = flatten(en)
const finalFlat = flatten(next)
const same = Object.keys(enFlat).filter((k) => finalFlat[k] === enFlat[k]).length
console.log(
  JSON.stringify(
    {
      overrideCount,
      replaceCount,
      sameAsEn: same,
      different: Object.keys(enFlat).length - same,
      pctIdentical: ((100 * same) / Object.keys(enFlat).length).toFixed(1),
    },
    null,
    2,
  ),
)
