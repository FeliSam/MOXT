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
    labelKey: 'businesses.activities.transfer.label',
    icon: FiCreditCard,
    services: ['Transfert'],
    description: 'Change, transfert et services financiers entre utilisateurs et entreprises.',
    descriptionKey: 'businesses.activities.transfer.description',
  },
  {
    value: 'logistics',
    label: 'Colis et logistique',
    labelKey: 'businesses.activities.logistics.label',
    icon: FiTruck,
    services: ['Colis'],
    description: 'Transport, depot, livraison et coordination de colis.',
    descriptionKey: 'businesses.activities.logistics.description',
  },
  {
    value: 'commerce',
    label: 'Commerce et marketplace',
    labelKey: 'businesses.activities.commerce.label',
    icon: FiShoppingBag,
    services: ['Marketplace'],
    description: 'Vente de produits, boutiques, services commerciaux et annonces.',
    descriptionKey: 'businesses.activities.commerce.description',
  },
  {
    value: 'recruitment',
    label: 'Jobs et recrutement',
    labelKey: 'businesses.activities.recruitment.label',
    icon: FiBriefcase,
    services: ['Jobs'],
    description: 'Offres d emploi, missions, recrutement et gestion de candidatures.',
    descriptionKey: 'businesses.activities.recruitment.description',
  },
  {
    value: 'events',
    label: 'Evenementiel',
    labelKey: 'businesses.activities.events.label',
    icon: FiCalendar,
    services: ['Events'],
    description: 'Rencontres, formations, salons et evenements communautaires.',
    descriptionKey: 'businesses.activities.events.description',
  },
  {
    value: 'education',
    label: 'Formation',
    labelKey: 'businesses.activities.education.label',
    icon: FiBookOpen,
    services: ['Jobs', 'Events'],
    description: 'Cours, accompagnement, coaching et ateliers.',
    descriptionKey: 'businesses.activities.education.description',
  },
  {
    value: 'real_estate',
    label: 'Immobilier',
    labelKey: 'businesses.activities.real_estate.label',
    icon: FiHome,
    services: ['Marketplace'],
    description: 'Location, logement, accompagnement et services immobiliers.',
    descriptionKey: 'businesses.activities.real_estate.description',
  },
  {
    value: 'services',
    label: 'Services administratifs',
    labelKey: 'businesses.activities.services.label',
    icon: FiPackage,
    services: ['Marketplace', 'Jobs'],
    description: 'Aide aux documents, demarches, support local et services pratiques.',
    descriptionKey: 'businesses.activities.services.description',
  },
]

