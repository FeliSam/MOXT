const fs = require('fs')
const path = 'moxt-react/src/pages/BusinessSetupPage.jsx'
let s = fs.readFileSync(path, 'utf8')

s = s.replace(
  `function ReviewStep({ formik, hasTransfer, serviceOptions }) {
  const experience = businessExperienceForActivity(formik.values.primaryActivity)
  const v = formik.values
  return (`,
  `function ReviewStep({ formik, hasTransfer, serviceOptions }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const experience = businessExperienceForActivity(formik.values.primaryActivity)
  const spotlight = (experience.spotlightKeys || [])
    .map((key) => businessesSpotlightLabel(t, key))
    .join(', ')
    .toLowerCase()
  const v = formik.values
  return (`,
)

s = s.replace(
  `<SectionTitle icon={FiUser} label="Identite" />
        <div className="flex items-center gap-4">
          {v.logoUrl ? (
            <img src={v.logoUrl} alt="Logo" className="size-16 rounded-2xl object-cover shadow ring-2 ring-[var(--app-border)]" />`,
  `<SectionTitle icon={FiUser} label={bt('businesses.setup.review.identity')} />
        <div className="flex items-center gap-4">
          {v.logoUrl ? (
            <img src={v.logoUrl} alt={bt('businesses.setup.preview.logoAlt')} className="size-16 rounded-2xl object-cover shadow ring-2 ring-[var(--app-border)]" />`,
)

s = s.replace(
  `<img src={v.bannerUrl} alt="Banniere" className="h-20 w-full rounded-[1.4rem] object-cover shadow" />`,
  `<img src={v.bannerUrl} alt={bt('businesses.setup.identity.bannerAlt')} className="h-20 w-full rounded-[1.4rem] object-cover shadow" />`,
)

s = s.replace(
  `<SectionTitle icon={FiMapPin} label="Contact" />
        <ReviewRow label="Ville" value={v.city} />
        <ReviewRow label="Adresse" value={v.address} />
        <ReviewRow label="Telephone russe" value={v.phone} />
        {v.originPhone ? <ReviewRow label="Telephone d origine" value={v.originPhone} /> : null}
        {v.email ? <ReviewRow label="Email" value={v.email} /> : null}
        {v.telegram ? <ReviewRow label="Telegram" value={v.telegram} /> : null}
        {v.website ? <ReviewRow label="Site web" value={v.website} /> : null}
        <ReviewRow label="Horaires" value={v.scheduleSummary || '—'} />
        <ReviewRow label="Zones" value={v.serviceZones || '—'} />`,
  `<SectionTitle icon={FiMapPin} label={bt('businesses.setup.review.contact')} />
        <ReviewRow label={bt('businesses.common.city')} value={v.city} />
        <ReviewRow label={bt('businesses.common.address')} value={v.address} />
        <ReviewRow label={bt('businesses.setup.review.russianPhone')} value={v.phone} />
        {v.originPhone ? <ReviewRow label={bt('businesses.setup.review.originPhone')} value={v.originPhone} /> : null}
        {v.email ? <ReviewRow label={bt('businesses.common.email')} value={v.email} /> : null}
        {v.telegram ? <ReviewRow label={bt('businesses.setup.contact.telegram')} value={v.telegram} /> : null}
        {v.website ? <ReviewRow label={bt('businesses.setup.contact.website')} value={v.website} /> : null}
        <ReviewRow label={bt('businesses.common.hours')} value={v.scheduleSummary || bt('businesses.common.emDash')} />
        <ReviewRow label={bt('businesses.common.zones')} value={v.serviceZones || bt('businesses.common.emDash')} />`,
)

s = s.replace(
  `<SectionTitle icon={FiZap} label="Services" />
        <ReviewRow label="Modules" value={serviceOptions.join(', ') || 'Aucun'} />
        {hasTransfer ? (
          <>
            <ReviewRow label="Frais" value={\`\${v.feePercent}%\`} />
            <ReviewRow label="Delai moyen" value={v.averageDelay} />
            <ReviewRow label="Devises" value={v.currencies.join(', ')} />
            <ReviewRow label="Reseaux & banques" value={v.exchangeMethods.join(', ')} />
          </>
        ) : null}
      </Card>

      <div className="flex items-start gap-3 rounded-[1.4rem] bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <FiSend className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
            Pret a envoyer pour validation
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
            Votre fiche sera examinee par un administrateur. Points forts mis en avant :{' '}
            {experience.spotlight.join(', ').toLowerCase()}.
          </p>
        </div>
      </div>`,
  `<SectionTitle icon={FiZap} label={bt('businesses.setup.review.services')} />
        <ReviewRow
          label={bt('businesses.setup.review.modules')}
          value={
            serviceOptions.map((service) => businessesServiceLabel(t, service)).join(', ') ||
            bt('businesses.setup.review.none')
          }
        />
        {hasTransfer ? (
          <>
            <ReviewRow label={bt('businesses.setup.review.fees')} value={\`\${v.feePercent}%\`} />
            <ReviewRow label={bt('businesses.setup.services.averageDelay')} value={v.averageDelay} />
            <ReviewRow label={bt('businesses.setup.review.currencies')} value={v.currencies.join(', ')} />
            <ReviewRow label={bt('businesses.setup.review.networksBanks')} value={v.exchangeMethods.join(', ')} />
          </>
        ) : null}
      </Card>

      <div className="flex items-start gap-3 rounded-[1.4rem] bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <FiSend className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
            {bt('businesses.setup.review.readyTitle')}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
            {bt('businesses.setup.review.readyBody', { spotlight })}
          </p>
        </div>
      </div>`,
)

