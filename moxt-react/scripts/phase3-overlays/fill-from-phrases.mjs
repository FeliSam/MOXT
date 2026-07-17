/**
 * Fill Phase 3 EN/RU/PT overlays from FR group files.
 * Uses exact FR phrase dictionary + per-key overrides.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { writeOverlay } from './writeOverlay.mjs'

const dir = path.dirname(fileURLToPath(import.meta.url))

/** Exact French phrase → [en, ru, pt] */
const PHRASES = {
  Compte: ['Account', 'Аккаунт', 'Conta'],
  Annuler: ['Cancel', 'Отмена', 'Cancelar'],
  Enregistrer: ['Save', 'Сохранить', 'Guardar'],
  Continuer: ['Continue', 'Продолжить', 'Continuar'],
  Retour: ['Back', 'Назад', 'Voltar'],
  Modifier: ['Edit', 'Изменить', 'Editar'],
  Supprimer: ['Delete', 'Удалить', 'Eliminar'],
  Ajouter: ['Add', 'Добавить', 'Adicionar'],
  Ouvrir: ['Open', 'Открыть', 'Abrir'],
  Retirer: ['Remove', 'Убрать', 'Remover'],
  Sélectionner: ['Select', 'Выбрать', 'Selecionar'],
  Pays: ['Country', 'Страна', 'País'],
  Ville: ['City', 'Город', 'Cidade'],
  Tous: ['All', 'Все', 'Todos'],
  Tout: ['All', 'Все', 'Tudo'],
  Envoyer: ['Send', 'Отправить', 'Enviar'],
  Partager: ['Share', 'Поделиться', 'Partilhar'],
  Voir: ['View', 'Смотреть', 'Ver'],
  Précédent: ['Previous', 'Назад', 'Anterior'],
  Erreur: ['Error', 'Ошибка', 'Erro'],
  Communauté: ['Community', 'Сообщество', 'Comunidade'],
  Finances: ['Finances', 'Финансы', 'Finanças'],
  Membres: ['Members', 'Участники', 'Membros'],
  Entreprises: ['Businesses', 'Компании', 'Empresas'],
  Abonnés: ['Subscribers', 'Подписчики', 'Subscritores'],
  Annonces: ['Listings', 'Объявления', 'Anúncios'],
  Colis: ['Parcels', 'Посылки', 'Encomendas'],
  Jobs: ['Jobs', 'Вакансии', 'Empregos'],
  Événements: ['Events', 'События', 'Eventos'],
  Publications: ['Publications', 'Публикации', 'Publicações'],
  Identité: ['Identity', 'Личность', 'Identidade'],
  Téléphone: ['Phone', 'Телефон', 'Telefone'],
  'E-mail': ['Email', 'Эл. почта', 'E-mail'],
  Email: ['Email', 'Эл. почта', 'E-mail'],
  Selfie: ['Selfie', 'Селфи', 'Selfie'],
  Domicile: ['Address', 'Адрес', 'Morada'],
  Confirmation: ['Confirmation', 'Подтверждение', 'Confirmação'],
  Niveau: ['Level', 'Уровень', 'Nível'],
  Passeport: ['Passport', 'Паспорт', 'Passaporte'],
  Actives: ['Active', 'Активные', 'Ativas'],
  Archives: ['Archives', 'Архив', 'Arquivos'],
  Fermer: ['Close', 'Закрыть', 'Fechar'],
  Publier: ['Publish', 'Опубликовать', 'Publicar'],
  Aimer: ['Like', 'Нравится', 'Gostar'],
  Contenu: ['Content', 'Содержимое', 'Conteúdo'],
  Nom: ['Name', 'Имя', 'Nome'],
  Type: ['Type', 'Тип', 'Tipo'],
  Frais: ['Fees', 'Комиссия', 'Taxas'],
  Note: ['Rating', 'Оценка', 'Nota'],
  Disponible: ['Available', 'Доступен', 'Disponível'],
  Partenaires: ['Partners', 'Партнёры', 'Parceiros'],
  Méthodes: ['Methods', 'Методы', 'Métodos'],
  Paiement: ['Payment', 'Платёж', 'Pagamento'],
  Gratuit: ['Free', 'Бесплатно', 'Grátis'],
  Archiver: ['Archive', 'В архив', 'Arquivar'],
  Republier: ['Republish', 'Опубликовать снова', 'Republicar'],
  Avis: ['Reviews', 'Отзывы', 'Avaliações'],
  Post: ['Post', 'Пост', 'Post'],
  Annonce: ['Listing', 'Объявление', 'Anúncio'],
  Entreprise: ['Business', 'Компания', 'Empresa'],
  Événement: ['Event', 'Событие', 'Evento'],
  Job: ['Job', 'Вакансия', 'Emprego'],
  'En ligne': ['Online', 'Онлайн', 'Online'],
  Aperçu: ['Preview', 'Превью', 'Pré-visualização'],
  Sujet: ['Subject', 'Тема', 'Assunto'],
  Message: ['Message', 'Сообщение', 'Mensagem'],
  Priorité: ['Priority', 'Приоритет', 'Prioridade'],
  Statut: ['Status', 'Статус', 'Estado'],
  Adresse: ['Address', 'Адрес', 'Morada'],
  Contact: ['Contact', 'Контакт', 'Contacto'],
  Profil: ['Profile', 'Профиль', 'Perfil'],
  Service: ['Service', 'Услуга', 'Serviço'],
  Secteur: ['Sector', 'Сектор', 'Setor'],
  Horaires: ['Hours', 'Часы работы', 'Horário'],
  Zones: ['Zones', 'Зоны', 'Zonas'],
  Documents: ['Documents', 'Документы', 'Documentos'],
  Document: ['Document', 'Документ', 'Documento'],
  Transfert: ['Transfer', 'Перевод', 'Transferência'],
  Marketplace: ['Marketplace', 'Маркетплейс', 'Marketplace'],
  Events: ['Events', 'События', 'Eventos'],
  P2P: ['P2P', 'P2P', 'P2P'],
  Russie: ['Russia', 'Россия', 'Rússia'],
  Oui: ['Yes', 'Да', 'Sim'],
  Non: ['No', 'Нет', 'Não'],
  Actif: ['Active', 'Активен', 'Ativo'],
  Valider: ['Approve', 'Подтвердить', 'Validar'],
  Refuser: ['Reject', 'Отклонить', 'Recusar'],
  Activer: ['Activate', 'Активировать', 'Ativar'],
  Traiter: ['Process', 'Обработать', 'Tratar'],
  Terminer: ['Complete', 'Завершить', 'Concluir'],
  Client: ['Client', 'Клиент', 'Cliente'],
  Destinataire: ['Recipient', 'Получатель', 'Destinatário'],
  Prêt: ['Ready', 'Готово', 'Pronto'],
  'À compléter': ['To complete', 'Заполнить', 'A completar'],
  'Par défaut': ['Default', 'По умолчанию', 'Predefinição'],
  Masqué: ['Hidden', 'Скрыто', 'Oculto'],
  Libellé: ['Label', 'Метка', 'Etiqueta'],
  Instructions: ['Instructions', 'Инструкции', 'Instruções'],
  Gestionnaire: ['Manager', 'Менеджер', 'Gestor'],
  Support: ['Support', 'Поддержка', 'Suporte'],
  Éditeur: ['Editor', 'Редактор', 'Editor'],
  Administration: ['Administration', 'Администрирование', 'Administração'],
  Utilisateurs: ['Users', 'Пользователи', 'Utilizadores'],
  Audit: ['Audit', 'Аудит', 'Auditoria'],
  Signalements: ['Reports', 'Жалобы', 'Denúncias'],
  Litiges: ['Disputes', 'Споры', 'Litígios'],
  Total: ['Total', 'Всего', 'Total'],
  'En cours': ['In progress', 'В процессе', 'Em curso'],
  global: ['global', 'глобальный', 'global'],
}

