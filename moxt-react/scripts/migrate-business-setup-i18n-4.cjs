const fs = require('fs')
const path = 'moxt-react/src/pages/BusinessSetupPage.jsx'
let s = fs.readFileSync(path, 'utf8')

s = s.replace(
  `function ContactStep({ errorFor, formik, onScheduleChange, onUseAccountPhone }) {
  return (`,
  `function ContactStep({ errorFor, formik, onScheduleChange, onUseAccountPhone }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  return (`,
)

s = s.replace(
  `<SectionTitle icon={FiMapPin} label="Localisation" description="Ville et adresse de votre activite en Russie." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="business-country" label="Pays" value="Russie" disabled />
          <CitySelector
            id="business-city"
            label="Ville en Russie"`,
  `<SectionTitle icon={FiMapPin} label={bt('businesses.setup.contact.locationSection')} description={bt('businesses.setup.contact.locationHint')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="business-country" label={bt('businesses.common.country')} value={bt('businesses.common.russia')} disabled />
          <CitySelector
            id="business-city"
            label={bt('businesses.setup.contact.cityInRussia')}`,
)

s = s.replace(
  `          label="Adresse complete"
          placeholder="Rue, immeuble, metro ou repere"`,
  `          label={bt('businesses.setup.contact.fullAddress')}
          placeholder={bt('businesses.setup.contact.addressPlaceholder')}`,
)

s = s.replace(
  `            label="Horaires"
            value={formik.values.scheduleType}
            onChange={(event) => onScheduleChange(event.target.value)}
            error={errorFor('scheduleType')}
          >
            {BUSINESS_SCHEDULE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>{preset.label}</option>
            ))}
          </Select>
          <Input
            id="business-zones"
            label="Zones desservies"
            placeholder="Moscou, Saint-Petersbourg..."`,
  `            label={bt('businesses.common.hours')}
            value={formik.values.scheduleType}
            onChange={(event) => onScheduleChange(event.target.value)}
            error={errorFor('scheduleType')}
          >
            {BUSINESS_SCHEDULE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.labelKey ? businessesText(t, preset.labelKey) : preset.label}
              </option>
            ))}
          </Select>
          <Input
            id="business-zones"
            label={bt('businesses.setup.contact.serviceZones')}
            placeholder={bt('businesses.setup.contact.serviceZonesPlaceholder')}`,
)

s = s.replace(
  `<SectionTitle icon={FiPhone} label="Coordonnees" description="Moyens de contact visibles sur votre fiche publique." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Input
              id="business-phone"
              label="Numero russe"`,
  `<SectionTitle icon={FiPhone} label={bt('businesses.setup.contact.coordsSection')} description={bt('businesses.setup.contact.coordsHint')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Input
              id="business-phone"
              label={bt('businesses.setup.contact.russianPhone')}`,
)

s = s.replace(
  `            <Button type="button" variant="secondary" onClick={onUseAccountPhone}>
              Utiliser mon numero du compte
            </Button>
          </div>
          <Input
            id="business-origin-phone"
            label="Numero du pays d origine"`,
  `            <Button type="button" variant="secondary" onClick={onUseAccountPhone}>
              {bt('businesses.setup.contact.useAccountPhone')}
            </Button>
          </div>
          <Input
            id="business-origin-phone"
            label={bt('businesses.setup.contact.originPhone')}`,
)

s = s.replace(
  `            label="Email professionnel"
            type="email"
            placeholder="contact@monentreprise.com"`,
  `            label={bt('businesses.setup.contact.professionalEmail')}
            type="email"
            placeholder={bt('businesses.setup.contact.emailPlaceholder')}`,
)

s = s.replace(
  `            label="Telegram"
            placeholder="@username"`,
  `            label={bt('businesses.setup.contact.telegram')}
            placeholder={bt('businesses.setup.contact.telegramPlaceholder')}`,
)

s = s.replace(
  `          label="Site web"
          placeholder="https://..."`,
  `          label={bt('businesses.setup.contact.website')}
          placeholder={bt('businesses.setup.contact.websitePlaceholder')}`,
)

