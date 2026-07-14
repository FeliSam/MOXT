#!/usr/bin/env node
/**
 * Génère un keystore release Android (si absent) + key.properties gitignoré.
 *
 * Usage : npm run android:keystore
 *
 * Ne log jamais les mots de passe. Sauvegardez key.properties + le .jks hors du repo.
 */
import { randomBytes, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const androidRoot = path.resolve(__dirname, '../android')
const keystoreDir = path.join(androidRoot, 'keystore')
const keystorePath = path.join(keystoreDir, 'moxt-release.jks')
const keyPropertiesPath = path.join(androidRoot, 'key.properties')
const keyAlias = 'moxt'
const validityDays = '10000'
const dname = 'CN=MOXT, OU=Mobile, O=MOXT, L=Moscow, C=RU'

function banner() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — keystore release Android')
  console.log('══════════════════════════════════════\n')
}

function findKeytool() {
  const candidates = []
  try {
    execFileSync('keytool', ['-help'], { stdio: 'ignore' })
    return 'keytool'
  } catch {
    /* fall through */
  }

  const javaHome = process.env.JAVA_HOME
  if (javaHome) {
    candidates.push(
      path.join(javaHome, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool'),
    )
  }

  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || ''
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files'
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    candidates.push(
      path.join(pf, 'Android', 'Android Studio', 'jbr', 'bin', 'keytool.exe'),
      path.join(local, 'Programs', 'Android', 'Android Studio', 'jbr', 'bin', 'keytool.exe'),
      path.join(pf86, 'Android', 'Android Studio', 'jbr', 'bin', 'keytool.exe'),
    )
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool',
    )
  }

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate
  }
  return null
}

function strongPassword() {
  // Alphanum + symboles sûrs pour keytool / properties (pas d'espace ni # = !)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = randomBytes(32)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `${out}${randomUUID().replace(/-/g, '').slice(0, 8)}`
}

function writeKeyProperties({ storePassword, keyPassword }) {
  // storeFile relatif au module app/ (app/build.gradle)
  const storeFileRelative = '../keystore/moxt-release.jks'
  const content = [
    '# Généré localement — NE PAS COMMITTER',
    `storePassword=${storePassword}`,
    `keyPassword=${keyPassword}`,
    `keyAlias=${keyAlias}`,
    `storeFile=${storeFileRelative}`,
    '',
  ].join('\n')
  writeFileSync(keyPropertiesPath, content, { encoding: 'utf8', mode: 0o600 })
}

function printFrenchInstructions({ createdKeystore, wroteProperties }) {
  console.log('Instructions importantes')
  console.log('───────────────────────')
  if (createdKeystore) {
    console.log(`  ✓ Keystore créé : android/keystore/moxt-release.jks`)
  } else {
    console.log(`  ✓ Keystore déjà présent : android/keystore/moxt-release.jks (non régénéré)`)
  }
  if (wroteProperties) {
    console.log(`  ✓ key.properties écrit : android/key.properties`)
  } else {
    console.log(`  ✓ key.properties déjà présent (inchangé)`)
  }
  console.log('')
  console.log('  1. SAUVEGARDEZ le fichier .jks + key.properties hors du dépôt')
  console.log('     (disque chiffré, coffre-fort, gestionnaire de secrets).')
  console.log('  2. Ne committez jamais *.jks, *.keystore ni key.properties.')
  console.log('  3. RuStore exige le MÊME certificat de signature pour les mises')
  console.log('     à jour — perdre le keystore = impossible de mettre à jour l’app.')
  console.log('  4. Les mots de passe sont UNIQUEMENT dans key.properties')
  console.log('     (ils ne sont pas affichés ici).')
  console.log('')
  console.log('Build AAB signé :')
  console.log('  npm run web:cap:prod:sync')
  console.log('  cd moxt-react/android')
  console.log('  .\\gradlew.bat bundleRelease     # Windows')
  console.log('  # → app/build/outputs/bundle/release/app-release.aab')
  console.log('')
  console.log('Sans keytool / sans key.properties :')
  console.log('  Android Studio → Build → Generate Signed Bundle / APK')
  console.log('  (créer ou choisir le keystore, puis Build Bundle).')
  console.log('')
}

function main() {
  banner()

  if (!existsSync(androidRoot)) {
    console.error(`Répertoire Android introuvable : ${androidRoot}`)
    process.exit(1)
  }

  mkdirSync(keystoreDir, { recursive: true })

  const keystoreExists = existsSync(keystorePath)
  const propsExist = existsSync(keyPropertiesPath)

  if (keystoreExists && propsExist) {
    printFrenchInstructions({ createdKeystore: false, wroteProperties: false })
    return
  }

  let storePassword
  let keyPassword

  if (propsExist) {
    // Eviter d’écraser des mots de passe existants : régénérer seulement le .jks manque
    console.error(
      'key.properties existe déjà mais le keystore manque.\n' +
        'Supprimez key.properties manuellement si vous voulez en régénérer un,\n' +
        'ou restaurez le .jks depuis votre sauvegarde.',
    )
    process.exit(1)
  }

  storePassword = strongPassword()
  keyPassword = storePassword

  if (!keystoreExists) {
    const keytool = findKeytool()
    if (!keytool) {
      console.error('keytool introuvable (JDK / JAVA_HOME).')
      console.error('')
      console.error('Repli : Android Studio → Build → Generate Signed Bundle / APK')
      console.error('Puis créez android/key.properties à partir de key.properties.example')
      console.error('avec le chemin vers votre .jks et vos mots de passe.')
      process.exit(1)
    }

    try {
      execFileSync(
        keytool,
        [
          '-genkeypair',
          '-v',
          '-storetype',
          'PKCS12',
          '-keystore',
          keystorePath,
          '-alias',
          keyAlias,
          '-keyalg',
          'RSA',
          '-keysize',
          '2048',
          '-validity',
          validityDays,
          '-storepass',
          storePassword,
          '-keypass',
          keyPassword,
          '-dname',
          dname,
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] },
      )
    } catch (err) {
      const detail = err?.stderr?.toString?.() || err?.message || String(err)
      console.error('Échec keytool (détails techniques, sans mots de passe) :')
      console.error(detail.replace(storePassword, '***').replace(keyPassword, '***'))
      process.exit(1)
    }
  }

  writeKeyProperties({ storePassword, keyPassword })
  printFrenchInstructions({
    createdKeystore: !keystoreExists,
    wroteProperties: true,
  })
}

main()
