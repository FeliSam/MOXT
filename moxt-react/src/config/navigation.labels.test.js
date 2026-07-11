import { describe, expect, it } from 'vitest'
import { navigationGroups } from '../config/navigation'

describe('navigation desktop labels', () => {
  it('expose QR invitation et services supplementaires dans le compte', () => {
    const account = navigationGroups.find((group) => group.id === 'account')
    const labels = account.children.map((item) => item.label)

    expect(labels).toContain('QR & invitation')
    expect(labels).not.toContain('Inviter un ami')
  })
})
