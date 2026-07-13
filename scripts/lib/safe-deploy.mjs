import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { runUploadBatch, uploadCacheControl, uploadObjectYc } from './yandex-upload.mjs'
import { isShellKey, SHELL_KEYS } from './deploy-shell-keys.mjs'
import { ycRun } from './yandex.mjs'

export { SHELL_KEYS, isShellKey }

export function partitionUploadItems(items = []) {
  const staged = []
  const shell = []
  for (const item of items) {
    if (isShellKey(item.key)) shell.push(item)
    else staged.push(item)
  }
  return { staged, shell }
}

function mergeBatchResults(acc, batch) {
  return {
    uploaded: acc.uploaded + batch.uploaded,
    failed: acc.failed + batch.failed,
    failedKeys: [...acc.failedKeys, ...(batch.failedKeys || [])],
  }
}

async function uploadWithRetries(bin, bucketName, items, options, maxAttempts) {
  let remaining = [...items]
  let result = { uploaded: 0, failed: 0, failedKeys: [] }

  for (let attempt = 1; attempt <= maxAttempts && remaining.length; attempt += 1) {
    if (attempt > 1) {
      console.log(`  ↻ Nouvelle tentative (${attempt}/${maxAttempts}) — ${remaining.length} fichier(s)`)
    }

    const batch = await runUploadBatch(bin, bucketName, remaining, options)
    result = mergeBatchResults(result, batch)

    if (!batch.failedKeys?.length) {
      remaining = []
      break
    }
    remaining = remaining.filter((item) => batch.failedKeys.includes(item.key))
  }

  if (remaining.length) {
    result.failedKeys = remaining.map((item) => item.key)
    result.failed = result.failedKeys.length
  }

  return result
}

async function downloadShellBackupYc(bin, bucketName, key, destPath) {
  mkdirSync(path.dirname(destPath), { recursive: true })
  const { code } = ycRun(
    ['storage', 's3', 'cp', `s3://${bucketName}/${key}`, destPath],
    { inherit: false },
  )
  return code === 0 && existsSync(destPath)
}

async function downloadShellBackupS3(client, bucketName, key, destPath) {
  mkdirSync(path.dirname(destPath), { recursive: true })
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }))
    const bytes = await response.Body.transformToByteArray()
    const { writeFileSync } = await import('node:fs')
    writeFileSync(destPath, bytes)
    return true
  } catch {
    return false
  }
}

async function backupRemoteShell(bin, bucketName, shellItems, backupDir, { s3Client, transport }) {
  const backups = []
  for (const item of shellItems) {
    const destPath = path.join(backupDir, item.key)
    const ok =
      transport === 's3' && s3Client
        ? await downloadShellBackupS3(s3Client, bucketName, item.key, destPath)
        : await downloadShellBackupYc(bin, bucketName, item.key, destPath)
    if (ok) backups.push({ key: item.key, file: destPath })
  }
  return backups
}

async function restoreShellBackups(bin, bucketName, backups) {
  let restored = 0
  for (const backup of backups) {
    const ok = uploadObjectYc(bin, bucketName, { file: backup.file, key: backup.key }, { quiet: true })
    if (ok) restored += 1
  }
  return restored
}

/**
 * Déploiement sûr :
 * 1. assets / fichiers statiques d’abord
 * 2. sauvegarde des fichiers shell distants
 * 3. shell (index.html, sw.js, …) en dernier
 * 4. en cas d’échec shell → restauration de la sauvegarde
 */
export async function runSafeDistUpload(
  bin,
  bucketName,
  items,
  {
    concurrency = 12,
    transport = 'yc',
    s3Client = null,
    maxAttempts = Number(process.env.MOXT_DEPLOY_MAX_ATTEMPTS || 3),
  } = {},
) {
  const uploadOptions = { concurrency, transport, s3Client }
  const { staged, shell } = partitionUploadItems(items)
  const empty = { uploaded: 0, failed: 0, failedKeys: [] }

  console.log(
    `  Garde-fou actif — ${staged.length} fichier(s) statiques puis ${shell.length} fichier(s) shell`,
  )

  let stagedResult = empty
  if (staged.length) {
    console.log('\n  ▸ Phase 1/2 — assets et fichiers statiques')
    stagedResult = await uploadWithRetries(bin, bucketName, staged, uploadOptions, maxAttempts)
    if (stagedResult.failedKeys.length) {
      console.error(
        `\n  ✗ Phase 1 incomplète (${stagedResult.failedKeys.length} échec(s)) — site inchangé (shell non publié)`,
      )
      for (const key of stagedResult.failedKeys.slice(0, 8)) {
        console.error(`    · ${key}`)
      }
      if (stagedResult.failedKeys.length > 8) {
        console.error(`    … et ${stagedResult.failedKeys.length - 8} autre(s)`)
      }
      return {
        ok: false,
        uploaded: stagedResult.uploaded,
        failed: stagedResult.failed,
        failedKeys: stagedResult.failedKeys,
        phase: 'staged',
        shellRestored: false,
      }
    }
  }

  if (!shell.length) {
    return { ok: true, ...stagedResult, phase: 'staged-only', shellRestored: false }
  }

  const backupDir = path.join(tmpdir(), `moxt-deploy-backup-${Date.now()}`)
  console.log('\n  ▸ Sauvegarde des fichiers shell distants (rollback possible)')
  const backups = await backupRemoteShell(bin, bucketName, shell, backupDir, {
    s3Client,
    transport,
  })
  if (backups.length) {
    console.log(`  ✓ ${backups.length} fichier(s) shell sauvegardé(s)`)
  }

  console.log('\n  ▸ Phase 2/2 — fichiers shell (index.html en dernier)')
  const shellOrdered = [...shell].sort((left, right) => {
    if (left.key === 'index.html') return 1
    if (right.key === 'index.html') return -1
    return left.key.localeCompare(right.key)
  })

  const shellResult = await uploadWithRetries(bin, bucketName, shellOrdered, uploadOptions, maxAttempts)
  const totalUploaded = stagedResult.uploaded + shellResult.uploaded
  const failedKeys = shellResult.failedKeys || []

  if (failedKeys.length) {
    console.error(
      `\n  ✗ Phase 2 incomplète — restauration de la version shell précédente pour garder le site en ligne`,
    )
    let shellRestored = false
    if (backups.length) {
      const restored = await restoreShellBackups(bin, bucketName, backups)
      shellRestored = restored > 0
      console.log(`  ${shellRestored ? '✓' : '⚠'} ${restored}/${backups.length} fichier(s) shell restauré(s)`)
    } else {
      console.warn('  ⚠ Aucune sauvegarde shell distante — index.html précédent peut rester actif si non écrasé')
    }

    for (const key of failedKeys.slice(0, 8)) {
      console.error(`    · échec : ${key}`)
    }

    return {
      ok: false,
      uploaded: totalUploaded,
      failed: failedKeys.length,
      failedKeys,
      phase: 'shell',
      shellRestored,
    }
  }

  return {
    ok: true,
    uploaded: totalUploaded,
    failed: 0,
    failedKeys: [],
    phase: 'complete',
    shellRestored: false,
  }
}

export function readBackupFile(filePath) {
  return readFileSync(filePath, 'utf8')
}
