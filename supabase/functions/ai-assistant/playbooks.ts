/** Playbooks métier courts — ancrage factuel pour Moxti (pas de tarifs inventés). */

export type Playbook = {
  id: string
  title: string
  steps: string[]
  paths: Array<{ label: string; path: string }>
}

const PLAYBOOKS: Playbook[] = [
  {
    id: 'transfert',
    title: 'Créer et suivre un transfert',
    steps: [
      'Ouvrir Nouveau transfert, choisir le sens (Afrique→Russie ou inverse) et l’échangeur.',
      'Vérifier montant, taux affiché et total à payer avant confirmation.',
      'Après acceptation, payer selon les instructions puis déclarer le paiement avec preuve.',
      'Suivre le statut dans Mes transferts jusqu’à paid_out / completed.',
    ],
    paths: [
      { label: 'Nouveau transfert', path: '/transfers/new' },
      { label: 'Mes transferts', path: '/transfers' },
    ],
  },
  {
    id: 'preuve',
    title: 'Déclarer un paiement',
    steps: [
      'Ouvrir le transfert concerné.',
      'Joindre une preuve claire (reçu, capture) puis déclarer le paiement.',
      'Attendre la confirmation côté échangeur (payment_received → suite du flux).',
    ],
    paths: [{ label: 'Mes transferts', path: '/transfers' }],
  },
  {
    id: 'verification',
    title: 'Vérification d’identité',
    steps: [
      'Aller dans Vérification / Documents.',
      'Envoyer les pièces demandées (identité, selfie selon le parcours).',
      'Les plafonds plus élevés se débloquent après validation.',
    ],
    paths: [
      { label: 'Vérification', path: '/verification' },
      { label: 'Documents', path: '/documents' },
    ],
  },
  {
    id: 'litige',
    title: 'Litige / support',
    steps: [
      'Rassembler l’id du transfert et les preuves.',
      'Ouvrir un litige ou contacter le support / admin depuis Moxti.',
      'Ne jamais envoyer d’argent hors du parcours MOXT documenté.',
    ],
    paths: [
      { label: 'Litiges', path: '/disputes' },
      { label: 'Support', path: '/support' },
    ],
  },
  {
    id: 'colis',
    title: 'Colis / trajets',
    steps: [
      'Consulter les trajets actifs ou publier un besoin / offre.',
      'Échanger via la messagerie MOXT et clarifier kilos, dates, destination.',
    ],
    paths: [
      { label: 'Colis', path: '/parcels' },
      { label: 'Publier', path: '/parcels/publish' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    steps: [
      'Parcourir les annonces actives ou publier la vôtre.',
      'Contacter le vendeur via l’annonce ; rester sur les canaux MOXT.',
    ],
    paths: [
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'Publier', path: '/listings/new' },
    ],
  },
  {
    id: 'p2p',
    title: 'Échanges P2P',
    steps: [
      'Ouvrir P2P pour voir les offres de devises.',
      'Publier ou répondre à une offre, puis suivre la conversation liée.',
    ],
    paths: [
      { label: 'P2P', path: '/p2p' },
      { label: 'Publier P2P', path: '/p2p/publish' },
    ],
  },
]

const KEYWORDS: Record<string, string[]> = {
  transfert: ['transfert', 'transfer', 'envoyer', 'virement', 'argent', 'mandat'],
  preuve: ['preuve', 'déclarer', 'declarer', 'justificatif', 'paiement déclaré'],
  verification: ['vérif', 'verif', 'kyc', 'identité', 'document', 'selfie', 'plafond'],
  litige: ['litige', 'réclamation', 'reclamation', 'plainte', 'remboursement', 'arnaque', 'support'],
  colis: ['colis', 'kilo', 'kg', 'voyageur', 'trajet', 'bagage'],
  marketplace: ['marketplace', 'annonce', 'vendre', 'acheter', 'article'],
  p2p: ['p2p', 'pair à pair', 'peer', 'devise'],
}

export function detectPlaybookIds(question: string): string[] {
  const q = question.toLocaleLowerCase('fr')
  const hits: string[] = []
  for (const [id, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => q.includes(w))) hits.push(id)
  }
  return hits.slice(0, 3)
}

export function resolvePlaybooks(question: string): Playbook[] {
  const ids = detectPlaybookIds(question)
  if (!ids.length) return []
  return ids
    .map((id) => PLAYBOOKS.find((p) => p.id === id))
    .filter((p): p is Playbook => Boolean(p))
}

export function formatPlaybooksForPrompt(playbooks: Playbook[]): string {
  if (!playbooks.length) return ''
  return playbooks
    .map((p) => {
      const steps = p.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
      const paths = p.paths.map((a) => `${a.label} → ${a.path}`).join(' · ')
      return `Playbook « ${p.title} »:\n${steps}\n  Liens: ${paths}`
    })
    .join('\n\n')
}
