import { buildPublisherStripItems, countActiveForKind } from '@/components/publications/publisherCatalog';

describe('bandeau autres publications', () => {
  const publications = {
    listings: [
      { id: 'L1', ownerId: 'U1', status: 'active', title: 'Vélo', city: 'Moscou' },
      { id: 'L2', ownerId: 'U1', status: 'sold', title: 'Vendu', city: 'Kazan' },
    ],
    parcels: [{ id: 'P1', ownerId: 'U1', status: 'active', origin: 'CDG', destination: 'SVO', departureDate: '2099-01-01' }],
    jobs: [{ id: 'J1', ownerId: 'U1', status: 'active', title: 'Cuisinier', location: 'Moscou' }],
    events: [{ id: 'E1', ownerId: 'U1', status: 'published', title: 'Soirée', city: 'Moscou' }],
    videos: [],
    posts: [],
    others: [{ id: 'O1', ownerId: 'U1', status: 'active', amount: 100, fromCurrency: 'RUB', toCurrency: 'XOF' }],
  };

  it('retire la fiche courante et les publications inactives', () => {
    const items = buildPublisherStripItems(publications, 'L1', 8);
    expect(items.map((item) => item.id)).toEqual(['J1', 'E1', 'P1', 'O1']);
    expect(items.find((item) => item.kind === 'parcel')?.title).toBe('CDG → SVO');
    expect(items.find((item) => item.kind === 'p2p')?.path).toBe('/p2p/O1');
  });

  it('compte les annonces actives du vendeur', () => {
    expect(countActiveForKind(publications, { ownerId: 'U1' }, 'listing')).toBe(1);
  });
});
