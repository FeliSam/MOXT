import { createAvatar } from '@dicebear/core'
import * as lorelei from '@dicebear/lorelei'
import { toCreateAvatarOptions } from './loreleiOptions.js'

/** Rendu Lorelei 100 % local (aucune dépendance à api.dicebear.com). */
export function createLoreleiAvatar(options, { size = 256 } = {}) {
  return createAvatar(lorelei, toCreateAvatarOptions(options, { size }))
}

export function loreleiSvgString(options, { size = 256 } = {}) {
  return createLoreleiAvatar(options, { size }).toString()
}

export function loreleiSvgDataUri(options, { size = 256 } = {}) {
  return createLoreleiAvatar(options, { size }).toDataUri()
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Rendu de l’avatar impossible.'))
    img.src = src
  })
}

/** Rasterise l’avatar en PNG carré (navigateur) — prêt pour l’upload Yandex. */
export async function loreleiToPngFile(options, { size = 512, fileName = 'avatar.png' } = {}) {
  if (typeof document === 'undefined') throw new Error('Export PNG indisponible.')
  const image = await loadImage(loreleiSvgDataUri(options, { size }))
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible.')
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(image, 0, 0, size, size)
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encodage PNG impossible.'))),
      'image/png',
    )
  })
  return new File([blob], fileName, { type: 'image/png', lastModified: Date.now() })
}
