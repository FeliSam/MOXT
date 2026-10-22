import { asStringList } from '../utils/stringList';
import { idFromPath, routeParam } from '../utils/routeParam';

describe('asStringList', () => {
  it('accepte tableau, null, JSON et chaîne', () => {
    expect(asStringList(null)).toEqual([]);
    expect(asStringList('liquides, piles')).toEqual(['liquides', 'piles']);
    expect(asStringList('["a","b"]')).toEqual(['a', 'b']);
    expect(asStringList(['x', ''])).toEqual(['x']);
  });
});

describe('routeParam', () => {
  it('lit le segment MXT même si le paramètre est un tableau', () => {
    expect(routeParam(['MXT-ABC'])).toBe('MXT-ABC');
    expect(idFromPath('/transfer/MXT-ABC')).toBe('MXT-ABC');
  });
});
