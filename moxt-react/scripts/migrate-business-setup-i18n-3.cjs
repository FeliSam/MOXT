const fs = require('fs')
const path = 'moxt-react/src/pages/BusinessSetupPage.jsx'
let s = fs.readFileSync(path, 'utf8')

// Keep data defaults as French literals (stored values)
s = s.replace(
  "serviceZones: ownBusiness?.serviceZones || businessesText(t, 'businesses.setup.defaults.serviceZones'),",
  "serviceZones: ownBusiness?.serviceZones || 'Moscou et villes proches',",
)
s = s.replace(
  "averageDelay: ownBusiness?.averageDelay || businessesText(t, 'businesses.setup.defaults.averageDelay'),",
  "averageDelay: ownBusiness?.averageDelay || '30-60 min',",
)

// IdentityStep
s = s.replace(
  `function IdentityStep({ businessId, errorFor, formik, userId }) {
  const dispatch = useDispatch()`,
  `function IdentityStep({ businessId, errorFor, formik, userId }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const dispatch = useDispatch()`,
)

s = s.replace(
  `        addToast({
          title: 'Logo ajouté',
          message: 'Le logo de l’entreprise a été envoyé.',
          tone: 'success',
        }),`,
  `        addToast({
          title: bt('businesses.setup.toast.logoAddedTitle'),
          message: bt('businesses.setup.toast.logoAddedBody'),
          tone: 'success',
        }),`,
)

s = s.replace(
  `        addToast({
          title: 'Logo non envoyé',
          message: err.message || "Le logo n'a pas pu être envoyé.",
          tone: 'error',
        }),`,
  `        addToast({
          title: bt('businesses.setup.toast.logoFailedTitle'),
          message: err.message || bt('businesses.setup.toast.logoFailedBody'),
          tone: 'error',
        }),`,
)

s = s.replace(
  `        addToast({
          title: 'Bannière ajoutée',
          message: 'La bannière de l’entreprise a été envoyée.',
          tone: 'success',
        }),`,
  `        addToast({
          title: bt('businesses.setup.toast.bannerAddedTitle'),
          message: bt('businesses.setup.toast.bannerAddedBody'),
          tone: 'success',
        }),`,
)

s = s.replace(
  `        addToast({
          title: 'Bannière non envoyée',
          message: err.message || "La bannière n'a pas pu être envoyée.",
          tone: 'error',
        }),`,
  `        addToast({
          title: bt('businesses.setup.toast.bannerFailedTitle'),
          message: err.message || bt('businesses.setup.toast.bannerFailedBody'),
          tone: 'error',
        }),`,
)

s = s.replace(
  `<SectionTitle icon={FiUser} label="Identite de l entreprise" description="Le nom public qui apparaitra dans l annuaire MOXT." />
        <Input
          id="business-name"
          label="Nom public de l'entreprise"
          placeholder="Ex : Koudjo Transfer, Afrik Logistique..."`,
  `<SectionTitle icon={FiUser} label={bt('businesses.setup.identity.section')} description={bt('businesses.setup.identity.sectionHint')} />
        <Input
          id="business-name"
          label={bt('businesses.setup.identity.name')}
          placeholder={bt('businesses.setup.identity.namePlaceholder')}`,
)

s = s.replace(
  `<SectionTitle icon={FiZap} label="Domaine principal" description="Choisissez le coeur de votre activite. Cela definit vos modules et votre positionnement." />`,
  `<SectionTitle icon={FiZap} label={bt('businesses.setup.identity.domainSection')} description={bt('businesses.setup.identity.domainHint')} />`,
)

