import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { cloudId, folderId, ycJson, ycRun } from './yandex.mjs'

const endpoint = 'https://notifications.yandexcloud.net/'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const phase2EnvPath = path.join(root, 'scripts', 'phase2.env')
const saName = process.env.MOXT_AUTH_SA_NAME || 'moxt-auth'

function parseEnvFile(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

let cachedIamToken = ''
let cachedIamTokenAt = 0

function iamToken() {
  const now = Date.now()
  if (cachedIamToken && now - cachedIamTokenAt < 10 * 60 * 1000) return cachedIamToken
  const { code, stdout, stderr } = ycRun(['iam', 'create-token'])
  if (code !== 0 || !stdout) {
    throw new Error(`Token IAM : ${stderr || stdout}`)
  }
  cachedIamToken = stdout.trim()
  cachedIamTokenAt = now
  return cachedIamToken
}

function staticCredentials() {
  const vars = parseEnvFile(phase2EnvPath)
  const accessKeyId = vars.YC_SNS_ACCESS_KEY_ID
  const secretAccessKey = vars.YC_SNS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) return null
  return { accessKeyId, secretAccessKey }
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (value.member) return asArray(value.member)
  return [value]
}

function parseAttributes(attributes) {
  if (!attributes) return {}
  if (Array.isArray(attributes)) {
    return Object.fromEntries(
      attributes
        .map((entry) => [entry?.key || entry?.Key, entry?.value || entry?.Value])
        .filter(([key]) => key),
    )
  }
  if (typeof attributes === 'object') {
    if (attributes.Attribute) return parseAttributes(attributes.Attribute)
    if (attributes.entry) return parseAttributes(asArray(attributes.entry))
    return attributes
  }
  return {}
}

function normalizeChannels(result) {
  const channels = asArray(result?.ListSMSChannelsResult?.SMSChannels)
  return channels.map((channel) => ({
    arn: channel.SMSChannelArn,
    attributes: parseAttributes(channel.Attributes),
  }))
}

function cnsError(data, fallback = '') {
  const err = data?.ErrorResponse?.Error || data?.Error
  if (!err) return fallback
  if (typeof err === 'object') {
    return `${err.Code || 'Error'}${err.SubCode ? `/${err.SubCode}` : ''}: ${err.Message || JSON.stringify(err)}`
  }
  return String(err)
}

async function cnsRequest(params) {
  const body = new URLSearchParams({
    ResponseFormat: 'JSON',
    ...params,
  })
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      Authorization: `Bearer ${iamToken()}`,
    },
    body,
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  const embeddedError = cnsError(data)
  if (!res.ok || embeddedError) {
    const msg = embeddedError || text || `HTTP ${res.status}`
    const error = new Error(`CNS ${params.Action} → ${res.status} ${msg}`)
    error.status = res.status
    error.subCode = data?.ErrorResponse?.Error?.SubCode
    throw error
  }
  return data
}

export function ensureNotificationsEditorRole(folder) {
  const list = ycJson('iam', 'service-account', 'list', '--folder-id', folder)
  const accounts = Array.isArray(list) ? list : []
  const sa = accounts.find((a) => a.name === saName)
  if (!sa?.id) {
    throw new Error(`Compte de service ${saName} introuvable — npm run setup:yandex-provision`)
  }
  for (const role of ['notifications.editor', 'notifications.publisher']) {
    const { code, stderr, stdout } = ycRun([
      'resource-manager',
      'folder',
      'add-access-binding',
      folder,
      '--role',
      role,
      '--service-account-id',
      sa.id,
    ])
    if (code !== 0 && !String(stderr || stdout).toLowerCase().includes('already')) {
      throw new Error(`Rôle ${role} : ${stderr || stdout}`)
    }
  }
  return sa.id
}

function channelAlreadyExists(error) {
  const msg = error instanceof Error ? error.message : String(error)
  return error?.subCode === 'ChannelAlreadyExists' || /already exists/i.test(msg)
}

function parseExistingChannelRef(message = '') {
  const match = String(message).match(/SMS channel '([^']+)' already exists/i)
  if (!match) return null
  const [scopeId, sender] = match[1].split(':')
  return scopeId && sender ? { scopeId, sender } : null
}

export function smsChannelArn(scopeId, senderId) {
  return `arn:aws:sns::${scopeId}:sms/${senderId}`
}

export async function getSmsChannelAttributes(arn) {
  const data = await cnsRequest({
    Action: 'GetSMSChannelAttributes',
    SMSChannelArn: arn,
  })
  return {
    arn,
    attributes: parseAttributes(data?.GetSMSChannelAttributesResult?.Attributes),
  }
}

async function findSmsChannel(senderId, folder) {
  const fromList = (await listSmsChannels(folder)).find(
    (channel) => channel.attributes?.SenderID === senderId,
  )
  if (fromList?.arn) return fromList

  const cloud = cloudId()
  if (!cloud) return null

  for (const scopeId of [cloud, folder].filter(Boolean)) {
    try {
      const channel = await getSmsChannelAttributes(smsChannelArn(scopeId, senderId))
      if (channel?.arn) return channel
    } catch {
      // try next scope
    }
  }
  return null
}

