import {
  FiBox,
  FiGlobe,
  FiMessageSquare,
  FiRepeat,
  FiShield,
  FiShoppingBag,
  FiSmartphone,
  FiUsers,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'

export const PUBLIC_SERVICES = [
  { id: 'transfers', icon: FiRepeat },
  { id: 'parcels', icon: FiBox },
  { id: 'marketplace', icon: FiShoppingBag },
  { id: 'businesses', icon: HiOutlineBuildingOffice2 },
  { id: 'community', icon: FiUsers },
  { id: 'messages', icon: FiMessageSquare },
]

export const TRUST_PRINCIPLES = [
  { id: 'phone', icon: FiSmartphone },
  { id: 'identity', icon: FiShield },
  { id: 'messaging', icon: FiMessageSquare },
  { id: 'validation', icon: FiRepeat },
]

export const PRESENTATION_PILLARS = [
  { id: 'transfers', icon: FiRepeat },
  { id: 'community', icon: FiUsers },
  { id: 'trust', icon: FiShield },
  { id: 'i18n', icon: FiGlobe },
]

export const FAQ_ITEMS = [
  {
    question: 'Pourquoi dois-je confirmer mon numéro russe ?',
    answer:
      'Pour publier une annonce, un colis, un job ou un événement, MOXT exige un numéro +7 vérifié par SMS. Cela limite les faux comptes et protège la communauté. La messagerie reste accessible sans cette étape.',
  },
  {
    question: 'Quels sont les trois niveaux de vérification ?',
    answer:
      '1) Téléphone russe (OTP) pour publier. 2) Identité MOXT (pièce + selfie) pour entreprise et transferts. 3) Renforcée (+ justificatif de domicile) pour des plafonds plus élevés.',
  },
  {
    question: 'Quelle différence entre profil vérifié et profil complet ?',
    answer:
      'Profil complet = vos champs sont renseignés (nom, contact, ville, pays…). Profil vérifié = l’équipe MOXT a validé votre identité via documents (KYC) : badge vert, plafonds plus élevés et opérations sensibles. Un profil peut être complet sans être vérifié.',
  },
  {
    question: 'J’ai créé mon compte avec un e-mail, dois-je vérifier mon téléphone ?',
    answer:
      'Oui, avant toute publication. Confirmez votre numéro +7 depuis Profil ou Vérification. Si vous changez de numéro, une nouvelle confirmation est demandée.',
  },
  {
    question: 'Comment contacter une entreprise ou un vendeur ?',
    answer:
      'Connectez-vous, ouvrez la fiche concernée puis utilisez le bouton Contacter. Une conversation liée au contenu sera créée.',
  },
  {
    question: 'Mon dossier de vérification est en attente depuis plus de 24 h',
    answer:
      'Contactez l’administrateur via le support MOXT avec votre identifiant de compte. L’équipe pourra accélérer le traitement.',
  },
  {
    question: 'Comment signaler un contenu problématique ?',
    answer:
      'Utilisez le signalement disponible sur les fiches. Les modérateurs MOXT traitent les signalements prioritaires.',
  },
]

export const DISCOVERY_TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'business', label: 'Entreprises' },
  { value: 'listing', label: 'Marketplace' },
  { value: 'parcel', label: 'Colis' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Événements' },
]

export const PUBLIC_RECENT_LIMIT = 6