s = s.replace(
  `{activity.label}
                </span>
              </button>
            )
          })}
        </div>
        {errorFor('primaryActivity') ? (
          <p className="text-xs text-red-600">{errorFor('primaryActivity')}</p>
        ) : null}

        {selectedActivity ? (
          <div className={\`flex items-start gap-3 rounded-2xl p-4 \${ACTIVITY_COLORS[selectedActivity.value]?.bg || ''}\`}>
            <selectedActivity.icon className={\`mt-0.5 shrink-0 text-lg \${ACTIVITY_COLORS[selectedActivity.value]?.text || ''}\`} />
            <div>
              <p className={\`text-sm font-black \${ACTIVITY_COLORS[selectedActivity.value]?.text || ''}\`}>{selectedActivity.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{selectedActivity.description}</p>
            </div>
          </div>
        ) : null}

        {/* Secondary activity */}
        <Select
          id="business-secondary-activity"
          label="Activite secondaire (facultatif)"
          {...formik.getFieldProps('secondaryActivity')}
          error={errorFor('secondaryActivity')}
        >
          <option value="">Aucune activite secondaire</option>
          {BUSINESS_ACTIVITIES.filter((a) => a.value !== formik.values.primaryActivity).map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </Select>
      </Card>

      {/* Visuals */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiCamera} label="Identite visuelle" description="Logo et banniere affiches sur votre fiche publique." />

        {/* Logo */}
        <div>
          <p className="mb-3 text-sm font-bold">Logo</p>`,
  `{businessesOptionLabel(t, activity)}
                </span>
              </button>
            )
          })}
        </div>
        {errorFor('primaryActivity') ? (
          <p className="text-xs text-red-600">{errorFor('primaryActivity')}</p>
        ) : null}

        {selectedActivity ? (
          <div className={\`flex items-start gap-3 rounded-2xl p-4 \${ACTIVITY_COLORS[selectedActivity.value]?.bg || ''}\`}>
            <selectedActivity.icon className={\`mt-0.5 shrink-0 text-lg \${ACTIVITY_COLORS[selectedActivity.value]?.text || ''}\`} />
            <div>
              <p className={\`text-sm font-black \${ACTIVITY_COLORS[selectedActivity.value]?.text || ''}\`}>{businessesOptionLabel(t, selectedActivity)}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{businessesOptionDescription(t, selectedActivity)}</p>
            </div>
          </div>
        ) : null}

        {/* Secondary activity */}
        <Select
          id="business-secondary-activity"
          label={bt('businesses.setup.identity.secondary')}
          {...formik.getFieldProps('secondaryActivity')}
          error={errorFor('secondaryActivity')}
        >
          <option value="">{bt('businesses.setup.identity.secondaryNone')}</option>
          {BUSINESS_ACTIVITIES.filter((a) => a.value !== formik.values.primaryActivity).map((a) => (
            <option key={a.value} value={a.value}>{businessesOptionLabel(t, a)}</option>
          ))}
        </Select>
      </Card>

      {/* Visuals */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiCamera} label={bt('businesses.setup.identity.visualSection')} description={bt('businesses.setup.identity.visualHint')} />

        {/* Logo */}
        <div>
          <p className="mb-3 text-sm font-bold">{bt('businesses.setup.identity.logo')}</p>`,
)

s = s.replace(
  `{formik.values.logoUrl ? 'Changer le logo' : 'Ajouter un logo'}`,
  `{formik.values.logoUrl ? bt('businesses.setup.identity.changeLogo') : bt('businesses.setup.identity.addLogo')}`,
)

s = s.replace(
  `<button type="button" className="text-xs text-red-600 hover:underline" onClick={() => formik.setFieldValue('logoUrl', '')}>
                  Supprimer
                </button>`,
  `<button type="button" className="text-xs text-red-600 hover:underline" onClick={() => formik.setFieldValue('logoUrl', '')}>
                  {bt('businesses.common.delete')}
                </button>`,
)

s = s.replace(
  `<p className="mb-3 text-sm font-bold">Banniere de fond</p>`,
  `<p className="mb-3 text-sm font-bold">{bt('businesses.setup.identity.banner')}</p>`,
)

s = s.replace(
  `alt="Banniere" className="h-32 w-full rounded-[1.5rem] object-cover shadow-md"`,
  `alt={bt('businesses.setup.identity.bannerAlt')} className="h-32 w-full rounded-[1.5rem] object-cover shadow-md"`,
)

s = s.replace(
  `                Supprimer
              </button>
            </div>
          ) : null}
          <Button type="button" variant="secondary" icon={FiImage} onClick={() => bannerInputRef.current?.click()}>
            {formik.values.bannerUrl ? 'Changer la banniere' : 'Ajouter une banniere'}
          </Button>`,
  `                {bt('businesses.common.delete')}
              </button>
            </div>
          ) : null}
          <Button type="button" variant="secondary" icon={FiImage} onClick={() => bannerInputRef.current?.click()}>
            {formik.values.bannerUrl ? bt('businesses.setup.identity.changeBanner') : bt('businesses.setup.identity.addBanner')}
          </Button>`,
)

fs.writeFileSync(path, s)
console.log('identity patched')
