import { describe, expect, it } from 'vitest'
import { ADMIN_PAGE_SIZE, paginateItems } from './adminUtils'

describe('paginateItems', () => {
  it('slices 15 items per page by default', () => {
    const items = Array.from({ length: 37 }, (_, i) => i + 1)
    const first = paginateItems(items, 1)
    expect(first.pageSize).toBe(ADMIN_PAGE_SIZE)
    expect(first.items).toEqual(items.slice(0, 15))
    expect(first.from).toBe(1)
    expect(first.to).toBe(15)
    expect(first.total).toBe(37)
    expect(first.pageCount).toBe(3)

    const last = paginateItems(items, 3)
    expect(last.items).toEqual(items.slice(30, 37))
    expect(last.from).toBe(31)
    expect(last.to).toBe(37)
  })

  it('clamps an out-of-range page', () => {
    const page = paginateItems(['a', 'b'], 9)
    expect(page.page).toBe(1)
    expect(page.items).toEqual(['a', 'b'])
  })
})
