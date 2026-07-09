import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

export function ycPath() {
  if (process.env.YC_BIN) return process.env.YC_BIN
  if (process.platform === 'win32') {
    const candidate = path.join(process.env.USERPROFILE || '', 'yandex-cloud', 'bin', 'yc.exe')
    if (existsSync(candidate)) return candidate
  }
  return 'yc'
}

export function ensureYc() {
  const bin = ycPath()
  if (bin !== 'yc' && !existsSync(bin)) {
    throw new Error('Yandex CLI introuvable. Lancez : yc init')
  }
  return bin
}

export function ycRun(args, { inherit = false, cwd } = {}) {
  const bin = ensureYc()
  const result = spawnSync(bin, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    stdio: inherit ? 'inherit' : 'pipe',
  })
  return {
    code: result.status ?? 1,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  }
}

export function ycJson(...args) {
  const { code, stdout, stderr } = ycRun([...args, '--format', 'json'])
  if (code !== 0) {
    throw new Error(`yc ${args.join(' ')} → ${stderr || stdout}`)
  }
  if (!stdout) return null
  try {
    return JSON.parse(stdout)
  } catch {
    return stdout
  }
}

export function ycInherit(...args) {
  const { code } = ycRun(args, { inherit: true })
  if (code !== 0) process.exit(code)
}

export function folderId() {
  if (process.env.MOXT_YC_FOLDER_ID) return process.env.MOXT_YC_FOLDER_ID
  const { code, stdout } = ycRun(['config', 'list'])
  if (code !== 0 || !stdout) return null
  const match = stdout.match(/^folder-id:\s*(\S+)/m)
  return match?.[1] || null
}

export function cloudId() {
  if (process.env.MOXT_YC_CLOUD_ID) return process.env.MOXT_YC_CLOUD_ID
  const { code, stdout } = ycRun(['config', 'list'])
  if (code !== 0 || !stdout) return null
  const match = stdout.match(/^cloud-id:\s*(\S+)/m)
  return match?.[1] || null
}