/** key → [en, ru, pt] overrides for full sentences / unique strings */
const KEY_OVERRIDES = {}

function loadOverrides() {
  const overridePath = path.join(dir, 'key-overrides.json')
  if (fs.existsSync(overridePath)) {
    Object.assign(KEY_OVERRIDES, JSON.parse(fs.readFileSync(overridePath, 'utf8')))
  }
}

function translatePhrase(fr) {
  if (PHRASES[fr]) return PHRASES[fr]
  // Trim trailing punctuation variants
  const trimmed = fr.trim()
  if (PHRASES[trimmed]) return PHRASES[trimmed]
  return null
}

function translateValue(key, fr) {
  if (KEY_OVERRIDES[key]) return KEY_OVERRIDES[key]
  const exact = translatePhrase(fr)
  if (exact) return exact
  // Fallback: keep FR temporarily — caller must ensure overrides cover long strings
  return null
}

export function buildRows(name) {
  loadOverrides()
  const fr = JSON.parse(fs.readFileSync(path.join(dir, `${name}-fr.json`), 'utf8'))
  const rows = []
  const unresolved = []
  for (const [key, value] of Object.entries(fr)) {
    const tr = translateValue(key, value)
    if (!tr) unresolved.push(key)
    else rows.push([key, tr[0], tr[1], tr[2]])
  }
  return { rows, unresolved, total: Object.keys(fr).length }
}

const group = process.argv[2]
if (group) {
  loadOverrides()
  const { rows, unresolved, total } = buildRows(group)
  console.log(group, 'resolved', rows.length, '/', total, 'unresolved', unresolved.length)
  if (unresolved.length) {
    fs.writeFileSync(
      path.join(dir, `${group}-unresolved.json`),
      JSON.stringify(unresolved.map((k) => ({ key: k, fr: JSON.parse(fs.readFileSync(path.join(dir, `${group}-fr.json`), 'utf8'))[k] })), null, 2),
    )
    console.log('wrote', `${group}-unresolved.json`)
  }
  if (unresolved.length === 0) writeOverlay(group, rows)
}
