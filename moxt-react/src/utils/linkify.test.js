import { describe, expect, it } from 'vitest'
import { linkifyParts } from './linkify'

describe('linkifyParts', () => {
  it('returns empty array for empty input', () => {
    expect(linkifyParts('')).toEqual([])
    expect(linkifyParts(null)).toEqual([])
  })

  it('keeps plain text as a single part', () => {
    expect(linkifyParts('Bonjour tout le monde')).toEqual([
      { type: 'text', value: 'Bonjour tout le monde' },
    ])
  })

  it('detects https URLs', () => {
    expect(linkifyParts('Voir https://moxtapp.ru/maintenant')).toEqual([
      { type: 'text', value: 'Voir ' },
      { type: 'link', value: 'https://moxtapp.ru/maintenant', href: 'https://moxtapp.ru/maintenant' },
    ])
  })

  it('detects www URLs and adds https scheme', () => {
    expect(linkifyParts('Site: www.example.com/page')).toEqual([
      { type: 'text', value: 'Site: ' },
      { type: 'link', value: 'www.example.com/page', href: 'https://www.example.com/page' },
    ])
  })

  it('detects bare domains without protocol', () => {
    expect(linkifyParts('Visitez moxtapp.ru')).toEqual([
      { type: 'text', value: 'Visitez ' },
      { type: 'link', value: 'moxtapp.ru', href: 'https://moxtapp.ru' },
    ])
  })

  it('detects bare domains with path', () => {
    expect(linkifyParts('Aller sur moxtapp.ru/transfers')).toEqual([
      { type: 'text', value: 'Aller sur ' },
      { type: 'link', value: 'moxtapp.ru/transfers', href: 'https://moxtapp.ru/transfers' },
    ])
  })

  it('detects modern TLD extensions', () => {
    expect(linkifyParts('a.xyz b.online c.app')).toEqual([
      { type: 'link', value: 'a.xyz', href: 'https://a.xyz' },
      { type: 'text', value: ' ' },
      { type: 'link', value: 'b.online', href: 'https://b.online' },
      { type: 'text', value: ' ' },
      { type: 'link', value: 'c.app', href: 'https://c.app' },
    ])
  })

  it('detects second-level country domains', () => {
    expect(linkifyParts('shop.co.uk')).toEqual([
      { type: 'link', value: 'shop.co.uk', href: 'https://shop.co.uk' },
    ])
  })

  it('does not linkify email addresses', () => {
    expect(linkifyParts('Contact: user@moxtapp.ru')).toEqual([
      { type: 'text', value: 'Contact: user@moxtapp.ru' },
    ])
  })

  it('handles multiple URLs in one string', () => {
    expect(linkifyParts('A https://a.test B www.b.test C moxtapp.ru D')).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'link', value: 'https://a.test', href: 'https://a.test' },
      { type: 'text', value: ' B ' },
      { type: 'link', value: 'www.b.test', href: 'https://www.b.test' },
      { type: 'text', value: ' C ' },
      { type: 'link', value: 'moxtapp.ru', href: 'https://moxtapp.ru' },
      { type: 'text', value: ' D' },
    ])
  })

  it('strips trailing punctuation from URLs', () => {
    expect(linkifyParts('Lien: moxtapp.ru.')).toEqual([
      { type: 'text', value: 'Lien: ' },
      { type: 'link', value: 'moxtapp.ru', href: 'https://moxtapp.ru' },
      { type: 'text', value: '.' },
    ])
  })

  it('does not treat version numbers as domains', () => {
    expect(linkifyParts('Version 2.0 disponible')).toEqual([
      { type: 'text', value: 'Version 2.0 disponible' },
    ])
  })
})
