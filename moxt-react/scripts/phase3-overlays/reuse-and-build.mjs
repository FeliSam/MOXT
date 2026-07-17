import fs from 'fs'
import { writeOverlay } from './writeOverlay.mjs'

const frToTr = new Map()
function add(fr, en, ru, pt) {
  if (fr != null && !frToTr.has(fr)) frToTr.set(fr, [en, ru, pt])
}

for (const group of ['g1', 'g2']) {
  const fr = JSON.parse(fs.readFileSync(`${group}-fr.json`, 'utf8'))
  const ov = JSON.parse(fs.readFileSync(`${group}.json`, 'utf8'))
  for (const key of Object.keys(fr)) {
    add(fr[key], ov.en[key], ov.ru[key], ov.pt[key])
  }
}

const common = [
  ['Marketplace', 'Marketplace', 'Маркетплейс', 'Marketplace'],
  ['Archiver', 'Archive', 'В архив', 'Arquivar'],
  ['Restaurer', 'Restore', 'Восстановить', 'Restaurar'],
  ['Réessayer', 'Retry', 'Повторить', 'Tentar novamente'],
  ['Utilisateur', 'User', 'Пользователь', 'Utilizador'],
  ['Contacter', 'Contact', 'Связаться', 'Contactar'],
  ['Ouverture…', 'Opening…', 'Открытие…', 'A abrir…'],
  ['Emploi', 'Job', 'Вакансия', 'Emprego'],
  ['Discussion', 'Chat', 'Обсуждение', 'Discussão'],
  ['Échange P2P', 'P2P exchange', 'P2P-обмен', 'Troca P2P'],
  ['Recrutement', 'Recruiting', 'Набор', 'Recrutamento'],
  ['Entrée gratuite', 'Free entry', 'Бесплатный вход', 'Entrada gratuita'],
  ["Aujourd'hui", 'Today', 'Сегодня', 'Hoje'],
  ['Hier', 'Yesterday', 'Вчера', 'Ontem'],
  ['Photo', 'Photo', 'Фото', 'Foto'],
  ['Pièce jointe', 'Attachment', 'Вложение', 'Anexo'],
  ['Mes activités', 'My activity', 'Моя активность', 'A minha atividade'],
  ['MOXT', 'MOXT', 'MOXT', 'MOXT'],
  ['—', '—', '—', '—'],
  ['Transfert', 'Transfer', 'Перевод', 'Transferência'],
  ['Colis', 'Parcels', 'Посылки', 'Encomendas'],
  ['Jobs', 'Jobs', 'Вакансии', 'Empregos'],
  ['Events', 'Events', 'События', 'Eventos'],
  ['P2P', 'P2P', 'P2P', 'P2P'],
  ['Annonces', 'Listings', 'Объявления', 'Anúncios'],
  ['Événements', 'Events', 'События', 'Eventos'],
  ['Russie', 'Russia', 'Россия', 'Rússia'],
  ['Ville', 'City', 'Город', 'Cidade'],
  ['Pays', 'Country', 'Страна', 'País'],
  ['Téléphone', 'Phone', 'Телефон', 'Telefone'],
  ['Email', 'Email', 'Эл. почта', 'E-mail'],
  ['Adresse', 'Address', 'Адрес', 'Morada'],
  ['Modifier', 'Edit', 'Изменить', 'Editar'],
  ['Supprimer', 'Delete', 'Удалить', 'Eliminar'],
  ['Annuler', 'Cancel', 'Отмена', 'Cancelar'],
  ['Enregistrer', 'Save', 'Сохранить', 'Guardar'],
  ['Continuer', 'Continue', 'Продолжить', 'Continuar'],
  ['Retour', 'Back', 'Назад', 'Voltar'],
  ['Consulter', 'View', 'Смотреть', 'Consultar'],
  ['Statut', 'Status', 'Статус', 'Estado'],
  ['Localisation', 'Location', 'Локация', 'Localização'],
  ['Publications', 'Publications', 'Публикации', 'Publicações'],
  ['Annuaire', 'Directory', 'Каталог', 'Diretório'],
  ['Service', 'Service', 'Услуга', 'Serviço'],
  ['Secteur', 'Sector', 'Сектор', 'Setor'],
  ['Horaires', 'Hours', 'Часы работы', 'Horário'],
  ['Zones', 'Zones', 'Зоны', 'Zonas'],
  ['À confirmer', 'To confirm', 'Уточняется', 'A confirmar'],
  ['À compléter', 'To complete', 'Заполнить', 'A completar'],
  ['Oui', 'Yes', 'Да', 'Sim'],
  ['Non', 'No', 'Нет', 'Não'],
  ['Tout', 'All', 'Все', 'Tudo'],
  ['Voir', 'View', 'Смотреть', 'Ver'],
  ['Ouvrir', 'Open', 'Открыть', 'Abrir'],
  ['Valider', 'Approve', 'Подтвердить', 'Validar'],
  ['Refuser', 'Reject', 'Отклонить', 'Recusar'],
  ['Publier', 'Publish', 'Опубликовать', 'Publicar'],
  ['Activer', 'Activate', 'Активировать', 'Ativar'],
  ['Ignorer', 'Dismiss', 'Игнорировать', 'Ignorar'],
  ['Traiter', 'Resolve', 'Обработать', 'Tratar'],
  ['Cloturer', 'Close', 'Закрыть', 'Encerrar'],
  ['Masquer', 'Hide', 'Скрыть', 'Ocultar'],
  ['Suspendre', 'Suspend', 'Приостановить', 'Suspender'],
  ['Reactiver', 'Reactivate', 'Восстановить', 'Reativar'],
  ['Resoudre', 'Resolve', 'Решить', 'Resolver'],
  ['Envoyer', 'Send', 'Отправить', 'Enviar'],
  ['Ajouter', 'Add', 'Добавить', 'Adicionar'],
  ['Retirer', 'Remove', 'Убрать', 'Remover'],
  ['Profil', 'Profile', 'Профиль', 'Perfil'],
  ['Document', 'Document', 'Документ', 'Documento'],
  ['Documents', 'Documents', 'Документы', 'Documentos'],
  ['Support', 'Support', 'Поддержка', 'Suporte'],
  ['Administration', 'Administration', 'Администрирование', 'Administração'],
  ['Utilisateurs', 'Users', 'Пользователи', 'Utilizadores'],
  ['Audit', 'Audit', 'Аудит', 'Auditoria'],
  ['Signalements', 'Reports', 'Жалобы', 'Denúncias'],
  ['Litiges', 'Disputes', 'Споры', 'Litígios'],
  ['Total', 'Total', 'Всего', 'Total'],
  ['En cours', 'In progress', 'В процессе', 'Em curso'],
  ['global', 'global', 'глобальный', 'global'],
  ['Actif', 'Active', 'Активен', 'Ativo'],
  ['Prêt', 'Ready', 'Готово', 'Pronto'],
  ['Par défaut', 'Default', 'По умолчанию', 'Predefinição'],
  ['Masqué', 'Hidden', 'Скрыто', 'Oculto'],
  ['Libellé', 'Label', 'Метка', 'Etiqueta'],
  ['Instructions', 'Instructions', 'Инструкции', 'Instruções'],
  ['Gestionnaire', 'Manager', 'Менеджер', 'Gestor'],
  ['Éditeur', 'Editor', 'Редактор', 'Editor'],
  ['Client', 'Client', 'Клиент', 'Cliente'],
  ['Destinataire', 'Recipient', 'Получатель', 'Destinatário'],
  ['Terminer', 'Complete', 'Завершить', 'Concluir'],
  ['Chronologie', 'Timeline', 'Хронология', 'Cronologia'],
  ['Toutes', 'All', 'Все', 'Todas'],
  ['Identité', 'Identity', 'Личность', 'Identidade'],
  ['Activité', 'Activity', 'Активность', 'Atividade'],
  ['Communauté', 'Community', 'Сообщество', 'Comunidade'],
  ['Conformité', 'Compliance', 'Соответствие', 'Conformidade'],
  ['Pilotage', 'Insights', 'Управление', 'Pilotagem'],
  ['Aperçu', 'Overview', 'Обзор', 'Vista geral'],
  ['Demandes', 'Requests', 'Заявки', 'Pedidos'],
  ['Transferts', 'Transfers', 'Переводы', 'Transferências'],
  ['Abonnements', 'Subscriptions', 'Подписки', 'Subscrições'],
  ['Avis', 'Reviews', 'Отзывы', 'Avaliações'],
  ['Membres', 'Members', 'Участники', 'Membros'],
  ['Statistiques', 'Statistics', 'Статистика', 'Estatísticas'],
  ['Actions', 'Actions', 'Действия', 'Ações'],
]
for (const [fr, en, ru, pt] of common) add(fr, en, ru, pt)

const overrides = fs.existsSync('key-overrides.json')
  ? JSON.parse(fs.readFileSync('key-overrides.json', 'utf8'))
  : {}

for (const group of ['g3', 'g4', 'g5']) {
  const fr = JSON.parse(fs.readFileSync(`${group}-fr.json`, 'utf8'))
  const rows = []
  const missing = []
  for (const [key, val] of Object.entries(fr)) {
    if (overrides[key]) {
      rows.push([key, ...overrides[key]])
      continue
    }
    const tr = frToTr.get(val)
    if (tr) {
      rows.push([key, ...tr])
      continue
    }
    missing.push({ key, fr: val })
  }
  fs.writeFileSync(`${group}-still.json`, JSON.stringify(missing, null, 2))
  console.log(group, 'ready', rows.length, 'still', missing.length)
  if (missing.length === 0) writeOverlay(group, rows)
  else fs.writeFileSync(`${group}-partial-rows.json`, JSON.stringify(rows))
}
