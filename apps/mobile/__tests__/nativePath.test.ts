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
    expect(resolveNativePath('/events')).toBe('/events');
    expect(resolveNativePath('/security')).toBe('/security');
    expect(resolveNativePath('/documents')).toBe('/documents');
    expect(resolveNativePath('/activities')).toBe('/activities');
    expect(resolveNativePath('/jobs/applications')).toBe('/jobs/applications');
    expect(resolveNativePath('/businesses/setup')).toBe('/organization/setup');
    expect(resolveNativePath('/p2p/off1/edit')).toBe('/p2p/edit/off1');
    expect(resolveNativePath('/transfers/tr1/receive')).toBe('/transfer/receive/tr1');
    expect(resolveNativePath('/invite/MOXT1')).toBe('/invite/MOXT1');
    expect(resolveNativePath('/discover')).toBe('/discover');
    expect(resolveNativePath('/guide/art1')).toBe('/guide/art1');
    expect(resolveNativePath('/aide')).toBe('/aide');
    expect(resolveNativePath('/exchangers/EXC-MOXT')).toBe('/exchangers/EXC-MOXT');
    expect(resolveNativePath('/admin')).toBe('/admin');
    expect(resolveNativePath('/admin/guide')).toBe('/admin/guide');
    expect(resolveNativePath('/moderation')).toBe('/moderation');
    expect(resolveNativePath('/feature-matrix')).toBe('/feature-matrix');
    expect(resolveNativePath('/superadmin')).toBe('/superadmin');
    expect(resolveNativePath('/contribute')).toBe('/contribute');
    expect(resolveNativePath('/parcels/col1')).toBe('/parcel/col1');
    expect(resolveNativePath('/p2p/off1')).toBe('/p2p/off1');
    expect(resolveNativePath('/transfers/tr1')).toBe('/transfer/tr1');
    expect(resolveNativePath('/transfers')).toBe('/transfer/wizard');
    expect(resolveNativePath('/transfers/history')).toBe('/(tabs)/transfers');
    expect(resolveNativePath('/receipts/r1')).toBe('/receipts/r1');
    expect(resolveNativePath('/statuses/sta1')).toBe('/status/sta1');
    expect(resolveNativePath('/status/sta1')).toBe('/status/sta1');
    expect(resolveNativePath('https://moxtapp.ru/statuses/sta1')).toBe('/status/sta1');
  });

  it('laisse les pages légales au navigateur', () => {
    expect(isLegalWebPath('/legal/privacy')).toBe(true);
    expect(resolveNativePath('https://moxtapp.ru/legal/mentions')).toBeNull();
    expect(resolveNativePath('https://wa.me/7999')).toBeNull();
  });
});
