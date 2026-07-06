import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiTruck,
} from 'react-icons/fi'

export const BUSINESS_ACTIVITIES = [
  {
    value: 'transfer',
    label: 'Transfert',
    icon: FiCreditCard,
    services: ['Transfert'],
    description: 'Change, transfert et services financiers entre utilisateurs et entreprises.',
  },
  {
    value: 'logistics',
    label: 'Colis et logistique',
    icon: FiTruck,
    services: ['Colis'],
    description: 'Transport, depot, livraison et coordination de colis.',
  },
  {
    value: 'commerce',
    label: 'Commerce et marketplace',
    icon: FiShoppingBag,
    services: ['Marketplace'],
    description: 'Vente de produits, boutiques, services commerciaux et annonces.',
  },
  {
    value: 'recruitment',
    label: 'Jobs et recrutement',
    icon: FiBriefcase,
    services: ['Jobs'],
    description: 'Offres d emploi, missions, recrutement et gestion de candidatures.',
  },
  {
    value: 'events',
    label: 'Evenementiel',
    icon: FiCalendar,
    services: ['Events'],
    description: 'Rencontres, formations, salons et evenements communautaires.',
  },
  {
    value: 'education',
    label: 'Formation',
    icon: FiBookOpen,
    services: ['Jobs', 'Events'],
    description: 'Cours, accompagnement, coaching et ateliers.',
  },
  {
    value: 'real_estate',
    label: 'Immobilier',
    icon: FiHome,
    services: ['Marketplace'],
    description: 'Location, logement, accompagnement et services immobiliers.',
  },
  {
    value: 'services',
    label: 'Services administratifs',
    icon: FiPackage,
    services: ['Marketplace', 'Jobs'],
    description: 'Aide aux documents, demarches, support local et services pratiques.',
  },
]

export const BUSINESS_ACTIVITY_EXPERIENCES = {
  transfer: {
    audience: 'Entreprises de change, transfert et reception de paiements.',
    promise: 'Mettez en avant vos delais, vos reseaux d echange, vos frais et votre disponibilite.',
    onboarding: [
      'Renseignez un nom public clair et rassurant.',
      'Ajoutez des contacts russes joignables rapidement.',
      'Activez vos devises et reseaux reellement disponibles.',
    ],
    spotlight: ['Frais annonces', 'Delai moyen', 'Reseaux actifs', 'Zone de service'],
  },
  logistics: {
    audience: 'Voyageurs, transporteurs et services de logistique.',
    promise: 'Montrez vos trajets, vos capacites et vos conditions de depot de colis.',
    onboarding: [
      'Precisez vos villes de depot et de remise.',
      'Expliquez les types de colis acceptes.',
      'Mettez vos disponibilites et votre zone de collecte.',
    ],
    spotlight: ['Capacite', 'Delai de prise en charge', 'Zone de service', 'Contact'],
  },
  commerce: {
    audience: 'Boutiques, vendeurs pro et services commerciaux.',
    promise: 'Valorisez votre vitrine, vos categories et votre reactivite commerciale.',
    onboarding: [
      'Decrivez votre specialite principale.',
      'Ajoutez votre zone de livraison ou de retrait.',
      'Mettez en avant la confiance et la disponibilite.',
    ],
    spotlight: ['Catalogue', 'Livraison', 'Disponibilite', 'Contact'],
  },
  recruitment: {
    audience: 'Cabinets, entreprises et recruteurs.',
    promise: 'Centralisez vos offres, vos candidatures et vos besoins terrain.',
    onboarding: [
      'Expliquez les profils recherches.',
      'Precisez votre ville d intervention.',
      'Indiquez vos horaires de traitement des candidatures.',
    ],
    spotlight: ['Offres actives', 'Delai de reponse', 'Ville', 'Contact RH'],
  },
  events: {
    audience: 'Organisateurs, associations et promoteurs.',
    promise: 'Presentez vos evenements, votre communaute et vos prochains rendez-vous.',
    onboarding: [
      'Decrivez le type d evenements organises.',
      'Ajoutez les villes et lieux frequents.',
      'Montrez votre rythme de publication.',
    ],
    spotlight: ['Evenements a venir', 'Capacite', 'Ville', 'Contact'],
  },
  education: {
    audience: 'Formateurs, coaches et structures educatives.',
    promise: 'Mettez en valeur vos cours, ateliers et accompagnements.',
    onboarding: [
      'Expliquez les domaines enseignes.',
      'Renseignez vos modalites presentiel ou en ligne.',
      'Ajoutez vos disponibilites typiques.',
    ],
    spotlight: ['Programmes', 'Ateliers', 'Disponibilite', 'Contact'],
  },
  real_estate: {
    audience: 'Agences, bailleurs et services immobiliers.',
    promise: 'Structurez vos annonces, zones et offres d accompagnement.',
    onboarding: [
      'Precisez vos zones de couverture.',
      'Indiquez le type de biens ou services proposes.',
      'Ajoutez un contact direct et rassurant.',
    ],
    spotlight: ['Biens actifs', 'Zones', 'Disponibilite', 'Contact'],
  },
  services: {
    audience: 'Prestataires administratifs et services pratiques.',
    promise: 'Rendez votre assistance concrete, visible et facile a contacter.',
    onboarding: [
      'Listez clairement les demarches couvertes.',
      'Ajoutez les horaires de prise en charge.',
      'Precisez la zone ou la modalite de service.',
    ],
    spotlight: ['Services', 'Zone', 'Horaires', 'Contact'],
  },
}