s = s.replace(
  `      <span className="text-right font-bold text-[var(--app-text)]">{value || '—'}</span>`,
  `      <span className="text-right font-bold text-[var(--app-text)]">{value || '—'}</span>`,
)

// Success screen
s = s.replace(
  `function BusinessCreatedSuccess({
  business,
  hasTransfer,
  onGoProfessional,
  onShare,
  serviceOptions,
}) {
  const { trigger, node } = useActionBurst()
  const experience = businessExperienceForActivity(business.primaryActivity)`,
  `function BusinessCreatedSuccess({
  business,
  hasTransfer,
  onGoProfessional,
  onShare,
  serviceOptions,
}) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const { trigger, node } = useActionBurst()
  const experience = businessExperienceForActivity(business.primaryActivity)
  const spotlight = (experience.spotlightKeys || [])
    .map((key) => businessesSpotlightLabel(t, key))
    .join(', ')
    .toLowerCase()`,
)

s = s.replace(
  `          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/75">
            Félicitations
          </p>
          <h1 className="mt-2 font-display text-2xl font-black sm:text-3xl">
            Votre entreprise est créée
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/88">
            <strong>{business.name}</strong> est enregistrée sur MOXT. Notre équipe va valider votre
            fiche avant publication dans l&apos;annuaire — vous pouvez déjà préparer votre espace pro.
          </p>`,
  `          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/75">
            {bt('businesses.setup.success.congrats')}
          </p>
          <h1 className="mt-2 font-display text-2xl font-black sm:text-3xl">
            {bt('businesses.setup.success.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/88">
            <strong>{business.name}</strong> {bt('businesses.setup.success.body')}
          </p>`,
)

s = s.replace(
  `<SectionTitle icon={FiUser} label="Récapitulatif" />`,
  `<SectionTitle icon={FiUser} label={bt('businesses.setup.success.recap')} />`,
)

s = s.replace(
  `          <ReviewRow label="Ville" value={business.city} />
          <ReviewRow label="Téléphone" value={business.phone} />
          {business.email ? <ReviewRow label="E-mail" value={business.email} /> : null}
          <ReviewRow label="Horaires" value={business.scheduleSummary} />
          <ReviewRow label="Services" value={serviceOptions.join(', ')} />
          {hasTransfer ? (
            <>
              <ReviewRow label="Frais" value={\`\${business.feePercent}%\`} />
              <ReviewRow label="Devises" value={(business.currencies || []).join(', ')} />
            </>
          ) : null}
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-3">
            <SectionTitle icon={FiCheckCircle} label="Prochaines étapes" />
            <ul className="grid gap-2 text-sm text-[var(--app-text-muted)]">
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                Validation administrateur (24–48 h en moyenne)
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                Points forts : {experience.spotlight.join(', ').toLowerCase()}
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                Complétez votre espace pro pour accueillir vos premiers clients
              </li>
            </ul>
          </Card>

          <div className="grid gap-2">
            <Button className="w-full" icon={HiOutlineBuildingOffice2} onClick={onGoProfessional}>
              Accéder à mon espace entreprise
            </Button>
            <Button className="w-full" variant="secondary" icon={FiShare2} onClick={onShare}>
              Republier dans l&apos;annuaire
            </Button>
          </div>`,
  `          <ReviewRow label={bt('businesses.common.city')} value={business.city} />
          <ReviewRow label={bt('businesses.common.phone')} value={business.phone} />
          {business.email ? <ReviewRow label={bt('businesses.common.email')} value={business.email} /> : null}
          <ReviewRow label={bt('businesses.common.hours')} value={business.scheduleSummary} />
          <ReviewRow
            label={bt('businesses.setup.review.services')}
            value={serviceOptions.map((service) => businessesServiceLabel(t, service)).join(', ')}
          />
          {hasTransfer ? (
            <>
              <ReviewRow label={bt('businesses.setup.review.fees')} value={\`\${business.feePercent}%\`} />
              <ReviewRow label={bt('businesses.setup.review.currencies')} value={(business.currencies || []).join(', ')} />
            </>
          ) : null}
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-3">
            <SectionTitle icon={FiCheckCircle} label={bt('businesses.setup.success.nextSteps')} />
            <ul className="grid gap-2 text-sm text-[var(--app-text-muted)]">
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                {bt('businesses.setup.success.stepValidation')}
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                {bt('businesses.setup.success.stepSpotlight', { spotlight })}
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                {bt('businesses.setup.success.stepComplete')}
              </li>
            </ul>
          </Card>

          <div className="grid gap-2">
            <Button className="w-full" icon={HiOutlineBuildingOffice2} onClick={onGoProfessional}>
              {bt('businesses.setup.success.goProfessional')}
            </Button>
            <Button className="w-full" variant="secondary" icon={FiShare2} onClick={onShare}>
              {bt('businesses.setup.success.republish')}
            </Button>
          </div>`,
)

fs.writeFileSync(path, s)
console.log('review+success patched')