s = s.replace(
  `              title="Generer automatiquement la presentation"
              aria-label="Generer automatiquement la presentation"`,
  `              title={bt('businesses.setup.contact.generateAria')}
              aria-label={bt('businesses.setup.contact.generateAria')}`,
)

s = s.replace(
  `          icon={FiGlobe}
          label="Presentation"
          description="Decrivez votre entreprise, votre specialite et votre zone d intervention. Cliquez sur l'eclair pour generer un texte a partir de vos informations."
        />
        <Textarea
          id="business-description"
          label="A propos de votre entreprise"
          rows={5}
          placeholder="Nous proposons... Notre specialite est... Nous intervenons sur..."`,
  `          icon={FiGlobe}
          label={bt('businesses.setup.contact.presentationSection')}
          description={bt('businesses.setup.contact.presentationHint')}
        />
        <Textarea
          id="business-description"
          label={bt('businesses.setup.contact.about')}
          rows={5}
          placeholder={bt('businesses.setup.contact.aboutPlaceholder')}`,
)

// ServicesStep
s = s.replace(
  `function ServicesStep({
  exchangeMethodOptions,
  errorFor,
  formik,
  hasTransfer,
  serviceOptions,
  toggleArrayField,
  transferCurrencies,
}) {
  return (`,
  `function ServicesStep({
  exchangeMethodOptions,
  errorFor,
  formik,
  hasTransfer,
  serviceOptions,
  toggleArrayField,
  transferCurrencies,
}) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  return (`,
)

s = s.replace(
  `<SectionTitle icon={FiZap} label="Modules actives" description="Definis automatiquement selon votre domaine principal." />
        <div className="flex flex-wrap gap-2">
          {serviceOptions.length ? (
            serviceOptions.map((service) => (
              <Badge key={service} tone={service === 'Transfert' ? 'success' : 'info'}>
                <FiCheckCircle className="mr-1 inline" />
                {service}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">
              Selectionnez un domaine principal (etape 1) pour activer les modules.
            </p>
          )}`,
  `<SectionTitle icon={FiZap} label={bt('businesses.setup.services.modulesSection')} description={bt('businesses.setup.services.modulesHint')} />
        <div className="flex flex-wrap gap-2">
          {serviceOptions.length ? (
            serviceOptions.map((service) => (
              <Badge key={service} tone={service === 'Transfert' ? 'success' : 'info'}>
                <FiCheckCircle className="mr-1 inline" />
                {businessesServiceLabel(t, service)}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">
              {bt('businesses.setup.services.selectDomainFirst')}
            </p>
          )}`,
)

s = s.replace(
  `<SectionTitle icon={FiSettings} label="Configuration transfert" description="Les devises et reseaux suivent le pays d origine du createur de l entreprise." />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="business-fee"
              label="Frais (%)"`,
  `<SectionTitle icon={FiSettings} label={bt('businesses.setup.services.transferSection')} description={bt('businesses.setup.services.transferHint')} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="business-fee"
              label={bt('businesses.setup.services.feePercent')}`,
)

s = s.replace(
  `              label="Delai moyen"
              placeholder="Ex : 30-60 min"`,
  `              label={bt('businesses.setup.services.averageDelay')}
              placeholder={bt('businesses.setup.services.averageDelayPlaceholder')}`,
)

s = s.replace(
  `            label="Devises echangees"`,
  `            label={bt('businesses.setup.services.currencies')}`,
)

s = s.replace(
  `            <p className="mb-1 text-sm font-semibold">Reseaux africains et banques russes</p>
            <p className="mb-3 text-xs text-[var(--app-text-muted)]">Cochez les modes de paiement que vous acceptez des deux cotes.</p>`,
  `            <p className="mb-1 text-sm font-semibold">{bt('businesses.setup.services.networksTitle')}</p>
            <p className="mb-3 text-xs text-[var(--app-text-muted)]">{bt('businesses.setup.services.networksHint')}</p>`,
)

s = s.replace(
  `<p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">Reseaux africains</p>`,
  `<p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">{bt('businesses.setup.services.africanNetworks')}</p>`,
)

s = s.replace(
  `<p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">Banques russes</p>`,
  `<p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">{bt('businesses.setup.services.russianBanks')}</p>`,
)

fs.writeFileSync(path, s)
console.log('contact+services patched')
