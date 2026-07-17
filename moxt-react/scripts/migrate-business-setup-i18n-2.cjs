const fs = require('fs')
const path = 'moxt-react/src/pages/BusinessSetupPage.jsx'
let s = fs.readFileSync(path, 'utf8')

// Stepper: use STEP_DEFS + translate labels
s = s.replace(
  `function Stepper({ step, onGoTo }) {
  return (
    <div className="relative flex items-start justify-between gap-0">
      {/* connecting line */}
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: \`\${((step - 1) / (STEPS.length - 1)) * 100}%\` }}
        aria-hidden
      />

      {STEPS.map((s) => {`,
  `function Stepper({ step, onGoTo }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const steps = STEP_DEFS.map((item) => ({ ...item, label: bt(item.labelKey) }))
  return (
    <div className="relative flex items-start justify-between gap-0">
      {/* connecting line */}
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: \`\${((step - 1) / (steps.length - 1)) * 100}%\` }}
        aria-hidden
      />

      {steps.map((s) => {`,
)

const replacements = [
  ["Apercu de votre fiche", "bt('businesses.setup.preview.title')"],
  ["Republier annuaire", "bt('businesses.setup.preview.republish')"],
  ["Nom de l entreprise", "bt('businesses.setup.preview.companyNamePlaceholder')"],
  ['"QR code apercu"', "bt('businesses.setup.preview.qrAlt')"],
  ['alt="Logo"', "alt={bt('businesses.setup.preview.logoAlt')}"],
  ["Votre presentation apparaitra ici.", "bt('businesses.setup.preview.presentationPlaceholder')"],
  ["0 avis", "bt('businesses.setup.preview.reviewsZero')"],
  [">Frais<", ">{bt('businesses.setup.preview.fees')}<"],
  ["Votre fiche sera visible apres validation", "bt('businesses.setup.preview.visibleAfterValidation')"],
]

// BusinessPreview needs useLanguage
if (!s.includes("function BusinessPreview") || !s.includes("BusinessPreview({ formik")) {
  console.log('BusinessPreview signature unexpected')
}

s = s.replace(
  'function BusinessPreview({ formik, hasTransfer, serviceOptions }) {\n  const v = formik.values',
  `function BusinessPreview({ formik, hasTransfer, serviceOptions }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const v = formik.values`,
)

s = s.replace(
  "const activity = BUSINESS_ACTIVITIES.find((a) => a.value === v.primaryActivity)\n  const experience = businessExperienceForActivity(v.primaryActivity)",
  `const activity = BUSINESS_ACTIVITIES.find((a) => a.value === v.primaryActivity)
  const activityLabel = businessesOptionLabel(t, activity)
  const experience = businessExperienceForActivity(v.primaryActivity)
  const experiencePromise = experience.promiseKey
    ? businessesText(t, experience.promiseKey)
    : experience.promise`,
)

// Replace common preview strings carefully
s = s.replace(
  `      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
        Apercu de votre fiche
      </p>`,
  `      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
        {bt('businesses.setup.preview.title')}
      </p>`,
)

s = s.replace(
  `            Republier annuaire`,
  `            {bt('businesses.setup.preview.republish')}`,
)

s = s.replace(
  `{v.name || 'Nom de l entreprise'}`,
  `{v.name || bt('businesses.setup.preview.companyNamePlaceholder')}`,
)

s = s.replace(
  `{activity ? <p className="mt-0.5 font-semibold text-brand-700">{activity.label}</p> : null}`,
  `{activity ? <p className="mt-0.5 font-semibold text-brand-700">{activityLabel}</p> : null}`,
)

s = s.replace(
  `<FiMapPin className="shrink-0" /> {v.city}, Russie`,
  `<FiMapPin className="shrink-0" /> {bt('businesses.setup.preview.cityRussia', { city: v.city })}`,
)

s = s.replace(
  `alt="QR code apercu"`,
  `alt={bt('businesses.setup.preview.qrAlt')}`,
)

s = s.replace(
  `alt="Logo"
                className="size-16 rounded-2xl border-4 border-[var(--app-surface)] object-cover shadow-lg"`,
  `alt={bt('businesses.setup.preview.logoAlt')}
                className="size-16 rounded-2xl border-4 border-[var(--app-surface)] object-cover shadow-lg"`,
)

s = s.replace(
  `{v.name || <span className="italic text-[var(--app-text-muted)]">Nom de l entreprise</span>}`,
  `{v.name || <span className="italic text-[var(--app-text-muted)]">{bt('businesses.setup.preview.companyNamePlaceholder')}</span>}`,
)

