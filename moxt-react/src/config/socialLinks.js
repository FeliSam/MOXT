/** Official MOXT social profiles — shared across account & public surfaces. */
export const MOXT_INSTAGRAM = {
  id: 'instagram',
  handle: '@MOXTAPP',
  handlePlain: 'MOXTAPP',
  url: 'https://www.instagram.com/moxtapp',
  qrSrc: '/assets/social/instagram-qr.png',
}

export const MOXT_TELEGRAM = {
  id: 'telegram',
  handle: 'MOXT',
  handlePlain: 'MOXT',
  url: 'https://t.me/+16yDlJqtM2hjZmQy',
  qrSrc: '/assets/social/telegram-qr.png',
}

export const MOXT_WHATSAPP = {
  id: 'whatsapp',
  handle: 'MOXT',
  handlePlain: 'MOXT',
  url: 'https://chat.whatsapp.com/Go0jkRPshueJqcZBjDUl6g',
  qrSrc: '/assets/social/whatsapp-qr.png',
}

export const MOXT_SOCIAL_NETWORKS = [MOXT_INSTAGRAM, MOXT_TELEGRAM, MOXT_WHATSAPP]

export function getMoxtSocialNetwork(id) {
  return MOXT_SOCIAL_NETWORKS.find((item) => item.id === id) || MOXT_INSTAGRAM
}
