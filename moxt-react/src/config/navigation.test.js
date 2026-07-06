import { describe, expect, it } from 'vitest'
import { navigationGroups, routePreloaders } from './navigation'

describe('navigation', () => {
  it('declare des routes uniques et prechargeables', () => {
    const routes = navigationGroups.flatMap((group) => group.children.map((item) => item.path))
    expect(new Set(routes).size).toBe(routes.length)
    expect(routes.every((route) => routePreloaders[route])).toBe(true)
  })

  it('reserve l administration aux roles autorises', () => {
    const administration = navigationGroups.find((group) => group.id === 'administration')
    expect(administration.roles).toEqual(['admin', 'superadmin'])
  })
})