s = s.replace(
  `{activity ? (
              <p className={\`mt-0.5 text-xs font-bold \${colors.text}\`}>{activity.label}</p>
            ) : null}`,
  `{activity ? (
              <p className={\`mt-0.5 text-xs font-bold \${colors.text}\`}>{activityLabel}</p>
            ) : null}`,
)

s = s.replace(
  `Votre presentation apparaitra ici.`,
  `{bt('businesses.setup.preview.presentationPlaceholder')}`,
)

s = s.replace(
  `<strong className={\`block \${colors.text}\`}>{activity.label}</strong>
              <span className="text-[var(--app-text-muted)]">{experience.promise}</span>`,
  `<strong className={\`block \${colors.text}\`}>{activityLabel}</strong>
              <span className="text-[var(--app-text-muted)]">{experiencePromise}</span>`,
)

s = s.replace(
  `<FiMapPin className="shrink-0 text-brand-600" /> {v.city} · Russie`,
  `<FiMapPin className="shrink-0 text-brand-600" /> {bt('businesses.setup.preview.cityDotRussia', { city: v.city })}`,
)

s = s.replace(
  `<span className="text-[10px] text-[var(--app-text-muted)]">0 avis</span>`,
  `<span className="text-[10px] text-[var(--app-text-muted)]">{bt('businesses.setup.preview.reviewsZero')}</span>`,
)

s = s.replace(
  `<span className="text-[10px] text-[var(--app-text-muted)]">Frais</span>`,
  `<span className="text-[10px] text-[var(--app-text-muted)]">{bt('businesses.setup.preview.fees')}</span>`,
)

s = s.replace(
  `Votre fiche sera visible apres validation`,
  `{bt('businesses.setup.preview.visibleAfterValidation')}`,
)

// Main page
s = s.replace(
  `export function BusinessSetupPage() {
  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const { requireBusiness } = useSecurityGate()`,
  `export function BusinessSetupPage() {
  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const { requireBusiness } = useSecurityGate()`,
)

s = s.replace(
  "serviceZones: ownBusiness?.serviceZones || 'Moscou et villes proches',",
  "serviceZones: ownBusiness?.serviceZones || businessesText(t, 'businesses.setup.defaults.serviceZones'),",
)

s = s.replace(
  "averageDelay: ownBusiness?.averageDelay || '30-60 min',",
  "averageDelay: ownBusiness?.averageDelay || businessesText(t, 'businesses.setup.defaults.averageDelay'),",
)

s = s.replace(
  'validationSchema: businessSchema,',
  'validationSchema: businessSchemaFor(t),',
)

s = s.replace(
  `      <PageHeader
        eyebrow="Espace entreprise"
        title={ownBusiness ? 'Modifier mon entreprise' : 'Creer mon entreprise'}
        description="Parcours en plusieurs etapes pour configurer votre activite, vos contacts en Russie et vos services."
        actions={
          <Link to={ownBusiness ? '/professional' : '/businesses'}>
            <Button variant="secondary" icon={FiArrowLeft}>Retour</Button>
          </Link>
        }
      />

      <Alert title="Validation requise">
        Votre entreprise reste invisible dans l annuaire jusqu a confirmation par un administrateur.
      </Alert>`,
  `      <PageHeader
        eyebrow={bt('businesses.setup.eyebrow')}
        title={ownBusiness ? bt('businesses.setup.title.edit') : bt('businesses.setup.title.create')}
        description={bt('businesses.setup.description')}
        actions={
          <Link to={ownBusiness ? '/professional' : '/businesses'}>
            <Button variant="secondary" icon={FiArrowLeft}>{bt('businesses.common.back')}</Button>
          </Link>
        }
      />

      <Alert title={bt('businesses.setup.validationAlertTitle')}>
        {bt('businesses.setup.validationAlertBody')}
      </Alert>`,
)

s = s.replace(
  `            Retour
          </Button>
          {step < 4 ? (
            <Button type="button" icon={FiArrowRight} onClick={nextStep}>
              Continuer
            </Button>
          ) : (
            <Button type="submit" icon={FiCheckCircle} loading={formik.isSubmitting}>
              {ownBusiness ? 'Enregistrer les modifications' : 'Envoyer pour validation'}
            </Button>
          )}`,
  `            {bt('businesses.common.back')}
          </Button>
          {step < 4 ? (
            <Button type="button" icon={FiArrowRight} onClick={nextStep}>
              {bt('businesses.common.continue')}
            </Button>
          ) : (
            <Button type="submit" icon={FiCheckCircle} loading={formik.isSubmitting}>
              {ownBusiness
                ? bt('businesses.setup.saveChanges')
                : bt('businesses.setup.submitForValidation')}
            </Button>
          )}`,
)

fs.writeFileSync(path, s)
console.log('setup main+preview patched')
