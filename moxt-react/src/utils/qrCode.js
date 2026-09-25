import { getSiteUrl } from './siteUrl'

export function makeQrCodeUrl(value, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&ecc=M&color=000000&bgcolor=ffffff&data=${encodeURIComponent(value || getSiteUrl())}`
}