export async function listSmsChannels(folder) {
  const data = await cnsRequest({
    Action: 'ListSMSChannels',
    FolderId: folder,
  })
  return normalizeChannels(data)
}

export async function ensureSmsChannel(senderId, folder) {
  const existing = await findSmsChannel(senderId, folder)
  if (existing?.arn) return existing

  try {
    const data = await cnsRequest({
      Action: 'CreateSMSChannel',
      SenderID: senderId,
      FolderId: folder,
      'Attributes.entry.1.key': 'Description',
      'Attributes.entry.1.value': 'MOXT OTP SMS',
    })
    const arn = data?.CreateSMSChannelResult?.SMSChannelArn
    if (!arn) {
      throw new Error(`CreateSMSChannel sans SMSChannelArn : ${JSON.stringify(data)}`)
    }
    return { arn, attributes: { SenderID: senderId } }
  } catch (error) {
    if (!channelAlreadyExists(error)) throw error

    const ref = parseExistingChannelRef(error instanceof Error ? error.message : String(error))
    if (ref?.scopeId) {
      try {
        return await getSmsChannelAttributes(smsChannelArn(ref.scopeId, ref.sender || senderId))
      } catch {
        // fall through
      }
    }

    const retry = await findSmsChannel(senderId, folder)
    if (retry?.arn) return retry
    throw error
  }
}

export async function ensureCommonSandboxChannel(folder) {
  const existing = await findSmsChannel('cns.shared', folder)
  if (existing?.arn) return existing

  try {
    const data = await cnsRequest({
      Action: 'CreateSMSChannel',
      FolderId: folder,
      'Attributes.entry.1.key': 'Description',
      'Attributes.entry.1.value': 'MOXT sandbox SMS',
    })
    const arn = data?.CreateSMSChannelResult?.SMSChannelArn
    if (!arn) throw new Error('CreateSMSChannel sandbox sans SMSChannelArn')
    return { arn, attributes: { SenderID: 'cns.shared' } }
  } catch (error) {
    if (!channelAlreadyExists(error)) throw error
    const retry = await findSmsChannel('cns.shared', folder)
    if (retry?.arn) return retry
    throw error
  }
}

export async function requestSandboxPhoneVerification(channelArn, phone) {
  await cnsRequest({
    Action: 'CreateSMSSandboxPhoneNumber',
    PhoneNumber: phone,
    SMSChannelArn: channelArn,
    LanguageCode: 'ru-RU',
  })
}

export async function verifySandboxPhone(channelArn, phone, otp) {
  await cnsRequest({
    Action: 'VerifySMSSandboxPhoneNumber',
    PhoneNumber: phone,
    SMSChannelArn: channelArn,
    OneTimePassword: otp,
  })
}

export async function listSandboxPhones(channelArn) {
  const data = await cnsRequest({
    Action: 'ListSMSSandboxPhoneNumbers',
    SMSChannelArn: channelArn,
  })
  const phones = asArray(data?.ListSMSSandboxPhoneNumbersResult?.PhoneNumbers)
  return phones
}

export function channelStateLabel(channel) {
  return (
    channel?.attributes?.ChannelState ||
    channel?.attributes?.channelState ||
    'inconnu'
  )
}

export function isNotSandboxError(error) {
  const msg = error instanceof Error ? error.message : String(error)
  return /not in Sandbox state/i.test(msg)
}

/** null = état indéterminé */
export function isSandboxChannel(channel) {
  const state = String(channelStateLabel(channel)).toLowerCase()
  if (state === 'sandbox') return true
  if (state && state !== 'inconnu' && state !== 'unknown') return false
  return null
}

export async function probeSandboxChannel(channelArn) {
  try {
    await listSandboxPhones(channelArn)
    return true
  } catch (error) {
    if (isNotSandboxError(error)) return false
    throw error
  }
}

export async function sendChannelTestSms({ phone, channel, senderId, useSharedSandbox }) {
  const env = readPhase2Env()
  const template =
    env.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'
  const message = template.replaceAll('{otp}', '123456').replaceAll('{code}', '123456')
  const resolvedSender = useSharedSandbox ? 'cns.shared' : senderId
  const messageId = await sendTestSms(phone, message, resolvedSender)
  return { messageId, message, senderId: resolvedSender }
}

export async function sendTestSms(phone, message, senderId) {
  const credentials = staticCredentials()
  if (!credentials) {
    throw new Error('scripts/phase2.env introuvable — npm run setup:yandex-provision')
  }
  const client = new SNSClient({
    endpoint,
    region: 'ru-central1',
    credentials,
  })
  const result = await client.send(
    new PublishCommand({
      PhoneNumber: phone,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: senderId,
        },
      },
    }),
  )
  return result.MessageId
}

export function readPhase2Env() {
  return parseEnvFile(phase2EnvPath)
}

export { folderId, phase2EnvPath }