export const BUSINESS_SECONDARY_ACTIVITIES = BUSINESS_ACTIVITIES.map(({ value, label }) => ({
  value,
  label,
}))

export const BUSINESS_SCHEDULE_PRESETS = [
  {
    value: 'always_open',
    label: 'Toujours ouvert',
    summary: 'Tous les jours, 24h/24',
    schedule: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
      (day) => ({ day, open: true, from: '00:00', to: '23:59' }),
    ),
  },
  {
    value: 'weekdays',
    label: 'Lundi a vendredi',
    summary: 'Lun-Ven, 09:00-18:00',
    schedule: [
      { day: 'monday', open: true, from: '09:00', to: '18:00' },
      { day: 'tuesday', open: true, from: '09:00', to: '18:00' },
      { day: 'wednesday', open: true, from: '09:00', to: '18:00' },
      { day: 'thursday', open: true, from: '09:00', to: '18:00' },
      { day: 'friday', open: true, from: '09:00', to: '18:00' },
      { day: 'saturday', open: false, from: '', to: '' },
      { day: 'sunday', open: false, from: '', to: '' },
    ],
  },
  {
    value: 'weekdays_saturday',
    label: 'Lundi a samedi',
    summary: 'Lun-Sam, 10:00-20:00',
    schedule: [
      { day: 'monday', open: true, from: '10:00', to: '20:00' },
      { day: 'tuesday', open: true, from: '10:00', to: '20:00' },
      { day: 'wednesday', open: true, from: '10:00', to: '20:00' },
      { day: 'thursday', open: true, from: '10:00', to: '20:00' },
      { day: 'friday', open: true, from: '10:00', to: '20:00' },
      { day: 'saturday', open: true, from: '10:00', to: '20:00' },
      { day: 'sunday', open: false, from: '', to: '' },
    ],
  },
  {
    value: 'appointment',
    label: 'Sur rendez-vous',
    summary: 'Disponible sur rendez-vous',
    schedule: [],
  },
]

export function activityByValue(value) {
  return BUSINESS_ACTIVITIES.find((activity) => activity.value === value) || null
}

export function servicesForActivities(primaryActivity, secondaryActivity) {
  return [
    ...(activityByValue(primaryActivity)?.services || []),
    ...(activityByValue(secondaryActivity)?.services || []),
  ].filter((service, index, services) => services.indexOf(service) === index)
}

export function schedulePreset(value) {
  return BUSINESS_SCHEDULE_PRESETS.find((preset) => preset.value === value)
}

export function businessExperienceForActivity(value) {
  return (
    BUSINESS_ACTIVITY_EXPERIENCES[value] || {
      audience: 'Entreprises professionnelles sur MOXT.',
      promise: 'Presentez clairement votre activite et vos services.',
      onboarding: [],
      spotlight: ['Services', 'Ville', 'Horaires', 'Contact'],
    }
  )
}
