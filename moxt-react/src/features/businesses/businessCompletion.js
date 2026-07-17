export const BUSINESS_COMPLETION_CHECKS = [
  {
    key: 'name',
    label: 'Nom de l’entreprise',
    labelKey: 'businesses.completion.name.label',
    hint: 'Indiquez le nom affiché sur votre fiche publique.',
    hintKey: 'businesses.completion.name.hint',
    setupStep: 'identity',
    test: (business) => Boolean(business?.name?.trim()),
  },
  {
    key: 'sector',
    label: 'Secteur d’activité',
    labelKey: 'businesses.completion.sector.label',
    hint: 'Choisissez votre domaine principal.',
    hintKey: 'businesses.completion.sector.hint',
    setupStep: 'activity',
    test: (business) => Boolean(business?.sector?.trim() || business?.primaryActivity),
  },
  {
    key: 'country',
    label: 'Pays',
    labelKey: 'businesses.completion.country.label',
    hint: 'Précisez le pays d’implantation.',
    hintKey: 'businesses.completion.country.hint',
    setupStep: 'location',
    test: (business) => Boolean(business?.country),
  },
  {
    key: 'city',
    label: 'Ville',
    labelKey: 'businesses.completion.city.label',
    hint: 'Ajoutez la ville où vous opérez.',
    hintKey: 'businesses.completion.city.hint',
    setupStep: 'location',
    test: (business) => Boolean(business?.city?.trim()),
  },
  {
    key: 'phone',
    label: 'Téléphone de contact',
    labelKey: 'businesses.completion.phone.label',
    hint: 'Un numéro joignable pour les clients MOXT.',
    hintKey: 'businesses.completion.phone.hint',
    setupStep: 'contact',
    test: (business) => Boolean(business?.phone?.trim()),
  },
  {
    key: 'description',
    label: 'Description de l’activité',
    labelKey: 'businesses.completion.description.label',
    hint: 'Présentez votre entreprise en quelques lignes.',
    hintKey: 'businesses.completion.description.hint',
    setupStep: 'presentation',
    test: (business) => Boolean(business?.description?.trim()),
  },
  {
    key: 'services',
    label: 'Modules activés',
    labelKey: 'businesses.completion.services.label',
    hint: 'Sélectionnez au moins un service (Marketplace, Jobs, Transfert…).',
    hintKey: 'businesses.completion.services.hint',
    setupStep: 'services',
    test: (business) => Boolean(business?.services?.length),
  },
  {
    key: 'averageDelay',
    label: 'Délai moyen de traitement',
    labelKey: 'businesses.completion.averageDelay.label',
    hint: 'Obligatoire pour le module Transfert.',
    hintKey: 'businesses.completion.averageDelay.hint',
    setupStep: 'transfer',
    isApplicable: (business) => business?.services?.includes('Transfert'),
    test: (business) => Boolean(business?.averageDelay?.trim()),
  },
  {
    key: 'documents',
    label: 'Justificatif déposé',
    labelKey: 'businesses.completion.documents.label',
    hint: 'Choisissez un type de document (enregistrement, licence, fiscal…) puis déposez le fichier dans l’onglet Documents de l’espace pro.',
    hintKey: 'businesses.completion.documents.hint',
    professionalTab: 'documents',
    test: (_business, documents = []) => documents.length > 0,
  },
  {
    key: 'verified',
    label: 'Validation MOXT',
    labelKey: 'businesses.completion.verified.label',
    hint: 'Une fois le dossier complet, l’équipe MOXT vérifie votre entreprise.',
    hintKey: 'businesses.completion.verified.hint',
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
    labelKey: check.labelKey,
    hint: check.hint,
    hintKey: check.hintKey,
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