export const BUSINESS_ACTIVITY_EXPERIENCES = {
  transfer: {
    audience: 'Entreprises de change, transfert et reception de paiements.',
    audienceKey: 'businesses.experience.transfer.audience',
    promise: 'Mettez en avant vos delais, vos reseaux d echange, vos frais et votre disponibilite.',
    promiseKey: 'businesses.experience.transfer.promise',
    onboarding: [
      'Renseignez un nom public clair et rassurant.',
      'Ajoutez des contacts russes joignables rapidement.',
      'Activez vos devises et reseaux reellement disponibles.',
    ],
    onboardingKeys: [
      'businesses.experience.transfer.onboarding.0',
      'businesses.experience.transfer.onboarding.1',
      'businesses.experience.transfer.onboarding.2',
    ],
    spotlight: ['Frais annonces', 'Delai moyen', 'Reseaux actifs', 'Zone de service'],
    spotlightKeys: ['feeAnnounced', 'averageDelay', 'activeNetworks', 'serviceZone'],
  },
  logistics: {
    audience: 'Voyageurs, transporteurs et services de logistique.',
    audienceKey: 'businesses.experience.logistics.audience',
    promise: 'Montrez vos trajets, vos capacites et vos conditions de depot de colis.',
    promiseKey: 'businesses.experience.logistics.promise',
    onboarding: [
      'Precisez vos villes de depot et de remise.',
      'Expliquez les types de colis acceptes.',
      'Mettez vos disponibilites et votre zone de collecte.',
    ],
    onboardingKeys: [
      'businesses.experience.logistics.onboarding.0',
      'businesses.experience.logistics.onboarding.1',
      'businesses.experience.logistics.onboarding.2',
    ],
    spotlight: ['Capacite', 'Delai de prise en charge', 'Zone de service', 'Contact'],
    spotlightKeys: ['capacity', 'handlingDelay', 'serviceZone', 'contact'],
  },
  commerce: {
    audience: 'Boutiques, vendeurs pro et services commerciaux.',
    audienceKey: 'businesses.experience.commerce.audience',
    promise: 'Valorisez votre vitrine, vos categories et votre reactivite commerciale.',
    promiseKey: 'businesses.experience.commerce.promise',
    onboarding: [
      'Decrivez votre specialite principale.',
      'Ajoutez votre zone de livraison ou de retrait.',
      'Mettez en avant la confiance et la disponibilite.',
    ],
    onboardingKeys: [
      'businesses.experience.commerce.onboarding.0',
      'businesses.experience.commerce.onboarding.1',
      'businesses.experience.commerce.onboarding.2',
    ],
    spotlight: ['Catalogue', 'Livraison', 'Disponibilite', 'Contact'],
    spotlightKeys: ['catalog', 'delivery', 'availability', 'contact'],
  },
  recruitment: {
    audience: 'Cabinets, entreprises et recruteurs.',
    audienceKey: 'businesses.experience.recruitment.audience',
    promise: 'Centralisez vos offres, vos candidatures et vos besoins terrain.',
    promiseKey: 'businesses.experience.recruitment.promise',
    onboarding: [
      'Expliquez les profils recherches.',
      'Precisez votre ville d intervention.',
      'Indiquez vos horaires de traitement des candidatures.',
    ],
    onboardingKeys: [
      'businesses.experience.recruitment.onboarding.0',
      'businesses.experience.recruitment.onboarding.1',
      'businesses.experience.recruitment.onboarding.2',
    ],
    spotlight: ['Offres actives', 'Delai de reponse', 'Ville', 'Contact RH'],
    spotlightKeys: ['activeOffers', 'responseDelay', 'city', 'hrContact'],
  },
  events: {
    audience: 'Organisateurs, associations et promoteurs.',
    audienceKey: 'businesses.experience.events.audience',
    promise: 'Presentez vos evenements, votre communaute et vos prochains rendez-vous.',
    promiseKey: 'businesses.experience.events.promise',
    onboarding: [
      'Decrivez le type d evenements organises.',
      'Ajoutez les villes et lieux frequents.',
      'Montrez votre rythme de publication.',
    ],
    onboardingKeys: [
      'businesses.experience.events.onboarding.0',
      'businesses.experience.events.onboarding.1',
      'businesses.experience.events.onboarding.2',
    ],
    spotlight: ['Evenements a venir', 'Capacite', 'Ville', 'Contact'],
    spotlightKeys: ['upcomingEvents', 'capacity', 'city', 'contact'],
  },
  education: {
    audience: 'Formateurs, coaches et structures educatives.',
    audienceKey: 'businesses.experience.education.audience',
    promise: 'Mettez en valeur vos cours, ateliers et accompagnements.',
    promiseKey: 'businesses.experience.education.promise',
    onboarding: [
      'Expliquez les domaines enseignes.',
      'Renseignez vos modalites presentiel ou en ligne.',
      'Ajoutez vos disponibilites typiques.',
    ],
    onboardingKeys: [
      'businesses.experience.education.onboarding.0',
      'businesses.experience.education.onboarding.1',
      'businesses.experience.education.onboarding.2',
    ],
    spotlight: ['Programmes', 'Ateliers', 'Disponibilite', 'Contact'],
    spotlightKeys: ['programs', 'workshops', 'availability', 'contact'],
  },
  real_estate: {
    audience: 'Agences, bailleurs et services immobiliers.',
    audienceKey: 'businesses.experience.real_estate.audience',
    promise: 'Structurez vos annonces, zones et offres d accompagnement.',
    promiseKey: 'businesses.experience.real_estate.promise',
    onboarding: [
      'Precisez vos zones de couverture.',
      'Indiquez le type de biens ou services proposes.',
      'Ajoutez un contact direct et rassurant.',
    ],
    onboardingKeys: [
      'businesses.experience.real_estate.onboarding.0',
      'businesses.experience.real_estate.onboarding.1',
      'businesses.experience.real_estate.onboarding.2',
    ],
    spotlight: ['Biens actifs', 'Zones', 'Disponibilite', 'Contact'],
    spotlightKeys: ['activeProperties', 'zones', 'availability', 'contact'],
  },
  services: {
    audience: 'Prestataires administratifs et services pratiques.',
    audienceKey: 'businesses.experience.services.audience',
    promise: 'Rendez votre assistance concrete, visible et facile a contacter.',
    promiseKey: 'businesses.experience.services.promise',
    onboarding: [
      'Listez clairement les demarches couvertes.',
      'Ajoutez les horaires de prise en charge.',
      'Precisez la zone ou la modalite de service.',
    ],
    onboardingKeys: [
      'businesses.experience.services.onboarding.0',
      'businesses.experience.services.onboarding.1',
      'businesses.experience.services.onboarding.2',
    ],
    spotlight: ['Services', 'Zone', 'Horaires', 'Contact'],
    spotlightKeys: ['services', 'zone', 'schedule', 'contact'],
  },
}

export const BUSINESS_SECONDARY_ACTIVITIES = BUSINESS_ACTIVITIES.map(
  ({ value, label, labelKey }) => ({
    value,
    label,
    labelKey,
  }),
)

export const BUSINESS_SCHEDULE_PRESETS = [
  {
    value: 'always_open',
    label: 'Toujours ouvert',
    labelKey: 'businesses.schedules.always_open.label',
    summary: 'Tous les jours, 24h/24',
    summaryKey: 'businesses.schedules.always_open.summary',
    schedule: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
      (day) => ({ day, open: true, from: '00:00', to: '23:59' }),
    ),
  },
  {
    value: 'weekdays',
    label: 'Lundi a vendredi',
    labelKey: 'businesses.schedules.weekdays.label',
    summary: 'Lun-Ven, 09:00-18:00',
    summaryKey: 'businesses.schedules.weekdays.summary',
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
    labelKey: 'businesses.schedules.weekdays_saturday.label',
    summary: 'Lun-Sam, 10:00-20:00',
    summaryKey: 'businesses.schedules.weekdays_saturday.summary',
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
    labelKey: 'businesses.schedules.appointment.label',
    summary: 'Disponible sur rendez-vous',
    summaryKey: 'businesses.schedules.appointment.summary',
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
      audienceKey: 'businesses.experience.default.audience',
      promise: 'Presentez clairement votre activite et vos services.',
      promiseKey: 'businesses.experience.default.promise',
      onboarding: [],
      onboardingKeys: [],
      spotlight: ['Services', 'Ville', 'Horaires', 'Contact'],
      spotlightKeys: ['services', 'city', 'schedule', 'contact'],
    }
  )
}
