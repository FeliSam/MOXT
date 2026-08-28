import { quoteStarsBoost, applyStarsBoost } from './starsRemote'
import { createId } from '../../services/createId'

export class StarsInsufficientError extends Error {
  constructor(quote) {
    super('Solde Stars insuffisant')
    this.name = 'StarsInsufficientError'
    this.quote = quote
  }
}

export async function withStarsBoost({
  entityType,
  entityId,
  durationKey = '24h',
  ownerType = 'user',
  ownerId = null,
  confirmPaid,
}) {
  const quote = await quoteStarsBoost({
    entityType,
    ownerType,
    ownerId,
    durationKey,
  })

  if (quote?.insufficient) {
    throw new StarsInsufficientError(quote)
  }

  if (!quote?.skipped && Number(quote?.paid) > 0) {
    const accepted = confirmPaid ? await confirmPaid(quote) : true
    if (!accepted) return { cancelled: true, quote }
  }

  if (quote?.skipped) {
    return { skipped: true, quote, result: null }
  }

  const result = await applyStarsBoost({
    entityType,
    entityId,
    durationKey,
    idempotencyKey: createId('BST'),
    ownerType,
    ownerId,
  })

  return { result, quote, consumed: result }
}
