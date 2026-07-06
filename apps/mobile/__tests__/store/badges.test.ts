import { configureStore } from '@reduxjs/toolkit';

import { badgesReducer, unlockBadge, setEarnedBadges, ALL_BADGES } from '../../store/badges';

function createStore() {
  return configureStore({ reducer: { badges: badgesReducer } });
}

describe('badges slice', () => {
  it('starts with no earned badges', () => {
    const store = createStore();
    expect(store.getState().badges.earned).toEqual([]);
    expect(store.getState().badges.available).toHaveLength(ALL_BADGES.length);
  });

  it('unlocks a badge', () => {
    const store = createStore();
    store.dispatch(unlockBadge('first_transfer'));
    expect(store.getState().badges.earned).toHaveLength(1);
    expect(store.getState().badges.earned[0].id).toBe('first_transfer');
    expect(store.getState().badges.earned[0].unlockedAt).toBeDefined();
  });

  it('does not duplicate an already unlocked badge', () => {
    const store = createStore();
    store.dispatch(unlockBadge('first_transfer'));
    store.dispatch(unlockBadge('first_transfer'));
    expect(store.getState().badges.earned).toHaveLength(1);
  });

  it('sets earned badges from external data', () => {
    const store = createStore();
    const badges = [
      { ...ALL_BADGES[0], unlockedAt: '2025-01-01T00:00:00Z' },
      { ...ALL_BADGES[1], unlockedAt: '2025-02-01T00:00:00Z' },
    ];
    store.dispatch(setEarnedBadges(badges));
    expect(store.getState().badges.earned).toHaveLength(2);
  });
});
