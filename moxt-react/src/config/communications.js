import { FiBox, FiBriefcase, FiCalendar, FiRepeat, FiShoppingBag, FiUsers } from 'react-icons/fi'

export const RELATED_CONTENT_META = {
  business: { icon: FiBriefcase, label: 'Entreprise', tone: 'bg-violet-500' },
  event: { icon: FiCalendar, label: 'Événement', tone: 'bg-amber-500' },
  job: { icon: FiBriefcase, label: 'Job', tone: 'bg-blue-500' },
  listing: { icon: FiShoppingBag, label: 'Annonce', tone: 'bg-pink-500' },
  parcel: { icon: FiBox, label: 'Colis', tone: 'bg-orange-500' },
  transfer: { icon: FiRepeat, label: 'Transfert', tone: 'bg-emerald-600' },
  general: { icon: FiUsers, label: 'Discussion', tone: 'bg-slate-500' },
}

export const MESSAGE_SUGGESTIONS = {
  business: [
    'Bonjour, quels services proposez-vous ?',
    'Quels sont vos horaires ?',
    'Je souhaite obtenir un devis.',
  ],
  event: [
    'Bonjour, reste-t-il des places ?',
    'Comment se déroule l’inscription ?',
    'Le lieu est-il accessible ?',
  ],
  job: [
    'Bonjour, le poste est-il toujours disponible ?',
    'Puis-je envoyer mon CV ?',
    'Quel est le processus de recrutement ?',
  ],
  listing: [
    'Bonjour, cette annonce est-elle disponible ?',
    'Le prix est-il négociable ?',
    'Pouvez-vous partager plus de détails ?',
  ],
  parcel: [
    'Bonjour, combien de kilos restent disponibles ?',
    'Quel est le délai prévu ?',
    'Quels objets acceptez-vous ?',
  ],
  transfer: [
    'Bonjour, pouvez-vous confirmer le statut du paiement ?',
    'La preuve de paiement est-elle suffisante ?',
    'Quel est le délai restant pour finaliser le transfert ?',
  ],
  general: [
    'Bonjour, je souhaite en savoir plus.',
    'Merci pour votre message.',
    'Pouvez-vous préciser votre demande ?',
  ],
}

export function messageSuggestionsFor(relatedType) {
  return MESSAGE_SUGGESTIONS[relatedType] || MESSAGE_SUGGESTIONS.general
}
