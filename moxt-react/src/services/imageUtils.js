/**
 * Compresse une image via Canvas avant upload.
 * Redimensionne à max 1600px (grand côté) et encode en JPEG/WEBP.
 * Retourne un nouveau File compressé.
 */
export async function compressImage(file, { maxPx = 1600, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/')) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round((height * maxPx) / width)
          width = maxPx
        } else {
          width = Math.round((width * maxPx) / height)
          height = maxPx
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const compressed = new File([blob], file.name, { type: outputType, lastModified: Date.now() })
          // Ne retourner le compressé que s'il est plus petit
          resolve(compressed.size < file.size ? compressed : file)
        },
        outputType,
        quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
