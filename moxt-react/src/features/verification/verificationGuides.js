export const VERIFICATION_GUIDES = {
  identity: {
    title: 'Pièce d’identité',
    intro: 'Photographiez le recto de votre document sur une surface plane, sans reflet.',
    accepted: [
      {
        id: 'id-clear',
        title: 'Document entier et net',
        description: 'Les 4 coins sont visibles, le texte est lisible et l’éclairage est uniforme.',
        illustration: 'id-good-full',
      },
      {
        id: 'id-passport',
        title: 'Passeport ou titre de séjour',
        description: 'Page principale avec photo, nom et numéro clairement visibles.',
        illustration: 'id-good-passport',
      },
    ],
    rejected: [
      {
        id: 'id-crop',
        title: 'Document coupé',
        description: 'Une partie du document est hors cadre ou un coin manque.',
        illustration: 'id-bad-crop',
      },
      {
        id: 'id-blur',
        title: 'Photo floue ou sombre',
        description: 'Le texte n’est pas lisible ou l’image est trop sombre.',
        illustration: 'id-bad-blur',
      },
      {
        id: 'id-screen',
        title: 'Capture d’écran',
        description: 'Photo d’un écran, scan de mauvaise qualité ou document plastifié avec reflets.',
        illustration: 'id-bad-screen',
      },
    ],
  },
  selfie: {
    title: 'Selfie de vérification',
    intro: 'Prenez un selfie en tenant votre pièce près du visage, dans un endroit bien éclairé.',
    accepted: [
      {
        id: 'selfie-good',
        title: 'Visage + document visibles',
        description: 'Votre visage et la pièce d’identité sont nets, sans filtre ni accessoire masquant.',
        illustration: 'selfie-good',
      },
      {
        id: 'selfie-light',
        title: 'Bonne luminosité',
        description: 'Lumière naturelle de face, sans ombre forte sur le visage ou le document.',
        illustration: 'selfie-good-light',
      },
    ],
    rejected: [
      {
        id: 'selfie-no-doc',
        title: 'Sans document',
        description: 'Le selfie ne montre pas la pièce d’identité tenue en main.',
        illustration: 'selfie-bad-no-doc',
      },
      {
        id: 'selfie-hidden',
        title: 'Visage masqué',
        description: 'Lunettes de soleil, masque, casquette ou visage hors cadre.',
        illustration: 'selfie-bad-hidden',
      },
      {
        id: 'selfie-dark',
        title: 'Photo trop sombre',
        description: 'On ne distingue ni le visage ni les informations du document.',
        illustration: 'selfie-bad-dark',
      },
    ],
  },
  address: {
    title: 'Justificatif de domicile',
    intro: 'Joignez un document récent (moins de 3 mois) à votre nom, avec adresse en Russie.',
    accepted: [
      {
        id: 'address-migration',
        title: 'Enregistrement migratoire',
        description: 'Tampon ou attestation d’enregistrement avec nom, adresse et date valides.',
        illustration: 'address-good-migration',
      },
      {
        id: 'address-bill',
        title: 'Facture ou bail récent',
        description: 'Contrat de location, facture d’énergie ou de télécom à votre nom.',
        illustration: 'address-good-bill',
      },
    ],
    rejected: [
      {
        id: 'address-old',
        title: 'Document trop ancien',
        description: 'Date de plus de 3 mois ou période non identifiable.',
        illustration: 'address-bad-old',
      },
      {
        id: 'address-name',
        title: 'Nom ou adresse absents',
        description: 'Le document ne mentionne pas votre nom complet ou votre adresse actuelle.',
        illustration: 'address-bad-name',
      },
      {
        id: 'address-unrelated',
        title: 'Document non admis',
        description: 'Carte bancaire, permis de conduire seul ou document sans lien avec le domicile.',
        illustration: 'address-bad-unrelated',
      },
    ],
  },
}
