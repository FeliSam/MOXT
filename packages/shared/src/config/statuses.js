export const STATUS_META = {
  active: { label: 'Actif', tone: 'success' },
  approved: { label: 'Approuvé', tone: 'success' },
  archived: { label: 'Archivé', tone: 'info' },
  blocked: { label: 'Bloqué', tone: 'danger' },
  cancelled: { label: 'Annulé', tone: 'danger' },
  closed: { label: 'Fermé', tone: 'info' },
  completed: { label: 'Terminé', tone: 'success' },
  draft: { label: 'Brouillon', tone: 'info' },
  expired: { label: 'Expiré', tone: 'danger' },
  full: { label: 'Complet', tone: 'warning' },
  in_progress: { label: 'En cours', tone: 'warning' },
  new: { label: 'Nouveau', tone: 'info' },
  pending: { label: 'En attente', tone: 'warning' },
  pending_review: { label: 'En vérification', tone: 'warning' },
  published: { label: 'Publié', tone: 'success' },
  registered: { label: 'Inscrit', tone: 'success' },
  rejected: { label: 'Refusé', tone: 'danger' },
  resolved: { label: 'Résolu', tone: 'success' },
  sold: { label: 'Vendu', tone: 'info' },
  submitted: { label: 'Envoyé', tone: 'success' },
  suspended: { label: 'Suspendu', tone: 'warning' },
  verified: { label: 'Vérifié', tone: 'success' },
  waiting_agent: { label: 'Attente support', tone: 'warning' },
  waiting_user: { label: 'Votre réponse attendue', tone: 'info' },
}

export function statusMeta(status) {
  return STATUS_META[status] || { label: status, tone: 'brand' }
}
