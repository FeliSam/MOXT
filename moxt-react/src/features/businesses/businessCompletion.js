export const BUSINESS_COMPLETION_CHECKS = [
  {
    key: 'name',
    label: 'Nom de l’entreprise',
    hint: 'Indiquez le nom affiché sur votre fiche publique.',
    setupStep: 'identity',
    test: (business) => Boolean(business?.name?.trim()),
  },
  {
    key: 'sector',
    label: 'Secteur d’activité',
    hint: 'Choisissez votre domaine principal.',
    setupStep: 'activity',
    test: (business) => Boolean(business?.sector?.trim() || business?.primaryActivity),
  },
  {
    key: 'country',
    label: 'Pays',
    hint: 'Précisez le pays d’implantation.',
    setupStep: 'location',
    test: (business) => Boolean(business?.country),
  },
  {
    key: 'city',
    label: 'Ville',
    hint: 'Ajoutez la ville où vous opérez.',
    setupStep: 'location',
    test: (business) => Boolean(business?.city?.trim()),
  },
  {
    key: 'phone',
    label: 'Téléphone de contact',
    hint: 'Un numéro joignable pour les clients MOXT.',
    setupStep: 'contact',
    test: (business) => Boolean(business?.phone?.trim()),
  },
  {
    key: 'description',
    label: 'Description de l’activité',
    hint: 'Présentez votre entreprise en quelques lignes.',
    setupStep: 'presentation',
    test: (business) => Boolean(business?.description?.trim()),
  },
  {
    key: 'services',
    label: 'Modules activés',
    hint: 'Sélectionnez au moins un service (Marketplace, Jobs, Transfert…).',
    setupStep: 'services',
    test: (business) => Boolean(business?.services?.length),
  },
  {
    key: 'averageDelay',
    label: 'Délai moyen de traitement',
    hint: 'Obligatoire pour le module Transfert.',
    setupStep: 'transfer',
    isApplicable: (business) => business?.services?.includes('Transfert'),
    test: (business) => Boolean(business?.averageDelay?.trim()),
  },
  {
    key: 'documents',
    label: 'Justificatif déposé',
    hint: 'Choisissez un type de document (enregistrement, licence, fiscal…) puis déposez le fichier dans l’onglet Documents de l’espace pro.',
    professionalTab: 'documents',
    test: (_business, documents = []) => documents.length > 0,
  },
  {
    key: 'verified',
    label: 'Validation MOXT',
    hint: 'Une fois le dossier complet, l’équipe MOXT vérifie votre entreprise.',
    test: (business) => ['verified', 'approved', 'active'].includes(business?.status),
  },
]

function resolveApplicableChecks(business, documents) {
  return BUSINESS_COMPLETION_CHECKS.filter(
    (check) => !check.isApplicable || check.isApplicable(business, documents),
  )
}

export function getBusinessCompletionStatus(business, documents = []) {
  if (!business) {
    return { percent: 0, items: [], missing: [], complete: [], total: 0 }
  }

  const applicable = resolveApplicableChecks(business, documents)
  const items = applicable.map((check) => ({
    key: check.key,
    label: check.label,
    hint: check.hint,
    setupStep: check.setupStep,
    professionalTab: check.professionalTab,
    complete: check.test(business, documents),
  }))
  const complete = items.filter((item) => item.complete)
  const missing = items.filter((item) => !item.complete)
  const percent = applicable.length
    ? Math.round((complete.length / applicable.length) * 100)
    : 0

  return {
    percent,
    items,
    missing,
    complete,
    total: applicable.length,
  }
}

export function calculateBusinessCompletion(business, documents = []) {
  return getBusinessCompletionStatus(business, documents).percent
}
