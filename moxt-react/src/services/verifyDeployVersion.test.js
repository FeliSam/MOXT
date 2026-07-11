import { describe, expect, it } from 'vitest'
import {
  buildIdsMatch,
  fetchRemoteBuildId,
  resolveExpectedBuildId,
} from '../../../scripts/verify-deploy-version.mjs'

describe('verify-deploy-version', () => {
  it('résout le buildId depuis GITHUB_SHA', () => {
    expect(
      resolveExpectedBuildId({ githubSha: '29aca04deadbeef1234567890abcdef123456' }),
    ).toBe('29aca04deadb')
  })

  it('compare les buildId avec préfixe commun', () => {
    expect(buildIdsMatch('29aca04deadb', '29aca04')).toBe(true)
    expect(buildIdsMatch('29aca04', '29aca04deadb')).toBe(true)
    expect(buildIdsMatch('abc', 'def')).toBe(false)
  })

  it('lit buildId distant depuis version.json', async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({ buildId: 'eb505fc' }),
    })
    await expect(fetchRemoteBuildId('https://www.moxtapp.ru', fetchImpl)).resolves.toBe('eb505fc')
  })
})
