const fs = require('fs')
const path = 'moxt-react/src/pages/BusinessSetupPage.jsx'
let s = fs.readFileSync(path, 'utf8')

if (!s.includes("from '../contexts/useLanguage'")) {
  s = s.replace(
    "import { makeQrCodeUrl } from '../utils/qrCode'",
    `import { makeQrCodeUrl } from '../utils/qrCode'
import { useLanguage } from '../contexts/useLanguage'
import {
  businessesOptionLabel,
  businessesOptionDescription,
  businessesServiceLabel,
  businessesSpotlightLabel,
  businessesText,
} from '../features/businesses/businessesI18n'`,
  )
}

s = s.replace(
  "import { businessSchema } from '../features/businesses/businessSchemas'",
  "import { businessSchemaFor } from '../features/businesses/businessSchemas'",
)

s = s.replace(
  /const STEPS = \[[\s\S]*?\]\n/,
  `const STEP_DEFS = [
  { value: 1, key: 'identity', labelKey: 'businesses.setup.steps.identity', icon: FiUser, color: 'brand' },
  { value: 2, key: 'contact', labelKey: 'businesses.setup.steps.contact', icon: FiMapPin, color: 'cyan' },
  { value: 3, key: 'services', labelKey: 'businesses.setup.steps.services', icon: FiZap, color: 'violet' },
  { value: 4, key: 'review', labelKey: 'businesses.setup.steps.review', icon: FiCheckCircle, color: 'emerald' },
]

`,
)

fs.writeFileSync(path, s)
console.log('ok', {
  stepDefs: s.includes('STEP_DEFS'),
  useLanguage: s.includes('useLanguage'),
  schemaFor: s.includes('businessSchemaFor'),
})
