import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';

import { buildDashboardTodos, buildOnboardingSteps, isArchivedTransferStatus } from '../components/dashboard/dashboardInbox';
import { mergeSearchTerm, normalizeSearchHistory } from '../services/searchHistory';

describe('inbox tableau de bord', () => {
  const user = { id: 'u1', verified: false, firstName: 'Awa', lastName: '', email: 'a@moxt.app', phone: '', country: 'BJ', city: '' };

  it('liste transferts, demandes colis et candidatures', () => {
    const todos = buildDashboardTodos({
      userId: 'u1',
      transfers: [
        { userId: 'u1', status: TRANSFER_STATUS.PENDING },
        { userId: 'u1', status: TRANSFER_STATUS.COMPLETED },
        { userId: 'other', status: TRANSFER_STATUS.PENDING },
      ],
      parcelRequests: [
        { id: 'r1', ownerId: 'u1', status: 'submitted', parcelId: 'p1' },
        { id: 'r1', ownerId: 'u1', status: 'submitted', parcelId: 'p1' },
        { id: 'r2', ownerId: 'u1', status: 'accepted', parcelId: 'p2' },
      ],
      jobApplications: [
        { id: 'a1', jobId: 'j1', status: 'submitted' },
        { id: 'a2', jobId: 'j2', status: 'rejected' },
      ],
    });
    expect(todos.map((item) => item.to)).toEqual(['/(tabs)/transfers', '/parcel/p1', '/jobs/j1']);
    expect(todos.map((item) => item.count)).toEqual([1, 1, 1]);
  });

  it('marque les étapes d’onboarding', () => {
    const steps = buildOnboardingSteps(user, 0);
    expect(steps.map((step) => step.done)).toEqual([false, false, false]);
    expect(steps.map((step) => step.to)).toEqual(['/kyc', '/profile/edit', '/transfer/wizard']);
    expect(isArchivedTransferStatus(TRANSFER_STATUS.EXPIRED)).toBe(true);
    expect(isArchivedTransferStatus(TRANSFER_STATUS.PENDING)).toBe(false);
  });
});

describe('historique de recherche', () => {
  it('garde 5 termes uniques, au moins 2 caractères', () => {
    expect(normalizeSearchHistory(['a', 2, 'b'])).toEqual(['a', 'b']);
    expect(mergeSearchTerm(['Colis', 'Job'], 'a')).toEqual(['Colis', 'Job']);
    expect(mergeSearchTerm(['Colis', 'Job', 'Event', 'P2P', 'News'], 'colis')).toEqual([
      'colis',
      'Job',
      'Event',
      'P2P',
      'News',
    ]);
  });
});
