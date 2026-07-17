export const VERIFICATION_GUIDES = {
  identity: {
    titleKey: 'verification.guide.identity.title',
    introKey: 'verification.guide.identity.intro',
    accepted: [
      {
        id: 'id-clear',
        titleKey: 'verification.guide.identity.accepted.idClear.title',
        descriptionKey: 'verification.guide.identity.accepted.idClear.desc',
        illustration: 'id-good-full',
      },
      {
        id: 'id-passport',
        titleKey: 'verification.guide.identity.accepted.idPassport.title',
        descriptionKey: 'verification.guide.identity.accepted.idPassport.desc',
        illustration: 'id-good-passport',
      },
    ],
    rejected: [
      {
        id: 'id-crop',
        titleKey: 'verification.guide.identity.rejected.idCrop.title',
        descriptionKey: 'verification.guide.identity.rejected.idCrop.desc',
        illustration: 'id-bad-crop',
      },
      {
        id: 'id-blur',
        titleKey: 'verification.guide.identity.rejected.idBlur.title',
        descriptionKey: 'verification.guide.identity.rejected.idBlur.desc',
        illustration: 'id-bad-blur',
      },
      {
        id: 'id-screen',
        titleKey: 'verification.guide.identity.rejected.idScreen.title',
        descriptionKey: 'verification.guide.identity.rejected.idScreen.desc',
        illustration: 'id-bad-screen',
      },
    ],
  },
  selfie: {
    titleKey: 'verification.guide.selfie.title',
    introKey: 'verification.guide.selfie.intro',
    accepted: [
      {
        id: 'selfie-good',
        titleKey: 'verification.guide.selfie.accepted.selfieGood.title',
        descriptionKey: 'verification.guide.selfie.accepted.selfieGood.desc',
        illustration: 'selfie-good',
      },
      {
        id: 'selfie-light',
        titleKey: 'verification.guide.selfie.accepted.selfieLight.title',
        descriptionKey: 'verification.guide.selfie.accepted.selfieLight.desc',
        illustration: 'selfie-good-light',
      },
    ],
    rejected: [
      {
        id: 'selfie-no-doc',
        titleKey: 'verification.guide.selfie.rejected.selfieNoDoc.title',
        descriptionKey: 'verification.guide.selfie.rejected.selfieNoDoc.desc',
        illustration: 'selfie-bad-no-doc',
      },
      {
        id: 'selfie-hidden',
        titleKey: 'verification.guide.selfie.rejected.selfieHidden.title',
        descriptionKey: 'verification.guide.selfie.rejected.selfieHidden.desc',
        illustration: 'selfie-bad-hidden',
      },
      {
        id: 'selfie-dark',
        titleKey: 'verification.guide.selfie.rejected.selfieDark.title',
        descriptionKey: 'verification.guide.selfie.rejected.selfieDark.desc',
        illustration: 'selfie-bad-dark',
      },
    ],
  },
  address: {
    titleKey: 'verification.guide.address.title',
    introKey: 'verification.guide.address.intro',
    accepted: [
      {
        id: 'address-migration',
        titleKey: 'verification.guide.address.accepted.addressMigration.title',
        descriptionKey: 'verification.guide.address.accepted.addressMigration.desc',
        illustration: 'address-good-migration',
      },
      {
        id: 'address-bill',
        titleKey: 'verification.guide.address.accepted.addressBill.title',
        descriptionKey: 'verification.guide.address.accepted.addressBill.desc',
        illustration: 'address-good-bill',
      },
    ],
    rejected: [
      {
        id: 'address-old',
        titleKey: 'verification.guide.address.rejected.addressOld.title',
        descriptionKey: 'verification.guide.address.rejected.addressOld.desc',
        illustration: 'address-bad-old',
      },
      {
        id: 'address-name',
        titleKey: 'verification.guide.address.rejected.addressName.title',
        descriptionKey: 'verification.guide.address.rejected.addressName.desc',
        illustration: 'address-bad-name',
      },
      {
        id: 'address-unrelated',
        titleKey: 'verification.guide.address.rejected.addressUnrelated.title',
        descriptionKey: 'verification.guide.address.rejected.addressUnrelated.desc',
        illustration: 'address-bad-unrelated',
      },
    ],
  },
}
