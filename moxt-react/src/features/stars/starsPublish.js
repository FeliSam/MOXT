import { consumeStars, quoteStarsAction, refundFailedStarsPublish } from './starsRemote'

export function starsOwnerFromPublish({ useBusiness, business, user }) {
  if (useBusiness && business?.id) {
    return { ownerType: 'business', ownerId: business.id }
  }
  return { ownerType: 'user', ownerId: user?.id || null }
}

export class StarsInsufficientError extends Error {
  constructor(quote) {
    super('Solde Stars insuffisant')
    this.name = 'StarsInsufficientError'
    this.quote = quote
  }
}

export async function withStarsConsume({
  category,
  ownerType = 'user',
  ownerId = null,
  entityId,
  durationKey = null,
  formulaKey = 'standard',
  confirmPaid,
  publish,
}) {
  const quote = await quoteStarsAction({
    category,
    ownerType,
    ownerId,
    durationKey,
    formulaKey,
  })

  if (quote?.insufficient) {
    throw new StarsInsufficientError(quote)
  }

  if (!quote?.skipped && Number(quote?.paid) > 0) {
    const accepted = confirmPaid ? await confirmPaid(quote) : true
    if (!accepted) return { cancelled: true, quote }
  }

  let consumed = { skipped: true, bonus: 0, paid: 0 }
  if (!quote?.skipped) {
    consumed = await consumeStars({
      category,
      idempotencyKey: entityId,
      ownerType,
      ownerId,
      durationKey,
      formulaKey,
      refType: category,
      refId: entityId,
    })
  }

  try {
    const result = await publish()
    return { result, consumed, quote }
  } catch (error) {
    if (!consumed?.skipped) {
      try {
        await refundFailedStarsPublish({
          idempotencyKey: entityId,
          ownerType,
          ownerId,
        })
      } catch {
        /* best-effort refund */
      }
    }
    throw error
  }
}
