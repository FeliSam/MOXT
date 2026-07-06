import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalRepository } from './localRepository'

describe('local repository', () => {
  beforeEach(() => localStorage.clear())

  it('offre une interface remplaçable de lecture, écriture et suppression', () => {
    const repository = createLocalRepository('test-repository')
    expect(repository.list()).toEqual([])
    expect(repository.save([{ id: '1' }])).toBe(true)
    expect(repository.list()).toEqual([{ id: '1' }])
    expect(repository.clear()).toBe(true)
    expect(repository.list()).toEqual([])
  })
})
