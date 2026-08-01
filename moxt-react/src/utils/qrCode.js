import { getSiteUrl } from './siteUrl'

export function makeQrCodeUrl(value, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(value || getSiteUrl())}`
}
