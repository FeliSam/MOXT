import { isLegalWebPath, resolveNativePath } from '../utils/nativePath';

describe('liens moxtapp vers les écrans natifs', () => {
  it('ouvre les fiches demandées', () => {
    expect(resolveNativePath('https://moxtapp.ru/users/u1/publications')).toBe('/users/u1/publications');
    expect(resolveNativePath('https://www.moxtapp.ru/users/u1')).toBe('/users/u1/publications');
    expect(resolveNativePath('https://moxtapp.ru/marketplace/lst1')).toBe('/listing/lst1');
    expect(resolveNativePath('moxt://videos/vid1')).toBe('/(tabs)/feed?type=video&item=video%3Avid1');
    expect(resolveNativePath('/news/post1')).toBe('/news/post1');
    expect(resolveNativePath('/jobs/job1')).toBe('/jobs/job1');
    expect(resolveNativePath('/events/evt1')).toBe('/events/evt1');
    expect(resolveNativePath('/parcels/col1')).toBe('/parcel/col1');
    expect(resolveNativePath('/p2p/off1')).toBe('/p2p/off1');
    expect(resolveNativePath('/transfers/tr1')).toBe('/transfer/tr1');
    expect(resolveNativePath('/statuses/sta1')).toBe('/status/sta1');
  });

  it('laisse les pages légales au navigateur', () => {
    expect(isLegalWebPath('/legal/privacy')).toBe(true);
    expect(resolveNativePath('https://moxtapp.ru/legal/mentions')).toBeNull();
    expect(resolveNativePath('https://wa.me/7999')).toBeNull();
  });
});
