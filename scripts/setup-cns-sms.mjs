#!/usr/bin/env node
/**
 * Configure Yandex CNS SMS : canal MOXT, sandbox, test optionnel.
 * Usage :
 *   npm run setup:cns
 *   $env:MOXT_CNS_TEST_PHONE="+7999..."; npm run setup:cns
 *   $env:YC_CNS_VERIFY_OTP="123456"; npm run setup:cns
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ensureCommonSandboxChannel,
  ensureNotificationsEditorRole,
  ensureSmsChannel,
  folderId,
  listSandboxPhones,
  phase2EnvPath,
  requestSandboxPhoneVerification,
  sendChannelTestSms,
  verifySandboxPhone,
  getSmsChannelAttributes,
  probeSandboxChannel,
  channelStateLabel,
  isSandboxChannel,
} from './lib/cns.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const senderId = process.env.YC_SNS_SENDER_ID || 'MOXT'
const testPhone = process.env.MOXT_CNS_TEST_PHONE || process.env.MOXT_CNS_TEST_PHONE_E164
const verifyOtp = process.env.YC_CNS_VERIFY_OTP
const useSharedSandbox = process.env.MOXT_CNS_SHARED_SANDBOX === '1'

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function normalizePhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.length === 10) return `+7${digits}`
  if (String(phone).trim().startsWith('+')) return `+${digits}`
  return `+${digits}`
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  CNS — SMS OTP automatique')
  console.log('══════════════════════════════════════')
  console.log('\n  ⚠ Facturation Yandex CNS (payant) :')
  console.log('  • Enregistrement expéditeur individuel (ex. MOXT) — abonnement mensuel fixe')
  console.log('  • Traitement des envois SMS — y compris numéros de test sandbox')
  console.log('  • Détails : https://yandex.cloud/en/docs/notifications/pricing')
  if (!useSharedSandbox) {
    console.log('\n  Astuce dev : MOXT_CNS_SHARED_SANDBOX=1 → expéditeur partagé, sans abonnement MOXT')
  }

  if (!existsSync(phase2EnvPath)) {
    console.error('\n✗ scripts/phase2.env introuvable.')
    console.error('  Lancez : npm run setup:yandex-provision')
    process.exit(1)
  }

  const folder = folderId()
  if (!folder) throw new Error('folder-id Yandex introuvable (yc init)')

  log('Rôles IAM', 'notifications.editor + notifications.publisher')
  ensureNotificationsEditorRole(folder)

  let channel
  if (useSharedSandbox) {
    log('Canal SMS', 'expéditeur partagé (sandbox test)')
    channel = await ensureCommonSandboxChannel(folder)
  } else {
    log('Canal SMS', `expéditeur individuel ${senderId}`)
    channel = await ensureSmsChannel(senderId, folder)
  }

  log('Canal ARN', channel.arn)
  channel = await getSmsChannelAttributes(channel.arn)
  log('État canal', channelStateLabel(channel))

  const phone = normalizePhone(testPhone)
  let sandboxMode = isSandboxChannel(channel)
  if (sandboxMode === null) {
    sandboxMode = await probeSandboxChannel(channel.arn)
    log('Mode détecté', sandboxMode ? 'sandbox' : 'production (hors sandbox)')
  }

  async function sendDirectTestSms() {
    log('SMS test', `${phone} via ${sandboxMode ? 'sandbox' : 'production'}`)
    const { messageId, senderId: resolvedSender } = await sendChannelTestSms({
      phone,
      channel,
      senderId,
      useSharedSandbox,
    })
    console.log(`  ✓ MessageId ${messageId} (expéditeur ${resolvedSender})`)
  }

  if (phone) {
    if (!sandboxMode) {
      if (verifyOtp) {
        console.log('\n  Le canal n’est plus en sandbox — la vérification OTP sandbox est ignorée.')
      }
      try {
        await sendDirectTestSms()
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (/template|authorization|not found|inactive/i.test(msg)) {
          console.error('\n✗ Envoi production impossible — modèle SMS Authorization requis.')
          console.error('  Console Yandex → CNS → canal MOXT → Templates → type Authorization')
          console.error('  Texte : Код MOXT: {code}. Никому не сообщайте.')
        }
        throw error
      }
    } else if (verifyOtp) {
      log('Vérification sandbox', phone)
      await verifySandboxPhone(channel.arn, phone, verifyOtp)
      console.log('  ✓ numéro vérifié')
      if (process.env.MOXT_CNS_SEND_TEST === '1') {
        await sendDirectTestSms()
      }
    } else {
      const verified = await listSandboxPhones(channel.arn)
      const already = verified.some(
        (entry) =>
          normalizePhone(entry?.PhoneNumber || entry) === phone &&
          (entry?.VerificationStatus === 'Verified' || entry?.Status === 'Verified'),
      )
      if (!already) {
        log('Code SMS sandbox', `envoi vers ${phone}`)
        await requestSandboxPhoneVerification(channel.arn, phone)
        console.log('\n  Un code SMS vient d’être envoyé.')
        console.log('  Relancez avec :')
        console.log(`    $env:YC_CNS_VERIFY_OTP="123456"; $env:MOXT_CNS_TEST_PHONE="${phone}"; npm run setup:cns`)
      } else {
        log('Numéro sandbox', `${phone} déjà vérifié`)
        if (process.env.MOXT_CNS_SEND_TEST === '1') {
          await sendDirectTestSms()
        }
      }
    }
  } else {
    console.log('\n  Option test :')
    if (sandboxMode) {
      console.log('    $env:MOXT_CNS_TEST_PHONE="+79991234567"; npm run setup:cns')
    } else {
      console.log('    $env:MOXT_CNS_TEST_PHONE="+79991234567"; npm run setup:cns')
      console.log('    (canal production — envoi SMS direct, sans étape sandbox)')
    }
  }

  if (process.env.MOXT_CNS_SKIP_PHASE2 !== '1') {
    log('Supabase', 'secrets + fonction send-sms')
    const phase2 = spawnSync(
      process.execPath,
      [path.join(root, 'scripts', 'setup-phase2-postbox-sms.mjs')],
      {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
      },
    )
    if (phase2.status !== 0) {
      process.exitCode = phase2.status ?? 1
      return
    }
  }

  console.log('\n══════════════════════════════════════')
  console.log('  CNS configuré (partie automatique)')
  console.log('══════════════════════════════════════')
  console.log('\n  Manuel (console Yandex, si modèle SMS pas encore actif) :')
  console.log('  1. CNS → canal MOXT → Templates → Create')
  console.log('     Type : Authorization')
  console.log('     Texte : Код MOXT: {code}. Никому не сообщайте.')
  console.log('  2. Attendre statut Active du modèle (2–4 semaines)')
  if (sandboxMode) {
    console.log('  3. Canal MOXT → Leave sandbox (ticket support)')
    console.log('\n  Test sandbox :')
    console.log('    $env:MOXT_CNS_TEST_PHONE="+7999..."; npm run setup:cns')
  } else {
    console.log('\n  Canal hors sandbox — test direct :')
    console.log('    $env:MOXT_CNS_TEST_PHONE="+7999..."; npm run setup:cns')
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  if (String(err?.message || '').includes('403') || String(err?.message || '').includes('Forbidden')) {
    console.error('\n  Activez CNS Preview : console Yandex → Notification Service → demander l’accès')
  }
  process.exitCode = 1
})
