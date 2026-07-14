export function makeQrCodeUrl(value, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(value || getSiteUrlFallback())}`
}

function getSiteUrlFallback() {
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://moxtapp.ru'
}
